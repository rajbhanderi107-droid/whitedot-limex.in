# Maldives Reel — Production Plan

Reference: `instagram.com/reel/DXMfz5zCBK6/` — @akanksha.s_, "japan is turning
footsteps into what 😭🏃‍♀️", 16 Apr 2026, 4.7K likes / 42 comments. Creator
states it uses **no template** and was cut **entirely in VN + InShot**.

Analysis below is measured frame-by-frame from the actual file (22.011 s,
1276×720, H.264 High, 30 fps, 657 frames, HE-AAC stereo).

> **Correction.** An earlier version of this doc reconstructed the reel from
> Instagram page metadata only and guessed it was a "footstep match-cut" edit —
> each foot landing triggering a transition. **That was wrong.** There is no
> footstep gimmick. The caption is just casual phrasing about walking around
> Japan. The real device is an animated aperture, documented below.

---

## 1. What the reel actually does

The signature is a **cinema aperture** — a black mask that opens, slams shut to
a slit, holds as a thin letterbox band, then breathes open across the montage.
A fixed title lock-up sits on top of it the whole time.

Measured aperture height (% of frame visible):

| Time | Aperture | What happens |
|---|---|---|
| 0.00 – 0.11 s | slit widens 214→1276 px, full height | Fast horizontal curtain open |
| 0.11 – 2.18 s | 100% | Opening Osaka street shot, held |
| 2.18 – 3.45 s | 100% → 9% | Iris squeezes shut to a near-line |
| 3.45 – 3.52 s | snaps to 17% | Letterbox band locks |
| 3.52 – 6.6 s | 17 – 23% | Title card + first clips inside the strip |
| 6.6 – 12.64 s | 23% → 97.5%, linear ≈12.4%/s | Band breathes open across the montage |
| 12.64 – 22.01 s | 100% | Full-bleed montage to the end |

The close at 2.18–3.45 s and the open at 6.6–12.64 s are both smooth linear
keyframe ramps — no easing tricks, just a steady scale on a mask.

## 2. The title lock-up

Two columns, white on black, geometric sans (Futura / Century Gothic family),
wide tracking on the small text:

```
72 HOURS                              IN
OSAKA                              JAPAN
```

Three things make it work:

1. **Scramble reveal.** The big words cycle through random 5-letter strings —
   `RTAEP`/`FLIRO`, `MLEON`/`PLEUS`, `DRAOB`/`WROLD`, `NPAJA`/`PRICO`,
   `ARANA`/`OMDSA` — before resolving to `OSAKA` / `JAPAN`. Same character
   count throughout, so nothing shifts as it settles.
2. **The text never moves.** It is pinned at fixed screen coordinates. The
   aperture opens *behind* it. At 4.6 s it reads on pure black; at 8.5 s the
   footage is visible behind the same unmoved words.
3. **It exits by being outgrown.** Once the aperture passes ~97% the text is
   gone. No slide-off, no fade gimmick — the frame simply grows past it.

## 3. Rhythm

Audio is ~128 BPM (beat ≈ 0.47 s). Loudness profile: strong 0–2 s, **drops out
3–5 s for the title card**, rebuilds from 6 s, peaks at 16 s and 20 s.

Roughly 40 shots in 22 s, and the cutting rate is **inverted** from what you'd
expect:

| Phase | Shot length | Feel |
|---|---|---|
| Band phase (6.6 – 12.6 s) | ~0.27 – 0.37 s | Rapid-fire teasing |
| Open phase (12.6 – 22 s) | ~0.47 s (one per beat) | Settled, one image at a time |

Small window → less to read per frame → it can cut fast. Big window → more to
absorb → it slows down. That inversion is the most transferable idea in the
whole reel, and it's the part most people copying this would get backwards.

## 4. Why it works

1. **The aperture is the hook.** Something is physically moving in the first
   0.1 s, before any content registers.
2. **The title gets silence.** Music drops for the card, so the type lands in a
   gap instead of competing.
3. **Escalation is structural, not just content-based.** The frame literally
   opens up as the reel progresses — the payoff is built into the geometry.
4. **One idea, executed cleanly.** No transition zoo. One mask, one title, one
   grade.

---

## Assumptions (correct these if wrong)

1. Personal/travel reel, not WhiteDot or LIMEX brand content. If brand, the
   copy strategy changes — see *Open questions*.
2. Shooting on a phone, editing on a phone (VN + InShot, matching the
   reference).
3. Footage does not exist yet — this plan includes the shoot.

**Aspect ratio note.** The reference file is 1276×720 (16:9 landscape). Compose
your master at 1080×1920 and place the aperture inside it, so the reel fills a
phone screen and the letterbox band is a deliberate design element rather than
dead space.

---

## 5. The Maldives adaptation

Keep the aperture. Change what it reveals.

The Maldives gives you something Osaka can't: the aperture opening can **track
the horizon**. Start the band as a thin strip of pure sea-line, then let it open
into sky above and water below. The mechanic stops being a graphic device and
becomes the actual subject — the view widening as you arrive.

**Title lock-up:**

```
72 HOURS                              IN
MALE                            MALDIVES
```

Use the same scramble-to-resolve treatment. `MALDIVES` is 8 characters, so
scramble at 8 — keep the character count fixed so nothing reflows.

**Structure (target 22–24 s):**

| Time | Aperture | Content |
|---|---|---|
| 0 – 0.15 s | slit → full width | Curtain-open on the seaplane window |
| 0.15 – 2.2 s | 100% | Hero shot held — approach over the atolls |
| 2.2 – 3.5 s | 100% → 10% | Iris shuts to the horizon line |
| 3.5 – 6.5 s | ~17% | **Title card.** Music drops. Band sits exactly on the sea-line |
| 6.5 – 12.5 s | 17% → 97% | Band opens. Fast cuts, ~0.3 s each |
| 12.5 – 24 s | 100% | Full-bleed, ~0.47 s per cut, on the beat |

**Band phase (~0.3 s cuts)** — tight, graphic, high-contrast fragments that read
instantly in a thin strip. Horizon-dominant by design:

1. Sea-line from the seaplane
2. Jetty planks running to the vanishing point
3. Waterline at the sand's edge
4. Villa deck rail against open ocean
5. Sandbank strip, water both sides
6. Fins entering water
7. Ripple texture, macro
8. Palm line silhouetted against sky
9. Boat wake cutting the frame
10. Reef edge — the colour change from turquoise to deep blue

**Open phase (~0.47 s cuts)** — full-frame images that need room:

11. Overwater villa, wide
12. Underwater reveal, fish scattering
13. Glass floor, rays below
14. Snorkel POV over coral
15. Hammock in shallow water
16. Golden-hour wet sand with full reflection
17. Sunset silhouette
18. Night — lantern-lit sand or bioluminescence
19. Aerial pullback over the atoll (if drone is cleared)
20. Final held wide, motion stops as the track drops

## 6. Filming rules

- **4K 60 fps** minimum. 60 fps gives clean speed ramps and crop room for 9:16.
- **Lock exposure and white balance per location.** Auto-exposure pumping
  mid-shot ruins a 0.3 s cut.
- **Shoot horizon-level and level.** The band phase only works if the horizon
  sits consistently in the same third of frame — otherwise the strip jumps.
- Every band-phase shot needs to read in **~17% of frame height**. Compose for
  the strip, not the full frame, or those ten shots are wasted.
- 3 takes per setup.
- Golden hour for most of it; 11:00–14:00 only for turquoise and underwater,
  when the water is most saturated.

## 7. Edit recipe

**VN — structure and timing**

1. New project, 1080×1920, 60 fps.
2. Drop the audio in first. Mark every beat before touching video.
3. Build the aperture as a **black overlay with a rectangular hole**, or two
   black bars top and bottom, and keyframe their positions. Two bars is easier
   in VN and gives the same result.
4. Keyframe the ramps linear: 100→10% over ~1.3 s, hold, then 17→97% over
   ~6 s. Don't ease — the reference doesn't, and the steadiness is the look.
5. Cut band-phase clips at ~0.3 s, open-phase at 0.47 s snapped to beats.
6. Grade last, one preset across everything.

**InShot — finish**

7. Title lock-up in two columns, fixed position, white geometric sans.
8. Scramble reveal: 4–5 keyframed text swaps at ~0.15 s each, same character
   count, resolving to the real words.
9. Export 1080×1920, highest bitrate available.

**Grade.** The two Maldives failure modes are blown highlights and an overall
cyan cast. Keep sand neutral-white, push teal only in water via HSL, lift
shadows slightly, mild grain.

## 8. Audio

- Pull from **Reels' own library** while trending — imported tracks don't get
  the same algorithmic pickup.
- Needs a clear beat around **120–130 BPM** and, critically, **a section you can
  drop to near-silence at 3.5–6.5 s** for the title card. That gap is doing real
  work; a wall-to-wall track kills the effect.
- Trim so the biggest hit lands on the final full-frame shot.
- 22–24 s total.

## 9. Hook, caption, loop

- The aperture *is* the hook — motion in frame 1, before content registers.
  Don't put a text hook over it.
- **Loop it.** Match the last frame to the first so it runs seamlessly.
- **Caption tone:** conversational, low-effort, matching the reference's
  register. e.g. "maldives said sit down 🩵"
- **Hashtags:** 3 large + 5 mid + 3 niche. Not 30.

## 10. Schedule

| Phase | Time |
|---|---|
| Pre-production, location scout | 1 day |
| Shoot (two golden hours + one midday block) | 2 days |
| Edit | 4–6 h |

## 11. Risks

- **The band phase is where this fails.** Shots not composed for a thin strip
  will read as noise. Frame those ten deliberately.
- **Salt, sand, water.** Waterproof case; rinse in fresh water after each
  session.
- **Underwater housing required.** Phone water-resistance ratings don't survive
  depth or salt.
- **Drone permits.** Many Maldives resort areas restrict drone use — clear it
  with the resort first.
- **Don't clone the reference.** Same mechanic is fine and expected; same audio
  *and* caption *and* shot order reads as a rip.
- **Shoot everything yourself.** Downloaded filler is a copyright exposure and
  breaks the grade continuity.

## Open questions

1. **What is the Maldives idea?** This plan applies the reference's mechanic to
   a Maldives shoot. If your concept differs, sections 5–6 are what to rewrite.
2. **Personal or WhiteDot/LIMEX brand?** If brand, the copy layer changes and
   there's an ocean-plastic / material-replacement tie-in worth considering,
   which would also change the final shot.
3. **Does footage already exist,** or is this shooting from scratch?
