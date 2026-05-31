---
name: ai-agent-build
description: >-
  The Claude Code Agent Development Kit — the 5-layer architecture for building
  capable agents: CLAUDE.md (memory) + Skills (knowledge) + Hooks (guardrails) +
  Subagents (delegation) + Plugins (distribution). USE THIS when designing,
  reviewing, or extending an agent setup: deciding what belongs in CLAUDE.md vs
  a skill, adding hooks to enforce rules deterministically, creating or
  delegating to subagents, packaging capabilities as plugins, or answering "how
  should I structure this agent / where should this knowledge live?" Encodes the
  mental model and per-layer decision rules so a session doesn't rederive them.
---

# AI Agent Build — The Claude Code Agent Development Kit

A practical model for building agents that are capable *and* token-lean. Source:
Brij Kishore Pandey's "Agent Development Kit" framing, reconciled with the actual
Claude Code architecture. The diagram is a creator's summary — the architecture
is real; treat https://code.claude.com/docs as authoritative when they differ.

Core idea: **Claude Code is not just a coding assistant — it's a 5-layer agent
architecture.** Most setups only use Layer 1. The skill of agent-building is
knowing which layer a given concern belongs to.

```
CLAUDE.md → Skills → Hooks → Subagents → Plugins
 rules      expertise  quality   delegate    distribute
```

---

## Layer 1 — CLAUDE.md  (The Memory Layer)
- **What:** architecture rules, naming conventions, test expectations, repo map.
- **Scope:** `~/.claude/CLAUDE.md` (global) + `<project>/.claude/CLAUDE.md` or
  repo-root `CLAUDE.md` (project). Project overrides/extends global.
- **Behavior:** **always loaded, always active** — the agent's constitution.
- **Decision rule:** put something here ONLY if it must apply to *every* turn.
  Because it's always-on, it costs tokens on every message. Anything
  task-specific belongs in Layer 2, not here. The most common mistake is
  bloating CLAUDE.md with knowledge that should be a skill.

## Layer 2 — Skills  (The Knowledge Layer)
- **What:** a `SKILL.md` with YAML frontmatter (`name`, `description`) plus
  optional reference docs, scripts, and templates in the same folder.
- **Behavior:** **on-demand, not always-on.** Description-matched to the task and
  auto-invoked. Key detail: **a skill's context can fork into an isolated
  subagent**, so loading deep reference material doesn't pollute the main window.
- **Decision rule:** use a skill for task-specific expertise a *new session would
  otherwise have to rediscover* — domain conventions, multi-step procedures,
  "how we do X here." Write the `description` around triggers ("USE THIS
  when…") so matching is reliable.
- **Location:** `.claude/skills/<name>/SKILL.md` (project) or `~/.claude/skills/…`
  (global). Invoke via the Skill tool / `/<name>`.

## Layer 3 — Hooks  (The Guardrail Layer)
- **What:** shell commands fired on events: `PreToolUse`, `PostToolUse`,
  `SessionStart`, `Stop`, `SubagentStop` (matchers decide when).
- **Behavior:** **deterministic, NOT AI** — "Git hooks for your agent." Flow is
  `event fires → matcher checks → command runs`.
- **Examples:** auto-lint/format on Write, **block `rm -rf`** on Bash, run
  `tsc`+build before a commit, Slack notification on Stop.
- **Decision rule:** if a rule must be *enforced* (not merely remembered),
  it's a hook — don't rely on the model to honor a CLAUDE.md line every time.
  Configure in `settings.json` (use the `update-config` skill).

## Layer 4 — Subagents  (The Delegation Layer)
- **What:** specialized agents (e.g. `code-reviewer`, `test-runner`, `explorer`)
  each with **own context window, own model, own tools, own permissions.**
- **Behavior:** parent delegates a task and gets back only the result, keeping
  the main context clean. **No infinite recursion — subagents can't spawn
  subagents.** Patterns: "delegate only" (fire-and-forget) and "results only"
  (return conclusion, not the file dump).
- **Decision rule:** delegate heavy fan-out / isolated work (broad search, a
  focused build, review) to one subagent rather than doing it inline or running
  a five-agent "team." One good subagent beats a team on most tasks and costs a
  fraction of the tokens.

## Layer 5 — Plugins  (The Distribution Layer)
- **What:** a package bundling `skills/ agents/ hooks/ commands/` — "npm
  packages for agent capabilities."
- **Behavior:** install via a marketplace / team share so a whole team inherits
  the same Layers 1–4.
- **Decision rule:** reach for a plugin only once a capability is proven and
  worth sharing across repos/teammates. Don't package prematurely.

---

## The flow (how the layers compose)
`CLAUDE.md rules → Skills provide expertise → Hooks enforce quality →
Subagents delegate work → Plugins distribute to the team.`

Adjacent infrastructure the diagram places on the sides:
- **MCP Servers** (left): external tools — GitHub, databases, APIs, custom
  integrations. The agent's hands into the outside world.
- **Agent Teams** (right): parallel execution, message passing, lead
  orchestration, shared permissions — built on Layer 4.

## "Where does this belong?" — quick triage
- Applies to every turn, forever → **Layer 1 (CLAUDE.md)**.
- Task-specific know-how, pulled in when relevant → **Layer 2 (Skill)**.
- Must be enforced mechanically, not trusted to memory → **Layer 3 (Hook)**.
- Heavy/isolated work that would bloat context → **Layer 4 (Subagent)**.
- Proven capability worth sharing across repos/team → **Layer 5 (Plugin)**.
