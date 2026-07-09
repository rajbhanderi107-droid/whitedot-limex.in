# Dairy Products Container  

- **id:** `dairyProductsContainer`  
- **index:** 10  
- **slug:** `dairy-products-container`  
- **category:** Dairy Packaging  
- **status:** live  

## Files
- Data: `public/case-study/data/products/dairy-products-container.json`
- Specs (runtime source of truth): `public/case-study/data/specs.json` -> `products.dairyProductsContainer`
- 3D model: `public/case-study/model/dairy-container-procedural.glb`
- Build script: `scripts/blender/build_dairy_container_product10.py` (Blender 5.1 bpy, run with `blender -b --python <script>`)
- HTML page: `product.html?p=dairy-products-container` (generic template, reads products.json + specs.json)
- Reference photos: 3 photos supplied in-chat (front, lid-underside, three-quarter) — no dimensions card, not yet saved as repo files (pending: export/attach the source photos to disk and add to `photos[]`)

## Composition / Specs
_Pending — no verified LIMEX composition, CO2, or supplier spec data exists yet. Do not invent numbers._

Geometry is a visual match to the 3 reference photos (tapered round tub, snap-fit lid, hinged tamper-seal pull tab), refined once after user review (tighter taper, thinner lid, softer satin material). Dimensions in specs.json are marked `verified: false` since no dimensions card was supplied — visual estimates only.

## Notes / TODO
- [ ] Source verified LIMEX composition/spec data (official PDF or supplier TDS)
- [x] Build 3D model (`public/case-study/model/dairy-container-procedural.glb`)
- [ ] Build dedicated HTML case-study page (currently uses generic `product.html` template, consistent with other live products like food-oil-can)
- [ ] Add products.json photos[] once the real reference photos are saved to disk
