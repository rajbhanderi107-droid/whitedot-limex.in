#!/usr/bin/env python3
"""
Token Saver Context Bridge — core dispatcher + shared utilities.

This file is BOTH a CLI entry point and a library:

  python token_saver.py status              show counts + last summary index
  python token_saver.py auto-check          for hook use: maybe-write a chunk
  python token_saver.py summarize-now       force-write a chunk for unsummarized msgs
  python token_saver.py handoff             rebuild NEW_CHAT_STARTER.md
  python token_saver.py clean               archive old raw/, keep summaries
  python token_saver.py help                print usage

Honest scope:
  * This script does MECHANICAL extraction (file edits, bash commands, errors,
    decisions detected by keyword). It cannot produce a semantic summary on
    its own. The `/tokensaver summarize-now` slash command lets Claude
    upgrade the mechanical draft into a real prose summary.
  * Transcript paths come from Claude Code hooks (`transcript_path` in the
    hook JSON). When called manually, we discover the most-recent transcript
    by scanning ~/.claude/projects/.

No third-party deps. Python 3.8+.
"""

from __future__ import annotations

import json
import os
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# Resolve the project root from this script's location.
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[2]
CONTEXT_DIR = PROJECT_ROOT / ".claude" / "context" / "tokensaver"
CHUNKS_DIR = CONTEXT_DIR / "chunks"
ARCHIVE_DIR = CONTEXT_DIR / "archive"
RAW_DIR = CONTEXT_DIR / "raw"
TEMPLATES_DIR = PROJECT_ROOT / ".claude" / "skills" / "tokensaver" / "templates"
CONFIG_PATH = SCRIPT_DIR / "config.json"
STATE_PATH = CONTEXT_DIR / ".state.json"

HANDOFF_PATH = CONTEXT_DIR / "CURRENT_HANDOFF.md"
SUMMARY_PATH = CONTEXT_DIR / "CURRENT_SUMMARY.md"
INDEX_PATH = CONTEXT_DIR / "SESSION_INDEX.md"
EDITABLE_PATH = CONTEXT_DIR / "EDITABLE_CONTEXT.md"
STARTER_PATH = CONTEXT_DIR / "NEW_CHAT_STARTER.md"


# ───────────────────────────── Secrets redaction ──────────────────────────────
# Conservative patterns. Caller can extend via config.json["redact_patterns"].
DEFAULT_REDACT_PATTERNS: list[str] = [
    # Anthropic, OpenAI, generic-prefixed API keys
    r"sk-[A-Za-z0-9_\-]{20,}",
    r"ak-[A-Za-z0-9_\-]{20,}",
    r"sk_live_[A-Za-z0-9]{20,}",
    r"sk_test_[A-Za-z0-9]{20,}",
    # GitHub PATs
    r"gh[pousr]_[A-Za-z0-9]{30,}",
    # AWS access keys
    r"AKIA[0-9A-Z]{16}",
    # Generic Bearer tokens that look secret-ish (40+ b64 chars)
    r"(?i)bearer\s+[A-Za-z0-9_\-\.=]{40,}",
    # .env-style KEY=value with secret-ish word in key
    r"(?i)(?:api[_-]?key|secret|password|token|private[_-]?key)\s*[:=]\s*['\"]?[A-Za-z0-9_\-\.\/+=]{12,}['\"]?",
]


# ───────────────────────────────── Config ─────────────────────────────────────
def load_config() -> dict[str, Any]:
    if CONFIG_PATH.exists():
        try:
            return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "chunk_size_messages": 20,
        "handoff_max_words": 1500,
        "redact_patterns": [],
        "include_assistant_messages": True,
        "include_user_messages": True,
    }


def save_config(cfg: dict[str, Any]) -> None:
    CONFIG_PATH.write_text(json.dumps(cfg, indent=2), encoding="utf-8")


# ─────────────────────────────── State helpers ────────────────────────────────
@dataclass
class State:
    last_summarized_index: int = 0       # cumulative message index already chunked
    last_chunk_number: int = 0           # NNNN of last chunk-NNNN.md written
    last_transcript_path: str = ""
    last_updated_utc: str = ""
    total_chunks: int = 0

    @classmethod
    def load(cls) -> "State":
        if STATE_PATH.exists():
            try:
                d = json.loads(STATE_PATH.read_text(encoding="utf-8"))
                return cls(
                    last_summarized_index=int(d.get("last_summarized_index", 0)),
                    last_chunk_number=int(d.get("last_chunk_number", 0)),
                    last_transcript_path=str(d.get("last_transcript_path", "")),
                    last_updated_utc=str(d.get("last_updated_utc", "")),
                    total_chunks=int(d.get("total_chunks", 0)),
                )
            except Exception:
                pass
        return cls()

    def save(self) -> None:
        self.last_updated_utc = now_iso()
        STATE_PATH.write_text(
            json.dumps(self.__dict__, indent=2), encoding="utf-8"
        )


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ──────────────────────────── Transcript discovery ────────────────────────────
def find_latest_transcript() -> Path | None:
    """
    Scan ~/.claude/projects/* for the most-recently modified .jsonl.
    Used when no transcript_path is supplied (manual invocations).
    """
    base = Path.home() / ".claude" / "projects"
    if not base.exists():
        return None
    candidates = list(base.rglob("*.jsonl"))
    if not candidates:
        return None
    candidates.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return candidates[0]


# ─────────────────────────────── Transcript ──────────────────────────────────
@dataclass
class Msg:
    role: str
    text: str
    tool_name: str = ""
    tool_input: dict = field(default_factory=dict)
    ts: str = ""


def _flatten_content(content: Any) -> tuple[str, str, dict]:
    """
    Given the `content` field of a transcript entry, return:
      (visible_text, tool_name_if_any, tool_input_if_any)
    Transcripts store content as either a string or a list of blocks.
    """
    if isinstance(content, str):
        return content, "", {}
    if not isinstance(content, list):
        return "", "", {}
    out_text: list[str] = []
    tool_name = ""
    tool_input: dict = {}
    for block in content:
        if not isinstance(block, dict):
            continue
        t = block.get("type")
        if t == "text" and isinstance(block.get("text"), str):
            out_text.append(block["text"])
        elif t == "tool_use":
            tool_name = block.get("name", "") or tool_name
            tin = block.get("input")
            if isinstance(tin, dict):
                tool_input = tin
        elif t == "tool_result":
            # Tool results can carry strings or further block lists; skip
            # for the summary (these are usually large + low signal).
            pass
    return "\n".join(out_text).strip(), tool_name, tool_input


def parse_transcript(path: Path) -> list[Msg]:
    """
    Parse a Claude Code transcript JSONL into an ordered list of Msg objects.
    Returns ONLY user + assistant turns (no system, no tool results in their
    own row — tool calls are attached to the assistant turn that emitted them).
    Tolerant to schema variations across Claude Code versions.
    """
    msgs: list[Msg] = []
    if not path or not path.exists():
        return msgs

    try:
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    except Exception:
        return msgs

    for raw in lines:
        raw = raw.strip()
        if not raw:
            continue
        try:
            entry = json.loads(raw)
        except Exception:
            continue
        # Claude Code transcript entries wrap a "message" object with role.
        msg = entry.get("message") if isinstance(entry, dict) else None
        if not isinstance(msg, dict):
            # Some lines may be hook events or system markers — skip.
            continue
        role = msg.get("role")
        if role not in ("user", "assistant"):
            continue
        ts = entry.get("timestamp") or entry.get("ts") or ""
        text, tool_name, tool_input = _flatten_content(msg.get("content"))
        # Filter out tool-result-only user turns (they contain no human text).
        if role == "user" and not text:
            continue
        msgs.append(Msg(role=role, text=text, tool_name=tool_name,
                        tool_input=tool_input, ts=str(ts)))
    return msgs


# ─────────────────────────────── Redaction ────────────────────────────────────
def redact(text: str, extra_patterns: list[str] | None = None) -> str:
    patterns = list(DEFAULT_REDACT_PATTERNS)
    if extra_patterns:
        patterns.extend(extra_patterns)
    out = text
    for pat in patterns:
        try:
            out = re.sub(pat, "[REDACTED_SECRET]", out)
        except re.error:
            continue
    return out


# ─────────────────────────── Mechanical extraction ────────────────────────────
EDIT_TOOLS = {"Edit", "Write", "NotebookEdit", "MultiEdit"}
READ_TOOLS = {"Read", "Glob", "Grep"}
RUN_TOOLS = {"Bash"}

DECISION_KEYWORDS = re.compile(
    r"(?im)^\s*(?:decision|chose|chosen|going with|we'll|we will|let's|approved|rejected|prefer|use\s+\w+\s+instead)\b"
)
ERROR_KEYWORDS = re.compile(
    r"(?i)\b(error|failed|exception|traceback|cannot|denied|fatal|warning:|err:)\b"
)


@dataclass
class ChunkFacts:
    files_edited: list[str] = field(default_factory=list)
    files_read: list[str] = field(default_factory=list)
    commands_run: list[str] = field(default_factory=list)
    decision_lines: list[str] = field(default_factory=list)
    error_lines: list[str] = field(default_factory=list)
    user_asks: list[str] = field(default_factory=list)
    assistant_replies_short: list[str] = field(default_factory=list)
    start_index: int = 0
    end_index: int = 0


def extract_facts(msgs: list[Msg], start_idx: int, end_idx: int) -> ChunkFacts:
    facts = ChunkFacts(start_index=start_idx, end_index=end_idx)
    for m in msgs[start_idx:end_idx]:
        if m.role == "user" and m.text:
            facts.user_asks.append(_one_line(m.text, 220))
        elif m.role == "assistant":
            if m.text:
                facts.assistant_replies_short.append(_one_line(m.text, 160))
            if m.tool_name in EDIT_TOOLS:
                fp = m.tool_input.get("file_path") or m.tool_input.get("notebook_path")
                if isinstance(fp, str):
                    facts.files_edited.append(fp)
            elif m.tool_name in READ_TOOLS:
                fp = m.tool_input.get("file_path") or m.tool_input.get("pattern")
                if isinstance(fp, str):
                    facts.files_read.append(fp)
            elif m.tool_name in RUN_TOOLS:
                cmd = m.tool_input.get("command")
                if isinstance(cmd, str):
                    facts.commands_run.append(_one_line(cmd, 200))
            # Scan plain text for decision / error markers.
            for line in (m.text or "").splitlines():
                if DECISION_KEYWORDS.search(line):
                    facts.decision_lines.append(_one_line(line, 220))
                elif ERROR_KEYWORDS.search(line):
                    facts.error_lines.append(_one_line(line, 220))
    # dedupe while preserving order
    facts.files_edited = _dedupe(facts.files_edited)
    facts.files_read = _dedupe(facts.files_read)[:25]
    facts.commands_run = _dedupe(facts.commands_run)[:25]
    facts.decision_lines = _dedupe(facts.decision_lines)[:15]
    facts.error_lines = _dedupe(facts.error_lines)[:15]
    return facts


def _one_line(s: str, limit: int) -> str:
    s = " ".join(s.split())
    return s if len(s) <= limit else s[: limit - 1] + "…"


def _dedupe(items: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for it in items:
        if it in seen:
            continue
        seen.add(it)
        out.append(it)
    return out


# ──────────────────────────── Chunk file writing ──────────────────────────────
def render_chunk(facts: ChunkFacts, msgs: list[Msg], cfg: dict[str, Any],
                 transcript_path: str) -> str:
    tpl = _read_template("summary-template.md")
    extras = cfg.get("redact_patterns", []) or []

    def bullets(items: list[str]) -> str:
        if not items:
            return "_none detected_"
        return "\n".join(f"- {redact(x, extras)}" for x in items)

    pending = _heuristic_pending(msgs, facts)
    next_action = _heuristic_next_action(facts)

    return tpl.format(
        timestamp=now_iso(),
        transcript=transcript_path or "(unknown)",
        start=facts.start_index + 1,
        end=facts.end_index,
        count=facts.end_index - facts.start_index,
        user_asks=bullets(facts.user_asks),
        assistant_replies=bullets(facts.assistant_replies_short[:10]),
        files_edited=bullets(facts.files_edited),
        files_read=bullets(facts.files_read),
        commands=bullets(facts.commands_run),
        decisions=bullets(facts.decision_lines),
        errors=bullets(facts.error_lines),
        pending=bullets(pending),
        next_action=next_action,
    )


def _heuristic_pending(msgs: list[Msg], facts: ChunkFacts) -> list[str]:
    if not msgs:
        return []
    pending: list[str] = []
    last_user = next((m for m in reversed(msgs[: facts.end_index]) if m.role == "user"), None)
    if last_user and last_user.text:
        pending.append(f"Last user request: {_one_line(last_user.text, 220)}")
    if facts.error_lines:
        pending.append("Unresolved errors detected in chunk (see Errors section).")
    return pending


def _heuristic_next_action(facts: ChunkFacts) -> str:
    if facts.error_lines:
        return "Investigate the errors listed above and confirm the prior fix landed."
    if facts.files_edited:
        return "Verify the most recently edited files build/run as expected."
    return "Awaiting next user direction."


def _read_template(name: str) -> str:
    p = TEMPLATES_DIR / name
    if not p.exists():
        # Minimal inline fallback so the script still works if templates are
        # missing or moved.
        return (
            "# Chunk {start}-{end}\n\n_generated {timestamp}_\n\n"
            "## Files edited\n{files_edited}\n\n## Commands\n{commands}\n\n"
            "## Decisions\n{decisions}\n\n## Errors\n{errors}\n\n"
            "## Pending\n{pending}\n\n## Next action\n{next_action}\n"
        )
    return p.read_text(encoding="utf-8")


# ─────────────────────────── Handoff / summary I/O ────────────────────────────
def update_handoff(state: State, latest_chunk: Path | None,
                   cfg: dict[str, Any]) -> None:
    tpl = _read_template("handoff-template.md")
    chunks_listing = _chunks_listing()
    word_cap = int(cfg.get("handoff_max_words", 1500))
    project_name = _detect_project_name()
    body = tpl.format(
        project_name=project_name,
        timestamp=now_iso(),
        total_chunks=state.total_chunks,
        last_chunk=(latest_chunk.name if latest_chunk else "(none yet)"),
        chunks_listing=chunks_listing or "_no chunks yet_",
        last_summarized_index=state.last_summarized_index,
    )
    body = _truncate_words(body, word_cap)
    HANDOFF_PATH.write_text(body, encoding="utf-8")

    # Rolling summary: index of chunks + edits-since-start counter.
    SUMMARY_PATH.write_text(
        f"# Rolling Project Summary\n\n_Last updated: {now_iso()}_\n\n"
        f"- Total chunks: {state.total_chunks}\n"
        f"- Last summarized message index: {state.last_summarized_index}\n"
        f"- Latest chunk: {(latest_chunk.name if latest_chunk else '(none)')}\n\n"
        f"## Chunks index\n\n{chunks_listing or '_none_'}\n\n"
        f"---\n\nThis file is a rolling index. Read individual chunks under "
        f"`.claude/context/tokensaver/chunks/` for detail. The handoff at "
        f"`CURRENT_HANDOFF.md` is the short form preferred for new sessions.\n",
        encoding="utf-8",
    )


def _chunks_listing() -> str:
    if not CHUNKS_DIR.exists():
        return ""
    files = sorted(CHUNKS_DIR.glob("chunk-*.md"))
    return "\n".join(f"- `.claude/context/tokensaver/chunks/{p.name}`" for p in files)


def _truncate_words(s: str, limit: int) -> str:
    words = s.split()
    if len(words) <= limit:
        return s
    return " ".join(words[:limit]) + "\n\n_…truncated to fit handoff word cap…_\n"


def _detect_project_name() -> str:
    pkg = PROJECT_ROOT / "package.json"
    if pkg.exists():
        try:
            return json.loads(pkg.read_text(encoding="utf-8")).get("name", PROJECT_ROOT.name)
        except Exception:
            pass
    return PROJECT_ROOT.name


def update_session_index(state: State, latest_chunk: Path | None) -> None:
    INDEX_PATH.write_text(
        f"# Session Index\n\n_Updated {now_iso()}_\n\n"
        f"- Last summarized message index: **{state.last_summarized_index}**\n"
        f"- Total chunks written: **{state.total_chunks}**\n"
        f"- Latest chunk: `{(latest_chunk.name if latest_chunk else '(none)')}`\n"
        f"- Last transcript: `{state.last_transcript_path or '(unknown)'}`\n",
        encoding="utf-8",
    )


# ─────────────────────────────── Core operations ──────────────────────────────
def resolve_transcript_path(hook_input: dict[str, Any] | None,
                            cli_arg: str | None) -> Path | None:
    """
    Priority: explicit CLI arg → hook input → latest discovered.
    """
    if cli_arg:
        p = Path(cli_arg).expanduser()
        if p.exists():
            return p
    if hook_input:
        tp = hook_input.get("transcript_path")
        if isinstance(tp, str):
            p = Path(tp).expanduser()
            if p.exists():
                return p
    return find_latest_transcript()


def maybe_write_chunk(transcript: Path, cfg: dict[str, Any], force: bool = False
                      ) -> tuple[bool, Path | None, int]:
    """
    Returns (wrote_chunk, last_chunk_path, new_unsummarized_count).

    If a backlog is present, iterates so each chunk covers ~threshold messages
    instead of one giant chunk. In `force` mode, writes one final chunk for
    any remainder below the threshold; otherwise the remainder is left for a
    future call.
    """
    msgs = parse_transcript(transcript)
    state = State.load()
    state.last_transcript_path = str(transcript)
    threshold = max(1, int(cfg.get("chunk_size_messages", 20)))
    total = len(msgs)
    if total == 0:
        return False, None, 0

    last_chunk: Path | None = None
    wrote = False
    while True:
        unsummarized = total - state.last_summarized_index
        if unsummarized <= 0:
            break
        if unsummarized < threshold and not force:
            break
        window_end = min(total, state.last_summarized_index + threshold)
        facts = extract_facts(msgs, state.last_summarized_index, window_end)
        chunk_num = state.last_chunk_number + 1
        chunk_path = CHUNKS_DIR / f"chunk-{chunk_num:04d}.md"
        CHUNKS_DIR.mkdir(parents=True, exist_ok=True)
        chunk_path.write_text(
            render_chunk(facts, msgs, cfg, str(transcript)),
            encoding="utf-8",
        )
        state.last_summarized_index = window_end
        state.last_chunk_number = chunk_num
        state.total_chunks = chunk_num
        state.save()
        last_chunk = chunk_path
        wrote = True
        # In force mode, after we've drained to below threshold, write one
        # final small chunk for the tail and stop.
        if force and (total - state.last_summarized_index) < threshold and (total - state.last_summarized_index) > 0:
            tail_facts = extract_facts(msgs, state.last_summarized_index, total)
            chunk_num = state.last_chunk_number + 1
            chunk_path = CHUNKS_DIR / f"chunk-{chunk_num:04d}.md"
            chunk_path.write_text(
                render_chunk(tail_facts, msgs, cfg, str(transcript)),
                encoding="utf-8",
            )
            state.last_summarized_index = total
            state.last_chunk_number = chunk_num
            state.total_chunks = chunk_num
            state.save()
            last_chunk = chunk_path
            break

    if wrote and last_chunk is not None:
        update_handoff(state, last_chunk, cfg)
        update_session_index(state, last_chunk)
    return wrote, last_chunk, total - state.last_summarized_index


# ───────────────────────────── Commands (CLI) ─────────────────────────────────
def cmd_status() -> int:
    state = State.load()
    cfg = load_config()
    tp = Path(state.last_transcript_path) if state.last_transcript_path else find_latest_transcript()
    msgs = parse_transcript(tp) if tp else []
    total = len(msgs)
    unsummarized = total - state.last_summarized_index
    print("Token Saver — status")
    print(f"  transcript            : {tp or '(not found)'}")
    print(f"  total user+asst msgs  : {total}")
    print(f"  last summarized index : {state.last_summarized_index}")
    print(f"  unsummarized          : {unsummarized}")
    print(f"  chunk threshold       : {cfg.get('chunk_size_messages', 20)}")
    print(f"  total chunks written  : {state.total_chunks}")
    print(f"  handoff               : {HANDOFF_PATH}")
    print(f"  editable context      : {EDITABLE_PATH}")
    return 0


def cmd_auto_check(hook_input: dict[str, Any] | None) -> int:
    cfg = load_config()
    tp = resolve_transcript_path(hook_input, None)
    if not tp:
        # Silent: no transcript yet, nothing to do. Never block the session.
        return 0
    wrote, chunk, unsummarized = maybe_write_chunk(tp, cfg, force=False)
    if wrote and chunk:
        # Print to stderr so it surfaces in Claude Code as a hook notice
        # without becoming part of the model's context.
        print(
            f"[tokensaver] wrote {chunk.name} (unsummarized was {unsummarized})",
            file=sys.stderr,
        )
    return 0


def cmd_summarize_now(args: list[str]) -> int:
    cfg = load_config()
    cli_path = args[0] if args else None
    tp = resolve_transcript_path(None, cli_path)
    if not tp:
        print("ERROR: no transcript found.", file=sys.stderr)
        return 1
    wrote, chunk, unsummarized = maybe_write_chunk(tp, cfg, force=True)
    if not wrote:
        print(f"[tokensaver] nothing to summarize (unsummarized={unsummarized}).")
        return 0
    print(f"[tokensaver] wrote {chunk}")
    return 0


def cmd_handoff() -> int:
    state = State.load()
    cfg = load_config()
    latest = None
    if CHUNKS_DIR.exists():
        files = sorted(CHUNKS_DIR.glob("chunk-*.md"))
        if files:
            latest = files[-1]
    update_handoff(state, latest, cfg)
    update_session_index(state, latest)
    project = _detect_project_name()
    STARTER_PATH.write_text(_render_new_chat_starter(project, state, latest), encoding="utf-8")
    print(f"[tokensaver] rebuilt {HANDOFF_PATH.name} and {STARTER_PATH.name}")
    return 0


def _render_new_chat_starter(project: str, state: State, latest: Path | None) -> str:
    return f"""# New-Chat Starter — paste this into a fresh Claude chat

> **Read this first. Continue from this project state. Do not ask me to repeat
> old context unless something is missing. Use the files listed below as the
> source of truth. Start by reading `CURRENT_HANDOFF.md` and
> `EDITABLE_CONTEXT.md`, then inspect only the listed project files.**

**Project**: `{project}`
**Generated**: `{now_iso()}`
**Total summary chunks**: `{state.total_chunks}`

## Source-of-truth files (read in this order)
1. `.claude/context/tokensaver/CURRENT_HANDOFF.md`
2. `.claude/context/tokensaver/EDITABLE_CONTEXT.md`  ← user-approved truth, overrides auto-summary on conflict
3. `.claude/context/tokensaver/CURRENT_SUMMARY.md`   ← rolling index of chunks
4. Latest chunk: `{latest.name if latest else "(none yet)"}` under `.claude/context/tokensaver/chunks/`

## Do not
- Re-read every archived chunk unless explicitly asked.
- Re-execute exploratory bash commands already captured in chunks.
- Discard `EDITABLE_CONTEXT.md` — it overrides any conflicting auto-summary.

If anything in those files conflicts with each other, prefer
`EDITABLE_CONTEXT.md` (manual edits) over auto-generated chunks.
"""


def cmd_clean() -> int:
    """
    Move raw/ contents and chunks older than the most recent 5 into archive/,
    keeping summaries intact.
    """
    moved = 0
    if RAW_DIR.exists():
        for f in RAW_DIR.glob("*"):
            if f.is_file():
                dest = ARCHIVE_DIR / "raw" / f.name
                dest.parent.mkdir(parents=True, exist_ok=True)
                f.rename(dest)
                moved += 1
    if CHUNKS_DIR.exists():
        chunks = sorted(CHUNKS_DIR.glob("chunk-*.md"))
        if len(chunks) > 5:
            old = chunks[:-5]
            for f in old:
                dest = ARCHIVE_DIR / "chunks" / f.name
                dest.parent.mkdir(parents=True, exist_ok=True)
                f.rename(dest)
                moved += 1
    print(f"[tokensaver] moved {moved} file(s) to archive/.")
    return 0


def cmd_help() -> int:
    print(__doc__ or "Token Saver Context Bridge")
    return 0


# ───────────────────────────── Hook entry point ───────────────────────────────
def read_hook_stdin() -> dict[str, Any] | None:
    """
    Claude Code hooks pass JSON via stdin. Returns parsed dict or None.
    """
    if sys.stdin.isatty():
        return None
    try:
        data = sys.stdin.read()
        if not data.strip():
            return None
        return json.loads(data)
    except Exception:
        return None


def main(argv: list[str]) -> int:
    if not argv:
        return cmd_status()
    op = argv[0]
    rest = argv[1:]
    hook_in = read_hook_stdin()
    try:
        if op == "status":
            return cmd_status()
        if op == "auto-check":
            return cmd_auto_check(hook_in)
        if op == "summarize-now":
            return cmd_summarize_now(rest)
        if op == "handoff":
            return cmd_handoff()
        if op == "clean":
            return cmd_clean()
        if op in ("help", "-h", "--help"):
            return cmd_help()
        print(f"unknown subcommand: {op}", file=sys.stderr)
        return cmd_help()
    except Exception as e:
        # Never crash a hook — print the error and return 0 so the session
        # is not blocked.
        print(f"[tokensaver] internal error (non-fatal): {e}", file=sys.stderr)
        return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
