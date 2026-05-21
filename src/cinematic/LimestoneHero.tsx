import { Suspense, useEffect, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree, type ThreeElements } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ChromaticAberration, DepthOfField, SMAA } from "@react-three/postprocessing";
import { Vector2 } from "three";
import * as THREE from "three";
import { LimexModel, ProceduralCrystal, ModelBoundary } from "./LimexModel";

const ACCENT = "#9aa893";
const CREAM = "#f5f1e8";

// Pre-allocate once — zero per-frame GC
const _caOffset = new Vector2(0.0005, 0.00025);

// Desktop: model sits clearly in the right ~55% of viewport.
// The camera's narrow FOV (42°) at z=6 gives a frustum half-width of about
// 6 * tan(21°) ≈ 2.3 units at z=0, so x=2.2 puts the model core comfortably
// in the right-center of the right column, well away from the left copy block.
const DESKTOP_X = 2.2;
const MOBILE_X = 0.0;

type ScrollRef = RefObject<number>;

/**
 * Real limestone scan suspended in cinematic space: idle spin, cursor parallax,
 * and scroll-driven transform.
 *
 * Composition: on desktop the group is INITIALIZED at x=DESKTOP_X (not 0) so
 * the rock appears immediately in the right column — no lerp-from-center pop.
 * On mobile (width < 768) it re-centers and the copy renders above it, so the
 * rock functions as a full-bleed hero backdrop.
 */
function Crystal({ scroll, ...props }: { scroll: ScrollRef } & ThreeElements["group"]) {
  const group = useRef<THREE.Group>(null); // outer: parallax + scroll + composition position
  const spin = useRef<THREE.Group>(null);  // inner: continuous idle rotation

  // Initialise the group's world position to the desktop target immediately,
  // before the first useFrame runs, so there is no frame-0 flash at the origin.
  const { size } = useThree();
  const mobile = size.width < 768;

  useFrame((state, delta) => {
    const p = scroll.current ?? 0;

    if (spin.current) {
      spin.current.rotation.y += delta * 0.09;
    }

    if (group.current) {
      // Cursor parallax — gentle, cinematic inertia
      const px = state.pointer.x * 0.22;
      const py = state.pointer.y * 0.15;
      group.current.rotation.y += (px - group.current.rotation.y) * 0.03;
      group.current.rotation.x += (-py - group.current.rotation.x) * 0.03;

      // Scroll-driven: subtle tilt and descent — keep it stately, not chaotic
      group.current.rotation.z = p * 0.3;
      const s = 1 + p * 0.28;
      group.current.scale.setScalar(s);
      group.current.position.y = -p * 1.0;

      // Composition X: smooth lerp toward the breakpoint target.
      // Fast easing (0.08) so on resize it snaps quickly without jarring.
      const isMob = state.size.width < 768;
      const targetX = isMob ? MOBILE_X : DESKTOP_X;
      group.current.position.x += (targetX - group.current.position.x) * 0.08;
    }
  });

  return (
    // Start the group at the desktop position from frame-0 to prevent the
    // model appearing at the origin before the first useFrame lerp fires.
    <group ref={group} position={[mobile ? MOBILE_X : DESKTOP_X, 0, 0]} {...props}>
      <Float speed={0.9} rotationIntensity={0.2} floatIntensity={0.55}>
        <group ref={spin}>
          <ModelBoundary fallback={<ProceduralCrystal />}>
            <Suspense fallback={<ProceduralCrystal />}>
              <LimexModel size={3.6} />
            </Suspense>
          </ModelBoundary>
        </group>
      </Float>
    </group>
  );
}

/**
 * Camera rig — filmic scroll dolly + soft lookAt that always frames the model.
 *
 * On desktop: camera leans left by -0.5 and looks at x≈1.4 so the rule-of-thirds
 * framing puts the model's centroid at roughly 62% from the left — deeply in the
 * right panel, never touching the copy block.
 * On mobile: camera centred, looks at origin.
 */
function CameraRig({ scroll }: { scroll: ScrollRef }) {
  useFrame((state) => {
    const p = scroll.current ?? 0;
    const isMob = state.size.width < 768;

    // Filmic dolly — push in gently as user scrolls, snappy easing
    state.camera.position.z += (6.2 - p * 1.6 - state.camera.position.z) * 0.05;
    // Slight upward lift on scroll
    state.camera.position.y += (p * 0.5 - state.camera.position.y) * 0.05;

    // On desktop: shift camera x left so it naturally frames the right-column rock.
    // The offset is -0.5 (camera moves left), which shifts the horizon right,
    // making the right-positioned model visually centred in the remaining space.
    const targetCamX = isMob ? 0 : -0.5;
    state.camera.position.x += (targetCamX - state.camera.position.x) * 0.04;

    // lookAt: track toward model's actual world x, with inertia
    const lookX = isMob ? 0 : 1.4;
    state.camera.lookAt(lookX, 0, 0);
  });
  return null;
}

function Scene({ scroll }: { scroll: ScrollRef }) {
  return (
    <>
      <color attach="background" args={["#0b0e0c"]} />
      <fog attach="fog" args={["#0b0e0c", 9, 20]} />

      {/* Ambient — barely-there, let rim lights sculpt the form */}
      <ambientLight intensity={0.12} />

      {/* Key — warm top-right, soft, reads as a skylight on carved stone */}
      <directionalLight position={[4, 8, 4]} intensity={1.8} color="#f0ede6" />

      {/* Primary rim / back light — sage tinted, strong — "born of limestone" glow */}
      <directionalLight position={[-6, 2, -6]} intensity={3.8} color={ACCENT} />

      {/* Counter-rim — cool top-left, defines mineral edge separation */}
      <directionalLight position={[-3, 7, 3]} intensity={1.2} color="#d8e8e0" />

      {/* Cream bounce from below — lifts the underside, stone-on-lightbox feel */}
      <pointLight position={[1.5, -5, 3]} intensity={1.6} color={CREAM} distance={14} decay={2} />

      {/* Deep pine fill — organic, warm, sustainability palette depth */}
      <pointLight position={[5, 3, -5]} intensity={0.6} color="#7a857c" distance={16} decay={2} />

      {/* Accent spot — tight sage glow aimed at the core for emissive vein pop */}
      <pointLight position={[DESKTOP_X, 0, 5]} intensity={0.85} color={ACCENT} distance={9} decay={2} />

      {/* Warm fill from right — lifts the model off the dark background */}
      <pointLight position={[6, 1, 2]} intensity={0.7} color="#e8e2d4" distance={12} decay={2} />

      {/* The limestone — Crystal.useFrame owns the x-position animation */}
      <Crystal scroll={scroll} />

      {/* Mineral particle field — two Sparkles passes for depth layering.
          Offset toward the right so particles inhabit the same space as the model. */}
      <Sparkles
        count={55}
        scale={[10, 7, 7]}
        position={[DESKTOP_X * 0.5, 0, 0]}
        size={1.6}
        speed={0.18}
        opacity={0.38}
        color={ACCENT}
      />
      <Sparkles
        count={28}
        scale={[6, 4, 5]}
        position={[DESKTOP_X * 0.5, 0, 0]}
        size={2.8}
        speed={0.12}
        opacity={0.22}
        color={CREAM}
      />

      <CameraRig scroll={scroll} />

      {/* Post-processing — elegant cinematic stack. SMAA for clean edges.
          Keep resolution moderate: multisampling=0 + SMAA is cheaper than
          native MSAA. DoF runs at resolutionScale=0.5 (half-res bokeh). */}
      <EffectComposer multisampling={0}>
        <SMAA />
        <DepthOfField
          focusDistance={0.018}
          focusRange={0.028}
          bokehScale={2.2}
          resolutionScale={0.5}
        />
        <Bloom
          luminanceThreshold={0.52}
          luminanceSmoothing={0.38}
          intensity={0.62}
          mipmapBlur
        />
        <ChromaticAberration
          offset={_caOffset}
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette
          offset={0.3}
          darkness={0.75}
        />
      </EffectComposer>
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
      dpr={[1, 1.75]}
      gl={{
        antialias: false, // SMAA handles AA; native antialias wastes GPU
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
      }}
      camera={{ position: [0, 0, 6.2], fov: 42 }}
    >
      <Suspense fallback={null}>
        <Scene scroll={scroll} />
      </Suspense>
    </Canvas>
  );
}
