import { Suspense, useRef, useEffect, useMemo, useState, type ReactNode } from "react";
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
 * VideoCube: A 3D WebGL Box Geometry playing a video texture on its faces
 * with physical glass characteristics, allowing the limestone model inside to shine through.
 */
function VideoCube({ videoUrl, active }: { videoUrl: string; active: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Initialize offscreen video element
  const [video] = useState(() => {
    const el = document.createElement("video");
    el.src = videoUrl;
    el.muted = true;
    el.loop = true;
    el.playsInline = true;
    el.crossOrigin = "anonymous";
    return el;
  });

  // Play/pause based on canvas visibility
  useEffect(() => {
    if (active) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [video, active]);

  // Clean up resource only on unmount
  useEffect(() => {
    return () => {
      video.pause();
      video.src = "";
      video.load();
    };
  }, [video]);

  // Feed HTML5 video into WebGL VideoTexture
  const texture = useMemo(() => {
    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [video]);

  // Slow turntable rotation of the enclosing cube
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.12;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.04;
      meshRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.1) * 0.04;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[3.2, 3.2, 3.2]} />
      <meshPhysicalMaterial
        map={texture}
        clearcoat={0.9}
        clearcoatRoughness={0.12}
        transmission={0.8} // High physical glass transparency
        thickness={0.8} // Glass thickness
        roughness={0.15}
        metalness={0.05}
        transparent
        opacity={0.62}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/**
 * Small detailed LIMEX model for the Material-Intelligence orb — sized to sit
 * INSIDE the section's two rings. Upgraded to float inside a 3D Glass Video Cube.
 */
export default function LimexOrb() {
  const { canvasRef, frameloop } = useFrameloopOnVisible();
  const tier = useDeviceTier();
  const base = import.meta.env.BASE_URL;
  const videoUrl = `${base}assets/videos/product.mp4`;

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

      {/* Glass Video Cube containing the model inside */}
      <VideoCube videoUrl={videoUrl} active={frameloop === "always"} />

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
