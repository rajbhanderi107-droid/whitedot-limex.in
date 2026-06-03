# Color Grade & Lookbook

**Look:** deep blacks, mineral whites, warm skin, controlled highlights, soft contrast, subtle grain. No oversaturation, no neon blue/cyber-green.

## Palette targets (match site tokens)
- Shadows/base: `#181b19` (deep iron-grey-green), secondary `#1f2421`
- Highlights/material: `#f6f7f4` frost white, `#f5f1e8` limestone cream
- Accent (sparingly, foliage/screen): `#9aa893` pine-smoke
- Warm skin: keep natural, slight warmth, protect from green cast

## Per-scene grade
- S1–S2: cooler, low-key, crushed-but-clean blacks; single light source feel.
- S3: neutral-cool, lifted soft volumetrics, protect particle highlights.
- S4: introduce warmth on skin; material stays neutral frost; gentle contrast.
- S5: clean studio neutral, cream highlights, soft specular roll-off.
- S6: natural daylight warmth, true skin, screen glow controlled (no blue spike).
- S7: warmest beat, daylight bloom, airy highlights.
- S8: back to deep dark, faint texture, frost-white type.

## DaVinci Resolve recipe (per clip node tree)
1. **Node 1 Balance:** auto-balance, set white point to limestone cream, lift blacks to ~#181b19.
2. **Node 2 Contrast:** soft S-curve, pivot mid, low contrast.
3. **Node 3 Hue vs Sat:** pull saturation off blues/cyans; keep greens muted toward `#9aa893`.
4. **Node 4 Skin:** qualifier on skin, +warmth, protect from green.
5. **Node 5 Highlights:** soft roll-off, glow 8–12% on material whites.
6. **Node 6 Grain:** subtle film grain (35mm light), 4–6%.
7. **Node 7 Vignette:** gentle, premium, on dark scenes only.

Export LUT as `born-of-limex.cube` for reuse across all clips.
