import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

globalThis.FileReader = class {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
};

const outDir = resolve('public/case-study/model');
mkdirSync(outDir, { recursive: true });

const scene = new THREE.Scene();
scene.name = 'WhiteDot Araldite Container - LIMEX PP';

/* ── Materials ─────────────────────────────────────────────────────────────── */
const white = new THREE.MeshPhysicalMaterial({
  name: 'araldite body - warm grey LIMEX PP plastic',
  color: new THREE.Color('#d4d4ce'),   // warmer medium grey matching reference photo
  roughness: 0.55,                      // matte-ish plastic feel
  metalness: 0,
  clearcoat: 0.28,                      // subtle surface sheen
  clearcoatRoughness: 0.40,
  sheen: 0.18,
  sheenColor: new THREE.Color('#c8c8c0'),
  sheenRoughness: 0.55,
  envMapIntensity: 1.10,
  thickness: 0.8,                       // slight subsurface depth
  attenuationColor: new THREE.Color('#e8e8e0'),
});

const blue = new THREE.MeshPhysicalMaterial({
  name: 'araldite cap - deep glossy royal blue',
  color: new THREE.Color('#2840c2'),    // deep royal blue matching Araldite brand
  roughness: 0.10,                      // very glossy cap
  metalness: 0,
  clearcoat: 1.0,
  clearcoatRoughness: 0.05,
  reflectivity: 0.9,
  envMapIntensity: 1.6,
});

const blueDark = new THREE.MeshPhysicalMaterial({
  name: 'araldite cap cross divider - darker blue',
  color: new THREE.Color('#1a2d9e'),
  roughness: 0.15,
  metalness: 0,
  clearcoat: 0.85,
  clearcoatRoughness: 0.08,
  envMapIntensity: 1.3,
});

function mesh(geometry, material, name, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const m = new THREE.Mesh(geometry, material);
  m.name = name;
  m.position.set(...position);
  m.rotation.set(...rotation);
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

function torus(name, radius, tube, y, material) {
  const g = new THREE.TorusGeometry(radius, tube, 20, 160);
  const m = mesh(g, material, name, [0, y, 0], [Math.PI / 2, 0, 0]);
  return m;
}

/* ── White body — bottom to top
 * Structure: ribbed grip at BOTTOM → smooth barrel body → narrow collar → blue cap on TOP
 *
 * Y layout (total height -1.22 to +1.33):
 *   -1.22  base rim
 *   -1.12 to -0.50  fluted grip section (wide, ribbed)
 *   -0.50 to -0.32  step into smooth body
 *   -0.32 to +0.72  smooth cylindrical body
 *   +0.72 to +0.86  shoulder narrowing
 *   +0.86 to +0.99  screw collar (subtle ridges in lathe profile)
 */
const bodyProfile = [
  new THREE.Vector2(0.55, -1.22),   // bottom base center
  new THREE.Vector2(0.92, -1.20),   // base collar
  new THREE.Vector2(1.02, -1.12),   // grip section bottom (wider)
  new THREE.Vector2(1.04, -0.90),
  new THREE.Vector2(1.03, -0.52),   // grip section top
  new THREE.Vector2(0.96, -0.42),   // step shoulder into body
  new THREE.Vector2(0.90, -0.33),
  new THREE.Vector2(0.88, 0.08),    // smooth lower body
  new THREE.Vector2(0.89, 0.52),    // smooth mid body
  new THREE.Vector2(0.88, 0.68),    // smooth upper body
  new THREE.Vector2(0.83, 0.79),    // shoulder narrowing
  new THREE.Vector2(0.78, 0.86),    // collar base
  new THREE.Vector2(0.80, 0.89),    // collar ridge 1
  new THREE.Vector2(0.77, 0.92),
  new THREE.Vector2(0.80, 0.95),    // collar ridge 2
  new THREE.Vector2(0.77, 0.97),
  new THREE.Vector2(0.79, 0.99),    // top of white collar
];
const body = mesh(new THREE.LatheGeometry(bodyProfile, 256), white, 'araldite white body fluted-bottom');
body.geometry.computeVertexNormals();

/* ── Vertical flute ribs — lower grip section (bottom third of container) ──── */
const FLUTES = 30;
for (let i = 0; i < FLUTES; i++) {
  const a = (i / FLUTES) * Math.PI * 2;
  const r = 1.005;  // slightly outside surface so ribs stand proud
  mesh(
    new RoundedBoxGeometry(0.065, 0.56, 0.065, 3, 0.020),
    white,
    `flute rib ${i}`,
    [Math.cos(a) * r, -0.80, Math.sin(a) * r],
    [0, -a, 0],
  );
}

/* ── Thin shadow gap where blue cap meets white collar ──────────────────────── */
torus('shadow gap cap-to-collar', 0.80, 0.007, 0.990, blueDark);

/* ── BLUE CAP — sits on TOP (the defining Araldite feature) ─────────────────── */
const blueCapProfile = [
  new THREE.Vector2(0.00, 0.96),   // center base (sits on white collar)
  new THREE.Vector2(0.74, 0.96),   // inner base
  new THREE.Vector2(0.85, 0.99),   // skirt flares over collar
  new THREE.Vector2(0.91, 1.04),   // outer cap wall starts
  new THREE.Vector2(0.92, 1.22),   // cap wall upper
  new THREE.Vector2(0.88, 1.28),   // top chamfer begins
  new THREE.Vector2(0.62, 1.32),   // top dome near edge
  new THREE.Vector2(0.30, 1.338),  // top dome
  new THREE.Vector2(0.00, 1.340),  // center top
];
mesh(new THREE.LatheGeometry(blueCapProfile, 220), blue, 'blue Araldite top cap');

/* ── Cross divider on the blue cap top (+ shape, the flip-top detail) ───────── */
const crossH = 0.052;
const crossW = 0.092;
const crossL = 1.78;
mesh(
  new THREE.BoxGeometry(crossW, crossH, crossL),
  blueDark, 'cross divider X',
  [0, 1.346, 0],
);
mesh(
  new THREE.BoxGeometry(crossL, crossH, crossW),
  blueDark, 'cross divider Z',
  [0, 1.346, 0],
);

/* ── Lights ─────────────────────────────────────────────────────────────────── */
const key = new THREE.DirectionalLight(0xffffff, 3.0);
key.position.set(3, 4, 5);
scene.add(key);

const fill = new THREE.DirectionalLight(0xffffff, 1.2);
fill.position.set(-3, 2, 4);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffffff, 0.6);
rim.position.set(0, -3, -4);
scene.add(rim);

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.name = 'front product camera';
camera.position.set(0, 0.10, 5.6);
camera.lookAt(0, 0.06, 0);
scene.add(camera);

/* ── Export ─────────────────────────────────────────────────────────────────── */
const exporter = new GLTFExporter();
const glb = await new Promise((resolveExport, reject) => {
  exporter.parse(scene, resolveExport, reject, { binary: true, trs: false, onlyVisible: true });
});

writeFileSync(resolve(outDir, 'araldite-container-procedural.glb'), Buffer.from(glb));
console.log('✓ GLB written:', resolve(outDir, 'araldite-container-procedural.glb'));
