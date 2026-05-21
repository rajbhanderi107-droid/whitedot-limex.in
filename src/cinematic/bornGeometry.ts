/**
 * Procedural geometry builders for the Born of LIMEX narrative.
 * All allocations happen once in useMemo — no per-frame work here.
 */
import * as THREE from "three";

// ─── Deterministic seeded pseudo-random ──────────────────────────────────────
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─── CO2 particle field ───────────────────────────────────────────────────────
export interface CO2Attrs {
  geometry: THREE.BufferGeometry;
  count: number;
}

export function buildCO2Particles(count: number): CO2Attrs {
  const rng = seededRng(42);
  const positions = new Float32Array(count * 3);
  const sizes     = new Float32Array(count);
  const phases    = new Float32Array(count);
  const offsets   = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    // Sphere shell distribution — CO2 cloud fills the dark space
    const theta = rng() * Math.PI * 2;
    const phi   = Math.acos(2 * rng() - 1);
    const r     = 1.8 + rng() * 2.8;

    offsets[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    offsets[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    offsets[i * 3 + 2] = r * Math.cos(phi);

    positions[i * 3]     = offsets[i * 3];
    positions[i * 3 + 1] = offsets[i * 3 + 1];
    positions[i * 3 + 2] = offsets[i * 3 + 2];

    sizes[i]  = 2.5 + rng() * 3.5;
    phases[i] = rng() * Math.PI * 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aSize",    new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute("aPhase",   new THREE.BufferAttribute(phases, 1));
  geo.setAttribute("aOffset",  new THREE.BufferAttribute(offsets, 3));

  return { geometry: geo, count };
}

// ─── CaCO3 crystal geometry ───────────────────────────────────────────────────
export function buildCrystalGeometry(radius: number): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(radius, 3);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const rng = seededRng(7);
  const v   = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = (
      Math.sin(v.x * 4.2) * Math.cos(v.y * 3.8) * Math.sin(v.z * 4.5)
    );
    const jitter = (rng() - 0.5) * 0.04;
    v.multiplyScalar(1 + n * 0.055 + jitter);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

// ─── Bottle geometry (LatheGeometry) ─────────────────────────────────────────
export function buildBottleGeometry(height = 2.2, segments = 24): THREE.BufferGeometry {
  // Profile points: base → waist → shoulder → neck → lip
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.38, 0.0),   // base rim
    new THREE.Vector2(0.40, 0.08),  // base flare
    new THREE.Vector2(0.34, 0.38),  // lower body
    new THREE.Vector2(0.30, 0.72),  // waist
    new THREE.Vector2(0.35, 1.05),  // mid body
    new THREE.Vector2(0.36, 1.32),  // shoulder start
    new THREE.Vector2(0.26, 1.60),  // shoulder taper
    new THREE.Vector2(0.14, 1.78),  // neck
    new THREE.Vector2(0.14, 1.92),  // neck straight
    new THREE.Vector2(0.18, 2.02),  // lip flare
    new THREE.Vector2(0.18, 2.10),  // lip top
  ].map(v => new THREE.Vector2(v.x, v.y * (height / 2.2)));

  return new THREE.LatheGeometry(pts, segments);
}

// ─── Burger-box carton geometry ───────────────────────────────────────────────
// Simple folded box: BoxGeometry with subdivided faces and slight fold offset
export function buildCartonGeometry(w = 1.6, h = 0.9, d = 1.1): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(w, h, d, 2, 2, 2);
  // Subtle fold warp — top face vertices curve upward slightly
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v   = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // Top vertices (y near +h/2): apply slight outward bow
    const topness = Math.max(0, (v.y / (h * 0.5) - 0.5) * 2);
    if (topness > 0) {
      const bow = Math.sin((v.x / w + 0.5) * Math.PI) * 0.06 * topness;
      v.y += bow;
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

// ─── Morph particle attributes (core → products) ─────────────────────────────
export interface MorphAttrs {
  geometry: THREE.BufferGeometry;
  count: number;
}

export function buildMorphParticles(
  count: number,
  fromRadius: number,
  toPositions: THREE.Vector3[],
): MorphAttrs {
  const rng     = seededRng(17);
  const aFrom   = new Float32Array(count * 3);
  const aTo     = new Float32Array(count * 3);
  const aPhase  = new Float32Array(count);
  const aSize   = new Float32Array(count);
  const pos     = new Float32Array(count * 3); // dummy positions (GPU uses attrs)

  const toCount = toPositions.length;

  for (let i = 0; i < count; i++) {
    // From: random surface of sphere (the core)
    const theta = rng() * Math.PI * 2;
    const phi   = Math.acos(2 * rng() - 1);
    const r     = fromRadius * (0.8 + rng() * 0.2);
    aFrom[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    aFrom[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    aFrom[i * 3 + 2] = r * Math.cos(phi);

    // To: random selection from product surface points
    const tp = toPositions[Math.floor(rng() * toCount)] ?? new THREE.Vector3();
    aTo[i * 3]     = tp.x + (rng() - 0.5) * 0.08;
    aTo[i * 3 + 1] = tp.y + (rng() - 0.5) * 0.08;
    aTo[i * 3 + 2] = tp.z + (rng() - 0.5) * 0.08;

    pos[i * 3]     = aFrom[i * 3];
    pos[i * 3 + 1] = aFrom[i * 3 + 1];
    pos[i * 3 + 2] = aFrom[i * 3 + 2];

    aPhase[i] = rng();
    aSize[i]  = 2.0 + rng() * 2.8;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aFrom",    new THREE.BufferAttribute(aFrom, 3));
  geo.setAttribute("aTo",      new THREE.BufferAttribute(aTo, 3));
  geo.setAttribute("aPhase",   new THREE.BufferAttribute(aPhase, 1));
  geo.setAttribute("aSize",    new THREE.BufferAttribute(aSize, 1));

  return { geometry: geo, count };
}

// ─── Limestone dust field (always-on living VFX) ──────────────────────────────
export function buildDustParticles(count: number): THREE.BufferGeometry {
  const rng = seededRng(123);
  const positions = new Float32Array(count * 3);
  const sizes     = new Float32Array(count);
  const phases    = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    // Loose cloud hugging the stone, biased to a tall column so rising reads.
    const r = 1.4 + rng() * 2.2;
    const theta = rng() * Math.PI * 2;
    positions[i * 3]     = Math.cos(theta) * r * (0.6 + rng() * 0.4);
    positions[i * 3 + 1] = (rng() - 0.5) * 6.0;
    positions[i * 3 + 2] = Math.sin(theta) * r * (0.6 + rng() * 0.4);
    sizes[i]  = 0.8 + rng() * 1.8;
    phases[i] = rng();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aSize",    new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute("aPhase",   new THREE.BufferAttribute(phases, 1));
  return geo;
}

// ─── Molecular lattice point cloud (R08–R09) ──────────────────────────────────
// A cubic lattice of nodes inside a sphere of `radius`, each carrying an exact
// ordered position + a disordered jitter offset (shader lerps order→1).
export function buildLatticeGeometry(approxCount: number, radius: number): THREE.BufferGeometry {
  const rng = seededRng(57);
  // Choose a grid resolution whose in-sphere node count ~= approxCount.
  const n = Math.max(4, Math.round(Math.cbrt(approxCount * 1.9)));
  const ordered: number[] = [];
  const jitter:  number[] = [];
  const phases:  number[] = [];
  const sizes:   number[] = [];
  const step = (2 * radius) / (n - 1);
  for (let xi = 0; xi < n; xi++) {
    for (let yi = 0; yi < n; yi++) {
      for (let zi = 0; zi < n; zi++) {
        const x = -radius + xi * step;
        const y = -radius + yi * step;
        const z = -radius + zi * step;
        if (x * x + y * y + z * z > radius * radius) continue; // sphere mask
        ordered.push(x, y, z);
        const jr = 1.1;
        jitter.push((rng() - 0.5) * jr, (rng() - 0.5) * jr, (rng() - 0.5) * jr);
        phases.push(rng());
        sizes.push(1.4 + rng() * 1.6);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  const count = phases.length;
  // position attr is required by three; ordered positions double as base.
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(ordered), 3));
  geo.setAttribute("aOrdered", new THREE.BufferAttribute(new Float32Array(ordered), 3));
  geo.setAttribute("aJitter",  new THREE.BufferAttribute(new Float32Array(jitter), 3));
  geo.setAttribute("aPhase",   new THREE.BufferAttribute(new Float32Array(phases), 1));
  geo.setAttribute("aSize",    new THREE.BufferAttribute(new Float32Array(sizes), 1));
  geo.userData.count = count;
  return geo;
}

// ─── Refined thin slab (R14 paper / R15 plastic) ─────────────────────────────
// A thin rounded-corner-feel slab lying flat (y = thin axis). Plane-subdivided
// faces give the slab UVs for the fibre grain; a slight edge bevel via corner
// rounding would add cost, so we keep a clean box and let the shader carry the
// material read. Built once in useMemo.
export function buildSlabGeometry(w = 2.6, h = 0.12, d = 1.7): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(w, h, d, 6, 1, 4);
  // Soften the long edges very slightly so the silhouette is not a hard brick.
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const hw = w * 0.5;
  const hd = d * 0.5;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const ex = Math.max(0, Math.abs(v.x) / hw - 0.78) / 0.22; // 0..1 near edge
    const ez = Math.max(0, Math.abs(v.z) / hd - 0.78) / 0.22;
    const edge = Math.max(ex, ez);
    if (edge > 0) v.y *= 1 - edge * 0.4; // taper the rim thinner
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

// ─── Sample surface points from a geometry ────────────────────────────────────
export function sampleGeometrySurface(geo: THREE.BufferGeometry, count: number, offset: THREE.Vector3 = new THREE.Vector3()): THREE.Vector3[] {
  const pos    = geo.attributes.position as THREE.BufferAttribute;
  const points: THREE.Vector3[] = [];
  const rng    = seededRng(99);
  const total  = pos.count;
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * total);
    const v   = new THREE.Vector3().fromBufferAttribute(pos, idx).add(offset);
    points.push(v);
  }
  return points;
}
