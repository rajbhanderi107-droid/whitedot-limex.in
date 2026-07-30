# Marketing Site UI Kit

Faithful recreation of the **cinematic dark** variant of
`whitedot-limex.in`. Source files in the original repo:

- `src/main.tsx` → `src/cinematic/CinematicApp.tsx`
- `src/cinematic/cinematic.css` (40 KB of detailed styling)
- `src/cinematic/{Hero,SupplyFlow,MaterialIntelligence,IndustryApplications,LimexComparison,Consultation,SiteFooter}.tsx`

## What this kit demonstrates

A scrollable, click-through recreation of the cinematic site, sectioned
into modular React components that can be plugged into any prototype.

## Components

| File | Purpose |
|------|---------|
| `Icon.jsx`              | Inline Lucide-equivalent SVG icon set (outline / stroke 2). |
| `Nav.jsx`               | Fixed top nav with brand mark, section links, sage primary CTA. |
| `Hero.jsx`              | Headline ("Replace Plastic" gradient), sub-paragraph, supply-chain flow, dual CTA, eco-signal strip. |
| `SupplyFlow.jsx`        | TBM → Seven Dot → White Dot horizontal flow with pulsing connectors. |
| `MaterialIntelligence.jsx` | Left + right labels around a 3D-orb proxy with dashed orbital rings. |
| `IndustryApplications.jsx` | 4×2 grid of application cards with sage tile icons and hover halo. |
| `LimexComparison.jsx`   | Interactive tabbed comparison (vs Plastic / Paper / Fillers). |
| `Consultation.jsx`      | Closing CTA + 4-step adoption strip + dual WhatsApp / spec-sheet button. |
| `Footer.jsx`            | Brand + 3 columns + base bar with authorization chain reminder. |
| `site.css`              | Page-specific styles; imports `colors_and_type.css`. |

## Visual deviations from the source repo

This is a recreation, not a clone. Two things to note:

1. **Three.js hero is replaced with the imported `limex-rock.webp`.** The
   real site renders a `<Canvas>` Three.js scene that orbits and refracts a
   limestone rock model. That requires `@react-three/fiber` + a webp
   texture map. The static image keeps the same compositional weight
   (right-side rock, left-side copy, sage halo, dark scrim) without
   pulling in a 3D engine.
2. **Lucide icons are inlined** as React SVG components in `Icon.jsx`
   rather than imported from `lucide-react`. Same paths, same stroke
   weight — but no npm install needed.

Everything else — type scale, color tokens, easing, hover behavior, scroll
divider, supply-flow pulse animation — matches the source CSS one-to-one.

## How to extend

- Add more applications by editing the array in `IndustryApplications.jsx`.
- Swap headline copy by editing `Hero.jsx`. The cream→sage gradient is
  applied via the `.grad` span around your key words.
- For new comparison tabs, add an entry to the `tabs` array and a matching
  data block in `LimexComparison.jsx`.

## Outside-the-codebase use

All assets and tokens are self-contained. Open `index.html` directly — no
build step. To use a component in production, port the JSX to a real
TypeScript file and replace `window.Icon` / `window.SupplyFlow` references
with normal ES imports.
