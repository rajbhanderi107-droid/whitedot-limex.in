#!/usr/bin/env python3
"""
Open the editable Token Saver context files in $EDITOR, with a backup
made before any external editor touches them. If no editor is set or it
fails, print the file paths and instructions.

Targets (in order):
  .claude/context/tokensaver/EDITABLE_CONTEXT.md   (primary — user truth)
  .claude/context/tokensaver/CURRENT_HANDOFF.md
  .claude/context/tokensaver/CURRENT_SUMMARY.md
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))
import token_saver as ts  # noqa: E402


TARGETS = [
    ts.EDITABLE_PATH,
    ts.HANDOFF_PATH,
    ts.SUMMARY_PATH,
]


def backup(p: Path) -> Path | None:
    if not p.exists():
        return None
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    dest = ts.ARCHIVE_DIR / "edit-backups" / f"{p.stem}.{stamp}{p.suffix}"
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(p, dest)
    return dest


def ensure_exists(p: Path) -> None:
    if p.exists():
        return
    p.parent.mkdir(parents=True, exist_ok=True)
    if p.name == "EDITABLE_CONTEXT.md":
        tpl = ts.TEMPLATES_DIR / "edit-template.md"
        if tpl.exists():
            p.write_text(tpl.read_text(encoding="utf-8"), encoding="utf-8")
            return
    p.write_text(f"# {p.stem}\n\n_created {ts.now_iso()}_\n", encoding="utf-8")


def open_in_editor(paths: list[Path]) -> bool:
    editor = os.environ.get("VISUAL") or os.environ.get("EDITOR")
    if not editor:
        return False
    try:
        subprocess.run([editor, *[str(p) for p in paths]], check=False)
        return True
    except FileNotFoundError:
        return False


def main() -> int:
    for p in TARGETS:
        ensure_exists(p)
        b = backup(p)
        if b:
            print(f"[tokensaver] backed up {p.name} -> {b}")

    opened = open_in_editor(TARGETS)
    if opened:
        return 0

    print()
    print("No $EDITOR / $VISUAL configured (or it failed to launch).")
    print("Open these files manually in your editor of choice:")
    for p in TARGETS:
        print(f"  {p}")
    print()
    print("Tip: `export EDITOR=nano` (or vim / code) then re-run.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
