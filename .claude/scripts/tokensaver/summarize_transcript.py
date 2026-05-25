#!/usr/bin/env python3
"""
Manual import path for normal Claude chat (no Claude Code hook present).

Usage:
  python summarize_transcript.py --manual-import <path-to-pasted-markdown>

The input file should contain the chat you pasted out of Claude (any format).
This script:
  * splits on "User:" / "Assistant:" / "Human:" / "Claude:" markers,
  * extracts mechanical facts (files, commands, decisions, errors),
  * writes the result to chunks/imported-claude-chat-summary.md,
  * refreshes CURRENT_HANDOFF.md via the shared module.

Honest note: this is mechanical extraction, not semantic summarization.
For a real prose summary, run /tokensaver summarize-now afterwards.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

# Reuse the core module's helpers without re-implementing them.
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))
import token_saver as ts  # noqa: E402


ROLE_SPLIT = re.compile(
    r"^\s*(user|assistant|human|claude)\s*:\s*",
    re.IGNORECASE | re.MULTILINE,
)


def parse_pasted_chat(text: str) -> list[ts.Msg]:
    """
    Best-effort split of a free-form pasted chat into Msg objects.
    Recognises "User:" / "Human:" → user, "Assistant:" / "Claude:" → assistant.
    Anything before the first marker is dropped.
    """
    # Find all marker positions.
    matches = list(ROLE_SPLIT.finditer(text))
    if not matches:
        # No markers — treat the whole thing as a single user message.
        return [ts.Msg(role="user", text=text.strip())]
    msgs: list[ts.Msg] = []
    for i, m in enumerate(matches):
        role_raw = m.group(1).lower()
        role = "user" if role_raw in ("user", "human") else "assistant"
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end].strip()
        if not body:
            continue
        msgs.append(ts.Msg(role=role, text=body))
    return msgs


def write_imported_chunk(msgs: list[ts.Msg], source_path: Path) -> Path:
    cfg = ts.load_config()
    facts = ts.extract_facts(msgs, 0, len(msgs))
    ts.CHUNKS_DIR.mkdir(parents=True, exist_ok=True)
    out = ts.CHUNKS_DIR / "imported-claude-chat-summary.md"
    body = ts.render_chunk(facts, msgs, cfg, str(source_path))
    out.write_text(body, encoding="utf-8")

    # Push the imported chunk through the same handoff refresh pipeline so
    # CURRENT_HANDOFF.md and NEW_CHAT_STARTER.md reflect it.
    state = ts.State.load()
    state.last_transcript_path = str(source_path)
    state.total_chunks = max(state.total_chunks, len(list(ts.CHUNKS_DIR.glob("chunk-*.md"))) + 1)
    state.save()
    ts.update_handoff(state, out, cfg)
    ts.update_session_index(state, out)
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description="Manual chat import for Token Saver.")
    ap.add_argument(
        "--manual-import",
        required=True,
        help="Path to a pasted chat (markdown/plain text).",
    )
    args = ap.parse_args()

    src = Path(args.manual_import).expanduser()
    if not src.exists():
        print(f"ERROR: file not found: {src}", file=sys.stderr)
        return 2
    try:
        text = src.read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        print(f"ERROR: could not read {src}: {e}", file=sys.stderr)
        return 2

    msgs = parse_pasted_chat(text)
    if not msgs:
        print("ERROR: no user/assistant turns found in input.", file=sys.stderr)
        return 1
    out = write_imported_chunk(msgs, src)
    print(f"[tokensaver] wrote {out}")
    print("Next step (optional): run /tokensaver summarize-now to upgrade to a prose summary.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
