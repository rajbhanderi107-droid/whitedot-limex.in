# Food Oil Can  

- **id:** `foodOilCan`  
- **index:** 09  
- **slug:** `food-oil-can`  
- **category:** Food Packaging  
- **status:** live  

## Files
- Data: `public/case-study/data/products/food-oil-can.json`
- 3D model: `model/oil-bottle-procedural.glb`
- HTML page: `product.html?p=food-oil-can  (generic template, no dedicated file)`
- Reference photos: `photos[]` empty in products.json — modeling used session-supplied reference photos + dimensions card, but no production photography is committed yet

## Composition / Specs
See `public/case-study/data/products/food-oil-can.json` — geometry/dimensions are photo-matched (145 mm wide face × 96 mm depth × 208 mm height, 45 mm cap). Verified LIMEX composition, mechanical values, and CO2 figures are still pending supplier data — none are published, per RULE.md.

## Notes / TODO
- [x] 3D model built (photo-matched colors, baked 2K PBR textures)
- [x] Served via generic case-study template (`product.html?p=food-oil-can`)
- [x] Entry synced in specs.json, products.json, and per-product json
- [ ] Source verified LIMEX composition/spec data (official PDF or supplier TDS)
- [ ] Real product photography (photos[] still empty)
- [ ] Consider compressing `oil-bottle-procedural.glb` (16 MB vs 0.3–3 MB for other products) for mobile load time
