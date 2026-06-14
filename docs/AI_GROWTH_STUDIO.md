# AI Growth Studio — WhiteDot Infinity Growth OS

Eight high-leverage AI capabilities added to the portal as a new sidebar group
**AI Growth Studio**. Each is a real, Claude-backed tool: a structured input
form → a server prompt → Claude → a reviewable draft. Nothing is sent, published,
deployed or traded automatically — every output is a DRAFT for a human.

Source of the playbook: the AI business-capability set the team collected
(3D web, conversion audits, SEO pipelines, UGC engineering, algo research) plus
the Naval-leverage prompt frameworks (leverage / productize / time-money).

## Tools

| Module | Route | What it does | Sell as |
|---|---|---|---|
| 3D Web Studio | `/admin/studio/web3d-studio` | Full Three.js / scroll-site build brief | Client web service |
| Conversion Audit | `/admin/studio/conversion-audit` | Senior CRO bottleneck report + top fix | Fast paid audit |
| SEO Pipeline | `/admin/studio/seo-pipeline` | 1 keyword → 15+ article plan + linking map | Monthly SEO retainer |
| UGC Script Engine | `/admin/studio/ugc-engine` | Ad teardown → batch of creator scripts | Content service |
| Leverage Auditor | `/admin/studio/leverage-auditor` | Naval 4-lever audit + 3 moves | Owner strategy |
| Productize Blueprint | `/admin/studio/productize-blueprint` | Expertise → scalable product plan | Owner strategy |
| Time–Money Leak Detector | `/admin/studio/time-money-leak` | Time-rent ratio + equity escape path | Owner strategy |
| Algo Trading Research | `/admin/studio/algo-research` | Strategy + Monte-Carlo backtest plan (research only) | Personal R&D |

## Architecture

- **Server registry** `server/src/services/aiTools.ts` — single source of truth:
  each tool = `{ id, name, tier, maxTokens, role, buildUser(inputs) }`. The system
  prompt = brand context + role + safety rules (reuses `BRAND_CONTEXT` /
  `SAFETY_RULES` exported from `aiAgent.service.ts`).
- **Shared completion** `aiAgent.service.ts → complete({ system, user, tier, maxTokens })`
  — one Anthropic call path, tier→model selection, cost accounting. `runAgent`
  (fleet agents) and the tool endpoint both use it.
- **Endpoint** `POST /api/portal/ai/tool` `{ tool, inputs }` →
  `portal.controller.ts → runAiTool`. Auth-gated (portal router), zod-validated
  (`runAiToolSchema`), stores each run in `AiAgentRun` (`agentId = "tool:<id>"`)
  for unified cost reporting, logs `AI_TOOL_RUN`. `GET /api/portal/ai/tools` lists
  available tools + `configured` flag.
- **Frontend** `src/admin/portal/aiTools.ts` mirrors the registry (ids + field
  names) for form rendering only — prompts never reach the client. One generic
  `pages/AiToolPage.tsx` renders any tool by key (form → run → output → Copy /
  Save-to-Approvals). Registered as `live` modules in `modules.ts`; routes added
  in `AdminApp.tsx` via `AI_TOOLS.map(...)`.

Add a new tool = add one entry to **both** `aiTools.ts` files with the same `key`
and field `name`s, plus a module entry + the route is automatic via the map.

## Operating it

1. **Set `ANTHROPIC_API_KEY`** in the Render backend env (already referenced in
   `server/src/config/env.ts`, `sync: false`). Without it the tools return a
   graceful 503 ("AI tools are not configured"). Optional `ANTHROPIC_MODEL`
   overrides the per-tier model.
2. Model tiers (`aiAgent.service.ts → TIER_MODEL`): strategy → `claude-opus-4-8`,
   content/specialist → `claude-sonnet-4-6`. Cost is shown under each output.
3. Each tool output can be saved to the **Approval Center** for sign-off before
   any external use.

## Safety

- Prompts and the Anthropic SDK call live **server-side only** — no keys client-side.
- Safety rules forbid inventing LIMEX specs, prices, certifications, delivery
  dates or CO₂ numbers (uses `[verify: …]` placeholders instead).
- Algo Trading Research is framed as **research/education only, not financial
  advice**, with a human-in-the-loop checklist before any real capital.

## Companion Claude skills

Eight standalone Claude Code skills mirror these tools (folder prefix `wd-` under
`~/.claude/skills/`) so the same capabilities are usable directly in Claude Code,
not only inside the portal.
