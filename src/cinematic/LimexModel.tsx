import { Component, useMemo, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const ACCENT = "#9aa893";
// Real limestone photogrammetry scan (Draco-compressed GLB).
// Drop a replacement at public/models/limex-core.glb to swap it everywhere.
export const MODEL_URL = `${import.meta.env.BASE_URL}models/limex-core.glb`;

/** Loads the limestone GLB, normalized to ~`size` units on its largest axis,
 *  centered at the origin, with shadows enabled. Shared by every LIMEX scene. */
export function LimexModel({ size = 3 }: { size?: number }) {
  const { scene } = useGLTF(MODEL_URL, true);
  const obj = useMemo(() => {
    const clone = scene.clone();
    const box = new THREE.Box3().setFromObject(clone);
    const dims = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(dims.x, dims.y, dims.z) || 1;
    const k = size / maxDim;
    clone.scale.setScalar(k);
    const center = box.getCenter(new THREE.Vector3()).multiplyScalar(k);
    clone.position.sub(center);
    clone.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    return clone;
  }, [scene, size]);
  return <primitive object={obj} />;
}

/** Procedural calcium-carbonate crystal — default + error-boundary fallback. */
export function ProceduralCrystal({ size = 1.6 }: { size?: number }) {
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
  return (
    <>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial
          color="#dcd9cf"
          metalness={0.14}
          roughness={0.52}
          flatShading
          emissive={ACCENT}
          emissiveIntensity={0.05}
        />
      </mesh>
      <mesh geometry={geometry} scale={1.012}>
        <meshBasicMaterial color={ACCENT} wireframe transparent opacity={0.07} />
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
