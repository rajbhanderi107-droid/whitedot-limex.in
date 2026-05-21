import { Component, useMemo, useRef, type ReactNode } from "react";
import { useGLTF, Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const ACCENT = "#9aa893";
const CREAM = "#f5f1e8";

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
    // Slow pulsing vein shimmer — organic, not electronic
    float pulse = 0.82 + 0.18 * sin(uTime * 0.6);
    float alpha = fresnel * uIntensity * pulse;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

/** Glowing sage fresnel rim layer — wraps the model at a tiny scale offset. */
function FresnelRim({ geometry }: { geometry: THREE.BufferGeometry }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTime:      { value: 0 },
    uColor:     { value: new THREE.Color(ACCENT) },
    uPower:     { value: 3.2 },
    uIntensity: { value: 0.85 },
  }), []);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.elapsedTime;
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

/** Loads the limestone GLB, normalized to ~`size` units on its largest axis,
 *  centered at the origin, with shadows enabled. Shared by every LIMEX scene. */
export function LimexModel({ size = 3 }: { size?: number }) {
  const { scene } = useGLTF(MODEL_URL, true);

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
        m.castShadow = true;
        m.receiveShadow = true;
        // Capture first mesh geo for the fresnel layer (approximate shell)
        if (!firstGeo && m.geometry) firstGeo = m.geometry;
        // Upgrade material with mineral PBR properties + emissive veins
        if (m.material) {
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          mats.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              // Limestone micro-roughness: slightly reduce default roughness
              mat.roughness  = Math.min(mat.roughness ?? 0.85, 0.72);
              mat.metalness  = Math.max(mat.metalness ?? 0, 0.06);
              // Faint sage-tinted emissive veins — visible only under the bloom pass
              if (!mat.emissive || mat.emissive.getHex() === 0) {
                mat.emissive = new THREE.Color(ACCENT);
                mat.emissiveIntensity = 0.035;
              }
              mat.needsUpdate = true;
            }
          });
        }
      }
    });

    // Build a merged representative sphere geometry for the fresnel shell
    // if no mesh geo found — fallback is graceful
    const fresnelGeo = firstGeo ?? new THREE.SphereGeometry(size * 0.48, 32, 24);

    return { obj: clone, mergedGeo: fresnelGeo };
  }, [scene, size]);

  return (
    <group>
      <primitive object={obj} />

      {/* Sage fresnel rim — gives the "born of limestone" mineral edge glow */}
      <FresnelRim geometry={mergedGeo} />

      {/* Close-in particle aura — tight, slow, minimal. Different from the
          outer atmosphere sparkles in the Scene so they read as two depth layers. */}
      <Sparkles
        count={22}
        scale={[size * 0.9, size * 0.85, size * 0.85]}
        size={1.4}
        speed={0.09}
        opacity={0.55}
        color={ACCENT}
      />
      <Sparkles
        count={12}
        scale={[size * 0.6, size * 0.55, size * 0.55]}
        size={2.2}
        speed={0.06}
        opacity={0.32}
        color={CREAM}
      />
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
    uColor:     { value: new THREE.Color(ACCENT) },
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
          color="#dcd9cf"
          metalness={0.12}
          roughness={0.55}
          flatShading
          emissive={ACCENT}
          emissiveIntensity={0.06}
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
        <meshBasicMaterial color={ACCENT} wireframe transparent opacity={0.055} />
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
