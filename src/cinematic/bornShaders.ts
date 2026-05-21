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
