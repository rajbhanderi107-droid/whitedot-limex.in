# Brand fonts — sourcing & rationale

White Dot uses a researched three-family system, all free for commercial use and
served via CDN.

## The system

| Role | Family | Foundry | Source / CDN |
|------|--------|---------|--------------|
| **Primary sans** (display + UI + body) | **Satoshi** (Variable) | Indian Type Foundry, by Deni Anggara | [fontshare.com/fonts/satoshi](https://www.fontshare.com/fonts/satoshi) |
| **Editorial display** (pull-quotes, stat numerals) | **Boska** | Indian Type Foundry | [fontshare.com/fonts/boska](https://www.fontshare.com/fonts/boska) |
| **Mono / data** (tokens, telemetry, code) | **JetBrains Mono** | JetBrains | [fonts.google.com/specimen/JetBrains+Mono](https://fonts.google.com/specimen/JetBrains+Mono) |
| **Japanese co-brand** (ライメックス / ホワイト・ドット) | **Noto Sans CJK JP** | Google + Adobe | self-hosted — `fonts/NotoSansCJKjp-{Regular,Bold}.otf` |

## Why these — research summary (May 2026)

### Satoshi
A "Swiss-style modernist sans serif" with "elegant rounded shapes and sharp
angular details." Inspired by **Modernism and the Industrial Era** — a precise
match for the limestone / raw-material brand metaphor. Indian Type Foundry is
based in Ahmedabad, which aligns Satoshi's *origin* with White Dot's
Gujarat headquarters. Two variable axes, 10 statics from Light → Black.
Distinct character (double-storey `a`/`g` defaults, sharp `t` terminal,
tabular figures) without being precious.

Used by Vercel, Framer, and a wide slate of 2025–26 sustainable/DTC brands.
Marked as one of the leading 2026 sans choices in the Fontfabric and FreeForFonts
trend roundups.

### Boska
Same foundry; high-contrast didone serif with chiselled, almost carved
terminals — a "cut limestone" gesture. Used **sparingly** — only the rare
pull-quote, the rare large stat numeral, never body. Provides editorial
range that Satoshi alone can't.

### JetBrains Mono
Open shapes, characterful zero (`0`), true italics. More distinctive than
Geist Mono or IBM Plex Mono without losing technical authority. Fits the
"procurement-grade" voice the README documents.

## Why we retired Inter

Inter is excellent but is now the default of every B2B SaaS interface — it
no longer signals identity. White Dot is a specialised industrial brand that
deserves a more particular voice. Satoshi gives us the same neutral
clarity at small sizes while reading as **considered** at display sizes.

## How it's loaded

Satoshi and Boska come from a Fontshare CSS request. JetBrains Mono and
Noto Sans JP load from Google Fonts in the GitHub Pages preview so the
website repository does not carry large CJK font binaries. The downloaded
OTF files are retained locally in `C:\Users\rbhan\OneDrive\Desktop\whitedot\fonts`.

See `preview/_base.css`:

```css
@import url("https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&f[]=boska@400,500,700,900&display=swap");
@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400..700;1,400..700&display=swap");
```

For self-hosting in production, download the `.woff2` files from Fontshare
(Satoshi + Boska) and Google Fonts (JetBrains Mono), and use the local
Noto Sans CJK JP `.otf` files from the workspace `fonts/` folder. Then swap
the CDN imports for `@font-face` blocks. The CSS tokens in
`colors_and_type.css` do not need to change.

## Token mapping

In `colors_and_type.css`:

| Token | Value |
|-------|-------|
| `--wd-font-sans`    | Satoshi → fallback stack |
| `--wd-font-display` | Boska → Satoshi → serif |
| `--wd-font-mono`    | JetBrains Mono → ui-monospace |
| `--wd-font-jp`      | Noto Sans JP → Hiragino Sans → Yu Gothic UI → Meiryo → `--wd-font-sans` |

`font-synthesis: none` is set globally — weights are only used if the actual
file is loaded.

## Licensing

- **Satoshi, Boska:** free for personal and commercial use via the ITF /
  Fontshare license. Required to credit Indian Type Foundry in design /
  production credits when used in published brand work.
- **JetBrains Mono:** Apache 2.0.
- **Noto Sans CJK JP:** SIL Open Font License 1.1. Free for commercial use.
  The two `.otf` files in this folder were uploaded by the brand team —
  treat as authoritative.

## When to use the Japanese face

Noto Sans CJK JP is loaded **only** for runs of Japanese text (kana / kanji)
and for the kanji co-brand wordmark 『ライメックス · ホワイト・ドット』.
It is **not** the brand's Latin face — Satoshi handles all A–Z, so the
`unicode-range` on the `@font-face` blocks restricts JP weights to CJK
blocks. This avoids:

1. Satoshi being overridden on Latin characters in mixed copy.
2. The Latin glyph design switching mid-line, which reads as a bug.

Mixed-language lines (e.g. `LIMEX を採用`) work transparently: Satoshi
renders `LIMEX`, Noto renders `を採用`. Set `font-family: var(--wd-font-jp)`
on blocks that are predominantly JP — the Latin in those blocks then falls
through Noto's Latin glyphs (which are competent but less distinctive)
or, more typically, you set `lang="ja"` and let the browser pick.

## Alternatives considered

| Considered | Why we didn't pick |
|------------|-------------------|
| Inter      | Over-used industry default; no longer signals identity |
| Geist / Geist Mono | Strong, but reads as "Vercel-coded"; less editorial range |
| IBM Plex   | Excellent but reads as IBM corporate; doesn't fit Indian foundry story |
| Söhne / Neue Haas Grotesk | Proprietary, expensive licensing |
| PP Neue Montreal | Pangram Pangram license; would prefer free for early-stage brand |
| Space Grotesk | Quirky terminals fight the procurement-grade tone |
| Editorial New / Fraunces | Flagged as over-used display serifs |

If the team wants to upgrade to a proprietary face later, **PP Neue Montreal**
is the closest premium peer to Satoshi and the natural step up.
