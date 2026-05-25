---
description: Token Saver Context Bridge — status / summarize-now / handoff / edit / clean / disable / help
argument-hint: "[status|summarize-now|handoff|edit|clean|disable|help]"
---

You are dispatching a subcommand for the **Token Saver Context Bridge**
local skill. The argument the user passed is `$ARGUMENTS` (may be empty).

Pick the matching branch below and execute it. **Do not** read entire
transcript files or archive chunks into your context unless the user
explicitly asks. Prefer running the Python scripts and showing their
output.

---

### Branch — `status` (default if no argument)

Run:

```
python .claude/scripts/tokensaver/token_saver.py status
```

Then briefly explain the numbers: how many unsummarized messages remain
and whether a chunk will auto-write soon (threshold lives in
`.claude/scripts/tokensaver/config.json`).

---

### Branch — `summarize-now`

Run:

```
python .claude/scripts/tokensaver/token_saver.py summarize-now
```

That writes / refreshes a mechanical chunk file. If a chunk was written,
**you (Claude) should now upgrade it**:

1. `Read` the newest chunk under `.claude/context/tokensaver/chunks/`.
2. Rewrite it in your own words with these sections (preserve the
   front-matter line `_transcript:` and `_generated:`):
   - Current project goal
   - User preferences / strict instructions
   - Decisions made
   - Files created / edited / deleted
   - Code architecture changes
   - Bugs / errors and fixes attempted
   - Commands run (keep mechanical list)
   - Pending tasks
   - Things to NOT repeat
   - Important prompts saved
   - Media / design / cinematic instructions (if any)
   - Unresolved questions
   - Next recommended action
3. `Write` the upgraded version back to the same chunk path.
4. Refresh the handoff by running:
   ```
   python .claude/scripts/tokensaver/build_handoff.py
   ```

Report the chunk path and a one-line description of what changed.

---

### Branch — `handoff`

Run:

```
python .claude/scripts/tokensaver/build_handoff.py
```

The script prints the contents of `NEW_CHAT_STARTER.md` to stdout.
Show that output to the user verbatim inside a fenced markdown block so
they can copy-paste it into a new Claude chat. **Do not** paraphrase it.

---

### Branch — `edit`

Run:

```
python .claude/scripts/tokensaver/edit_context.py
```

Tell the user which files the script targets:

- `.claude/context/tokensaver/EDITABLE_CONTEXT.md`  ← user truth
- `.claude/context/tokensaver/CURRENT_HANDOFF.md`
- `.claude/context/tokensaver/CURRENT_SUMMARY.md`

Backups are written under `archive/edit-backups/`.

---

### Branch — `clean`

Run:

```
python .claude/scripts/tokensaver/token_saver.py clean
```

This moves raw/ contents and chunks older than the latest 5 into
`archive/`. Summary files are untouched. Report what was moved.

---

### Branch — `disable`

Do NOT modify any files. Just explain:

> Edit `.claude/settings.local.json` and remove the `Stop` hook entry
> for `tokensaver`, or set its matcher to a value that never fires.
> The generated context files stay on disk; nothing is deleted.

Show the user the relevant `.claude/settings.local.json` block from the
file using `Read`.

---

### Branch — `help`

Print the table from `.claude/skills/tokensaver/SKILL.md` under
"Commands". Do not regurgitate the whole SKILL.md.
