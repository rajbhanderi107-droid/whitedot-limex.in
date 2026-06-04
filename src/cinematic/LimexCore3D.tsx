import { Suspense, useRef, type ReactNode, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { LimexModel, ProceduralCrystal, ModelBoundary } from "./LimexModel";
import { useFrameloopOnVisible } from "./useFrameloopOnVisible";
import { useDeviceTier } from "./useDeviceTier";

const ACCENT = "#9aa893";

type ScrollRef = RefObject<number>;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, from: number, to: number) => clamp((p - from) / (to - from));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

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

function Scene({ scroll, tier }: { scroll: ScrollRef; tier: string }) {
  const isLowTier = tier === "low";
  return (
    <>
      <fog attach="fog" args={["#181b19", 8, 18]} />
      <ambientLight intensity={0.34} />
      <directionalLight position={[-3, 4, 5]} intensity={1.9} color="#f6f7f4" />
      <directionalLight position={[5, -2, -3]} intensity={1.8} color={ACCENT} />
      <pointLight position={[0, -3, 4]} intensity={0.9} color="#cfcabd" />
      <CoreGroup scroll={scroll}>
        <ModelBoundary fallback={<ProceduralCrystal size={1.45} />}>
          <Suspense fallback={<ProceduralCrystal size={1.45} />}>
            <LimexModel size={3} />
          </Suspense>
        </ModelBoundary>
      </CoreGroup>
      <Rings scroll={scroll} />
      <Sparkles count={isLowTier ? 25 : 70} scale={[9, 7, 5]} size={2.2} speed={0.25} opacity={0.5} color={ACCENT} />
    </>
  );
}

export default function LimexCore3D({ scroll }: { scroll: ScrollRef }) {
  const { canvasRef, frameloop } = useFrameloopOnVisible();
  const tier = useDeviceTier();
  return (
    <Canvas
      ref={canvasRef}
      frameloop={frameloop}
      className="cine-core-canvas"
      // R3F's inline position:relative collapses the canvas; force the intended fill.
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      dpr={tier === "low" ? 1 : [1, 1.75]}
      gl={{ antialias: tier !== "low", alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 6], fov: 42 }}
    >
      <Scene scroll={scroll} tier={tier} />
    </Canvas>
  );
}
