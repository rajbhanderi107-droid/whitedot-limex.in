# Cup Container  

- **id:** `cupContainer`  
- **index:** 19  
- **slug:** `cup-container`  
- **category:** Food Packaging  
- **status:** live  

## Files
- Data: `public/case-study/data/products/cup-container.json`
- 3D model: `public/case-study/model/product-19-cup-container.glb` (photo-matched; envelope 95×95×149.75mm, hollow 1.8mm tapered wall, snap lid, 7 meshes / 3 PP materials)
- HTML page: `product.html?p=cup-container  (generic template, no dedicated file)`
- Wired in: `public/case-study/index.html` (grid card + hover stats), `public/case-study/product.html` (MODEL_SRC/CAMERA_ORBIT), `src/cinematic-v2/sections/CaseStudyFeature.tsx` (homepage grid card + hover stats)
- Reference photos: `photos[]` empty in products.json — none supplied yet

## Composition / Specs
_Pending — no verified LIMEX composition, CO2, or supplier spec data exists yet. Do not invent numbers. Card shows "Material spec pending" until sourced._

## Notes / TODO
- [ ] Source verified LIMEX composition/spec data (official PDF or supplier TDS)
- [ ] Add products.json photos[] once real photography exists
- [ ] Minor: GLTFLoader logs "Mesh is missing primitive index association" console warnings for this GLB (non-fatal, model still renders) — worth a cleanup pass in Blender export if time allows
