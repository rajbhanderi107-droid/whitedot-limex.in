# Clip Generation — Kling-first + Firefly-first (per scene)

> Reality: no clip generator is wired into this toolchain for free. Generate clips in the web apps below using these prompts. **Primary: Kling (free tier). Preference: Adobe Firefly (web).** Veo / Runway / Seedance are listed as paid alternates.

**Workflow per scene:** generate the still (`ai-image-prompts.md`) -> upload as the start frame -> paste the motion prompt -> set duration from the shot list. Global negative everywhere: no warping, morphing hands/faces, neon, cartoon, text artifacts, jitter.

## Engine guide
- **Kling (kling.ai) — PRIMARY, free tier:** image-to-video, strong motion + camera control. Use "Professional Mode", camera = "push in"/"dolly", motion strength low-medium. Best for S1, S3, S4, S7.
- **Adobe Firefly (firefly.adobe.com) — PREFERENCE:** Firefly Video (image-to-video / text-to-video). Premium, brand-safe, commercial license. Use for hero scenes S4, S5, S6; export 1080p.
- **Veo (paid):** best physical realism — S4 hand, S6 people. **Runway Gen-3/4 (paid):** great match-cuts/transitions — S5. **Seedance (paid):** strong identity/reference — S5 product consistency.

## Per-scene prompts
**S1 (4s):** "Slow breath-like push-in on macro limestone, fine dust drifting through one soft light shaft, subtle parallax, premium, still." Kling motion: low. Firefly: image-to-video, camera push-in.

**S2 (4s):** "Slow lateral dolly past shadowed packaging silhouettes, soft rim light traveling edges, restrained." Kling: dolly-left, low motion.

**S3 (5s):** "Push-in through soft vapor; fine pale mineral particles fall and settle like slow snow; volumetric light." Kling: push-in, medium.

**S4 (5s):** "Dolly-in; particles compact into a slab; a real hand touches; rack focus to natural veins blooming under fingertip; warm, tactile." Firefly/Veo for hand realism.

**S5 (7s):** "Gentle push-ins / match-moves across products on a table (sheet, pouch, bottle, FMCG pack, paper box); soft light glides." Runway for match-cuts; Seedance for product consistency.

**S6 (6s):** "Warm handheld micro-movement; a sheet lifts to window light (translucency); rack focus to laptop showing a dark minimal site." Veo/Firefly for people.

**S7 (5s):** "Slow rising push-in toward window light; daylight bloom grows across finished products; serene." Kling: tilt-up + push-in.

**S8 (4s):** "Near-static, almost imperceptible push-in on dark textured plate; hold for logo comp; settle to black." Kling: minimal motion (or hold a still in edit).
