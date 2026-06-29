/**
 * Motor Cover GLB v6 — Ultra-Realistic + Corrected Orientation.
 *
 * Fixes over v5:
 *  - Root Group rotated -90° around Y so grille face is the DEFAULT front in model-viewer
 *  - R_GRILLE = 0.76 (was 0.82) → wider outer bezel (thicker border as requested)
 *  - All grid params scaled proportionally to new R_GRILLE
 *  - SDF fillet corners on holes (injection-moulded rounded-rectangle look)
 *  - 2048×2048 alpha mask
 *  - Deep navy-black ABS + ultra-gloss clearcoat PBR
 *  - Two-section cup with step groove
 *  - PNG EMBEDDED in GLB BIN — fully self-contained
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve }                  from 'node:path';
import { deflateSync }              from 'node:zlib';
import * as THREE                   from 'three';
import { GLTFExporter }             from 'three/examples/jsm/exporters/GLTFExporter.js';

globalThis.FileReader = class {
  async readAsArrayBuffer(blob) { this.result = await blob.arrayBuffer(); this.onloadend?.(); }
};

// ── Pure-JS PNG encoder ────────────────────────────────────────────────────────
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : c >>> 1;
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const L = Buffer.allocUnsafe(4); L.writeUInt32BE(data.length);
  const C = Buffer.allocUnsafe(4); C.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([L, t, data, C]);
}
function makePNG(w, h, pixelFn) {
  const raw = Buffer.allocUnsafe(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0;
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = pixelFn(x, y);
      const i = y * (1 + w * 4) + 1 + x * 4;
      raw[i]=r; raw[i+1]=g; raw[i+2]=b; raw[i+3]=a;
    }
  }
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(w,0); ihdr.writeUInt32BE(h,4);
  ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Grille parameters — matched to real product references ─────────────────────
// Real part: concentric RINGS of discrete radially-oriented capsule SLOTS,
// spoke count rising outward (denser at rim), wide flat bezel, keyhole center boss.
const R_GRILLE       = 0.820;  // grille disc radius (matches bezel inner edge)
const GRILLE_OUTER_R = 0.780;  // outermost slot extent — just outside ring 5
const CENTER_BOSS_R  = 0.060;  // raised center boss radius
const CENTER_HOLE_R  = 0.024;  // keyhole circle radius
const KEY_NOTCH_W    = 0.011;  // keyhole notch half-width
const KEY_NOTCH_L    = 0.034;  // keyhole notch length

// [ ringRadius, spokeCount ] — 5 rings matching reference product
const SLOT_RINGS = [
  [0.150,  8],   // innermost — 8 wide slots (thicker, more visible)
  [0.295, 14],
  [0.435, 20],
  [0.570, 25],
  [0.710, 30],
];
const SLOT_RAD_FRAC = 0.40;  // shorter radial extent (tangential slot shape)
const SLOT_ARC_FRAC = 0.44;  // wider tangential extent — matches reference orientation
const SLOT_CORNER   = 0.016; // rounded-rectangle corner radius (pill ends)

// Precompute radial half-length per ring from neighbour spacing
const RING_HALF_LEN = SLOT_RINGS.map(([r], i) => {
  const prev = i > 0 ? SLOT_RINGS[i - 1][0] : null;
  const next = i < SLOT_RINGS.length - 1 ? SLOT_RINGS[i + 1][0] : null;
  const gaps = [];
  if (prev != null) gaps.push(r - prev);
  if (next != null) gaps.push(next - r);
  return Math.min(...gaps) * SLOT_RAD_FRAC;
});

// ── 2048×2048 alpha-mask PNG ──────────────────────────────────────────────────
// Transparent pixels = open slots (cream backing visible through them).
// Opaque pixels = glossy black plastic web / bezel.
const TEX = 2048;
const grillePNG = makePNG(TEX, TEX, (x, y) => {
  const u  = x / TEX;
  const v  = 1 - y / TEX;
  const wx = R_GRILLE * (u - 0.5) * 2;
  const wy = R_GRILLE * (v - 0.5) * 2;
  const wr = Math.hypot(wx, wy);

  const O = [8, 10, 20, 255];  // opaque navy-black plastic
  const T = [0,  0,  0,  0];   // open slot

  if (wr > R_GRILLE * 0.997) return T;
  if (wr > GRILLE_OUTER_R)   return O;  // flat bezel border

  const angle = Math.atan2(wy, wx);

  // Center keyhole: circle + radial notch
  if (wr < CENTER_BOSS_R) {
    if (wr < CENTER_HOLE_R) return T;
    if (wx > 0 && wx < KEY_NOTCH_L && Math.abs(wy) < KEY_NOTCH_W) return T;
    return O;
  }

  // Find nearest slot ring
  let bi = 0, bd = Infinity;
  for (let i = 0; i < SLOT_RINGS.length; i++) {
    const d = Math.abs(wr - SLOT_RINGS[i][0]);
    if (d < bd) { bd = d; bi = i; }
  }
  const [Ri, Ni] = SLOT_RINGS[bi];

  // Radial offset from ring centerline
  const dr = wr - Ri;

  // Angular offset from nearest spoke centerline → arc length
  const sector = (Math.PI * 2) / Ni;
  const k      = Math.round(angle / sector);
  const arc    = (angle - k * sector) * Ri;

  // Rounded-rectangle (pill) SDF
  const halfL = RING_HALF_LEN[bi];
  const halfW = sector * Ri * SLOT_ARC_FRAC;
  const qx = Math.abs(dr)  - (halfL - SLOT_CORNER);
  const qy = Math.abs(arc) - (halfW - SLOT_CORNER);
  const inside = Math.max(qx, qy) <= 0
    || Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) <= SLOT_CORNER;

  return inside ? T : O;
});

const imgDir = resolve('public/case-study/img');
mkdirSync(imgDir, { recursive: true });
writeFileSync(resolve(imgDir, 'grille-mask.png'), grillePNG);
console.log(`✓ grille-mask.png  ${(grillePNG.length / 1024).toFixed(1)} KB`);

// ── Three.js scene ─────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.name  = 'Motor Cover — LIMEX Ultra';
const GRILLE_MAT = 'GRILLE_NET_DISC';

// ── Root group — rotated -90° around Y ─────────────────────────────────────────
// Grille face is at +Z in Three.js space.
// After -90° Y rotation: +Z → +X.
// model-viewer theta=0 looks from +X → grille face is front-and-center by default.
const root = new THREE.Group();
root.name       = 'motor-cover-root';
root.rotation.y = -Math.PI / 2;
scene.add(root);

// ── Materials ──────────────────────────────────────────────────────────────────
const C_PLASTIC = new THREE.Color('#060A14');
const C_INNER   = new THREE.Color('#040610');
const C_CREAM   = new THREE.Color('#E2DBC6');

const ultraGloss = new THREE.MeshPhysicalMaterial({
  name: 'ultra-gloss',
  color: C_PLASTIC,
  roughness: 0.055,
  metalness: 0.0,
  clearcoat: 1.0,
  clearcoatRoughness: 0.04,
  reflectivity: 0.92,
  side: THREE.DoubleSide,
});
const innerMat = new THREE.MeshPhysicalMaterial({
  name: 'inner-mat',
  color: C_INNER,
  roughness: 0.14,
  metalness: 0,
  clearcoat: 0.65,
  clearcoatRoughness: 0.10,
  side: THREE.DoubleSide,
});
const grilleMat = new THREE.MeshPhysicalMaterial({
  name: GRILLE_MAT,
  color: C_PLASTIC,
  roughness: 0.09,
  metalness: 0,
  clearcoat: 0.92,
  clearcoatRoughness: 0.06,
  alphaTest: 0,
  transparent: true,
  side: THREE.DoubleSide,
});
const creamMat = new THREE.MeshBasicMaterial({
  name: 'cream-housing',
  color: C_CREAM,
  side: THREE.DoubleSide,
});

// ── Helpers ─────────────────────────────────────────────────────────────────────
const H = Math.PI / 2;
function add(geo, mat, name, px=0, py=0, pz=0, rx=0, ry=0, rz=0) {
  const m = new THREE.Mesh(geo, mat);
  m.name = name;
  m.position.set(px, py, pz);
  m.rotation.set(rx, ry, rz);
  root.add(m);
  return m;
}
function cyl(name, rT, rB, h, mat, z, seg=80) {
  return add(new THREE.CylinderGeometry(rT, rB, h, seg, 1, true), mat, name, 0,0,z, H,0,0);
}
function disc(name, r, mat, z, flip=false) {
  return add(new THREE.CircleGeometry(r, 80), mat, name, 0,0,z, flip?Math.PI:0,0,0);
}
function rng(name, rI, rO, mat, z) {
  return add(new THREE.RingGeometry(rI, rO, 80), mat, name, 0,0,z);
}
function tor(name, r, tube, mat, z, radSeg=14, tubSeg=80) {
  return add(new THREE.TorusGeometry(r, tube, radSeg, tubSeg), mat, name, 0,0,z);
}

// ── Dimensions ──────────────────────────────────────────────────────────────────
const FZ = 0.64;   // front face Z — NET disc at front (as before)
const JZ = 0.47;   // junction Z  — slope meets tube (1 cm slope)
const RZ = -0.65;  // rear opening Z

const R_NET  = R_GRILLE;  // = 0.820 — NET disc radius at front (smaller)
const R_TUBE = 0.980;     // outer tube radius (bigger)
const T      = 0.050;     // wall thickness

// ── SLOPE — NET small circle at front fans out to tube ──────────────────────────
const slopeH = FZ - JZ;
cyl('front-cone',       R_NET,     R_TUBE,     slopeH, ultraGloss, JZ + slopeH / 2, 96);
cyl('front-cone-inner', R_NET - T, R_TUBE - T, slopeH, innerMat,   JZ + slopeH / 2, 96);

// ── STRAIGHT TUBE ───────────────────────────────────────────────────────────────
cyl('outer-tube', R_TUBE,     R_TUBE,     JZ - RZ, ultraGloss, RZ + (JZ - RZ) / 2, 96);
cyl('inner-tube', R_TUBE - T, R_TUBE - T, JZ - RZ, innerMat,   RZ + (JZ - RZ) / 2, 96);

// ── GRILLE — NET disc at front face, fully see-through slots ────────────────────

// NET disc — alpha-masked; slot pixels are fully transparent (no backing — open holes)
disc('grille-net-disc', R_NET, grilleMat, FZ);

// ── REAR BUMP RING — 1.5 cm raised collar, 3 circular screw holes ───────────────
const bumpH  = 0.25;            // 1.5 cm
const R_BUMP = R_TUBE + 0.032;  // modest protrusion

// Full smooth bump wall
cyl('bump-wall', R_BUMP, R_BUMP, bumpH, ultraGloss, RZ + bumpH / 2, 80);

// 3 circular screw holes — dark cylinders embedded radially in bump surface
const SCREW_R = 0.022;   // hole radius
const SCREW_D = 0.058;   // hole depth (goes through bump + into tube wall)
for (let i = 0; i < 3; i++) {
  const hAng  = i * 2 * Math.PI / 3;
  const mid_r = R_BUMP - SCREW_D / 2;  // centre of hole cylinder
  // Hole walls (open cylinder going radially inward)
  const hCylGeo = new THREE.CylinderGeometry(SCREW_R, SCREW_R, SCREW_D, 16, 1, true);
  const hCyl    = new THREE.Mesh(hCylGeo, innerMat);
  hCyl.name     = `screw-cyl-${i}`;
  hCyl.position.set(mid_r * Math.cos(hAng), mid_r * Math.sin(hAng), RZ + bumpH / 2);
  hCyl.rotation.set(0, 0, hAng - Math.PI / 2);  // orient radially
  root.add(hCyl);
  // Hole face — dark circle visible on bump outer surface
  const hDiscGeo = new THREE.CircleGeometry(SCREW_R, 16);
  const hDisc    = new THREE.Mesh(hDiscGeo, innerMat);
  hDisc.name     = `screw-face-${i}`;
  hDisc.position.set((R_BUMP + 0.001) * Math.cos(hAng), (R_BUMP + 0.001) * Math.sin(hAng), RZ + bumpH / 2);
  hDisc.rotation.set(0, Math.PI / 2, hAng);  // face outward
  root.add(hDisc);
}
rng('bump-shoulder', R_TUBE,     R_BUMP, ultraGloss, RZ + bumpH);
rng('rear-face',     R_TUBE - T, R_BUMP, ultraGloss, RZ);

// ── CENTER BOSS — small raised hub with keyhole ──────────────────────────────────
cyl('center-boss', CENTER_BOSS_R - 0.004, CENTER_BOSS_R + 0.004, 0.030, ultraGloss, FZ + 0.015, 32);
tor('center-base-ring', CENTER_BOSS_R + 0.012, 0.006, ultraGloss, FZ + 0.003, 12, 48);

// ── LIGHTS ───────────────────────────────────────────────────────────────────────
const key  = new THREE.DirectionalLight(0xffffff, 3.8);  key.position.set(2.2, 2.8, 4.2);
const fill = new THREE.DirectionalLight(0xffffff, 1.1);  fill.position.set(-3.0, 1.4, 3.0);
const rim  = new THREE.DirectionalLight(0xffffff, 0.55); rim.position.set(0.2, -2.2, -2.2);
const back = new THREE.DirectionalLight(0xffffff, 0.30); back.position.set(0, 0.5, -4.0);
scene.add(key, fill, rim, back);

// ── CAMERA ───────────────────────────────────────────────────────────────────────
const cam = new THREE.PerspectiveCamera(33, 1, 0.1, 100);
cam.position.set(0, 0.08, 4.6);
cam.lookAt(0, 0, 0.05);
scene.add(cam);

// ── EXPORT ───────────────────────────────────────────────────────────────────────
const exporter = new GLTFExporter();
const rawBuf = await new Promise((res, rej) =>
  exporter.parse(scene, res, rej, { binary:true, trs:false, onlyVisible:true }));

const finalBuf = embedTexture(Buffer.from(rawBuf), grillePNG, GRILLE_MAT);

const outDir = resolve('public/case-study/model');
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'motor-cover-procedural-black.glb'), finalBuf);
console.log(`✓ GLB saved  ${(finalBuf.length / 1024).toFixed(1)} KB`);

// ── Verify ───────────────────────────────────────────────────────────────────────
{
  const jLen = finalBuf.readUInt32LE(12);
  const j    = JSON.parse(finalBuf.slice(20, 20 + jLen).toString('utf8'));
  const m    = (j.materials || []).find(m => m.name === GRILLE_MAT);
  const tIdx = m?.pbrMetallicRoughness?.baseColorTexture?.index;
  const img  = tIdx != null ? j.images?.[j.textures?.[tIdx]?.source] : null;
  console.log(`✓ Material: ${!!m}  alphaMode: ${m?.alphaMode}  embedded-png: ${img?.bufferView != null}`);
}

// ── embedTexture ──────────────────────────────────────────────────────────────────
function embedTexture(glbBuf, pngBytes, matName) {
  if (glbBuf.readUInt32LE(0) !== 0x46546C67) throw new Error('Not a GLB');

  const jsonLen = glbBuf.readUInt32LE(12);
  const json    = JSON.parse(glbBuf.slice(20, 20 + jsonLen).toString('utf8'));

  const binOff = 20 + jsonLen;
  const hasBin = glbBuf.length > binOff + 8;
  const oldLen = hasBin ? glbBuf.readUInt32LE(binOff) : 0;
  const oldBin = hasBin ? glbBuf.slice(binOff + 8, binOff + 8 + oldLen) : Buffer.alloc(0);

  const oldPad = Math.ceil(oldBin.length / 4) * 4;
  const pngPad = Math.ceil(pngBytes.length  / 4) * 4;
  const newBin = Buffer.alloc(oldPad + pngPad, 0x00);
  oldBin.copy(newBin, 0);
  pngBytes.copy(newBin, oldPad);

  json.bufferViews = json.bufferViews || [];
  const bvIdx = json.bufferViews.length;
  json.bufferViews.push({ buffer:0, byteOffset:oldPad, byteLength:pngBytes.length });
  if (json.buffers?.[0]) json.buffers[0].byteLength = newBin.length;

  json.images   = json.images   || [];
  json.samplers = json.samplers || [];
  json.textures = json.textures || [];

  const imgIdx  = json.images.length;
  json.images.push({ mimeType:'image/png', bufferView:bvIdx });
  const sampIdx = json.samplers.length;
  json.samplers.push({ magFilter:9729, minFilter:9986, wrapS:33071, wrapT:33071 });
  const texIdx  = json.textures.length;
  json.textures.push({ sampler:sampIdx, source:imgIdx });

  const mat = (json.materials || []).find(m => m.name === matName);
  if (!mat) {
    console.warn(`⚠  "${matName}" not found in GLB materials`);
  } else {
    mat.pbrMetallicRoughness = mat.pbrMetallicRoughness || {};
    mat.pbrMetallicRoughness.baseColorTexture = { index:texIdx };
    mat.alphaMode   = 'BLEND';
    mat.doubleSided = true;
  }

  const jsonBuf = Buffer.from(JSON.stringify(json), 'utf8');
  const jPad    = Math.ceil(jsonBuf.length / 4) * 4;
  const jOut    = Buffer.alloc(jPad, 0x20); jsonBuf.copy(jOut);
  const bPad    = Math.ceil(newBin.length  / 4) * 4;
  const bOut    = Buffer.alloc(bPad, 0x00); newBin.copy(bOut);

  const total = 12 + 8 + jPad + 8 + bPad;
  const hdr   = Buffer.allocUnsafe(12);
  hdr.writeUInt32LE(0x46546C67, 0);
  hdr.writeUInt32LE(2,          4);
  hdr.writeUInt32LE(total,      8);
  const jHdr = Buffer.allocUnsafe(8);
  jHdr.writeUInt32LE(jPad,       0);
  jHdr.writeUInt32LE(0x4E4F534A, 4);
  const bHdr = Buffer.allocUnsafe(8);
  bHdr.writeUInt32LE(bPad,       0);
  bHdr.writeUInt32LE(0x004E4942, 4);

  return Buffer.concat([hdr, jHdr, jOut, bHdr, bOut]);
}
