import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

globalThis.FileReader = class {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
};

const outDir = resolve('public/case-study/model');
mkdirSync(outDir, { recursive: true });

const scene = new THREE.Scene();
scene.name = 'WhiteDot Paint Container - 25 LIMEX 75 PP';

const red = new THREE.MeshPhysicalMaterial({
  name: 'glossy red LIMEX PP body',
  color: new THREE.Color('#f01814'),
  roughness: 0.28,
  metalness: 0,
  clearcoat: 0.65,
  clearcoatRoughness: 0.22,
});

const white = new THREE.MeshPhysicalMaterial({
  name: 'bright white LIMEX lid',
  color: new THREE.Color('#ffffff'),
  roughness: 0.38,
  metalness: 0,
  clearcoat: 0.32,
  clearcoatRoughness: 0.3,
});

const dark = new THREE.MeshPhysicalMaterial({
  name: 'black handle grip',
  color: new THREE.Color('#171717'),
  roughness: 0.48,
  metalness: 0,
});

const metal = new THREE.MeshPhysicalMaterial({
  name: 'polished wire handle',
  color: new THREE.Color('#d8d8d8'),
  roughness: 0.18,
  metalness: 1,
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

// Tapered paint pail body: wide top, narrower bottom, molded-plastic proportions.
mesh(new THREE.CylinderGeometry(1.18, 0.86, 2.25, 160, 4, false), red, 'tapered glossy red paint pail body', [0, 0, 0]);
torus('rounded lower molded foot ring', 0.87, 0.035, -1.14, red);
torus('upper red rolled rim under lid', 1.19, 0.055, 1.11, red);
mesh(new THREE.CylinderGeometry(1.23, 1.18, 0.13, 160), red, 'thick red top collar', [0, 1.1, 0]);

// Bright white snap lid with concentric molded rings.
mesh(new THREE.CylinderGeometry(1.34, 1.3, 0.22, 160), white, 'bright white snap lid side wall', [0, 1.28, 0]);
mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.08, 160), white, 'flat bright white lid top', [0, 1.43, 0]);
torus('outer raised white lid rim', 1.18, 0.035, 1.485, white);
torus('middle shallow circular lid ring', 0.82, 0.012, 1.505, white);
torus('inner shallow circular lid ring', 0.45, 0.01, 1.515, white);
mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.008, 48), white, 'tiny injection point on lid center', [0, 1.525, 0]);

// Subtle molded highlights/ribs on the glossy red front.
for (const x of [-0.62, 0.62]) {
  const rib = mesh(new THREE.BoxGeometry(0.018, 1.52, 0.012), red, 'subtle vertical molded body highlight', [x, -0.12, 0.858]);
  rib.rotation.y = x < 0 ? -0.08 : 0.08;
}
torus('subtle lower body circular mold line', 0.91, 0.008, -0.88, red);

// Side hinge lugs and wire bail handle.
for (const x of [-1.22, 1.22]) {
  mesh(new THREE.SphereGeometry(0.07, 32, 16), red, 'red molded handle attachment lug', [x, 0.72, 0]);
  mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.14, 32), metal, 'silver handle pivot pin', [x, 0.72, 0], [0, 0, Math.PI / 2]);
}

const handlePoints = [
  new THREE.Vector3(-1.24, 0.72, 0),
  new THREE.Vector3(-1.05, 0.2, 0.82),
  new THREE.Vector3(-0.48, -0.42, 1.2),
  new THREE.Vector3(0, -0.58, 1.28),
  new THREE.Vector3(0.48, -0.42, 1.2),
  new THREE.Vector3(1.05, 0.2, 0.82),
  new THREE.Vector3(1.24, 0.72, 0),
];
const handleCurve = new THREE.CatmullRomCurve3(handlePoints);
mesh(new THREE.TubeGeometry(handleCurve, 120, 0.012, 16, false), metal, 'arched silver wire bail handle');
mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 48), dark, 'centered black plastic handle grip', [0, -0.54, 1.28], [0, 0, Math.PI / 2]);

// Add lights/camera metadata so model-viewer and other GLB viewers have a sensible preview.
const key = new THREE.DirectionalLight(0xffffff, 3);
key.position.set(3, 4, 5);
scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff, 1.2);
fill.position.set(-3, 2, 4);
scene.add(fill);

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.name = 'front product camera';
camera.position.set(0, 0.25, 5.8);
camera.lookAt(0, 0.1, 0);
scene.add(camera);

const exporter = new GLTFExporter();
const glb = await new Promise((resolveExport, reject) => {
  exporter.parse(
    scene,
    resolveExport,
    reject,
    { binary: true, trs: false, onlyVisible: true },
  );
});

writeFileSync(resolve(outDir, 'paint-container-procedural-red-white.glb'), Buffer.from(glb));
console.log(resolve(outDir, 'paint-container-procedural-red-white.glb'));
