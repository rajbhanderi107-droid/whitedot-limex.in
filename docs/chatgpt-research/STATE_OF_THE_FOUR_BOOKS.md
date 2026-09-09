# State of the Four Books

Briefing for ChatGPT (Astra) on the WhiteDot LIMEX field system.
Shareable version: https://claude.ai/code/artifact/65f6a1ff-8a00-46fb-8b68-2c9c00e45985

As of 9 September 2026 · frontend `0a48d0b` · backend `716ec56` · Hostinger VPS `187.127.185.57`

---

## The register, in numbers

| | |
|---|---|
| Companies | 1,443 |
| Legs | 163 |
| Families | 15 |
| Ahmedabad area | 331 |
| `fit: prime` | 157 |
| Parked (`clear` + `no`) | 65 |

A *leg* is a drivable round — one estate, one sweep. A *family* groups legs by geography or
theme. Every company carries a `fit` from `prime · good · weak · channel · clear · no` and a
`why` in plain words. `clear` and `no` are parked: hidden from the route unless the Parked chip
is on.

**331 of 1,443 are in Ahmedabad — roughly a quarter.** Raj wants to concentrate there. That
ratio, not the size of the book, is the live problem.

## One row, four books

A company appears in exactly one book, decided by a single field: `RouteBookMark.stage`.
No separate list per book, nothing to drift.

| Book | Rule | Paths |
|---|---|---|
| Route Book | `stage = PROSPECT` | `/route/` · `/admin/route-book` |
| Visit Follow-ups | `PROSPECT` + ticked or starred | `/visits/` · `/admin/visit-followups` |
| Lead Book | `stage = LEAD` | `/leads/` · `/admin/lead-book` |
| Customer Book | `stage = CUSTOMER` | `/customers/` · `/admin/customer-book` |

The fourth book is **derived, not stored** — no "follow-up" stage to set or forget to clear.

Stages advance `PROSPECT → LEAD → CUSTOMER`, with `LOST` reachable from any. A CRM mirror
pushes each change onto the pipeline board and **never walks a status backwards** — a card at
WON stays at WON even if the customer is un-made, and must be corrected by hand.

## Recently shipped

| Change | What it fixes |
|---|---|
| Fourth book: Visit Follow-ups (#99, #100) | The Lead Book was holding both real deals and "I visited them, now what". |
| Day record lists the round walked (#103) | It showed any company *touched* that day, so a removal looked like a visit. |
| Website logo as the app icon (#103) | The four apps carried hand-drawn glyphs, not the brand. |
| Versioned icon URLs (#104) | nginx serves `/assets/` as `immutable` for a year but icon filenames never change, so a new icon could never arrive. |
| Mould makers parked (backend #13) | Three sat at `fit: prime`; a toolroom buys steel, not resin. |
| Toys category opened (backend #13) | No toy maker in 1,438 companies, though moulded toys are opaque PP/HDPE. |
| Four Ahmedabad converters (backend #14) | Sweep of Odhav, Naroda, Vatva, Kathwada; the rest were already in the book. |

## Constraints any proposal must respect

- **Infrastructure — Hostinger VPS only.** Frontend from nginx at `/var/www/whitedot-frontend`;
  backend in Docker behind `api.whitedotindia.in`. Never propose Render, Vercel, Railway,
  Heroku, Fly.io or a hosted Supabase backend. Standing instruction, not a preference.
- **Company data — never invented.** No fabricated company, address, phone, or description of
  what a firm makes. Entries carry an empty `makes` and `precise: false` when the fact is not
  known, and say "confirm on the call".
- **Commercial figures** derive from settings Raj entered (`limexRate`, `substitutionPct`).
  No invented prices, margins or tonnages.
- **Product truth.** LIMEX is opaque, stone-white, >50% limestone in a polyolefin carrier. It
  replaces PP, LLDPE, LDPE, HDPE and PVC *inside a moulded or formed article*. That decides the
  register: clear PET is `fit: clear`, a mould maker is `fit: no`, a thin-wall tub is `prime`.

## Open questions — where Astra's judgement is worth most

1. **The Ahmedabad ratio.** 331 in Ahmedabad, 1,021 elsewhere. Keep adding Ahmedabad companies,
   reorder the book so Ahmedabad leads, or accept the register as a state-wide asset and change
   how the round is *chosen* rather than what it contains?
2. **Toys is a real category with one entry.** Moulded toys are squarely the LIMEX article, but
   Gujarat's toy cluster is Bhavnagar and Rajkot, not Ahmedabad. The two goals pull apart.
3. **Directory research returns the wrong industry.** Searching for toy or container makers in
   Ahmedabad returns mould makers and machine builders almost exclusively — the tooling trade
   advertises, converters do not. Four estates yielded four genuine finds. Better source?
   GIDC registers, association member lists, GST/MSME filings, trade-show exhibitor lists?
4. **`fit` is doing a lot of work.** 1,108 of 1,443 sit at `good`, the "confirm on the call"
   default; only 157 are `prime`. Round ordering leans on this. Is a coarser signal plus a real
   qualification step better than a six-value fit assigned mostly from a register name?

## Known debt

- **Waiting on Raj:** *Refresh register data (admin)* in the Route Book command palette applies
  the three register changes to the live database; *Restore* in the left rail replays 24 marks
  and 54 journal lines from a backup file.
- Manifests are served as `application/octet-stream`, not `application/manifest+json`, and with
  no `Cache-Control`. Both live in the VPS nginx config, not the repo.
- A Cloudflare Workers check fails on every PR. No Workers config has ever existed here.
- Public homepage Lighthouse performance ~0.43 (warn-only). No performance pass has been done.
- Installed home-screen icons do not refresh; phones snapshot them at install.

## How this codebase expects to be changed

- The register is a committed JSON file, `prisma/data/route-book.json`, that seeds only into an
  **empty** table. Editing it changes nothing live until *Refresh register data* runs, which
  upserts register fields and leaves every tick, note and outcome alone.
- Marks, journal lines and orders are user data, never touched by a register change. Stop ids
  carry a leg prefix (`G15-savita-containers-pvt-ltd`) but it is cosmetic — moving a company
  between legs must keep the id or its history is orphaned.
- Deduplicate on distinctive words, not exact names. Exact matching passed "Amar Plastics" as
  new when the book held "Amar Plastics (India)", and nearly filed "Jay Packaging" into the
  estate where "Jay Packaging Industries" already sat.
- Frontend deploys on push to `main`, backend on push to `master`. Both atomic; the backend
  rebuilds its container and the API returns 502 for roughly fifteen seconds mid-swap.
