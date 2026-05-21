/**
 * BORN OF LIMEX — Scroll-driven cinematic 3D narrative.
 *
 * Architecture:
 *  - ONE tall wrapper (500vh) with a position:sticky, 100vh canvas stage.
 *  - A passive rAF-throttled scroll listener writes a 0..1 progress ref.
 *  - All stage transitions, camera moves, particle uniforms, and text
 *    crossfades are driven from that single progress value.
 *  - Post-processing: EffectComposer (Bloom + Vignette + ChromaticAberration).
 *  - Particle counts: 900 CO2, halved to 450 on mobile (<480px).
 *  - GLB reused from LimexModel (stage 4 hero moment).
 */

import {
  Suspense,
  useEffect,
  useRef,
  useMemo,
  type RefObject,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, ChromaticAberration, SMAA } from "@react-three/postprocessing";
import * as THREE from "three";
import { Vector2 } from "three";
import { LimexModel, ProceduralCrystal, ModelBoundary } from "./LimexModel";
import {
  buildCO2Particles,
  buildCrystalGeometry,
  buildBottleGeometry,
  buildCartonGeometry,
  buildMorphParticles,
  sampleGeometrySurface,
} from "./bornGeometry";
import {
  co2VertGLSL,
  co2FragGLSL,
  crystalVertGLSL,
  crystalFragGLSL,
  resinVertGLSL,
  resinFragGLSL,
  morphVertGLSL,
  morphFragGLSL,
} from "./bornShaders";
import { STAGE_TEXTS } from "./BornStatic";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const ACCENT = "#9aa893";
const CREAM  = "#f5f1e8";

// Pre-allocated to avoid per-frame GC
const _caOffset = new Vector2(0.0004, 0.0002);

// ─── Stage windows (progress 0..1 → 5 stages, soft overlaps) ─────────────────
// Each stage fully active in the middle third of its window.
const STAGE_WINDOWS = [
  [0.00, 0.22],  // 0 CO2
  [0.18, 0.42],  // 1 CaCO3 crystal
  [0.38, 0.62],  // 2 Resin bonding
  [0.58, 0.82],  // 3 LIMEX core hero
  [0.78, 1.00],  // 4 Real-world products
] as const;

// Stage opacity: smooth ramp in [lo..lo+0.06] ramp out [hi-0.06..hi]
function stageAlpha(progress: number, stageIdx: number): number {
  const [lo, hi] = STAGE_WINDOWS[stageIdx];
  const fadeW = 0.06;
  if (progress < lo || progress > hi) return 0;
  const fadeIn  = Math.min(1, (progress - lo) / fadeW);
  const fadeOut = Math.min(1, (hi - progress) / fadeW);
  return Math.min(fadeIn, fadeOut);
}

// 0..1 within a stage's full window
function stageLocal(progress: number, stageIdx: number): number {
  const [lo, hi] = STAGE_WINDOWS[stageIdx];
  return Math.max(0, Math.min(1, (progress - lo) / (hi - lo)));
}

// ─── Ease helpers ─────────────────────────────────────────────────────────────
function smoothstep(t: number) { return t * t * (3 - 2 * t); }

// ─── Camera rig ───────────────────────────────────────────────────────────────
// Moves cinematically through 5 positions driven purely by progress.
const CAM_POSITIONS: [number, number, number][] = [
  [0,    0.5,  7.5],   // stage 0 — wide, high up
  [0,    0.2,  6.0],   // stage 1 — closer, level
  [0.8,  0.0,  5.5],   // stage 2 — slight orbit right
  [0,    0.0,  5.0],   // stage 3 — centred, close
  [-0.5, -0.2, 6.2],   // stage 4 — widen for duality
];
const CAM_LOOK: [number, number, number][] = [
  [0,  0.2,  0],
  [0,  0,    0],
  [0.3,0,    0],
  [0,  0,    0],
  [0, -0.1,  0],
];

function lerpArr(a: [number,number,number], b: [number,number,number], t: number): [number,number,number] {
  return [
    a[0] + (b[0]-a[0])*t,
    a[1] + (b[1]-a[1])*t,
    a[2] + (b[2]-a[2])*t,
  ];
}

function CameraRig({ progress }: { progress: RefObject<number> }) {
  const _lookTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const p = progress.current ?? 0;

    // Map 0..1 into the 5 keyframes
    const fIdx  = p * 4;          // 0..4
    const segI  = Math.floor(Math.min(fIdx, 3));
    const segT  = smoothstep(fIdx - segI);

    const camTarget = lerpArr(CAM_POSITIONS[segI], CAM_POSITIONS[segI + 1], segT);
    const lookTarget = lerpArr(CAM_LOOK[segI], CAM_LOOK[segI + 1], segT);

    state.camera.position.lerp(
      new THREE.Vector3(...camTarget),
      0.04,
    );
    _lookTarget.lerp(new THREE.Vector3(...lookTarget), 0.04);
    state.camera.lookAt(_lookTarget);
  });

  return null;
}

// ─── Stage 0: CO2 particle field ──────────────────────────────────────────────
function CO2Stage({ progress }: { progress: RefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();
  const isMobile = size.width < 480;

  const { geometry, count } = useMemo(
    () => buildCO2Particles(isMobile ? 450 : 900),
    [isMobile],
  );

  const uniforms = useMemo(() => ({
    uTime:    { value: 0 },
    uGather:  { value: 0 },
    uProgress:{ value: 0 },
  }), []);

  useFrame(({ clock }) => {
    const p = progress.current ?? 0;
    const local = stageLocal(p, 0);
    // Gather intensifies toward end of stage 0 (particles fuse into crystal)
    const gather = smoothstep(Math.max(0, (local - 0.6) / 0.4));

    if (matRef.current) {
      matRef.current.uniforms.uTime.value    = clock.elapsedTime;
      matRef.current.uniforms.uGather.value  = gather;
      matRef.current.uniforms.uProgress.value = local;
    }
  });

  // Dispose on unmount
  useEffect(() => {
    return () => { geometry.dispose(); };
  }, [geometry]);

  const alpha = useRef(0);

  useFrame(() => {
    const p = progress.current ?? 0;
    const a = stageAlpha(p, 0);
    alpha.current = a;
    if (matRef.current) {
      matRef.current.transparent = true;
      (matRef.current as THREE.ShaderMaterial & { opacity: number }).opacity = a;
    }
  });

  return (
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
  );
}

// ─── Stage 1: CaCO3 Crystal ───────────────────────────────────────────────────
function CrystalStage({ progress }: { progress: RefObject<number> }) {
  const groupRef  = useRef<THREE.Group>(null);
  const matRef    = useRef<THREE.ShaderMaterial>(null);
  const resinRef  = useRef<THREE.ShaderMaterial>(null);

  const crystalGeo = useMemo(() => buildCrystalGeometry(1.5), []);

  const crystalUniforms = useMemo(() => ({
    uTime:  { value: 0 },
    uGrow:  { value: 0 },
    uColor: { value: new THREE.Color(ACCENT) },
  }), []);

  const resinUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWrap: { value: 0 },
  }), []);

  useEffect(() => {
    return () => { crystalGeo.dispose(); };
  }, [crystalGeo]);

  useFrame(({ clock }) => {
    const p     = progress.current ?? 0;
    const stg1  = stageLocal(p, 1);
    const stg2  = stageLocal(p, 2);
    const alpha1 = stageAlpha(p, 1);
    const alpha2 = stageAlpha(p, 2);

    const grow = smoothstep(Math.min(1, stg1 * 2));
    const wrap = smoothstep(stg2);
    const combinedAlpha = Math.max(alpha1, alpha2);

    if (matRef.current) {
      matRef.current.uniforms.uTime.value  = clock.elapsedTime;
      matRef.current.uniforms.uGrow.value  = grow;
    }
    if (resinRef.current) {
      resinRef.current.uniforms.uTime.value = clock.elapsedTime;
      resinRef.current.uniforms.uWrap.value = wrap;
    }
    if (groupRef.current) {
      groupRef.current.visible = combinedAlpha > 0.01;
      // Slow rotation — stately, not frenetic
      groupRef.current.rotation.y += 0.003;
      groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.2) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Crystal body */}
      <mesh geometry={crystalGeo} castShadow>
        <shaderMaterial
          ref={matRef}
          vertexShader={crystalVertGLSL}
          fragmentShader={crystalFragGLSL}
          uniforms={crystalUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Resin shell — stage 2 */}
      <mesh geometry={crystalGeo}>
        <shaderMaterial
          ref={resinRef}
          vertexShader={resinVertGLSL}
          fragmentShader={resinFragGLSL}
          uniforms={resinUniforms}
          transparent
          depthWrite={false}
          side={THREE.FrontSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// ─── Stage 3: LIMEX core (GLB or procedural fallback) ─────────────────────────
function LimexCoreStage({ progress }: { progress: RefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const p     = progress.current ?? 0;
    const alpha = stageAlpha(p, 3);

    if (groupRef.current) {
      groupRef.current.visible = alpha > 0.01;
      // Levitate + slow rotate
      groupRef.current.rotation.y   += 0.005;
      groupRef.current.position.y    = Math.sin(clock.elapsedTime * 0.5) * 0.12;
      groupRef.current.scale.setScalar(alpha); // fade via scale is simpler than opacity on GLB
    }
  });

  return (
    <group ref={groupRef}>
      <ModelBoundary fallback={<ProceduralCrystal size={1.8} />}>
        <Suspense fallback={<ProceduralCrystal size={1.8} />}>
          <LimexModel size={3.2} />
        </Suspense>
      </ModelBoundary>
    </group>
  );
}

// ─── Stage 4: Morph particles + product forms ─────────────────────────────────
function ProductStage({ progress }: { progress: RefObject<number> }) {
  const morphMatRef = useRef<THREE.ShaderMaterial>(null);
  const bottleRef   = useRef<THREE.Mesh>(null);
  const cartonRef   = useRef<THREE.Mesh>(null);
  const groupRef    = useRef<THREE.Group>(null);

  const { size } = useThree();
  const isMobile = size.width < 480;

  const bottleGeo  = useMemo(() => buildBottleGeometry(), []);
  const cartonGeo  = useMemo(() => buildCartonGeometry(), []);

  // Sample destination points from bottle (left) and carton (right)
  const morphGeo = useMemo(() => {
    const bottleOffset = new THREE.Vector3(-1.4, -0.5, 0);
    const cartonOffset = new THREE.Vector3( 1.4, -0.5, 0);
    const nPts = isMobile ? 150 : 300;
    const bottlePts = sampleGeometrySurface(bottleGeo, nPts, bottleOffset);
    const cartonPts = sampleGeometrySurface(cartonGeo, nPts, cartonOffset);
    const allPts    = [...bottlePts, ...cartonPts];
    return buildMorphParticles(allPts.length, 1.6, allPts);
  }, [bottleGeo, cartonGeo, isMobile]);

  const morphUniforms = useMemo(() => ({
    uProgress: { value: 0 },
    uTime:     { value: 0 },
    uColor:    { value: new THREE.Color(CREAM) },
  }), []);

  useEffect(() => {
    return () => {
      bottleGeo.dispose();
      cartonGeo.dispose();
      morphGeo.geometry.dispose();
    };
  }, [bottleGeo, cartonGeo, morphGeo]);

  useFrame(({ clock }) => {
    const p     = progress.current ?? 0;
    const local = stageLocal(p, 4);
    const alpha = stageAlpha(p, 4);

    if (morphMatRef.current) {
      morphMatRef.current.uniforms.uProgress.value = smoothstep(local);
      morphMatRef.current.uniforms.uTime.value     = clock.elapsedTime;
    }

    const productAlpha = smoothstep(Math.max(0, (local - 0.45) / 0.55));

    if (bottleRef.current) {
      bottleRef.current.visible = alpha > 0.01;
      (bottleRef.current.material as THREE.Material & { opacity: number }).opacity = productAlpha;
      bottleRef.current.rotation.y += 0.006;
    }
    if (cartonRef.current) {
      cartonRef.current.visible = alpha > 0.01;
      (cartonRef.current.material as THREE.Material & { opacity: number }).opacity = productAlpha;
      cartonRef.current.rotation.y -= 0.004;
    }
    if (groupRef.current) {
      groupRef.current.visible = alpha > 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Morph particle stream */}
      <points geometry={morphGeo.geometry}>
        <shaderMaterial
          ref={morphMatRef}
          vertexShader={morphVertGLSL}
          fragmentShader={morphFragGLSL}
          uniforms={morphUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Bottle — LatheGeometry, left */}
      <mesh
        ref={bottleRef}
        geometry={bottleGeo}
        position={[-1.4, -0.5, 0]}
        castShadow
      >
        <meshStandardMaterial
          color="#dcd9cf"
          roughness={0.35}
          metalness={0.08}
          emissive={ACCENT}
          emissiveIntensity={0.06}
          transparent
          opacity={0}
        />
      </mesh>

      {/* Carton / burger-box, right */}
      <mesh
        ref={cartonRef}
        geometry={cartonGeo}
        position={[1.4, -0.3, 0]}
        castShadow
      >
        <meshStandardMaterial
          color="#c8c2ae"
          roughness={0.55}
          metalness={0.04}
          emissive={CREAM}
          emissiveIntensity={0.04}
          transparent
          opacity={0}
        />
      </mesh>
    </group>
  );
}

// ─── Scene root ───────────────────────────────────────────────────────────────
function BornScene({ progress }: { progress: RefObject<number> }) {
  return (
    <>
      <color attach="background" args={["#050706"]} />

      {/* Lights — minimal, filmic */}
      <ambientLight intensity={0.10} />
      <directionalLight position={[4, 8, 4]}  intensity={1.6} color="#f0ede6" />
      <directionalLight position={[-6, 2, -6]} intensity={3.2} color={ACCENT} />
      <directionalLight position={[-3, 7, 3]}  intensity={1.0} color="#d8e8e0" />
      <pointLight position={[0, -5, 3]} intensity={1.2} color={CREAM} distance={14} decay={2} />

      <CameraRig progress={progress} />

      {/* Stages — all live in the scene simultaneously; show/hide via uniforms */}
      <CO2Stage      progress={progress} />
      <CrystalStage  progress={progress} />
      <LimexCoreStage progress={progress} />
      <ProductStage  progress={progress} />

      {/* Post-processing — tasteful, perf-aware */}
      <EffectComposer multisampling={0}>
        <SMAA />
        <Bloom
          luminanceThreshold={0.48}
          luminanceSmoothing={0.35}
          intensity={0.75}
          mipmapBlur
        />
        <ChromaticAberration
          offset={_caOffset}
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette offset={0.28} darkness={0.82} />
      </EffectComposer>
    </>
  );
}

// ─── Stage captions (HTML overlay) ────────────────────────────────────────────
interface CaptionProps {
  progress: RefObject<number>;
}

function BornCaptions({ progress }: CaptionProps) {
  // We update caption opacity via direct DOM manipulation inside rAF to avoid
  // React re-renders on every scroll tick.
  const captionRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ] as const;

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const p = progress.current ?? 0;
      captionRefs.forEach((ref, i) => {
        if (!ref.current) return;
        const a = stageAlpha(p, i);
        ref.current.style.opacity  = String(a);
        ref.current.style.transform = `translateY(${(1 - a) * 18}px)`;
        ref.current.setAttribute("aria-hidden", a < 0.05 ? "true" : "false");
      });
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="born-captions" aria-live="polite">
      {STAGE_TEXTS.map((t, i) => (
        <div
          key={i}
          ref={captionRefs[i]}
          className="born-caption"
          aria-hidden="true"
        >
          <span className="born-eyebrow">{t.eyebrow}</span>
          <p className="born-heading">{t.heading}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
// Only mounted when premium && !reduce (gated at the call site in CinematicApp),
// so the heavy three.js / postprocessing chunk is never fetched on the simple,
// reduced-motion, or low-end path. The static fallback lives in BornStatic.tsx.
export function BornOfLimex() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const progress   = useRef(0);

  // rAF-throttled passive scroll listener — same pattern as LimestoneHero
  useEffect(() => {
    let rafId = 0;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const el = wrapperRef.current;
        if (!el) return;
        const rect  = el.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        // progress: 0 when top of wrapper at top of viewport, 1 when bottom exits
        const raw   = -rect.top / total;
        progress.current = Math.max(0, Math.min(1, raw));
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // sync on mount
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
      {/* Tall scroll driver (500vh) */}
      <div ref={wrapperRef} className="born-scroll-driver">
        {/* Sticky stage holds canvas + captions */}
        <div className="born-sticky">
          {/* Canvas — aria-hidden; captions are real DOM text */}
          <div className="born-canvas-wrap" aria-hidden="true">
            <Canvas
              className="born-canvas"
              dpr={[1, 1.75]}
              gl={{
                antialias: false,
                alpha: false,
                powerPreference: "high-performance",
                stencil: false,
              }}
              camera={{ position: [0, 0.5, 7.5], fov: 46 }}
              frameloop="always"
            >
              <Suspense fallback={null}>
                <BornScene progress={progress} />
              </Suspense>
            </Canvas>
          </div>

          {/* HTML captions overlay */}
          <BornCaptions progress={progress} />
        </div>
      </div>
    </section>
  );
}
