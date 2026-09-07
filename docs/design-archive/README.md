# Design archive

Material the site was designed from, kept out of `public/`.

`public/` is the web root: every file in it is downloadable by anyone who
guesses the URL, and every file in it is rsynced to the VPS on each deploy.
These files are neither served nor referenced by the site, so being there cost
bandwidth and published internal design work for no benefit. They are still in
the repository — they simply live somewhere that does not ship.

## storyboard/

The fourteen storyboard frames the cinematic site was designed from. The two
still in `public/assets/storyboard/` — `frame-13-globalimpact.png` and
`.webp` — are excluded because `GlobalImpact.tsx` actually renders them.

## launch-film/

The LIMEX launch film, its fast encode, and the poster in both formats.
Nothing in the codebase references them; they are kept because a launch film
is brand material, not a build artifact.

## What was deleted rather than archived

Superseded technical derivatives — alternate encodes and 4K masters of videos
the site has since replaced, and the orphaned `limex-bottle-*.glb` models with
their textures (the case-study models the site does use live in
`public/case-study/model/`). Every byte is still in git history:

    git show adb2160:public/assets/higgsfield/hero-head-background-4k.mp4 > out.mp4

`adb2160` is the last commit before the cleanup; any path listed in that
commit can be recovered the same way.
