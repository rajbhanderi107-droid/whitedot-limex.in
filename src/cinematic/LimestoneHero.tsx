import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, type ThreeElements } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";

const ACCENT = "#9aa893";

type ScrollRef = RefObject<number>;

/** Procedural calcium-carbonate crystal: faceted icosahedron with a warm rim,
 *  cursor parallax, and igloo-style scroll-driven transform. */
function Crystal({ scroll, ...props }: { scroll: ScrollRef } & ThreeElements["group"]) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1.6, 4);
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
  }, []);

  useFrame((state, delta) => {
    const p = scroll.current ?? 0;
    if (mesh.current) mesh.current.rotation.y += delta * 0.12;
    if (group.current) {
      const px = state.pointer.x * 0.35;
      const py = state.pointer.y * 0.25;
      group.current.rotation.y += (px - group.current.rotation.y) * 0.04;
      group.current.rotation.x += (-py - group.current.rotation.x) * 0.04;
      // scroll-driven: tilt, grow, and descend as the user scrolls the hero
      group.current.rotation.z = p * 0.5;
      const s = 1 + p * 0.4;
      group.current.scale.setScalar(s);
      group.current.position.y = -p * 1.3;
    }
  });

  return (
    <group ref={group} {...props}>
      <Float speed={1.1} rotationIntensity={0.3} floatIntensity={0.7}>
        <mesh ref={mesh} geometry={geometry} castShadow>
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
      </Float>
    </group>
  );
}

/** Camera dolly tied to scroll — the "igloo" push-in. */
function CameraRig({ scroll }: { scroll: ScrollRef }) {
  useFrame((state) => {
    const p = scroll.current ?? 0;
    state.camera.position.z += (6 - p * 1.9 - state.camera.position.z) * 0.06;
    state.camera.position.y += (p * 0.7 - state.camera.position.y) * 0.06;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

function Scene({ scroll }: { scroll: ScrollRef }) {
  return (
    <>
      <color attach="background" args={["#181b19"]} />
      <fog attach="fog" args={["#181b19", 7, 16]} />
      <ambientLight intensity={0.34} />
      <directionalLight position={[4, 6, 5]} intensity={2.0} color="#f6f7f4" />
      <directionalLight position={[-6, -2, -4]} intensity={2.3} color={ACCENT} />
      <pointLight position={[0, -4, 4]} intensity={1.05} color="#cfcabd" />
      {/* faint pine fill for an organic, sustainable feel */}
      <pointLight position={[3, 3, -3]} intensity={0.5} color="#7a857c" />
      <Crystal scroll={scroll} position={[0, 0, 0]} />
      <Sparkles count={90} scale={[10, 7, 6]} size={2.4} speed={0.3} opacity={0.6} color={ACCENT} />
      <CameraRig scroll={scroll} />
    </>
  );
}

export function LimestoneHero() {
  const scroll = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const h = window.innerHeight || 1;
      scroll.current = Math.min(1, Math.max(0, window.scrollY / h));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Canvas
      className="cine-hero-canvas"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 6], fov: 42 }}
    >
      <Suspense fallback={null}>
        <Scene scroll={scroll} />
      </Suspense>
    </Canvas>
  );
}
