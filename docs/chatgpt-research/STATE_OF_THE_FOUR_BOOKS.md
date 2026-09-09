# State of the Four Books

Briefing for ChatGPT (Astra) on the WhiteDot LIMEX field system.
Shareable version: https://claude.ai/code/artifact/65f6a1ff-8a00-46fb-8b68-2c9c00e45985

As of 9 September 2026 · frontend `2df45e1` · backend `73d05e2` · Hostinger VPS `187.127.185.57`

---

## The register, in numbers

| | |
|---|---|
| Companies | 1,464 |
| Legs | 166 |
| Families | 15 |
| Ahmedabad area | 341 |
| `fit: prime` | 171 |
| Parked (`clear` + `no`) | 65 |

Tagged: `Thin Wall` 59 · `Toys` 20 · `Containers` 52

A *leg* is a drivable round — one estate, one sweep. A *family* groups legs by geography or
theme. Every company carries a `fit` from `prime · good · weak · channel · clear · no` and a
`why` in plain words. `clear` and `no` are parked: hidden from the route unless the Parked chip
is on.

**341 of 1,464 are in Ahmedabad — still roughly a quarter.** Raj wants to concentrate there.
That ratio, not the size of the book, is the live problem: three sweeps in a row added real
companies without moving it, because the state's plastics industry genuinely is spread across
Rajkot, Morbi, Vadodara and South Gujarat.

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
| Twenty-one for containers and toys (backend #15) | Finished the research ChatGPT stopped on, then eighteen toy makers from the Toy Association of India member list. `Toys` went 2 → 20; Morbi went 0 → 5. |

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

1. **The Ahmedabad ratio, still unmoved.** 341 in Ahmedabad, 1,033 elsewhere — the same quarter
   it was three sweeps ago, because every honest sweep keeps finding that the industry is
   genuinely spread across Rajkot, Morbi, Vadodara and South Gujarat. Adding companies is not
   shifting it. The real question is whether the answer is more Ahmedabad companies at all, or
   reordering the book so Ahmedabad families lead, or accepting the register as a state-wide
   asset and changing how a *round* is chosen rather than what the book contains.

2. **Answered, and it moved the map.** `Toys` went from 1 to 20, and Morbi from 0 companies to
   5. But the answer confirmed the tension rather than resolving it: five of the toy houses are
   at Morbi, five at Rajkot, and only five in Ahmedabad. **Gujarat's toy moulding is not in
   Ahmedabad.** Worth a decision — pursue toys where they actually are, and accept the drive, or
   treat toys as opportunistic and keep the round in the city?

3. **Answered: use registers, not directories.** Directory search returns the tooling trade
   because that is who advertises — it sank two sweeps and ChatGPT's own attempt, and one
   four-estate sweep yielded four companies. The **Toy Association of India** member list, where
   members file their own name, city, type and product range, yielded eighteen from one list.
   The open half: **is there an equivalent register for containers and packaging?** A Gujarat
   plastics association roll, a GIDC estate member list, MSME or GST filings by NIC code. That
   is the highest-leverage question on this page, because it decides the cost of every future
   company added.

4. **`fit` is doing a lot of work, and the ratio is getting worse.** 1,115 of 1,464 now sit at
   `good`, the "plastics processor, confirm on the call" default, against 171 `prime`. Round
   ordering leans on this field. Association entries make it sharper: they arrive with a
   declared product range, so the ones that name a material earn `prime` on evidence rather than
   on a register name. Is a coarser signal plus a real qualification step better than a
   six-value fit, most of which is a default?

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
