# Dairy Products Container  

- **id:** `dairyProductsContainer`  
- **index:** 10  
- **slug:** `dairy-products-container`  
- **category:** Dairy Packaging  
- **status:** live  

## Files
- Data: `public/case-study/data/products/dairy-products-container.json`
- 3D model: `model/dairy-container-procedural.glb` (built via `scripts/blender/build_dairy_container_product10.py`), autoplays its baked "Explode" (cap-lift) animation on the case-study cards and product page
- HTML page: `product.html?p=dairy-products-container  (generic template, no dedicated file)`
- Reference photos: session-supplied only (3 photos + a dimensions spec sheet); `photos[]` in products.json still empty — no production photography yet

## Composition / Specs
Geometry is dimensioned precisely from the supplied spec sheet (68.5mm total height, 82.5mm max lid diameter, 75.0/64.0mm body top/bottom outer diameters, 6.5mm lid thickness) and marked `verified: true` in `specs.json` under source `dairy-container-spec-sheet` — see the build script header for the full breakdown. The lid's embossed "ALIM" / "QUALITY PACK" / "BREAK TAB AT SLOT BELOW. ARROW TO OPEN LID" text is the physical sample's own moulded identification, not a White Dot/LIMEX brand claim. **LIMEX composition percentage, CO2, and mechanical values remain unverified** (`verified: false`, "LIMEX blend - verification in progress") — do not invent these numbers; the product is live on the strength of its spec-matched geometry only, per the same pattern used for Product 09 (Food Oil Can).

## Notes / TODO
- [x] 3D model built (photo + spec-sheet matched, tapered body + snap lid + tamper tab + embossed lid text)
- [x] Promoted to `live` — wired into `products.json`, `specs.json`, per-product json, `index.html`, `product.html`, `CaseStudyFeature.tsx`, `CaseStudyPage.tsx`
- [ ] Source verified LIMEX composition/CO2/supplier TDS data — update `specs.json` + per-product json + this file together once available (RULE.md)
- [ ] Build a dedicated HTML case-study page (`public/case-study/{slug}.html`, follow bobbin.html pattern) — currently served by the generic `product.html` template
- [ ] Add products.json photos[] once real product photography exists
