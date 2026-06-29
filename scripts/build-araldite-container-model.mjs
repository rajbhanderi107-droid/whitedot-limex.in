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

/* ── Materials ───────────────────────────────────────────────────────────── */
const white = new THREE.MeshPhysicalMaterial({
  name: 'semi-matte white LIMEX PP body',
  color: new THREE.Color('#f3f3ee'),
  roughness: 0.42,
  metalness: 0,
  clearcoat: 0.4,
  clearcoatRoughness: 0.3,
  sheen: 0.12,
  sheenRoughness: 0.4,
  envMapIntensity: 1.05,
});

const whiteCap = new THREE.MeshPhysicalMaterial({
  name: 'white screw cap',
  color: new THREE.Color('#f6f6f2'),
  roughness: 0.36,
  metalness: 0,
  clearcoat: 0.5,
  clearcoatRoughness: 0.24,
  envMapIntensity: 1.1,
});

const blue = new THREE.MeshPhysicalMaterial({
  name: 'glossy blue dispensing cap',
  color: new THREE.Color('#2a45c8'),
  roughness: 0.22,
  metalness: 0,
  clearcoat: 1,
  clearcoatRoughness: 0.1,
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

function torus(name, radius, tube, y, material, scaleY = 1) {
  const g = new THREE.TorusGeometry(radius, tube, 20, 160);
  const m = mesh(g, material, name, [0, y, 0], [Math.PI / 2, 0, 0]);
  m.scale.z = scaleY;
  return m;
}

/* ── White body — single lathe profile (bottom → top) ──────────────────────
 * Fluted lower grip, smooth tall body, shoulder, knurled screw cap on top.   */
const bodyProfile = [
  new THREE.Vector2(0.52, -1.20),  // bottom opening rim (seats blue cap)
  new THREE.Vector2(0.93, -1.19),  // bottom collar outer
  new THREE.Vector2(0.97, -1.12),  // flute section bottom (widest grip)
  new THREE.Vector2(1.00, -0.92),
  new THREE.Vector2(1.00, -0.58),  // flute section top
  new THREE.Vector2(0.94, -0.46),  // step into smooth body
  new THREE.Vector2(0.905, -0.40),
  new THREE.Vector2(0.90, 0.10),   // straight smooth body
  new THREE.Vector2(0.905, 0.62),
  new THREE.Vector2(0.895, 0.74),  // upper body
  new THREE.Vector2(0.86, 0.82),   // shoulder narrowing
  new THREE.Vector2(0.82, 0.86),   // neck under cap
];
const body = mesh(new THREE.LatheGeometry(bodyProfile, 256), white, 'smooth white fluted LIMEX PP container body', [0, 0, 0]);
body.geometry.computeVertexNormals();

/* ── Vertical flute ribs on the lower grip section ─────────────────────────── */
const FLUTES = 32;
for (let i = 0; i < FLUTES; i++) {
  const a = (i / FLUTES) * Math.PI * 2;
  const r = 0.965;  // embed into the body surface so ribs read as flutes, not pins
  mesh(
    new RoundedBoxGeometry(0.058, 0.54, 0.05, 3, 0.018),
    white,
    `vertical flute rib ${i}`,
    [Math.cos(a) * r, -0.85, Math.sin(a) * r],
    [0, -a, 0],
  );
}

/* ── Thin separation line where cap meets body ─────────────────────────────── */
torus('fine shadow gap below screw cap', 0.85, 0.006, 0.875, blue);

/* ── White screw cap with knurled grip wall ────────────────────────────────── */
const capProfile = [
  new THREE.Vector2(0.84, 0.86),   // cap skirt bottom
  new THREE.Vector2(0.985, 0.90),  // cap wall flares out
  new THREE.Vector2(0.99, 1.16),   // cap wall top
  new THREE.Vector2(0.96, 1.215),  // top chamfer
  new THREE.Vector2(0.80, 1.245),  // flat-ish domed top
  new THREE.Vector2(0.40, 1.255),
  new THREE.Vector2(0.0, 1.258),   // top center
];
mesh(new THREE.LatheGeometry(capProfile, 200), whiteCap, 'white knurled screw cap', [0, 0, 0]);

const KNURLS = 58;
for (let i = 0; i < KNURLS; i++) {
  const a = (i / KNURLS) * Math.PI * 2;
  const r = 0.965;  // embed into the cap wall (wall radius ~0.99)
  mesh(
    new RoundedBoxGeometry(0.02, 0.23, 0.035, 2, 0.007),
    whiteCap,
    `cap knurl ${i}`,
    [Math.cos(a) * r, 1.02, Math.sin(a) * r],
    [0, -a, 0],
  );
}

/* ── Blue dispensing cap at the base (container stands on it) ──────────────── */
mesh(new THREE.CylinderGeometry(0.66, 0.62, 0.16, 200), blue, 'blue dispensing cap base', [0, -1.30, 0]);
mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.04, 200), blue, 'blue cap flat underside', [0, -1.39, 0]);
// raised central divider bar (flip-top dispensing spout)
mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.62, 24), blue, 'blue cap spout divider bar', [0, -1.40, 0], [Math.PI / 2, 0, 0.35]);
torus('white collar ring around blue cap', 0.70, 0.05, -1.235, white);

/* ── Lights + camera metadata for GLB viewers ──────────────────────────────── */
const key = new THREE.DirectionalLight(0xffffff, 3);
key.position.set(3, 4, 5);
scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff, 1.2);
fill.position.set(-3, 2, 4);
scene.add(fill);

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.name = 'front product camera';
camera.position.set(0, 0.1, 5.6);
camera.lookAt(0, -0.05, 0);
scene.add(camera);

const exporter = new GLTFExporter();
const glb = await new Promise((resolveExport, reject) => {
  exporter.parse(scene, resolveExport, reject, { binary: true, trs: false, onlyVisible: true });
});

writeFileSync(resolve(outDir, 'araldite-container-procedural.glb'), Buffer.from(glb));
console.log(resolve(outDir, 'araldite-container-procedural.glb'));
