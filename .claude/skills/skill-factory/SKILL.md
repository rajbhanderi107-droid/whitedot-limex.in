---
name: skill-factory
description: Manufacture new Claude skills from grounded source material using the NotebookLM → Claude "Skills Factory" loop — build a new AI expert in ~5 minutes with zero hallucinations. USE THIS when the user wants to create, author, scaffold, or "learn"/"turn this into" a new skill (a SKILL.md), distill PDFs/articles/YouTube/transcripts into a reusable recipe, or set up a repeatable "one skill per job type" workflow (email, landing page, FAQ, support reply, anything else). Encodes the 5-step loop, the source-grounding rule, the SKILL.md anatomy, and the repo's skill conventions.
---

# Skill Factory — Build a new AI expert in ~5 minutes · Zero hallucinations

> A meta-skill: a recipe for writing recipes.
> It captures the **NotebookLM → Claude Skills Factory** loop so any session can
> turn trusted sources into a clean, grounded, reusable `SKILL.md` — then repeat
> the loop for every new job type.

## The thesis

A skill is a **recipe Claude follows the same way every time**. The factory makes
skills that are *grounded in real sources* rather than improvised, so the output
is consistent and free of hallucination. One skill per job type; loop forever.

```
sources  →  distill to SKILL.md  →  drop into skills folder  →  Claude follows the recipe
   ▲                                                                      │
   └──────────────────  repeat the loop for every new skill  ◀───────────┘
```

## When to use this skill

- "Learn this and make it a skill" / "turn this into a skill" / "create a skill for X"
- The user hands over sources (PDFs, articles, YouTube links, docs, a transcript, a
  screenshot of a process) and wants a repeatable expert built from them.
- Setting up **one skill per job type** — email, landing page, FAQ, support reply, etc.
- Any time output needs to be *consistent every single time* and *traceable to sources*.

## The 5-step loop (from the Skills Factory)

### 1. Gather your best sources
Collect the authoritative material the skill must be built on: PDFs, articles,
YouTube links/transcripts, internal docs, examples of "good" output. Quality of
sources = quality of skill. In NotebookLM this is "add sources"; here it's the
files/links/notes the user provides. **Garbage in, garbage out — curate.**

### 2. Distill into a SKILL.md — *based only on those sources*
Write the recipe **strictly from the supplied sources**. This is the
zero-hallucination rule:
- Do **not** invent facts, steps, numbers, APIs, or claims not present in the sources.
- If the sources are silent on something needed, mark it `TODO: confirm with source`
  rather than guessing.
- Prefer quoting/paraphrasing the source's own rules, thresholds, and examples.
- Cite where a rule came from when it isn't obvious (`(per <source>)`).

### 3. Drop the file into the skills folder
- The infographic shows `/mnt/skills/` (Claude Code's managed skills location).
- **In this repo, skills live in `.claude/skills/<skill-name>/SKILL.md`** — match the
  existing convention (`king-queen`, `whitedot-cinematic`). One folder per skill.
- File name is always `SKILL.md`; the folder name is the skill's `name`.

### 4. Claude reads the skill and follows the recipe
Once present and well-described, Claude loads the skill on matching tasks and
follows it — consistent output, every single time. A good `description` is what
makes the skill *fire at the right moment*; treat it as the trigger, not a summary.

### 5. One skill per job type — then loop
Keep each skill **narrow and single-purpose**. Don't build a mega-skill. Build
`email`, then `landing-page`, then `faq`, then `support-reply`, then *anything else* —
repeat the loop for every new job type. Small, sharp, composable.

## Anatomy of a good SKILL.md

```markdown
---
name: kebab-case-name              # must match the folder name
description: >                     # the TRIGGER — write it like a search query.
  One or two sentences. State WHAT it does and WHEN to use it ("USE THIS when…").
  Pack in the words a user would actually say. This is how the skill gets selected.
---

# Title — one-line promise

> Optional blockquote: the thesis / what this encodes and why.

## When to use this skill
- Concrete trigger phrases and task types (mirror real user language).

## The recipe
Numbered, deterministic steps. The heart of the skill. Same input → same output.

## Rules / guardrails
Hard constraints, thresholds, do-nots. Grounded in sources.

## Examples (optional but powerful)
✓ good / ✗ bad pairs. Show the target output, don't just describe it.

## References (optional)
Point to bundled files in the skill folder (templates, data, scripts).
```

### Description writing — the single highest-leverage part
The `description` decides whether the skill ever fires. Make it:
- **Specific** about the job ("write procurement-grade B2B email replies"), not vague
  ("helps with writing").
- **Trigger-rich**: include the verbs and nouns a user types ("create a skill", "turn
  this PDF into", "FAQ", "landing page copy").
- **Bounded**: say when *not* to use it if there's an adjacent skill, to avoid misfires.

## Zero-hallucination discipline (the factory's promise)

This is the whole value proposition — protect it:
1. **Source-bound.** Every factual claim in the skill traces to a supplied source.
2. **No fabrication.** Missing info becomes an explicit `TODO`, never a guess.
3. **Show the seams.** When a rule comes from a specific source, name it.
4. **Examples over assertions.** A real ✓/✗ example from the sources beats a paraphrase.
5. **Verify before shipping.** Re-read the draft against the sources; cut anything you
   can't point back to.

## Procedure (what to do when invoked)

1. **Confirm the job type and gather sources.** If the user hasn't supplied sources,
   ask for them (or for the existing material/URL to ground on). Don't improvise a
   skill from general knowledge — that breaks the zero-hallucination promise.
2. **Pick a kebab-case name** and create `.claude/skills/<name>/`.
3. **Draft `SKILL.md`** following the anatomy above, grounded only in the sources.
   Keep it narrow — one job type.
4. **Bundle assets** if useful (templates, examples, data, a script) in the same folder
   and reference them from the skill.
5. **Self-check** against the zero-hallucination discipline; mark gaps as `TODO`.
6. **Report** the new skill's path, its `description`, and how to trigger it. Loop for
   the next job type.

## Repo conventions (this project)

- Location: `.claude/skills/<name>/SKILL.md` (not `/mnt/skills/`).
- Match the voice/format of existing skills (`king-queen`, `whitedot-cinematic`).
- Commit with conventional-commit style (`feat: …`), one logical change per commit.
- Skills are documentation, not site code — they don't affect the bundle budget or
  the removable-module systems.

## Anti-patterns

- ✗ A mega-skill that does email *and* landing pages *and* FAQs — split them.
- ✗ A vague description ("assists with content") — it won't fire reliably.
- ✗ Inventing steps/numbers not in the sources — defeats the purpose.
- ✗ Fake recipes with no deterministic steps — output won't be consistent.
- ✗ Dumping raw source text instead of distilling it into a recipe.
