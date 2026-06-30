/**
 * Araldite Container — Photo-accurate GLB builder
 *
 * Geometry proportions measured pixel-by-pixel from the 4096×4096 reference render:
 *
 *   Section        Height %   Radius vs grip
 *   Blue cap        11.8 %     0.813
 *   White collar    14.0 %     0.672  (NARROWEST)
 *   Barrel body     25.0 %     0.739
 *   Step shoulder    5.0 %     rapid 0.739 → 1.000
 *   Grip section    44.2 %     1.000  (WIDEST)
 *
 * Total height: 2.60 units  (y = -1.30 → +1.30)
 * Grip radius reference: 1.05 units
 *
 * Texture: front-view strip extracted from reference PNG via sharp,
 * embedded in GLB as DataTexture (RGBA). Requires OffscreenCanvas polyfill.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/* ── Node.js polyfills required by GLTFExporter ─────────────────────────── */

globalThis.FileReader = class {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }
};

globalThis.ImageData = class NodeImageData {
  constructor(data, width, height) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
};

// OffscreenCanvas polyfill — lets GLTFExporter convert DataTexture → PNG
globalThis.OffscreenCanvas = class NodeOffscreenCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this._imageData = null;
  }
  getContext() {
    const self = this;
    return {
      translate() {},
      scale() {},
      putImageData(imageData) {
        self._imageData = imageData;
      },
      drawImage(img) {
        if (img && img.data) {
          self._imageData = { data: img.data, width: img.width, height: img.height };
        }
      },
    };
  }
  async convertToBlob({ type = 'image/png' } = {}) {
    const id = this._imageData;
    if (!id) {
      const buf = await sharp({
        create: { width: 1, height: 1, channels: 4, background: { r: 200, g: 200, b: 195, alpha: 255 } },
      }).png().toBuffer();
      return new Blob([buf], { type });
    }
    const rawBuf = Buffer.from(id.data.buffer ?? id.data);
    const channels = rawBuf.length / (id.width * id.height);
    const pngBuf = await sharp(rawBuf, {
      raw: { width: id.width, height: id.height, channels: channels | 0 },
    }).png().toBuffer();
    return new Blob([pngBuf], { type });
  }
};

/* ── Texture extraction from reference photograph ────────────────────────── */
//
// Reference image: 4096×4096
// Container measured bounds (original pixel coords):
//   Cap top:       y ≈  200   Container left:  x ≈ 1300
//   Collar top:    y ≈  550   Container right: x ≈ 2600
//   Barrel start:  y ≈  950   Container width: ≈ 1300
//   Grip start:    y ≈ 1700
//   Base bottom:   y ≈ 3150
//
// Body texture covers collar-top → base  (y=550 → y=3150, height=2600)
// UV V=0 (base, LatheGeometry first point) → PNG top-left (OpenGL flipY=false → V=0 = last row)
// So row-0 of the extracted PNG = collar top (V=1) and last row = base (V=0) — correct.

const REF_IMAGE = 'C:/Users/rbhan/Downloads/hf_20260630_084316_c04b663e-fc18-4bb9-a3b4-e4c471c2db27.png';
const TEX_W = 512, TEX_H = 1024;

let bodyTex = null;
try {
  const { data, info } = await sharp(REF_IMAGE)
    .extract({ left: 1300, top: 550, width: 1300, height: 2600 })
    .resize(TEX_W, TEX_H, { fit: 'fill' })
    .ensureAlpha()          // RGBA — GLTFExporter requires RGBAFormat
    .raw()
    .toBuffer({ resolveWithObject: true });

  bodyTex = new THREE.DataTexture(
    new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    TEX_W, TEX_H,
    THREE.RGBAFormat,
  );
  bodyTex.flipY = false;                   // GLTF convention
  bodyTex.wrapS = THREE.MirroredRepeatWrapping;
  bodyTex.wrapT = THREE.ClampToEdgeWrapping;
  bodyTex.magFilter = THREE.LinearFilter;
  bodyTex.minFilter = THREE.LinearMipmapLinearFilter;
  bodyTex.generateMipmaps = false;
  bodyTex.needsUpdate = true;
  console.log('✓ Body texture extracted:', info.width, '×', info.height, info.channels, 'ch → RGBA', TEX_W, '×', TEX_H);
} catch (e) {
  console.warn('⚠ Texture extraction failed (falling back to PBR color):', e.message);
}

/* ── Scene setup ─────────────────────────────────────────────────────────── */
const outDir = resolve('public/case-study/model');
mkdirSync(outDir, { recursive: true });

const scene = new THREE.Scene();
scene.name = 'WhiteDot Araldite Container — LIMEX PP Photo-Accurate';

/* ── Materials ───────────────────────────────────────────────────────────── */

// Grey PP body — use photo texture when available, PBR colour otherwise
const bodyMat = new THREE.MeshPhysicalMaterial({
  name: 'araldite body — LIMEX PP warm grey',
  ...(bodyTex
    ? { map: bodyTex, color: new THREE.Color('#ffffff') }
    : { color: new THREE.Color('#c4c4bc') }),
  roughness: 0.60,
  metalness: 0,
  clearcoat: 0.22,
  clearcoatRoughness: 0.42,
  sheen: 0.14,
  sheenColor: new THREE.Color('#bdbdb5'),
  sheenRoughness: 0.58,
  envMapIntensity: 1.00,
});

// White collar (screw section) — brighter than body
const collarMat = new THREE.MeshPhysicalMaterial({
  name: 'araldite collar — white PP',
  color: new THREE.Color('#e4e4e0'),
  roughness: 0.30,
  metalness: 0,
  clearcoat: 0.55,
  clearcoatRoughness: 0.25,
  envMapIntensity: 1.30,
});

// Araldite royal blue cap — very glossy
const blueMat = new THREE.MeshPhysicalMaterial({
  name: 'araldite cap — Araldite royal blue',
  color: new THREE.Color('#2840ca'),
  roughness: 0.07,
  metalness: 0,
  clearcoat: 1.0,
  clearcoatRoughness: 0.04,
  reflectivity: 0.95,
  envMapIntensity: 1.75,
  ior: 1.52,
});

// Darker blue for divider cross + shadow rings
const blueDarkMat = new THREE.MeshPhysicalMaterial({
  name: 'araldite cap divider — dark blue',
  color: new THREE.Color('#1a2da6'),
  roughness: 0.14,
  metalness: 0,
  clearcoat: 0.82,
  envMapIntensity: 1.20,
});

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function mesh(geo, mat, name, pos = [0, 0, 0], rot = [0, 0, 0]) {
  const m = new THREE.Mesh(geo, mat);
  m.name = name;
  m.position.set(...pos);
  m.rotation.set(...rot);
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}
function ring(name, r, tube, y, mat, seg = 24) {
  const g = new THREE.TorusGeometry(r, tube, seg, 180);
  return mesh(g, mat, name, [0, y, 0], [Math.PI / 2, 0, 0]);
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  GEOMETRY — photo-accurate proportions (y = −1.30 … +1.30)
 *
 *  Y layout (measured from photo, total 2.60 units):
 *    −1.300  base rim bottom
 *    −0.151  top of grip  →  step shoulder starts
 *    −0.021  bottom of barrel  →  step shoulder ends
 *    +0.629  top of barrel  →  collar starts
 *    +0.993  top of collar  →  blue cap starts
 *    +1.300  top of blue cap
 *
 *  Radii (grip = 1.050):
 *    Grip:   1.050   Barrel: 0.780   Collar: 0.705   Cap: 0.855
 * ═══════════════════════════════════════════════════════════════════════════ */

/* ── 1. Full white body: one LatheGeometry (grip + step + barrel + collar) ── */
//  Single lathe = one UV space → texture maps cleanly from base (V=0) to collar (V=1)
const bodyProfile = [
  // ─ Base rim ─
  new THREE.Vector2(0.000, -1.300),   // center bottom
  new THREE.Vector2(0.880, -1.300),   // base inner flat
  new THREE.Vector2(1.055, -1.278),   // base rim outer flare
  new THREE.Vector2(1.065, -1.248),   // rim peak
  new THREE.Vector2(1.050, -1.215),   // into grip wall

  // ─ Grip section (44 % of height — tallest part) ─
  new THREE.Vector2(1.050, -0.200),   // grip wall (long straight run)
  new THREE.Vector2(1.040, -0.160),   // step shoulder outer

  // ─ Step shoulder (rapid 30 % inward over 0.13 units) ─
  new THREE.Vector2(0.850, -0.095),   // rapid taper
  new THREE.Vector2(0.785, -0.030),   // step resolves into barrel

  // ─ Barrel body (slight barrel curve — widest at mid) ─
  new THREE.Vector2(0.783, 0.100),
  new THREE.Vector2(0.782, 0.250),    // widest barrel point
  new THREE.Vector2(0.780, 0.420),
  new THREE.Vector2(0.772, 0.560),    // gentle taper toward collar
  new THREE.Vector2(0.762, 0.629),    // barrel top / collar base

  // ─ White collar (narrower than barrel — screw section) ─
  new THREE.Vector2(0.712, 0.655),    // step inward into collar
  new THREE.Vector2(0.706, 0.720),
  new THREE.Vector2(0.710, 0.790),
  new THREE.Vector2(0.706, 0.860),
  new THREE.Vector2(0.712, 0.930),
  new THREE.Vector2(0.722, 0.965),
  new THREE.Vector2(0.748, 0.993),    // collar top / cap base
];
const bodyMesh = mesh(
  new THREE.LatheGeometry(bodyProfile, 280),
  bodyMat, 'araldite white body',
);
bodyMesh.geometry.computeVertexNormals();

/* ── 2. Bottom disk cap ──────────────────────────────────────────────────── */
mesh(new THREE.CircleGeometry(0.880, 80), bodyMat, 'bottom disk',
  [0, -1.300, 0], [-Math.PI / 2, 0, 0]);

/* ── 3. Vertical flute ribs on grip section ──────────────────────────────── */
//  32 rounded ribs, centred at y = −0.683 (mid-grip), height 0.98 units
const FLUTES = 32;
for (let i = 0; i < FLUTES; i++) {
  const a = (i / FLUTES) * Math.PI * 2;
  const r = 1.053;
  mesh(
    new RoundedBoxGeometry(0.058, 0.98, 0.058, 3, 0.017),
    bodyMat, `flute rib ${i}`,
    [Math.cos(a) * r, -0.683, Math.sin(a) * r],
    [0, -a, 0],
  );
}

/* ── 4. Collar torus rings (4 distinct ridges clearly visible in photo) ──── */
ring('collar ring 1', 0.712, 0.016, 0.670, collarMat);
ring('collar ring 2', 0.707, 0.016, 0.755, collarMat);
ring('collar ring 3', 0.710, 0.016, 0.840, collarMat);
ring('collar ring 4', 0.714, 0.013, 0.920, collarMat);

/* ── 5. Shadow gap between white collar and blue cap ─────────────────────── */
ring('shadow gap collar→cap', 0.750, 0.009, 0.993, blueDarkMat, 20);

/* ── 6. Blue Araldite top cap (dominating feature of the product) ────────── */
const capProfile = [
  new THREE.Vector2(0.000, 0.993),    // centre base
  new THREE.Vector2(0.720, 0.993),    // inner base
  new THREE.Vector2(0.820, 1.004),    // skirt flares over collar
  new THREE.Vector2(0.855, 1.025),    // outer cap wall base
  new THREE.Vector2(0.860, 1.145),    // outer cap wall
  new THREE.Vector2(0.850, 1.225),    // wall curves to dome
  new THREE.Vector2(0.800, 1.268),    // dome shoulder
  new THREE.Vector2(0.620, 1.293),    // dome
  new THREE.Vector2(0.340, 1.300),    // near apex
  new THREE.Vector2(0.000, 1.300),    // centre top
];
mesh(new THREE.LatheGeometry(capProfile, 260), blueMat, 'blue Araldite top cap');

/* ── 7. Cross divider on cap top (+ mark visible in photo) ──────────────── */
const CW = 0.088, CH = 0.043, CL = 1.68;
mesh(new THREE.BoxGeometry(CW, CH, CL), blueDarkMat, 'cap cross X', [0, 1.303, 0]);
mesh(new THREE.BoxGeometry(CL, CH, CW), blueDarkMat, 'cap cross Z', [0, 1.303, 0]);

/* ── 8. Concentric detail rings on cap top ───────────────────────────────── */
ring('cap inner ring',  0.440, 0.009, 1.296, blueDarkMat, 20);
ring('cap middle ring', 0.660, 0.007, 1.291, blueDarkMat, 20);

/* ── 9. Lighting (key + fill + rim + top) ───────────────────────────────── */
const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
keyLight.position.set(3, 5, 5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 1.1);
fillLight.position.set(-3, 2, 3);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
rimLight.position.set(0, -4, -3);
scene.add(rimLight);

const topLight = new THREE.DirectionalLight(0xffffff, 0.7);
topLight.position.set(0, 8, 1);
scene.add(topLight);

/* ── 10. Camera ──────────────────────────────────────────────────────────── */
const cam = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
cam.name = 'product front camera';
cam.position.set(0, 0.10, 5.6);
cam.lookAt(0, 0.04, 0);
scene.add(cam);

/* ── Export ──────────────────────────────────────────────────────────────── */
const exporter = new GLTFExporter();
const glb = await new Promise((res, rej) =>
  exporter.parse(scene, res, rej, {
    binary: true,
    trs: false,
    onlyVisible: true,
    embedImages: true,
    maxTextureSize: 1024,
  }),
);

const outPath = resolve(outDir, 'araldite-container-procedural.glb');
writeFileSync(outPath, Buffer.from(glb));
console.log('✓ GLB written:', outPath, `(${(glb.byteLength / 1024 / 1024).toFixed(2)} MB)`);
console.log(bodyTex ? '✓ Photo texture embedded in GLB' : '⚠ Procedural PBR colors used (no texture)');
