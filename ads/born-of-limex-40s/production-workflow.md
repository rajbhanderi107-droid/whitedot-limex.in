# Production Workflow — how to build the ad with AI tools

## Pipeline
1. **Stills** — generate 8 frames (16:9 + 9:16) from `ai-image-prompts.md` in Midjourney or Adobe Firefly. Pick 1 hero still per scene.
2. **Clips** — image-to-video per `runway-seedance-veo-prompts.md`. Primary **Kling (free)**; preference **Firefly (web)**; paid alternates Veo/Runway/Seedance. Match durations to `shot-list-40sec.md`.
3. **Transitions** — render the 7 transitions from `google-flow-transition-prompts.md` (Google Flow / in-editor).
4. **Voiceover** — ElevenLabs from `voiceover-script.md` (calm premium settings).
5. **Music + SFX** — Suno + library per `sound-design-and-music.md`; export stems.
6. **Assemble** — in DaVinci Resolve / Premiere / CapCut, lay clips to the EDL; drop VO + music + SFX; place on-screen text (`onscreen-text.md`) in Boska.
7. **Grade** — apply `born-of-limex.cube` and per-scene notes (`color-grade-and-lookbook.md`).
8. **Polish** — Adobe pass per `adobe-postproduction-workflow.md` (grade stills, resize 9:16, quick-cut).
9. **QC** — run `quality-control-checklist.md`.
10. **Export** — 16:9 master (1080p + 4K), 9:16 social cut, poster frame. H.264/H.265, -1 dBTP, -14 LUFS.
11. **Deploy** — website hero (replace/augment the existing Born-of-LIMEX hero) + social launch (9:16).

## Checklist
- [ ] 8 stills approved (palette on-brand)
- [ ] 8 clips at correct durations (sum 40.0s)
- [ ] 7 transitions material-motivated
- [ ] VO recorded + synced
- [ ] Music + SFX mixed under VO
- [ ] On-screen text in Boska, title-safe
- [ ] Graded with LUT
- [ ] 16:9 + 9:16 exported
- [ ] QC passed

## Time / cost estimate
~1–2 days solo. Free path: Kling free tier + Suno free + ElevenLabs free + DaVinci free. Paid upgrade (Veo/Runway/Firefly + licensed music): ~$50–150 for higher realism + commercial license.
