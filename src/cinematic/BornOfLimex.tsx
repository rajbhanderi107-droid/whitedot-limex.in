/**
 * BORN OF LIMEX — 20-route cinematic scroll-film (Phase 1).
 *
 * Architecture (unchanged core pattern):
 *  - ONE tall wrapper (~1600vh) with a position:sticky, 100vh canvas stage.
 *  - A passive rAF-throttled scroll listener writes a single 0..1 progress ref.
 *  - Everything (camera, per-route uniforms, captions) reads that one ref inside
 *    useFrame / a caption rAF loop — NEVER React state, so no re-render churn.
 *  - ONE <Canvas>, ONE <EffectComposer>. dpr capped [1, 1.75].
 *
 * The story is data-driven by ROUTES + CAM_KEYS in bornRoutes.ts. The scene is a
 * thin renderer that derives a handful of scalar "drivers" each frame:
 *   reveal · cracks · co2 · calcium · sheets · lattice
 * computed by summing the alpha of every route whose `systems` include that
 * subsystem. That keeps transitions cross-blended (no hard cuts) and makes
 * Phase 2+ a pure-data exercise (extend ROUTES, no engine edits).
 *
 * Routes 01–09 are fully realised this phase; 10–20 hold gracefully on the
 * stabilized, ordered stone (so the build is shippable).
 *
 * Tiering: useDeviceTier() → "high" | "low". Low halves particle counts, drops
 * DepthOfField + ChromaticAberration, and skips the env map. Mobile (<480px)
 * also halves counts. The reduced-motion / premium-off path renders BornStatic.
 */

import {
  Suspense,
  useEffect,
  useRef,
  useMemo,
  type RefObject,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  DepthOfField,
  SMAA,
} from "@react-three/postprocessing";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { Vector2 } from "three";
import { LimexModel, ProceduralCrystal, ModelBoundary } from "./LimexModel";
import {
  buildCO2Particles,
  buildCrystalGeometry,
  buildDustParticles,
  buildLatticeGeometry,
} from "./bornGeometry";
import {
  co2VertGLSL,
  co2FragGLSL,
  stoneVertGLSL,
  stoneFragGLSL,
  calciumVertGLSL,
  calciumFragGLSL,
  latticeVertGLSL,
  latticeFragGLSL,
  dustVertGLSL,
  dustFragGLSL,
} from "./bornShaders";
import {
  ROUTES,
  CAM_KEYS,
  ROUTE_COUNT,
  routeAlpha,
  smoothstep,
  type BornSystem,
} from "./bornRoutes";
import { useFrameloopOnVisible } from "./useFrameloopOnVisible";
import { useDeviceTier, type DeviceTier } from "./useDeviceTier";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const ACCENT = "#9aa893";
const CREAM = "#f5f1e8";

// Pre-allocated, reused every frame — ZERO per-frame allocations downstream.
const _caOffset = new Vector2(0.0006, 0.0003);
const _camPos = new THREE.Vector3();
const _camLook = new THREE.Vector3();
const _keyDir = new THREE.Vector3(0.5, 0.8, 0.6).normalize();

// ─── Driver computation ───────────────────────────────────────────────────────
// Sum the alpha of every route that drives a given subsystem → a smooth 0..1
// scalar that crossfades naturally as adjacent routes overlap. Pure math, no
// allocation. Returns the blended weight clamped to 1.
function systemDriver(progress: number, system: BornSystem): number {
  let acc = 0;
  for (let i = 0; i < ROUTE_COUNT; i++) {
    if (ROUTES[i].systems.includes(system)) acc += routeAlpha(progress, i);
  }
  return acc > 1 ? 1 : acc;
}

// First route index whose window contains progress (for ramps within a route).
function localWithin(progress: number, system: BornSystem): number {
  // Progress within the *span* of routes carrying this system — used so an
  // effect can ramp across its multi-route arc (e.g. co2 over R04→R05).
  let lo = 1;
  let hi = 0;
  for (let i = 0; i < ROUTE_COUNT; i++) {
    if (ROUTES[i].systems.includes(system)) {
      lo = Math.min(lo, ROUTES[i].window[0]);
      hi = Math.max(hi, ROUTES[i].window[1]);
    }
  }
  if (hi <= lo) return 0;
  const t = (progress - lo) / (hi - lo);
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

// ─── Camera rig — 20 keyframes, eased, with cheap handheld micro-drift ────────
function CameraRig({ progress }: { progress: RefObject<number> }) {
  useFrame((state) => {
    const p = progress.current ?? 0;
    const fIdx = p * (ROUTE_COUNT - 1); // 0..19
    const segI = Math.floor(Math.min(fIdx, ROUTE_COUNT - 2));
    const segT = smoothstep(fIdx - segI);

    const a = CAM_KEYS[segI];
    const b = CAM_KEYS[segI + 1];

    _camPos.set(
      a.pos[0] + (b.pos[0] - a.pos[0]) * segT,
      a.pos[1] + (b.pos[1] - a.pos[1]) * segT,
      a.pos[2] + (b.pos[2] - a.pos[2]) * segT,
    );
    _camLook.set(
      a.look[0] + (b.look[0] - a.look[0]) * segT,
      a.look[1] + (b.look[1] - a.look[1]) * segT,
      a.look[2] + (b.look[2] - a.look[2]) * segT,
    );

    // Handheld micro-drift — slow, sub-pixel, must not fight the dolly.
    const t = state.clock.elapsedTime;
    _camPos.x += Math.sin(t * 0.21) * 0.05 + Math.sin(t * 0.07) * 0.03;
    _camPos.y += Math.cos(t * 0.17) * 0.04;

    state.camera.position.lerp(_camPos, 0.045);
    state.camera.lookAt(_camLook);
  });
  return null;
}

// ─── Living stone — always alive (rotation + breathing + scroll-reactive) ─────
// Wraps the GLB core (procedural fallback) with a surface shell shader that
// reveals texture (R02) + emissive cracks (R03), an inner calcium glow shell
// (R06), and a thin sheet-split group (R07). The whole group breathes + rotates.
function LivingStone({ progress }: { progress: RefObject<number> }) {
  const breatheRef = useRef<THREE.Group>(null); // scale breathing
  const spinRef = useRef<THREE.Group>(null); // slow rotation
  const stoneMat = useRef<THREE.ShaderMaterial>(null);
  const calciumMat = useRef<THREE.ShaderMaterial>(null);
  const sheetsRef = useRef<THREE.Group>(null);

  // Shell geometry approximates the core silhouette (the GLB's exact mesh isn't
  // needed for the additive overlay — a faceted icosphere reads as mineral).
  const shellGeo = useMemo(() => buildCrystalGeometry(1.62), []);
  const innerGeo = useMemo(() => buildCrystalGeometry(1.5), []);

  const stoneUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uCracks: { value: 0 },
      uColor: { value: new THREE.Color(ACCENT) },
      uKeyDir: { value: _keyDir.clone() },
    }),
    [],
  );
  const calciumUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uGrow: { value: 0 },
      uColor: { value: new THREE.Color(ACCENT) },
    }),
    [],
  );

  // Three thin sheet clones offset along Y, eased apart for R07.
  const SHEETS = 3;

  useEffect(() => {
    return () => {
      shellGeo.dispose();
      innerGeo.dispose();
    };
  }, [shellGeo, innerGeo]);

  useFrame(({ clock }) => {
    const p = progress.current ?? 0;
    const t = clock.elapsedTime;

    const reveal = systemDriver(p, "light");
    const cracks = systemDriver(p, "cracks");
    const calcium = systemDriver(p, "calcium");
    const sheets = systemDriver(p, "sheets");

    if (stoneMat.current) {
      stoneMat.current.uniforms.uTime.value = t;
      stoneMat.current.uniforms.uReveal.value = reveal;
      stoneMat.current.uniforms.uCracks.value = cracks;
    }
    if (calciumMat.current) {
      calciumMat.current.uniforms.uTime.value = t;
      calciumMat.current.uniforms.uGrow.value = calcium;
    }

    if (spinRef.current) {
      // Always-on slow rotation; subtly faster while the stone "works".
      spinRef.current.rotation.y += 0.0018 + calcium * 0.0012;
      spinRef.current.rotation.x = Math.sin(t * 0.15) * 0.05;
    }
    if (breatheRef.current) {
      // Subtle breathing + a gentle scroll-reactive lift through the arc.
      const breathe = 1 + Math.sin(t * 0.6) * 0.012;
      breatheRef.current.scale.setScalar(breathe);
      breatheRef.current.position.y = Math.sin(t * 0.4) * 0.06;
    }
    if (sheetsRef.current) {
      sheetsRef.current.visible = sheets > 0.01;
      const e = smoothstep(sheets);
      const kids = sheetsRef.current.children;
      for (let i = 0; i < kids.length; i++) {
        const offset = (i - (SHEETS - 1) / 2) * e * 0.55;
        kids[i].position.y = offset;
        const m = (kids[i] as THREE.Mesh).material as THREE.Material & {
          opacity: number;
        };
        if (m) m.opacity = 0.5 * sheets;
      }
    }
  });

  return (
    <group ref={breatheRef}>
      <group ref={spinRef}>
        {/* GLB core (procedural crystal fallback) — the always-present stone. */}
        <ModelBoundary fallback={<ProceduralCrystal size={1.6} />}>
          <Suspense fallback={<ProceduralCrystal size={1.6} />}>
            <LimexModel size={3.0} />
          </Suspense>
        </ModelBoundary>

        {/* Surface shell — light reveal (R02) + emissive cracks (R03). */}
        <mesh geometry={shellGeo}>
          <shaderMaterial
            ref={stoneMat}
            vertexShader={stoneVertGLSL}
            fragmentShader={stoneFragGLSL}
            uniforms={stoneUniforms}
            transparent
            depthWrite={false}
            side={THREE.FrontSide}
          />
        </mesh>

        {/* Inner calcium glow (R06). */}
        <mesh geometry={innerGeo}>
          <shaderMaterial
            ref={calciumMat}
            vertexShader={calciumVertGLSL}
            fragmentShader={calciumFragGLSL}
            uniforms={calciumUniforms}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Layered mineral sheets (R07) — thin offset slices of the shell. */}
        <group ref={sheetsRef} visible={false}>
          {Array.from({ length: SHEETS }).map((_, i) => (
            <mesh key={i} geometry={shellGeo} scale={[1.04, 0.12, 1.04]}>
              <meshStandardMaterial
                color="#cfcabd"
                roughness={0.5}
                metalness={0.06}
                emissive={ACCENT}
                emissiveIntensity={0.05}
                transparent
                opacity={0}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

// ─── Limestone dust — always-on environmental VFX ─────────────────────────────
function DustField({ progress, tier, isMobile }: { progress: RefObject<number>; tier: DeviceTier; isMobile: boolean }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const count = (tier === "low" || isMobile) ? 70 : 140;
  const geometry = useMemo(() => buildDustParticles(count), [count]);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uOpacity: { value: 1 } }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={matRef}
        vertexShader={dustVertGLSL}
        fragmentShader={dustFragGLSL}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── CO₂ orbit + absorption (R04–R05) ─────────────────────────────────────────
function CO2Orbit({ progress, tier, isMobile }: { progress: RefObject<number>; tier: DeviceTier; isMobile: boolean }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const count = (tier === "low" || isMobile) ? 280 : 560;
  const { geometry } = useMemo(() => buildCO2Particles(count), [count]);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uGather: { value: 0 }, uProgress: { value: 0 } }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }) => {
    const p = progress.current ?? 0;
    const co2 = systemDriver(p, "co2");
    // Gather (absorption) ramps over the *back half* of the co2 arc → R05.
    const arc = localWithin(p, "co2");
    const gather = smoothstep(Math.max(0, (arc - 0.5) / 0.5));

    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.elapsedTime;
      matRef.current.uniforms.uGather.value = gather;
      matRef.current.uniforms.uProgress.value = co2;
      matRef.current.opacity = co2;
    }
    if (groupRef.current) {
      groupRef.current.visible = co2 > 0.01;
      // Slow orbital rotation of the whole CO₂ shell around the stone.
      groupRef.current.rotation.y += 0.0025;
      groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.1) * 0.15;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <points geometry={geometry}>
        <shaderMaterial
          ref={matRef}
          vertexShader={co2VertGLSL}
          fragmentShader={co2FragGLSL}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

// ─── Molecular lattice (R08–R09) ──────────────────────────────────────────────
function LatticeField({ progress, tier, isMobile }: { progress: RefObject<number>; tier: DeviceTier; isMobile: boolean }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const approx = (tier === "low" || isMobile) ? 110 : 220;
  const geometry = useMemo(() => buildLatticeGeometry(approx, 1.55), [approx]);
  const uniforms = useMemo(
    () => ({
      uOrder: { value: 0 },
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(ACCENT) },
      uReveal: { value: 1 },
    }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }) => {
    const p = progress.current ?? 0;
    const lattice = systemDriver(p, "lattice");
    // Order ramps across the lattice arc (R08 emerge → R09 tighten).
    const order = smoothstep(localWithin(p, "lattice"));
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.elapsedTime;
      matRef.current.uniforms.uOrder.value = order;
      matRef.current.uniforms.uReveal.value = lattice;
    }
    if (groupRef.current) {
      groupRef.current.visible = lattice > 0.01;
      groupRef.current.rotation.y += 0.0012;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <points geometry={geometry}>
        <shaderMaterial
          ref={matRef}
          vertexShader={latticeVertGLSL}
          fragmentShader={latticeFragGLSL}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

// ─── Scene root ───────────────────────────────────────────────────────────────
function BornScene({
  progress,
  tier,
  isMobile,
}: {
  progress: RefObject<number>;
  tier: DeviceTier;
  isMobile: boolean;
}) {
  const high = tier === "high";

  return (
    <>
      <color attach="background" args={["#050706"]} />
      <fogExp2 attach="fog" args={["#050706", 0.045]} />

      {/* Cinematic soft studio: key + sage rim + cool fill + cream under-bounce. */}
      <ambientLight intensity={0.12} />
      <directionalLight position={[4, 8, 4]} intensity={1.5} color="#f0ede6" />
      <directionalLight position={[-6, 2, -6]} intensity={2.6} color={ACCENT} />
      <directionalLight position={[-3, 7, 3]} intensity={0.9} color="#d8e8e0" />
      <pointLight position={[0, -5, 3]} intensity={1.0} color={CREAM} distance={14} decay={2} />

      {/* Env reflections — high tier only (adds GPU cost). Procedural studio
          cubemap built from Lightformers: no remote HDR fetch, fully bundled,
          works offline. Soft sage + cream sources read as mineral reflections. */}
      {high && (
        <Environment resolution={128} environmentIntensity={0.4} frames={1}>
          <Lightformer intensity={1.6} color={CREAM} position={[0, 3, 2]} scale={[6, 3, 1]} />
          <Lightformer intensity={0.9} color={ACCENT} position={[-4, 1, -3]} scale={[5, 5, 1]} />
          <Lightformer intensity={0.6} color="#d8e8e0" position={[4, 0, 2]} scale={[4, 4, 1]} />
          <Lightformer intensity={0.4} color={CREAM} position={[0, -3, 1]} scale={[6, 2, 1]} />
        </Environment>
      )}

      <CameraRig progress={progress} />

      <LivingStone progress={progress} />
      <DustField progress={progress} tier={tier} isMobile={isMobile} />
      <CO2Orbit progress={progress} tier={tier} isMobile={isMobile} />
      <LatticeField progress={progress} tier={tier} isMobile={isMobile} />

      {/* Post-FX — single composer. Tier-aware: low drops DoF + ChromaticAb. */}
      <EffectComposer multisampling={0}>
        <SMAA />
        {high ? (
          <DepthOfField focusDistance={0.012} focalLength={0.05} bokehScale={2.4} height={360} />
        ) : (
          <></>
        )}
        <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.35} intensity={0.7} mipmapBlur />
        {high ? (
          <ChromaticAberration offset={_caOffset} radialModulation={false} modulationOffset={0} />
        ) : (
          <></>
        )}
        <Vignette offset={0.3} darkness={0.82} />
      </EffectComposer>
    </>
  );
}

// ─── Captions (HTML overlay, real DOM text, rAF-driven) ───────────────────────
function BornCaptions({ progress }: { progress: RefObject<number> }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const p = progress.current ?? 0;
      const root = containerRef.current;
      if (root) {
        const nodes = root.children;
        for (let i = 0; i < nodes.length; i++) {
          const el = nodes[i] as HTMLElement;
          const a = routeAlpha(p, i);
          el.style.opacity = String(a);
          el.style.transform = `translateY(${(1 - a) * 16}px)`;
          el.setAttribute("aria-hidden", a < 0.05 ? "true" : "false");
        }
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  return (
    <div className="born-captions" aria-live="polite" ref={containerRef}>
      {ROUTES.map((r) => (
        <div key={r.id} className="born-caption" aria-hidden="true">
          <span className="born-eyebrow">{r.eyebrow}</span>
          <p className="born-heading">{r.heading}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
// Only mounted when premium && !reduce (gated upstream in CinematicApp). The
// static, three-free fallback lives in BornStatic.tsx.
export function BornOfLimex() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const { canvasRef, frameloop } = useFrameloopOnVisible();
  const tier = useDeviceTier();
  // One-time mobile check (stable) — avoids a useThree size subscription inside
  // the canvas that would re-render the scene/composer on orientation change.
  const isMobile = useMemo(
    () => typeof window !== "undefined" && window.innerWidth < 480,
    [],
  );

  useEffect(() => {
    let rafId = 0;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const el = wrapperRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const raw = total > 0 ? -rect.top / total : 0;
        progress.current = Math.max(0, Math.min(1, raw));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section
      className="born-section"
      aria-label="Born of LIMEX — the material origin story"
    >
      {/* Tall scroll driver — 20 routes need room to breathe (~1600vh). */}
      <div ref={wrapperRef} className="born-scroll-driver born-scroll-driver--20">
        <div className="born-sticky">
          <div className="born-canvas-wrap" aria-hidden="true">
            <Canvas
              ref={canvasRef}
              frameloop={frameloop}
              className="born-canvas"
              dpr={[1, 1.75]}
              gl={{
                antialias: false,
                alpha: false,
                powerPreference: "high-performance",
                stencil: false,
              }}
              camera={{ position: [0, 0.35, 7.6], fov: 46 }}
            >
              <Suspense fallback={null}>
                <BornScene progress={progress} tier={tier} isMobile={isMobile} />
              </Suspense>
            </Canvas>
          </div>

          <BornCaptions progress={progress} />
        </div>
      </div>

      {/* Visually-hidden, screen-reader summary of the journey (canvas is hidden). */}
      <h2 className="born-sr-only">Born of LIMEX</h2>
    </section>
  );
}
