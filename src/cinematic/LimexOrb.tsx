import { Suspense, useRef, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LimexModel, ProceduralCrystal, ModelBoundary } from "./LimexModel";
import { useFrameloopOnVisible } from "./useFrameloopOnVisible";
import { useDeviceTier } from "./useDeviceTier";

const ACCENT = "#9aa893";

function Spin({ children }: { children: ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    const grp = g.current;
    if (!grp) return;
    grp.rotation.y += delta * 0.22;
    grp.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
    grp.position.x += (state.pointer.x * 0.08 - grp.position.x) * 0.05;
  });
  return <group ref={g}>{children}</group>;
}

/**
 * Small detailed LIMEX model for the Material-Intelligence orb — sized to sit
 * INSIDE the section's two rings. Lightweight: alpha canvas, simple lights,
 * no postprocessing. Premium-gated by the caller (falls back to the image).
 */
export default function LimexOrb() {
  const { canvasRef, frameloop } = useFrameloopOnVisible();
  const tier = useDeviceTier();

  return (
    <Canvas
      ref={canvasRef}
      frameloop={frameloop}
      className="cine-mi-orb-canvas"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      dpr={tier === "low" ? 1 : [1, 2]}
      gl={{ antialias: tier !== "low", alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 7.6], fov: 38 }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[-3, 4, 5]} intensity={2.1} color="#f6f7f4" />
      <directionalLight position={[5, -2, -3]} intensity={1.6} color={ACCENT} />
      <pointLight position={[0, -3, 4]} intensity={0.8} color="#cfcabd" />

      <Spin>
        <ModelBoundary fallback={<ProceduralCrystal size={1.0} />}>
          <Suspense fallback={<ProceduralCrystal size={1.0} />}>
            <LimexModel size={2.1} />
          </Suspense>
        </ModelBoundary>
      </Spin>
    </Canvas>
  );
}
