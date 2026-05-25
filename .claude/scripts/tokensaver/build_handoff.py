#!/usr/bin/env python3
"""
Build / rebuild the new-chat handoff bundle.

This is a thin CLI wrapper around `token_saver handoff` so users have a
predictable single-purpose entry point. Prints the contents of
NEW_CHAT_STARTER.md to stdout so it is trivially copy-pasteable.
"""

from __future__ import annotations

import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))
import token_saver as ts  # noqa: E402


def main() -> int:
    rc = ts.cmd_handoff()
    if rc != 0:
        return rc
    if ts.STARTER_PATH.exists():
        print("\n" + "─" * 72)
        print("Paste this into a new Claude chat:")
        print("─" * 72 + "\n")
        print(ts.STARTER_PATH.read_text(encoding="utf-8"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
