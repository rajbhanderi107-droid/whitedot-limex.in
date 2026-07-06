# Dairy Products Container  

- **id:** `dairyProductsContainer`  
- **index:** 10  
- **slug:** `dairy-products-container`  
- **category:** Dairy Packaging  
- **status:** pending  

## Files
- Data: `public/case-study/data/products/dairy-products-container.json`
- 3D model: `model/dairy-container-procedural.glb` (built via `scripts/blender/build_dairy_container_product10.py`)
- HTML page: `product.html?p=dairy-products-container  (generic template, no dedicated file)`
- Reference photos: session-supplied only (3 photos + a dimensions spec sheet); `photos[]` in products.json still empty — no production photography yet

## Composition / Specs
_Pending — no verified LIMEX composition, CO2, or supplier spec data exists yet. Do not invent numbers._ Geometry is dimensioned precisely from the supplied spec sheet (68.5mm total height, 82.5mm max lid diameter, 75.0/64.0mm body top/bottom outer diameters, 6.5mm lid thickness) — see the build script header for the full breakdown. The lid's embossed "ALIM" / "QUALITY PACK" / "BREAK TAB AT SLOT BELOW. ARROW TO OPEN LID" text is the physical sample's own moulded identification, not a White Dot/LIMEX brand claim.

## Notes / TODO
- [x] 3D model built (photo + spec-sheet matched, tapered body + snap lid + tamper tab + embossed lid text)
- [ ] Source verified LIMEX composition/spec data (official PDF or supplier TDS) — required before flipping to `live`
- [ ] Build HTML case-study page (`public/case-study/{slug}.html`, follow bobbin.html pattern)
- [ ] Add products.json photos[] once real product photography exists
- [ ] Once composition is verified: update this file, `specs.json`, `products.json` status, and the per-product json together per RULE.md
