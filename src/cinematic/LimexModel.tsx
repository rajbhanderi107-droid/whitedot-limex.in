import { Component, useMemo, useRef, useEffect, type ReactNode, type RefObject } from "react";
import { useGLTF, Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDeviceTier } from "./useDeviceTier";
import { ACCENT, CREAM, RevealController, turntableDelta } from "./heroCinematics";

// Real limestone photogrammetry scan (Draco-compressed GLB).
// Drop a replacement at public/models/limex-core.glb to swap it everywhere.
export const MODEL_URL = `${import.meta.env.BASE_URL}models/limex-core.glb`;

// ─── Fresnel + emissive-vein shader material ──────────────────────────────────
// Applied as a second "layer" mesh (slightly enlarged) so the GLB's own PBR
// material is untouched and the overlay adds the cinematic mineral glow.
//
// Vertex shader computes fresnel from worldNormal · worldViewDir.
// Fragment outputs a sage-tinted rim glow that only shows on silhouette edges.
const fresnelVertGLSL = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vec4 mvPos    = viewMatrix * worldPos;
    vNormal   = normalize(normalMatrix * normal);
    vViewDir  = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const fresnelFragGLSL = /* glsl */`
  uniform float uTime;
  uniform vec3  uColor;
  uniform float uPower;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float rim = 1.0 - clamp(dot(vNormal, vViewDir), 0.0, 1.0);
    // Sharp cubic fresnel — crisp mineral edge, not wide halo
    float fresnel = pow(rim, uPower);
    // Slow pulsing vein shimmer — organic, not electronic. A travelling
    // brightness band drifts up the edge so the rim "catches" moving light.
    float pulse = 0.82 + 0.18 * sin(uTime * 0.6);
    float band  = 0.85 + 0.15 * sin(uTime * 0.35 + rim * 6.2831);
    float alpha = fresnel * uIntensity * pulse * band;
    // Push emissive past 1.0 at the brightest edge so Bloom blooms the rim.
    gl_FragColor = vec4(uColor * (1.0 + fresnel * 0.6), alpha);
  }
`;

/** Glowing sage fresnel rim layer — wraps the model at a tiny scale offset.
 *  `flareRef` carries the title-card reveal flare (0..1); when present it
 *  briefly boosts rim intensity on first entry so Bloom blooms a soft flare
 *  that resolves into the steady idle glow. */
function FresnelRim({
  geometry,
  flareRef,
}: {
  geometry: THREE.BufferGeometry;
  flareRef: RefObject<number>;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTime:      { value: 0 },
    uColor:     { value: new THREE.Color("#ffffff") },
    uPower:     { value: 3.2 },
    uIntensity: { value: 0.85 },
  }), []);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.elapsedTime;
      // Idle 0.85 + up to +1.1 flare on the reveal → blooms, then settles.
      matRef.current.uniforms.uIntensity.value = 0.85 + (flareRef.current ?? 0) * 1.1;
    }
  });

  return (
    <mesh geometry={geometry} scale={1.018}>
      <shaderMaterial
        ref={matRef}
        vertexShader={fresnelVertGLSL}
        fragmentShader={fresnelFragGLSL}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.FrontSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function SaturnRing({ size, count = 120 }: { size: number; count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  // Procedural neon white glow texture
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      // High contrast neon white gradient: bright core, soft white halo
      grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
      grad.addColorStop(0.2, "rgba(255, 255, 255, 1.0)");
      grad.addColorStop(0.5, "rgba(255, 255, 255, 0.6)");
      grad.addColorStop(0.85, "rgba(255, 255, 255, 0.12)");
      grad.addColorStop(1, "rgba(255, 255, 255, 0.0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      // Concentric circular distribution (from 0.85 to 1.25 times size)
      const r = size * (0.85 + Math.random() * 0.4);
      const theta = Math.random() * Math.PI * 2;
      // Keplerian-like speed: slower further out
      const speed = (0.24 + Math.random() * 0.06) / Math.sqrt(r);
      const y = (Math.random() - 0.5) * size * 0.025; // extremely flat ring
      arr.push({ r, theta, speed, y });
    }
    return arr;
  }, [count, size]);

  const posAttr = useMemo(() => {
    const arr = new Float32Array(count * 3);
    return new THREE.BufferAttribute(arr, 3);
  }, [count]);

  useEffect(() => {
    if (geometryRef.current) {
      geometryRef.current.setAttribute("position", posAttr);
    }
  }, [posAttr]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const positions = posAttr.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      // Increment angle (concentric, non-intersecting orbits)
      p.theta += p.speed * delta * 0.9;
      
      const x = p.r * Math.cos(p.theta);
      const z = p.r * Math.sin(p.theta);
      
      const idx = i * 3;
      positions[idx] = x;
      positions[idx + 1] = p.y;
      positions[idx + 2] = z;
    }
    
    posAttr.needsUpdate = true;
  });

  return (
    <group rotation={[Math.PI / 9, 0, Math.PI / 18]}>
      <points ref={pointsRef}>
        <bufferGeometry ref={geometryRef} />
        <pointsMaterial
          map={texture}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          size={0.15 * (size / 3)} // size-relative particles
          sizeAttenuation={true}
          color="#ffffff"
          opacity={0.9}
        />
      </points>
    </group>
  );
}

/** Loads the limestone GLB, normalized to ~`size` units on its largest axis,
 *  centered at the origin, with shadows enabled. Shared by every LIMEX scene. */
export function LimexModel({ size = 3 }: { size?: number }) {
  const { scene } = useGLTF(MODEL_URL, true);
  const tier = useDeviceTier();
  const isLowTier = tier === "low";

  const { obj, mergedGeo } = useMemo(() => {
    const clone = scene.clone();
    const box = new THREE.Box3().setFromObject(clone);
    const dims = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(dims.x, dims.y, dims.z) || 1;
    const k = size / maxDim;
    clone.scale.setScalar(k);
    const center = box.getCenter(new THREE.Vector3()).multiplyScalar(k);
    clone.position.sub(center);

    // Enhance each mesh: PBR micro-detail + faint emissive mineral veins
    let firstGeo: THREE.BufferGeometry | null = null;
    clone.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = !isLowTier;
        m.receiveShadow = !isLowTier;
        // Capture first mesh geo for the fresnel layer (approximate shell)
        if (!firstGeo && m.geometry) firstGeo = m.geometry;
        // Upgrade material with mineral PBR properties + emissive veins.
        // Promote MeshStandardMaterial → MeshPhysicalMaterial to get a thin
        // clearcoat + fabric-like sheen that reads as polished wet limestone
        // (a faint mineral lacquer), never plastic/metal.
        if (m.material) {
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          const upgraded = mats.map((mat) => {
            if (isLowTier) {
              if (mat instanceof THREE.MeshStandardMaterial) {
                mat.color.setRGB(1.0, 1.0, 1.0);
                mat.roughness = Math.min(mat.roughness ?? 0.85, 0.7);
                mat.metalness = Math.max(mat.metalness ?? 0, 0.04);
                mat.emissive = new THREE.Color("#ffffff");
                mat.emissiveIntensity = 0.01;
                mat.needsUpdate = true;
              }
              return mat;
            }
            if (mat instanceof THREE.MeshStandardMaterial && !(mat instanceof THREE.MeshPhysicalMaterial)) {
              // Manual property transfer instead of phys.copy(mat) — copy()
              // fails because MeshPhysicalMaterial.copy() reads physical-only
              // properties (specularColor, attenuationColor) that don't exist
              // on MeshStandardMaterial, causing Vector3.copy(undefined).
              const phys = new THREE.MeshPhysicalMaterial({
                map: mat.map,
                color: new THREE.Color("#ffffff"),
                normalMap: mat.normalMap,
                normalScale: mat.normalScale?.clone(),
                roughnessMap: mat.roughnessMap,
                metalnessMap: mat.metalnessMap,
                aoMap: mat.aoMap,
                aoMapIntensity: mat.aoMapIntensity,
                envMap: mat.envMap,
                envMapIntensity: mat.envMapIntensity,
                side: mat.side,
                transparent: mat.transparent,
                opacity: mat.opacity,
                alphaMap: mat.alphaMap,
              });
              // Limestone micro-roughness: slightly reduce default roughness
              phys.roughness = Math.min(mat.roughness ?? 0.85, 0.7);
              phys.metalness = Math.max(mat.metalness ?? 0, 0.04);
              // Thin clearcoat: a polished mineral sheen catch on highlights.
              phys.clearcoat = 0.5;
              phys.clearcoatRoughness = 0.62;
              // Sheen: soft white sheen
              phys.sheen = 0.55;
              phys.sheenRoughness = 0.85;
              phys.sheenColor = new THREE.Color("#ffffff");
              phys.emissive = new THREE.Color("#ffffff");
              phys.emissiveIntensity = 0.02;

              // Inject shader code to desaturate/brighten texture
              phys.onBeforeCompile = (shader) => {
                shader.fragmentShader = shader.fragmentShader.replace(
                  "#include <map_fragment>",
                  `
                  #ifdef USE_MAP
                    vec4 texelColor = texture2D( map, vMapUv );
                    float luma = dot(texelColor.rgb, vec3(0.299, 0.587, 0.114));
                    texelColor.rgb = vec3(0.72 + luma * 0.28);
                    diffuseColor *= texelColor;
                  #endif
                  `
                );
              };

              phys.needsUpdate = true;
              return phys;
            }
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.color.setRGB(1.0, 1.0, 1.0);
              mat.roughness = Math.min(mat.roughness ?? 0.85, 0.7);
              mat.metalness = Math.max(mat.metalness ?? 0, 0.04);
              mat.emissive = new THREE.Color("#ffffff");
              mat.emissiveIntensity = 0.02;

              mat.onBeforeCompile = (shader) => {
                shader.fragmentShader = shader.fragmentShader.replace(
                  "#include <map_fragment>",
                  `
                  #ifdef USE_MAP
                    vec4 texelColor = texture2D( map, vMapUv );
                    float luma = dot(texelColor.rgb, vec3(0.299, 0.587, 0.114));
                    texelColor.rgb = vec3(0.72 + luma * 0.28);
                    diffuseColor *= texelColor;
                  #endif
                  `
                );
              };

              mat.needsUpdate = true;
            }
            return mat;
          });
          m.material = Array.isArray(m.material) ? upgraded : upgraded[0];
        }
      }
    });

    // Build a merged representative sphere geometry for the fresnel shell
    // if no mesh geo found — fallback is graceful
    const fresnelGeo = firstGeo ?? new THREE.SphereGeometry(size * 0.48, 32, 24);

    return { obj: clone, mergedGeo: fresnelGeo };
  }, [scene, size, isLowTier]);

  // Cinematic turntable + title-card reveal. Inner group so it composes UNDER
  // the Float/parallax/scroll transforms owned by the hero scene.
  const turntable = useRef<THREE.Group>(null);
  const reveal = useRef<THREE.Group>(null);
  const revealCtl = useRef(new RevealController(1.2));
  // Live flare amount (0..1) read by FresnelRim each frame — no re-render.
  const flareRef = useRef(0);

  useFrame(({ clock }, delta) => {
    if (turntable.current) {
      turntable.current.rotation.y += turntableDelta(clock.elapsedTime, delta);
    }
    if (!revealCtl.current.done) {
      const { scale, flare } = revealCtl.current.tick(delta);
      if (reveal.current) reveal.current.scale.setScalar(scale);
      flareRef.current = flare;
    } else if (flareRef.current !== 0) {
      flareRef.current = 0;
    }
  });

  return (
    <group ref={reveal}>
      {/* Turntable spins only the solid form + its rim, so the aura stays put. */}
      <group ref={turntable}>
        <primitive object={obj} />
        {/* Sage fresnel rim — the "born of limestone" mineral edge glow */}
        <FresnelRim geometry={mergedGeo} flareRef={flareRef} />
      </group>

      {/* Close-in particle aura — tight, slow, minimal. Different from the
          outer atmosphere sparkles in the Scene so they read as two depth layers. */}
      <Sparkles
        count={isLowTier ? 6 : 22}
        scale={[size * 0.9, size * 0.85, size * 0.85]}
        size={1.4}
        speed={0.09}
        opacity={0.55}
        color="#ffffff"
      />
      <Sparkles
        count={isLowTier ? 3 : 12}
        scale={[size * 0.6, size * 0.55, size * 0.55]}
        size={2.2}
        speed={0.06}
        opacity={0.32}
        color="#f5f1e8"
      />

      {/* Custom concentric non-intersecting Saturn Ring of neon white glowy particles */}
      <SaturnRing size={size} count={isLowTier ? 36 : 120} />
    </group>
  );
}

/** Procedural calcium-carbonate crystal — default + error-boundary fallback. */
export function ProceduralCrystal({ size = 1.6 }: { size?: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(size, 4);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n = Math.sin(v.x * 3.1) * Math.cos(v.y * 2.7) * Math.sin(v.z * 3.3);
      v.multiplyScalar(1 + n * 0.06);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, [size]);

  const uniforms = useMemo(() => ({
    uTime:      { value: 0 },
    uColor:     { value: new THREE.Color("#ffffff") },
    uPower:     { value: 2.8 },
    uIntensity: { value: 0.9 },
  }), []);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return (
    <>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial
          color="#ffffff"
          metalness={0.12}
          roughness={0.55}
          flatShading
          emissive="#ffffff"
          emissiveIntensity={0.02}
        />
      </mesh>
      {/* Fresnel overlay on the procedural crystal */}
      <mesh geometry={geometry} scale={1.018}>
        <shaderMaterial
          ref={matRef}
          vertexShader={fresnelVertGLSL}
          fragmentShader={fresnelFragGLSL}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.FrontSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Wireframe accent — faint structural grid */}
      <mesh geometry={geometry} scale={1.024}>
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.055} />
      </mesh>
    </>
  );
}

/** Catches a missing/failed GLB and renders the procedural fallback instead. */
export class ModelBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// Warm the cache so the model is ready before the hero mounts.
useGLTF.preload(MODEL_URL, true);
