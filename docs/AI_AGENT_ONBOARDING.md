# AI Agent Onboarding — Read This First

One-page orientation for any AI session (Claude, ChatGPT, Gemini, etc.) picking up
work on this repo cold. Written 2026-07-10 after a debugging session that found
and fixed several production bugs — read the "Known gotchas" section before
touching `case-study` product data or the deploy pipeline.

## What this project is

WhiteDot's marketing site for LIMEX (a limestone-based plastic/paper
replacement material, invented by TBM Co., Japan). React + Vite + TypeScript,
cinematic/premium design. Full mission and design rules: `CLAUDE.md` (repo root).

## Infrastructure (locked — do not suggest alternatives)

- **Host**: Hostinger VPS `187.127.185.57`, nginx serves `/var/www/whitedot-frontend`.
- **Domain**: `whitedotindia.in` → the VPS. API at `api.whitedotindia.in` → Docker on the same VPS, port 4000.
- **Deploy**: GitHub Actions (`.github/workflows/*.yml`), triggered by push to `main`. The
  "Deploy Frontend" job runs `npm run build` fresh on the CI runner, then `scp`s the
  resulting `dist/` to the VPS via `appleboy/scp-action`. **The repo's own committed
  `dist/` folder is never actually deployed** — CI rebuilds it from scratch every time.
- Never suggest Render, Vercel, Railway, Heroku, Fly.io, or hosted Supabase for this project.
- **DNS**: authoritative on **Cloudflare** (`noel`/`fiona.ns.cloudflare.com`), not at
  Hostinger. DNS edits made anywhere else have no effect. This includes the mail
  records — see `docs/EMAIL_DNS.md`, and note that the domain's SPF/DKIM/DMARC are
  currently misconfigured in a way that blocks mail.

## Known gotchas (read before editing product/case-study data)

1. **`public/` is the only source of truth for static assets.** Vite copies
   `public/` → `dist/` verbatim on build. Editing `dist/` by hand is pointless —
   it gets overwritten on the next deploy. (A past session double-edited both
   dirs for a while out of caution; that was wasted effort. Just edit `public/`.)

2. **This repo has been hit by a recurring corruption pattern**: literal
   unresolved `git stash pop` conflict markers (`<<<<<<< Updated upstream` /
   `=======` / `>>>>>>> Stashed changes`) committed directly into files instead
   of being resolved. This has broken, at various times: a product JSON (invalid
   JSON → broken product card), `product.html` (markers inside a `<script>` tag →
   JS syntax error → the whole page hangs on "Loading..." forever), and
   `products.json` (same). **Before trusting any file in `public/case-study/`,
   grep it for `<<<<<<<`.** Repo-wide check:
   ```bash
   grep -rl "^<<<<<<< \|^=======$\|^>>>>>>> " --exclude-dir=node_modules --exclude-dir=.git .
   ```
   (One perpetual false positive: `docs/whitedot brain/.obsidian/plugins/obsidian-git/main.js`
   — that's third-party plugin code that legitimately contains those strings.)
   Root cause is almost certainly parallel/automated sessions running
   `git stash` and not cleaning up conflicts before committing. **If you run
   `git stash`, always resolve conflicts fully before committing — never commit
   a file containing conflict markers.**

3. **The GitHub Actions deploy step can silently hang or fail** with
   `dial tcp ...:22: i/o timeout` — the VPS occasionally becomes unreachable via
   SSH from GitHub's runners. This is infrastructure flakiness, not a code bug.
   If a deploy has been "in_progress" for more than ~5 minutes, it's stuck —
   check `gh run view <id>`, and if it shows the scp step hanging, cancel and
   retry once VPS SSH is confirmed reachable. Nothing you push will go live
   until a deploy actually completes.

4. **Product 10 (Dairy Products Container)** has had two independent, parallel
   3D-model implementations built by different sessions (`dairy-products-container.glb`
   and `dairy-container-procedural.glb`). The live code (`CaseStudyFeature.tsx`,
   `product.html`) currently references `dairy-container-procedural.glb`. If you
   touch this product, grep both files for `dairyContainer` / `dairyProductsContainer`
   to confirm which key/path is actually wired up before assuming your edit will
   show up live.

5. **Premium/cinematic mode can be forced off** for testing or debugging via
   `?premium=off` in the URL (persists to `localStorage`, see
   `src/premium-wd/premiumMode.ts`). It also auto-disables itself on
   low-`deviceMemory` / low-`hardwareConcurrency` devices, `prefers-reduced-motion`,
   and `saveData` connections — this is intentional graceful degradation, not a bug.
   If a video/animation "isn't playing," check `document.documentElement.dataset.premium`
   before assuming it's broken.

## Product / case-study data model

- `public/case-study/data/products.json` — canonical list of all 35 planned
  products (`status: "live" | "pending"`).
- `public/case-study/data/products/<slug>.json` — per-product detail (only
  meaningful for `"live"` products).
- `public/case-study/data/specs.json` — full verified specs, keyed by product `id`.
- **Never fabricate LIMEX composition %, CO2 figures, or supplier specs** for a
  product that doesn't have them verified. Leave `composition`/`specs` as `null`
  and say so in a `note` field. Source of truth for real numbers: the official
  White Dot "LIMEX Case Studies in India" PDF or verified supplier TDS.
- `src/cinematic-v2/sections/CaseStudyFeature.tsx` hardcodes model file paths
  and camera orbits per product — the JSON's `modelFile` field is documentation
  only, **not** read by the React app at runtime. `product.html` (the standalone
  per-product page) has its own separate `MODEL_SRC` / `CAMERA_ORBIT` maps inline
  in a `<script>` tag — keep both in sync manually when changing a model path.

## Verifying a fix actually went live

Don't trust "the deploy succeeded" alone — verify the served content directly:
```bash
curl -s https://whitedotindia.in/case-study/data/products/<slug>.json | python3 -m json.tool
curl -sI https://whitedotindia.in/case-study/model/<file>.glb   # check size/200
```
For anything served as `<script>` inline HTML, grep the live response for
conflict markers / expected strings before declaring it fixed — a build can
succeed and deploy can complete while the file itself is still broken.

## Where other docs live

- `CLAUDE.md` — full mission, design standards, and operating rules (read this too).
- `docs/runbook.md` — performance budgets, feature-flag/kill-switch reference, rollback steps.
- `docs/CACHE_AND_DEPLOY.md`, `docs/PREVIEW_DEPLOYS.md` — caching and preview-deploy details.
- `docs/EMAIL_DNS.md` — SPF/DKIM/DMARC for the domain, why mail is currently broken, and how to fix it.
- `docs/products/` — per-product research/build notes.
- `docs/brain/`, `docs/whitedot brain/` — Obsidian-based project memory (human-curated).
