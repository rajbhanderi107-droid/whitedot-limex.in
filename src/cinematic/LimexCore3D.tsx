import {
  Component,
  Suspense,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const ACCENT = "#9aa893";
// Drop your model here (Draco-compressed GLB recommended): public/models/limex-core.glb
const MODEL_URL = `${import.meta.env.BASE_URL}models/limex-core.glb`;

type ScrollRef = RefObject<number>;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, from: number, to: number) => clamp((p - from) / (to - from));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/** Catches a missing/failed GLB and renders the procedural fallback instead. */
class ModelBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Procedural calcium-carbonate crystal (default + fallback). */
function ProceduralMesh() {
  const geo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1.45, 5);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n = Math.sin(v.x * 2.6) * Math.cos(v.y * 2.3) * Math.sin(v.z * 2.9);
      v.multiplyScalar(1 + n * 0.05);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <>
      <mesh geometry={geo}>
        <meshStandardMaterial color="#e8e4da" metalness={0.12} roughness={0.5} flatShading emissive={ACCENT} emissiveIntensity={0.06} />
      </mesh>
      <mesh scale={0.6}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.18} />
      </mesh>
    </>
  );
}

/** User-supplied GLB model, normalized to a consistent size + centered. */
function ModelMesh() {
  const { scene } = useGLTF(MODEL_URL, true);
  const obj = useMemo(() => {
    const clone = scene.clone();
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const k = 3 / maxDim; // normalize largest dimension to ~3 units
    clone.scale.setScalar(k);
    const center = box.getCenter(new THREE.Vector3()).multiplyScalar(k);
    clone.position.sub(center);
    return clone;
  }, [scene]);
  return <primitive object={obj} />;
}

/** Shared scroll-driven group: forms, rotates, parallax, settles. */
function CoreGroup({ scroll, children }: { scroll: ScrollRef; children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    const p = scroll.current ?? 0;
    const g = group.current;
    if (!g) return;
    g.rotation.y += delta * (0.1 + seg(p, 0.5, 0.72) * 0.5);
    g.rotation.x = Math.sin(p * Math.PI) * 0.16;
    const form = ease(seg(p, 0, 0.25));
    const open = seg(p, 0.28, 0.5) * (1 - seg(p, 0.5, 0.62));
    g.scale.setScalar(0.4 + form * 0.6 + open * 0.12);
    g.position.x += (state.pointer.x * 0.25 - g.position.x) * 0.04;
  });
  return <group ref={group}>{children}</group>;
}

function Rings({ scroll }: { scroll: ScrollRef }) {
  const rings = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const p = scroll.current ?? 0;
    const settle = ease(seg(p, 0.72, 1));
    const g = rings.current;
    if (!g) return;
    g.rotation.x = (1 - settle) * 1.1 + (Math.PI / 2) * settle;
    g.rotation.z += delta * 0.15;
    g.children.forEach((c) => {
      ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.12 + settle * 0.35;
    });
  });
  return (
    <group ref={rings}>
      {[2.5, 2.9, 3.3].map((r, i) => (
        <mesh key={r} rotation={[0, 0, (i * Math.PI) / 5]}>
          <torusGeometry args={[r, 0.012, 8, 120]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.12} />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ scroll }: { scroll: ScrollRef }) {
  return (
    <>
      <fog attach="fog" args={["#181b19", 8, 18]} />
      <ambientLight intensity={0.34} />
      <directionalLight position={[-3, 4, 5]} intensity={1.9} color="#f6f7f4" />
      <directionalLight position={[5, -2, -3]} intensity={1.8} color={ACCENT} />
      <pointLight position={[0, -3, 4]} intensity={0.9} color="#cfcabd" />
      <CoreGroup scroll={scroll}>
        <ModelBoundary fallback={<ProceduralMesh />}>
          <Suspense fallback={<ProceduralMesh />}>
            <ModelMesh />
          </Suspense>
        </ModelBoundary>
      </CoreGroup>
      <Rings scroll={scroll} />
      <Sparkles count={70} scale={[9, 7, 5]} size={2.2} speed={0.25} opacity={0.5} color={ACCENT} />
    </>
  );
}

export default function LimexCore3D({ scroll }: { scroll: ScrollRef }) {
  return (
    <Canvas
      className="cine-core-canvas"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 6], fov: 42 }}
    >
      <Scene scroll={scroll} />
    </Canvas>
  );
}
