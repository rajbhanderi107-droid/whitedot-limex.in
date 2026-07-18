// SUPERSEDED — do not run. The live araldite-container-procedural.glb is a
// photo-matched, Draco/WebP-compressed model built through a different
// pipeline (see git log for that file). This script's crude procedural
// placeholder was accidentally re-run over the real asset on 2026-07-18 and
// had to be restored from git history — kept only for historical reference.
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

globalThis.FileReader = class {
  async readAsArrayBuffer(blob) { this.result = await blob.arrayBuffer(); this.onloadend?.(); }
};

const outDir = resolve('public/case-study/model');
mkdirSync(outDir, { recursive: true });
const scene = new THREE.Scene();
scene.name = 'Adhesive Dispenser Container LIMEX PP';

/* ─────────────────────────────────────────────────────────────────────────────
 * REFERENCE PHOTO MEASUREMENTS  (4096 × 4096 source)
 *
 *  Section     Height %   Y range (total = 2.60 units)   Radius (grip = 1.00)
 *  Blue cap      12 %     +0.97 … +1.30                   outer wall ≈ 0.82
 *  Collar        14 %     +0.61 … +0.97                   ≈ 0.65  (NARROWEST)
 *  Barrel        26 %     −0.06 … +0.61                   ≈ 0.73
 *  Step           3 %     −0.14 … −0.06                   1.00 → 0.73  SHARP
 *  Grip          45 %     −1.30 … −0.14                   1.00  (WIDEST)
 * ───────────────────────────────────────────────────────────────────────────── */

/* ── MATERIALS ─────────────────────────────────────────────────────────────── */

const grey = new THREE.MeshPhysicalMaterial({
  name: 'grey-body',
  color: new THREE.Color('#c8c8c2'),
  roughness: 0.62,
  metalness: 0,
  clearcoat: 0.20,
  clearcoatRoughness: 0.45,
  envMapIntensity: 0.92,
});

const white = new THREE.MeshPhysicalMaterial({
  name: 'white-collar',
  color: new THREE.Color('#e2e2de'),
  roughness: 0.34,
  metalness: 0,
  clearcoat: 0.50,
  clearcoatRoughness: 0.26,
  envMapIntensity: 1.22,
});

const blue = new THREE.MeshPhysicalMaterial({
  name: 'blue-cap',
  color: new THREE.Color('#3050c8'),
  roughness: 0.08,
  metalness: 0,
  clearcoat: 1.0,
  clearcoatRoughness: 0.04,
  reflectivity: 0.95,
  envMapIntensity: 1.75,
});

const blueDark = new THREE.MeshPhysicalMaterial({
  name: 'blue-dark',
  color: new THREE.Color('#1e3ab2'),
  roughness: 0.15,
  metalness: 0,
  clearcoat: 0.78,
  envMapIntensity: 1.18,
});

/* ── HELPERS ───────────────────────────────────────────────────────────────── */
function add(geo, mat, name, pos = [0, 0, 0], rot = [0, 0, 0]) {
  const m = new THREE.Mesh(geo, mat);
  m.name = name;
  m.position.set(...pos);
  m.rotation.set(...rot);
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}
function ring(name, r, tube, y, mat) {
  add(new THREE.TorusGeometry(r, tube, 20, 160), mat, name, [0, y, 0], [Math.PI / 2, 0, 0]);
}
function lathe(pts, segs, mat, name) {
  const g = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), segs);
  g.computeVertexNormals();
  return add(g, mat, name);
}

/* ── SECTION 1 — GREY BODY  (base + grip + step + barrel) ─────────────────── */
lathe([
  // base
  [0.00, -1.300],
  [0.82, -1.300],
  [1.03, -1.278],   // base rim flare
  [1.04, -1.248],   // rim peak
  [1.00, -1.215],   // into grip wall

  // grip — tall straight walls
  [1.00, -0.155],

  // STEP — sharp inward  (45% → 27% radius drop in 0.09 units)
  [0.98, -0.135],
  [0.76, -0.078],
  [0.730, -0.060],  // step bottom = barrel start

  // barrel — smooth, very slight barrel curve
  [0.730,  0.000],
  [0.728,  0.200],
  [0.727,  0.380],
  [0.722,  0.540],
  [0.715,  0.610],  // barrel top
], 256, grey, 'grey-body');

// flat base disk
add(new THREE.CircleGeometry(0.82, 80), grey, 'base-disk', [0, -1.300, 0], [-Math.PI / 2, 0, 0]);

/* ── SECTION 2 — GRIP RIBS (28 rounded vertical flutes) ───────────────────── */
const RIB_COUNT = 28;
for (let i = 0; i < RIB_COUNT; i++) {
  const a = (i / RIB_COUNT) * Math.PI * 2;
  add(
    new RoundedBoxGeometry(0.056, 1.00, 0.056, 3, 0.018),
    grey, `rib-${i}`,
    [Math.cos(a) * 1.032, -0.677, Math.sin(a) * 1.032],
    [0, -a, 0],
  );
}

/* ── SECTION 3 — WHITE COLLAR ──────────────────────────────────────────────── */
lathe([
  [0.715, 0.610],   // join barrel top (same point)
  [0.660, 0.635],   // step inward to collar wall
  [0.650, 0.720],
  [0.653, 0.800],
  [0.650, 0.878],
  [0.655, 0.940],
  [0.665, 0.970],   // collar top
], 200, white, 'collar');

// 4 raised torus rings (the screw-thread ridges clearly visible in photo)
ring('col-ring-1', 0.652, 0.016, 0.655, white);
ring('col-ring-2', 0.650, 0.016, 0.737, white);
ring('col-ring-3', 0.651, 0.016, 0.820, white);
ring('col-ring-4', 0.654, 0.013, 0.902, white);

// shadow line between collar and cap
ring('collar-cap-shadow', 0.752, 0.009, 0.970, blueDark);

/* ── SECTION 4 — BLUE CAP ──────────────────────────────────────────────────── */
lathe([
  [0.000, 0.970],   // centre base
  [0.718, 0.970],   // inner base
  [0.820, 0.982],   // skirt flares over collar
  [0.855, 1.008],   // outer cap wall base
  [0.860, 1.130],   // outer cap wall
  [0.848, 1.215],   // curve to dome
  [0.798, 1.262],
  [0.612, 1.291],
  [0.335, 1.299],
  [0.000, 1.300],   // cap centre top
], 240, blue, 'blue-cap');

// + cross divider on cap top
add(new THREE.BoxGeometry(0.088, 0.042, 1.68), blueDark, 'cross-x', [0, 1.304, 0]);
add(new THREE.BoxGeometry(1.68, 0.042, 0.088), blueDark, 'cross-z', [0, 1.304, 0]);

// concentric rings on cap top (visible in photo)
ring('cap-ring-inner',  0.425, 0.009, 1.295, blueDark);
ring('cap-ring-middle', 0.648, 0.007, 1.290, blueDark);

/* ── LIGHTS ────────────────────────────────────────────────────────────────── */
const key = new THREE.DirectionalLight(0xffffff, 3.4);
key.position.set(4, 6, 5);
scene.add(key);

const fill = new THREE.DirectionalLight(0xffffff, 1.0);
fill.position.set(-3, 2, 4);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffffff, 0.45);
rim.position.set(0, -4, -3);
scene.add(rim);

const top = new THREE.DirectionalLight(0xffffff, 0.65);
top.position.set(0, 9, 1);
scene.add(top);

const cam = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
cam.name = 'main-camera';
cam.position.set(0, 0.05, 5.8);
cam.lookAt(0, 0.00, 0);
scene.add(cam);

/* ── EXPORT ─────────────────────────────────────────────────────────────────── */
const exporter = new GLTFExporter();
const glb = await new Promise((res, rej) =>
  exporter.parse(scene, res, rej, { binary: true, trs: false, onlyVisible: true }),
);
writeFileSync(resolve(outDir, 'araldite-container-procedural.glb'), Buffer.from(glb));
console.log('✓ GLB', (glb.byteLength / 1024 / 1024).toFixed(2), 'MB');
