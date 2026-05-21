/**
 * GLSL shader strings for the Born of LIMEX cinematic narrative.
 * Kept in a separate file so BornOfLimex.tsx stays readable.
 */

// ─── CO2 particle shader ──────────────────────────────────────────────────────
export const co2VertGLSL = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3  aOffset;
  uniform float   uTime;
  uniform float   uGather;   // 0=dispersed 1=gathered at centre
  uniform float   uProgress; // stage progress 0..1
  varying float   vAlpha;
  varying float   vPhase;

  // Pseudo-random (deterministic by attribute)
  float hash(float n) { return fract(sin(n) * 43758.5453); }

  void main() {
    vec3 pos = aOffset;

    // Gentle turbulence drift
    float t = uTime * 0.22 + aPhase;
    pos.x += sin(t * 1.1 + aPhase * 3.7) * 0.35 * (1.0 - uGather);
    pos.y += cos(t * 0.9 + aPhase * 2.1) * 0.28 * (1.0 - uGather);
    pos.z += sin(t * 0.7 + aPhase * 5.3) * 0.22 * (1.0 - uGather);

    // Gather toward origin
    pos = mix(pos, vec3(0.0), uGather * uGather);

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position  = projectionMatrix * mvPos;

    float dist = length(mvPos.xyz);
    gl_PointSize = aSize * (280.0 / max(dist, 0.1)) * (1.0 + uGather * 0.4);

    // Fade out near gather completion (they'll become the crystal)
    vAlpha = (1.0 - uGather * uGather) * clamp(1.2 - dist * 0.12, 0.0, 1.0);
    vPhase = aPhase;
  }
`;

export const co2FragGLSL = /* glsl */ `
  uniform float uTime;
  varying float vAlpha;
  varying float vPhase;

  void main() {
    // Soft circular point
    vec2 uv   = gl_PointCoord * 2.0 - 1.0;
    float d   = dot(uv, uv);
    if (d > 1.0) discard;

    float soft = 1.0 - smoothstep(0.55, 1.0, d);

    // Slow pulse per particle — organic, not electric
    float pulse = 0.72 + 0.28 * sin(uTime * 0.4 + vPhase * 6.28);

    // Sage-tinted CO2 haze — scientific but mineral
    vec3 col = mix(vec3(0.38, 0.44, 0.4), vec3(0.62, 0.72, 0.6), pulse);
    gl_FragColor = vec4(col, soft * vAlpha * pulse * 0.88);
  }
`;

// ─── Crystal (CaCO3) growth shader ───────────────────────────────────────────
export const crystalVertGLSL = /* glsl */ `
  uniform float uTime;
  uniform float uGrow;   // 0..1 crystal emergence scale
  varying vec3  vNormal;
  varying vec3  vPos;
  varying float vHeight;

  void main() {
    // Procedural displacement — mineral facet noise
    vec3 p = position;
    float disp = sin(p.x * 4.2 + uTime * 0.3) * cos(p.y * 3.8) * sin(p.z * 4.5 + uTime * 0.2);
    p += normal * disp * 0.04 * uGrow;

    // Scale emergence
    p *= uGrow;

    vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPos;

    vNormal  = normalize(normalMatrix * normal);
    vPos     = p;
    vHeight  = p.y;
  }
`;

export const crystalFragGLSL = /* glsl */ `
  uniform float uTime;
  uniform float uGrow;
  uniform vec3  uColor;
  varying vec3  vNormal;
  varying vec3  vPos;
  varying float vHeight;

  void main() {
    // Fresnel
    vec3 viewDir = normalize(cameraPosition - vPos);
    float rim = 1.0 - clamp(dot(vNormal, viewDir), 0.0, 1.0);
    float fresnel = pow(rim, 2.8);

    // Reaction pulse — slow, organic
    float pulse = 0.78 + 0.22 * sin(uTime * 0.55 + vPos.y * 3.0);

    // Crystal body colour — pale limestone
    vec3 baseCol = vec3(0.83, 0.80, 0.74);
    vec3 rimCol  = uColor * 1.3;

    vec3 col  = mix(baseCol, rimCol, fresnel * 0.7);
    float alpha = uGrow * (0.75 + fresnel * 0.25) * pulse;
    gl_FragColor = vec4(col, alpha);
  }
`;

// ─── Resin shell (translucent wrapping layer) ─────────────────────────────────
export const resinVertGLSL = /* glsl */ `
  uniform float uTime;
  uniform float uWrap;   // 0..1 resin wrap progress
  varying vec3  vNormal;
  varying vec3  vPos;

  void main() {
    vec3 p = position * (1.04 + uWrap * 0.06);
    vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPos;
    vNormal = normalize(normalMatrix * normal);
    vPos    = p;
  }
`;

export const resinFragGLSL = /* glsl */ `
  uniform float uTime;
  uniform float uWrap;
  varying vec3  vNormal;
  varying vec3  vPos;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vPos);
    float rim = 1.0 - clamp(dot(vNormal, viewDir), 0.0, 1.0);

    // Fresnel transmission look — thicker at edges
    float fresnel = pow(rim, 1.8);

    // Energy pulse radials
    float r    = length(vPos.xz);
    float wave = sin(r * 6.0 - uTime * 1.4) * 0.5 + 0.5;

    // Translucent resin: cream tinted, glass-like
    vec3 col   = mix(vec3(0.92, 0.89, 0.82), vec3(0.6, 0.75, 0.62), fresnel);
    float alpha = uWrap * (0.12 + fresnel * 0.22 + wave * 0.06);
    gl_FragColor = vec4(col, alpha);
  }
`;

// ─── Particle morph (disintegration / reassembly) ─────────────────────────────
export const morphVertGLSL = /* glsl */ `
  attribute float aPhase;
  attribute vec3  aFrom;     // start world position
  attribute vec3  aTo;       // end world position
  attribute float aSize;
  uniform float   uProgress; // 0..1 morph
  uniform float   uTime;
  varying float   vAlpha;

  void main() {
    // Cubic ease
    float t   = uProgress;
    float ease = t * t * (3.0 - 2.0 * t);

    vec3 pos = mix(aFrom, aTo, ease);

    // Mid-arc bulge — particles arc outward at peak
    float arc = sin(ease * 3.14159) * 0.6;
    pos += vec3(sin(aPhase * 6.28) * arc, arc * 0.8, cos(aPhase * 6.28) * arc);

    vec4 mvPos   = modelViewMatrix * vec4(pos, 1.0);
    gl_Position  = projectionMatrix * mvPos;

    float dist   = length(mvPos.xyz);
    gl_PointSize = aSize * (220.0 / max(dist, 0.1));

    // Alpha peaks in mid-flight, fades at start and end
    vAlpha = sin(ease * 3.14159) * 0.9 + 0.1 * (1.0 - abs(ease - 0.5) * 2.0);
  }
`;

export const morphFragGLSL = /* glsl */ `
  varying float vAlpha;
  uniform vec3  uColor;

  void main() {
    vec2  uv = gl_PointCoord * 2.0 - 1.0;
    float d  = dot(uv, uv);
    if (d > 1.0) discard;
    float soft = 1.0 - smoothstep(0.4, 1.0, d);
    gl_FragColor = vec4(uColor, soft * vAlpha * 0.85);
  }
`;

// ─── Living-stone surface shader (R01–R03) ────────────────────────────────────
// A second shell over the stone core. Three uniforms layer cinematically:
//   uReveal  — 0..1 environmental light reveal (R02). Lifts surface texture out
//              of the dark by modulating fresnel + a procedural mineral grain.
//   uCracks  — 0..1 emissive mineral crack lines fade in (R03). Pure GPU value
//              noise ridges, no texture fetch, sage emissive that Bloom catches.
// Cheap: one fbm (4 octaves) + one ridged-noise call. No per-frame allocations.
export const stoneVertGLSL = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vPos;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vec4 mvPos    = viewMatrix * worldPos;
    vNormal   = normalize(normalMatrix * normal);
    vWorldPos = worldPos.xyz;
    vPos      = position;
    gl_Position = projectionMatrix * mvPos;
  }
`;

export const stoneFragGLSL = /* glsl */ `
  uniform float uTime;
  uniform float uReveal;   // 0..1 light reveal (R02)
  uniform float uCracks;   // 0..1 crack emergence (R03)
  uniform vec3  uColor;     // sage rim/crack tint
  uniform vec3  uKeyDir;    // normalized key-light direction
  varying vec3  vNormal;
  varying vec3  vWorldPos;
  varying vec3  vPos;

  // Cheap value noise + fbm (no texture, deterministic).
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float vnoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                   mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                   mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  // 3-octave fbm — one octave fewer than before; visually indistinguishable on
  // this surface but ~25% cheaper per call.
  float fbm(vec3 p) {
    float a = 0.0, w = 0.5;
    for (int i = 0; i < 3; i++) { a += w * vnoise(p); p *= 2.02; w *= 0.5; }
    return a;
  }

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float ndv = clamp(dot(normalize(vNormal), viewDir), 0.0, 1.0);
    float rim = pow(1.0 - ndv, 2.6);

    // Mineral grain — single fbm (collapsed from two), and skipped entirely
    // until light begins revealing the surface. The branch is uniform-coherent
    // (uReveal is the same for every fragment) so there is no divergence cost.
    float surface = 0.0;
    if (uReveal > 0.001) {
      surface = fbm(vPos * 3.8) * uReveal;
    }

    // Key-light lambert term, soft.
    float key = clamp(dot(normalize(vNormal), normalize(uKeyDir)), 0.0, 1.0);
    float lit = mix(0.18, 1.0, key) * (0.45 + 0.55 * uReveal);

    // Ridged crack network — emissive sage lines. Only computed once cracks
    // start fading in (uniform-coherent branch → saves the fbm for R01-R02).
    float cracksGlow = 0.0;
    if (uCracks > 0.001) {
      float ridge = fbm(vPos * 5.5 + vec3(0.0, uTime * 0.02, 0.0));
      float lines = 1.0 - smoothstep(0.0, 0.06, abs(ridge - 0.52));
      cracksGlow = lines * uCracks * (0.6 + 0.4 * sin(uTime * 0.4 + ridge * 8.0));
    }

    vec3 baseCol = mix(vec3(0.30, 0.31, 0.29), vec3(0.74, 0.73, 0.68), surface) * lit;
    vec3 rimCol  = uColor * rim * (0.4 + 0.6 * uReveal);
    vec3 crackCol = uColor * 1.6 * cracksGlow;

    vec3 col = baseCol + rimCol + crackCol;
    // Slightly transparent so the GLB/procedural core PBR reads underneath.
    float alpha = clamp(0.10 + surface * 0.35 + rim * 0.5 + cracksGlow, 0.0, 0.92);
    gl_FragColor = vec4(col, alpha);
  }
`;

// ─── Inner calcium glow (R06) ─────────────────────────────────────────────────
// An inner shell (slightly smaller than the stone) whose crystalline glow grows
// from the core outward. Reuses the crystal facet feel but reads as "internal".
export const calciumVertGLSL = /* glsl */ `
  uniform float uGrow;   // 0..1 inner structure emergence
  uniform float uTime;
  varying vec3  vNormal;
  varying vec3  vPos;
  void main() {
    vec3 p = position;
    float disp = sin(p.x * 5.0 + uTime * 0.25) * cos(p.y * 4.4) * sin(p.z * 5.2);
    p += normal * disp * 0.05 * uGrow;
    p *= 0.55 + 0.42 * uGrow;   // grows outward from the core
    vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPos;
    vNormal = normalize(normalMatrix * normal);
    vPos    = p;
  }
`;

export const calciumFragGLSL = /* glsl */ `
  uniform float uGrow;
  uniform float uTime;
  uniform vec3  uColor;
  varying vec3  vNormal;
  varying vec3  vPos;
  void main() {
    vec3 viewDir = normalize(cameraPosition - vPos);
    float rim = 1.0 - clamp(dot(normalize(vNormal), viewDir), 0.0, 1.0);
    float fresnel = pow(rim, 2.2);
    float pulse = 0.7 + 0.3 * sin(uTime * 0.5 + vPos.y * 4.0);
    // Crystalline cream→sage inner light.
    vec3 col = mix(vec3(0.86, 0.84, 0.78), uColor * 1.4, fresnel);
    float alpha = uGrow * (0.18 + fresnel * 0.55) * pulse;
    gl_FragColor = vec4(col, alpha);
  }
`;

// ─── Molecular lattice points (R08–R09) ───────────────────────────────────────
// A point cloud arranged on a jittered grid that "orders" as uOrder→1: the
// jitter collapses toward an exact lattice. Soft additive sage dots + faint
// inter-node shimmer. uReveal gates overall opacity.
export const latticeVertGLSL = /* glsl */ `
  attribute vec3  aOrdered;   // exact lattice position
  attribute vec3  aJitter;    // disordered offset
  attribute float aPhase;
  attribute float aSize;
  uniform float   uOrder;     // 0=disordered 1=ordered
  uniform float   uTime;
  varying float   vAlpha;
  void main() {
    float e = uOrder * uOrder * (3.0 - 2.0 * uOrder);
    vec3 pos = mix(aOrdered + aJitter, aOrdered, e);
    // gentle breathing drift while disordered
    pos += (1.0 - e) * vec3(
      sin(uTime * 0.3 + aPhase * 6.28) * 0.12,
      cos(uTime * 0.27 + aPhase * 4.0) * 0.12,
      sin(uTime * 0.21 + aPhase * 7.0) * 0.12
    );
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;
    float dist = length(mvPos.xyz);
    gl_PointSize = aSize * (200.0 / max(dist, 0.1));
    vAlpha = 0.4 + 0.6 * e;
  }
`;

export const latticeFragGLSL = /* glsl */ `
  uniform vec3  uColor;
  uniform float uReveal;
  varying float vAlpha;
  void main() {
    vec2  uv = gl_PointCoord * 2.0 - 1.0;
    float d  = dot(uv, uv);
    if (d > 1.0) discard;
    float soft = 1.0 - smoothstep(0.2, 1.0, d);
    gl_FragColor = vec4(uColor, soft * vAlpha * uReveal * 0.8);
  }
`;

// ─── Limestone dust points (always-on, R01+) ──────────────────────────────────
// Tiny slow-rising motes that orbit the stone — the "living" environmental VFX.
export const dustVertGLSL = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  uniform float   uTime;
  varying float   vAlpha;
  varying float   vPhase;
  void main() {
    vec3 pos = position;
    float t = uTime * 0.08 + aPhase * 6.28;
    pos.x += sin(t * 0.9 + aPhase * 5.0) * 0.22;
    pos.y += t * 0.05;                 // slow rise
    pos.y = mod(pos.y + 3.0, 6.0) - 3.0; // wrap so the field never empties
    pos.z += cos(t * 0.7 + aPhase * 3.0) * 0.22;
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;
    float dist = length(mvPos.xyz);
    gl_PointSize = aSize * (140.0 / max(dist, 0.1));
    vAlpha = clamp(1.1 - dist * 0.1, 0.0, 1.0);
    vPhase = aPhase;
  }
`;

export const dustFragGLSL = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vPhase;
  void main() {
    vec2  uv = gl_PointCoord * 2.0 - 1.0;
    float d  = dot(uv, uv);
    if (d > 1.0) discard;
    float soft = 1.0 - smoothstep(0.3, 1.0, d);
    float twinkle = 0.6 + 0.4 * sin(uTime * 0.6 + vPhase * 6.28);
    vec3 col = vec3(0.82, 0.80, 0.74);
    gl_FragColor = vec4(col, soft * vAlpha * twinkle * uOpacity * 0.5);
  }
`;
