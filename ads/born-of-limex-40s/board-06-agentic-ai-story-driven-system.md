# Board 06 — Agentic AI Story-Driven System

Pipeline of agents to generate the film. Each: role · input · task · output · quality rules · failure checks.

1. **Research Agent** — in: brand bible, LIMEX facts. task: lock facts + restrictions. out: fact sheet. quality: no overclaim. fail: flag any carbon-negative/biodegradable claim.
2. **Script Agent** — in: structure + facts. task: VO + on-screen text. out: voiceover-script.md. quality: <=80 words, ~40s. fail: word count / tone drift.
3. **Storyboard Agent** — in: scene table. task: frames + composition. out: master-storyboard.md. quality: 8 boards, 16:9+9:16. fail: missing scene.
4. **Image Agent** — in: ai-image-prompts. task: stills per scene. out: 8 frames. quality: palette adherence, photoreal. fail: neon/cartoon artifacts -> regen.
5. **Video Agent** — in: stills + video prompts. task: image-to-video clips. out: 8 clips at scene durations. quality: motion matches camera notes. fail: warp/morph artifacts -> reseed.
6. **Transition Agent** — in: adjacent clips. task: 7 material-motivated transitions. out: transition renders. quality: motivated, not template. fail: generic wipe -> redo.
7. **Sound Agent** — in: sound-design doc. task: music + ambience + SFX. out: stems. quality: no EDM/trailer-boom. fail: loud/cheap -> re-score.
8. **Edit Agent** — in: clips + transitions + VO + stems. task: assemble to 40.0s. out: rough cut. quality: timeline matches EDL. fail: drift from 40s -> retime.
9. **QC Agent** — in: rough cut + checklist. task: continuity/safety/timing. out: QC report. quality: all checks pass. fail: list blockers.
10. **Final-Master Agent** — in: approved cut. task: grade + export 16:9 + 9:16. out: masters. quality: lookbook match. fail: color/contrast off -> regrade.
