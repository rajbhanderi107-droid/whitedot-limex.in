# Circle Container  

- **id:** `circleContainer`  
- **index:** 38  
- **slug:** `circle-container`  
- **category:** General Packaging  
- **status:** live  

## Files
- Data: `public/case-study/data/products/circle-container.json`
- 3D model: `public/case-study/model/product-38-circle-container.glb` (Draco-compressed, 2.35 MB -> 232 KB)
- Blender source: `C:\Users\rbhan\Documents\whitedot\public\case-study\model\pink-red-3l-bucket\pink-red-3l-bucket-photo-match.blend`
- Build script: `C:\Users\rbhan\Documents\whitedot\scripts\blender\build_pink_red_3l_bucket_photo_match.py`
- Recolour script: `scripts/blender/recolor_circle_container_white.py` (re-run to regenerate the GLB)
- HTML page: `product.html?p=circle-container  (generic template, no dedicated file)`
- Reference photos: `photos[]` empty in products.json — none supplied yet

## Model
Photo-matched 3 litre bucket: **bright white** body, rim and interior, red snap
lid with a centre boss, red wire bail handle. Card orbit `20deg 76deg 112%` —
the container convention, low enough to show the handle.

The source .blend ships a pale-blush body; `scripts/blender/recolor_circle_container_white.py`
sets the three body-side materials to bright white (0.90 / 0.88 / 0.84 linear)
and leaves the two red lid/handle materials untouched.

**Gotcha:** the .blend also contains a studio backdrop named
`studio floor - not exported`, four lights and a camera for validation renders.
A whole-scene glTF export drags the backdrop in and the product viewer then
shows a large grey plane behind the bucket — export the 22 bucket meshes with
`use_selection=True` (the script asserts the count).

## Composition / Specs
_Pending — no LIMEX grade or ratio has been supplied for this product. Do not
invent numbers. The card and detail page render the honest "material spec
pending" state until a grade and ratio arrive._

## Notes / TODO
- [ ] Get the LIMEX grade + mix ratio from Raj, then fill composition/highlights
      (see `strip-tape.md` / `dark-plastic-talpatri.md` for the shape)
- [ ] Add products.json photos[] once real photography exists
