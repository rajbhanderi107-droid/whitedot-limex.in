HIGGSFIELD ASSET DROP SLOTS
===========================

Higgsfield (https://higgsfield.ai) generates cinematic VIDEO and IMAGES — not
3D meshes. Generated media drops in here; the live Three.js scene stays
procedural.

HOW TO ACTIVATE A SLOT
----------------------
1. Generate the asset in Higgsfield.
2. Save the file into this folder (public/assets/higgsfield/).
3. Open  src/cinematic/higgsfieldAssets.ts  and set the matching path in RAW,
   e.g.  heroVideo: "assets/higgsfield/born-loop.mp4"
4. Rebuild. Empty (null) slots leave the site exactly as it is now.

Kill switch: set VITE_WD_HIGGSFIELD_ENABLED="false" to disable every slot.

SLOTS
-----
heroVideo    Cinematic loop for the lightweight (non-WebGL) "Born of LIMEX"
             path — shown on simple/premium-off/reduced-motion/low-end devices.
             Format: .mp4 (H.264) + ideally .webm. 16:9. 1920x1080. Muted,
             seamless loop, <= ~8 s, target < 4 MB. No on-screen text.
heroPoster   First-frame still for heroVideo; also shown under reduced-motion.
             .jpg/.webp, 1920x1080, 16:9.
heroImage    Hero still used when no heroVideo is set. .jpg/.webp, 1920x1080.

ogImage      Social / link-preview share image. Referenced by index.html
             (og:image + twitter:image). Save as exactly:
                og-cover.jpg
             1200x630 (1.91:1). Keep key art centered; safe-area the edges.

sectionImages  Named stills for content sections (optional). Add a key in
               higgsfieldAssets.ts RAW.sectionImages and render with
               <HiggsfieldImage src={HIGGSFIELD.sectionImage("yourKey")} .../>.

textures.{stone,paper,polymer}  RESERVED. Material maps for the 3D shaders.
             NOT wired yet — feeding textures into the bespoke GLSL is a
             separate, performance-reviewed pass (the procedural look is what
             cleared the perf gate). Leave null until that work lands.

BRAND NOTE
----------
Dark, mineral, premium (Stripe/Linear/Aesop bar). Limestone whites, sage
(#9aa893), graphite. No neon, no stock-video gloss, no on-image text.
