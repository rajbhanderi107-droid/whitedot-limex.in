# WhiteDot LIMEX Website Project

## Project

WhiteDot India LIMEX / CR LIMEX website for regional distribution and customer education across Gujarat, Rajasthan, Diu, Daman, and Goa.

## Live Website

https://rajbhanderi107-droid.github.io/whitedot-limex.in/

## Admin Website

Target custom domain: `https://admin.whitedot-limex.in`

## GitHub Repository

https://github.com/rajbhanderi107-droid/whitedot-limex.in

## Current Stack

- Vite
- React
- TypeScript
- Three.js
- Plain CSS
- Express
- Prisma
- PostgreSQL
- GitHub Pages deployment through the `gh-pages` branch

## Local Commands

```bash
npm install
npm run dev
npm run build
npm --prefix server install
npm run backend:dev
npm run backend:build
```

## Main Files

- `src/App.tsx` - website content and sections
- `src/admin` - admin dashboard frontend
- `server/src` - merged WhiteDot backend API
- `server/prisma/schema.prisma` - backend database schema
- `src/HeroScene.tsx` - floating LIMEX stone and particle animation
- `src/styles.css` - full visual theme, responsive layout, and animations
- `public/assets/limex-rock.webp` - optimized floating stone texture
- `public/assets/india-map-source.svg` - glowing India territory map
- `public/assets/whitedot-symbol.svg` - WhiteDot symbol
- `.github/workflows/pages.yml` - GitHub deployment workflow

## Contact Details Used

- WhatsApp: `+91 88497 28938`
- Email: `office@whitedotindia.in`

## Important Notes

- The public GitHub Pages link is the shareable customer link.
- The admin dashboard should use `admin.whitedot-limex.in`; `whitedot-limex.admin.in` is a different domain.
- Do not share `127.0.0.1`; that is only the local preview URL.
- The website avoids unsupported endorsement wording for companies unless official permission or documents are supplied.
- Future launch updates should include final company address, approved logos, product catalogue PDFs, and a custom domain.

## Next Recommended Improvements

1. Connect a custom domain such as `whitedot-limex.in`.
2. Add official company address, GST, and dealership documentation if available.
3. Add downloadable product brochures and sample request forms.
4. Add Google Analytics and Google Search Console.
5. Add a product gallery using real sample photos.

## Token efficiency (operating habits — apply every session)

Source: Charlie Hills, "How to Never Hit Your Token Limits in Claude Code." Claude Code counts tokens, not messages — every turn re-reads the live context, so a lean window is a cheaper, longer, sharper session. Follow these by default in this repo.

**Context hygiene**
- `/compact` at ~50% of the window — not at 95%. Compacting a degraded, near-full context bakes in the noise; compacting at the halfway mark keeps the summary clean.
- `/clear` between unrelated tasks. Finished one task and moving to another? Start fresh — stale messages cost tokens on every later turn.
- `/context` to audit when a session feels heavy — it itemises system prompt, MCP tools, memory, and messages in tokens so you can see what's eating the window.

**Read narrow, not wide**
- Name the exact file; never read a whole directory tree to "look around." One file ≈ ~800 tokens; a folder tree ≈ ~12,000. Use Grep/Glob to locate, then Read the specific file.

**Plan before you build**
- Planning (read-only) is far cheaper than rebuilding. One failed build burns more tokens than ten minutes of planning.
- Problem first, not prescription: describe what's broken ("the loader never dismisses on iOS — find why"), not the fix you imagine. Prescribed solutions lock the wrong path and burn tokens implementing it.

**Match effort to the task** (`/effort`, or model choice)
- low / medium — quick edits, formatting, simple refactors, boilerplate. Lightest budget.
- high (default) — real coding, debugging, multi-step work. The everyday setting.
- xhigh / max — complex architecture, hard bugs, decisions costly to undo. Heaviest budget; reserve for it.
- Rule of thumb: Sonnet executes, Opus strategises. Don't burn max-effort tokens on a CSS tweak.

**Prefer the lighter tool**
- Prefer a single focused subagent (isolates one heavy task in its own window) over multi-agent "teams" that run several full conversations back-to-back. One good subagent beats a five-agent team on most tasks here — and costs a fraction of the tokens.
