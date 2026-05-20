import { Suspense, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";

const ACCENT = "#9aa893";
type ScrollRef = RefObject<number>;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
// progress within [from,to] mapped to 0..1
const seg = (p: number, from: number, to: number) => clamp((p - from) / (to - from));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

function Core({ scroll }: { scroll: ScrollRef }) {
  const group = useRef<THREE.Group>(null);
  const shells = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);

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

  useFrame((state, delta) => {
    const p = scroll.current ?? 0;
    const g = group.current;
    if (!g) return;

    // continuous + scroll rotation (faster around stage 3)
    const spin = 0.1 + seg(p, 0.5, 0.72) * 0.5;
    g.rotation.y += delta * spin;
    g.rotation.x = Math.sin(p * Math.PI) * 0.18;

    // Stage 1 (0..0.25): form / scale up from a seed
    const form = ease(seg(p, 0, 0.25));
    const baseScale = 0.35 + form * 0.65;
    g.scale.setScalar(baseScale);

    // cursor parallax (subtle)
    g.position.x += (state.pointer.x * 0.25 - g.position.x) * 0.04;

    // Stage 2 (0.25..0.5): shells separate outward, then merge back by 0.55
    const open = seg(p, 0.28, 0.5) * (1 - seg(p, 0.5, 0.62));
    if (shells.current) {
      shells.current.children.forEach((child, i) => {
        const m = child as THREE.Mesh;
        const k = 1 + open * (0.18 + i * 0.16);
        m.scale.setScalar(k);
        const mat = m.material as THREE.MeshBasicMaterial;
        mat.opacity = open * (0.5 - i * 0.1);
      });
    }

    // Stage 4 (0.75..1): rings tilt into a flat aligned orbit + fade in
    const settle = ease(seg(p, 0.72, 1));
    if (rings.current) {
      rings.current.rotation.x = (1 - settle) * 1.1 + Math.PI / 2 * settle;
      rings.current.rotation.z += delta * 0.15;
      rings.current.children.forEach((child) => {
        const m = child as THREE.Mesh;
        (m.material as THREE.MeshBasicMaterial).opacity = 0.12 + settle * 0.35;
      });
    }
  });

  return (
    <group ref={group}>
      {/* main mineral core */}
      <mesh geometry={geo}>
        <meshStandardMaterial
          color="#e8e4da"
          metalness={0.12}
          roughness={0.5}
          flatShading
          emissive={ACCENT}
          emissiveIntensity={0.06}
        />
      </mesh>
      {/* inner glow seed */}
      <mesh scale={0.6}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.18} />
      </mesh>
      {/* engineered shells (separate in stage 2) */}
      <group ref={shells}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} geometry={geo}>
            <meshBasicMaterial color={i === 1 ? "#cfcabd" : ACCENT} wireframe transparent opacity={0} />
          </mesh>
        ))}
      </group>
      {/* technical rings (align in stage 4) */}
      <group ref={rings}>
        {[2.5, 2.9, 3.3].map((r, i) => (
          <mesh key={r} rotation={[0, 0, (i * Math.PI) / 5]}>
            <torusGeometry args={[r, 0.012, 8, 120]} />
            <meshBasicMaterial color={ACCENT} transparent opacity={0.12} />
          </mesh>
        ))}
      </group>
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
      <Core scroll={scroll} />
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
      <Suspense fallback={null}>
        <Scene scroll={scroll} />
      </Suspense>
    </Canvas>
  );
}
