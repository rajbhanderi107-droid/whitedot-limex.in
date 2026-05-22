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
 *   reveal · cracks · co2 · calcium · sheets · lattice · resin · stabilize ·
 *   refine · paper · plastic
 * computed by summing the alpha of every route whose `systems` include that
 * subsystem. That keeps transitions cross-blended (no hard cuts) and makes
 * each phase mostly a data exercise (extend ROUTES, add a thin renderer).
 *
 * Routes 01–15 are realised (Phase 1: R01–R09 living stone; Phase 2: R10–R15
 * material-transformation arc — resin flow, stabilize, refine, paper, plastic);
 * 16–20 hold gracefully on the finished material (Phase 3 adds products/finale).
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
  buildSlabGeometry,
  buildCartonGeometry,
  buildBottleGeometry,
  buildMorphParticles,
  sampleGeometrySurface,
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
  resinVertGLSL,
  resinFragGLSL,
  slabVertGLSL,
  slabFragGLSL,
  productVertGLSL,
  productFragGLSL,
  finaleVertGLSL,
  finaleFragGLSL,
  morphVertGLSL,
  morphFragGLSL,
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
      uRefine: { value: 0 },
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
    const refine = systemDriver(p, "refine");
    // Stabilize (R11): quiets motion + consolidates layers into one solid.
    const calm = systemDriver(p, "stabilize");
    // Once refined, the surface is finished — fold the residual sheet split shut.
    const settle = calm > refine ? calm : refine;

    // Product takeover (R16+): as packaging / bottle / ecosystem / finale forms
    // emerge, the stone recedes (shrinks away) so it never overlaps them.
    const takeover = Math.max(
      systemDriver(p, "packaging"),
      systemDriver(p, "bottle"),
      systemDriver(p, "ecosystem"),
      systemDriver(p, "finale"),
    );
    const hide = 1 - smoothstep(takeover);

    if (stoneMat.current) {
      stoneMat.current.uniforms.uTime.value = t;
      stoneMat.current.uniforms.uReveal.value = reveal;
      stoneMat.current.uniforms.uCracks.value = cracks;
      stoneMat.current.uniforms.uRefine.value = refine;
    }
    if (calciumMat.current) {
      calciumMat.current.uniforms.uTime.value = t;
      calciumMat.current.uniforms.uGrow.value = calcium;
    }

    if (spinRef.current) {
      // Always-on slow rotation; subtly faster while the stone "works", then
      // eased toward stillness as the composition stabilizes/refines (R11+).
      const quiet = 1 - 0.7 * settle;
      spinRef.current.rotation.y += (0.0018 + calcium * 0.0012) * quiet;
      spinRef.current.rotation.x = Math.sin(t * 0.15) * 0.05 * quiet;
    }
    if (breatheRef.current) {
      // Subtle breathing + a gentle scroll-reactive lift through the arc.
      // Breathing amplitude collapses as the material settles (R11+).
      const quiet = 1 - 0.8 * settle;
      const breathe = 1 + Math.sin(t * 0.6) * 0.012 * quiet;
      breatheRef.current.scale.setScalar(breathe * hide);
      breatheRef.current.visible = hide > 0.001;
      breatheRef.current.position.y = Math.sin(t * 0.4) * 0.06 * quiet;
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

// ─── Resin flow shell (R10 → R11) ─────────────────────────────────────────────
// A translucent fresnel-transmission shell sitting just outside the ordered
// structure. uResin fills a vertical flow front up the form (resin moving
// through); uCalm (from the stabilize driver) quiets the flow wave into a still
// film as the composition settles. Reuses the crystal shell silhouette so it
// hugs the stone. Cheap: one fresnel + one sine ripple, all guarded by uResin.
function ResinFlow({ progress }: { progress: RefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  // Slightly outside the surface shell (1.62) so it reads as flow through/around.
  const geometry = useMemo(() => buildCrystalGeometry(1.66), []);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResin: { value: 0 },
      uCalm: { value: 0 },
      uColor: { value: new THREE.Color(ACCENT) },
    }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }) => {
    const p = progress.current ?? 0;
    const resin = systemDriver(p, "resin");
    const calm = systemDriver(p, "stabilize");
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.elapsedTime;
      matRef.current.uniforms.uResin.value = resin;
      matRef.current.uniforms.uCalm.value = calm;
    }
    if (groupRef.current) {
      groupRef.current.visible = resin > 0.01;
      // Drifts almost imperceptibly — calm, never busy.
      groupRef.current.rotation.y += 0.0009;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={matRef}
          vertexShader={resinVertGLSL}
          fragmentShader={resinFragGLSL}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ─── Refined slab — paper (R14) + plastic (R15) ───────────────────────────────
// One thin slab geometry the refined material takes a flat form as. uEmerge
// scales it in from a hairline; uPaper drives a matte fibrous paper read, uPlastic
// a clean slightly-translucent polymer blank. Both looks cross-blend on the same
// mesh so R14→R15 is a material shift, not a swap. Guarded by uPaper/uPlastic so
// it costs nothing before R14.
function RefinedSlab({ progress, tier }: { progress: RefObject<number>; tier: DeviceTier }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  // Lower-poly slab on low tier (the shader, not the mesh, carries the look).
  const geometry = useMemo(
    () => (tier === "low" ? buildSlabGeometry(2.6, 0.12, 1.7) : buildSlabGeometry()),
    [tier],
  );
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uEmerge: { value: 0 },
      uPaper: { value: 0 },
      uPlastic: { value: 0 },
      uKeyDir: { value: _keyDir.clone() },
    }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }) => {
    const p = progress.current ?? 0;
    const paper = systemDriver(p, "paper");
    const plastic = systemDriver(p, "plastic");
    const emerge = paper > plastic ? paper : plastic; // grows in for either look
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.elapsedTime;
      matRef.current.uniforms.uEmerge.value = smoothstep(emerge);
      matRef.current.uniforms.uPaper.value = paper;
      matRef.current.uniforms.uPlastic.value = plastic;
    }
    if (groupRef.current) {
      groupRef.current.visible = emerge > 0.01;
      // The slab tilts to read as a flat panel, with a barely-there sway.
      groupRef.current.rotation.x = -0.32 + Math.sin(clock.elapsedTime * 0.18) * 0.015;
      groupRef.current.rotation.y += 0.0008;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={matRef}
          vertexShader={slabVertGLSL}
          fragmentShader={slabFragGLSL}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ─── Packaging carton (R16) ───────────────────────────────────────────────────
// The finished material folds into a packaging silhouette. A clean carton grows
// in (uEmerge) with the refined-product shader; uReveal gates the cross-blend.
function PackagingForm({ progress }: { progress: RefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const geometry = useMemo(() => buildCartonGeometry(1.5, 0.95, 1.05), []);
  const uniforms = useMemo(
    () => ({
      uEmerge: { value: 0 },
      uReveal: { value: 0 },
      uKeyDir: { value: _keyDir.clone() },
      uColor: { value: new THREE.Color(ACCENT) },
      uTint: { value: new THREE.Color(1.0, 0.99, 0.96) },
    }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }) => {
    const p = progress.current ?? 0;
    const pack = systemDriver(p, "packaging");
    if (matRef.current) {
      matRef.current.uniforms.uEmerge.value = smoothstep(localWithin(p, "packaging"));
      matRef.current.uniforms.uReveal.value = pack;
    }
    if (groupRef.current) {
      groupRef.current.visible = pack > 0.01;
      groupRef.current.rotation.y = -0.5 + clock.elapsedTime * 0.08;
      groupRef.current.rotation.x = -0.12;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={matRef}
          vertexShader={productVertGLSL}
          fragmentShader={productFragGLSL}
          uniforms={uniforms}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ─── Bottle assembly from particles (R17) ─────────────────────────────────────
// Particles converge from the core radius onto a bottle profile (morph shader);
// as they arrive, the solid vessel fades in beneath them (product shader).
function BottleAssembly({
  progress,
  tier,
  isMobile,
}: {
  progress: RefObject<number>;
  tier: DeviceTier;
  isMobile: boolean;
}) {
  const morphMat = useRef<THREE.ShaderMaterial>(null);
  const bottleMat = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const count = tier === "low" || isMobile ? 360 : 720;
  const bottleGeo = useMemo(() => buildBottleGeometry(1.8), []);
  // Endpoints sampled once from the bottle surface (raw coords; the group is
  // offset to centre, so mesh + particles share the same local space).
  const toPositions = useMemo(
    () => sampleGeometrySurface(bottleGeo, count),
    [bottleGeo, count],
  );
  const morph = useMemo(
    () => buildMorphParticles(count, 1.45, toPositions),
    [count, toPositions],
  );
  const morphUniforms = useMemo(
    () => ({ uProgress: { value: 0 }, uTime: { value: 0 }, uColor: { value: new THREE.Color(CREAM) } }),
    [],
  );
  const bottleUniforms = useMemo(
    () => ({
      uEmerge: { value: 0 },
      uReveal: { value: 0 },
      uKeyDir: { value: _keyDir.clone() },
      uColor: { value: new THREE.Color(ACCENT) },
      uTint: { value: new THREE.Color(0.95, 0.97, 0.94) },
    }),
    [],
  );

  useEffect(
    () => () => {
      bottleGeo.dispose();
      morph.geometry.dispose();
    },
    [bottleGeo, morph],
  );

  useFrame(({ clock }) => {
    const p = progress.current ?? 0;
    const bottle = systemDriver(p, "bottle");
    const assemble = smoothstep(localWithin(p, "bottle"));
    // Solid vessel forms over the back half of the assembly.
    const solid = smoothstep(Math.max(0, (assemble - 0.5) / 0.5));
    if (morphMat.current) {
      morphMat.current.uniforms.uTime.value = clock.elapsedTime;
      morphMat.current.uniforms.uProgress.value = assemble;
    }
    if (bottleMat.current) {
      bottleMat.current.uniforms.uEmerge.value = solid;
      bottleMat.current.uniforms.uReveal.value = bottle * solid;
    }
    if (groupRef.current) {
      groupRef.current.visible = bottle > 0.01;
      groupRef.current.rotation.y = clock.elapsedTime * 0.12;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.86, 0]} visible={false}>
      <points geometry={morph.geometry}>
        <shaderMaterial
          ref={morphMat}
          vertexShader={morphVertGLSL}
          fragmentShader={morphFragGLSL}
          uniforms={morphUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <mesh geometry={bottleGeo}>
        <shaderMaterial
          ref={bottleMat}
          vertexShader={productVertGLSL}
          fragmentShader={productFragGLSL}
          uniforms={bottleUniforms}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ─── Product ecosystem + impact (R18–R19) ─────────────────────────────────────
// A calm family of forms (carton · bottle · sheet) appears together (ecosystem).
// On impact (R19) the arrangement settles — eases down + slows — while the
// procurement-grade impact line fades in via the caption layer (no WebGL charts).
function ProductEcosystem({
  progress,
  tier,
}: {
  progress: RefObject<number>;
  tier: DeviceTier;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const cartonMat = useRef<THREE.ShaderMaterial>(null);
  const bottleMat = useRef<THREE.ShaderMaterial>(null);
  const sheetMat = useRef<THREE.ShaderMaterial>(null);

  const cartonGeo = useMemo(() => buildCartonGeometry(0.95, 0.62, 0.7), []);
  const bottleGeo = useMemo(() => buildBottleGeometry(1.3), []);
  const sheetGeo = useMemo(() => buildSlabGeometry(1.0, 0.08, 0.7), []);

  const mkUniforms = (tint: THREE.Color) => ({
    uEmerge: { value: 0 },
    uReveal: { value: 0 },
    uKeyDir: { value: _keyDir.clone() },
    uColor: { value: new THREE.Color(ACCENT) },
    uTint: { value: tint },
  });
  const cartonU = useMemo(() => mkUniforms(new THREE.Color(1.0, 0.99, 0.96)), []);
  const bottleU = useMemo(() => mkUniforms(new THREE.Color(0.95, 0.97, 0.94)), []);
  const sheetU = useMemo(() => mkUniforms(new THREE.Color(0.99, 0.98, 0.93)), []);

  useEffect(
    () => () => {
      cartonGeo.dispose();
      bottleGeo.dispose();
      sheetGeo.dispose();
    },
    [cartonGeo, bottleGeo, sheetGeo],
  );

  useFrame(({ clock }) => {
    const p = progress.current ?? 0;
    const eco = systemDriver(p, "ecosystem");
    const impact = systemDriver(p, "impact");
    const emerge = smoothstep(localWithin(p, "ecosystem"));
    // Unrolled (no per-frame array allocation).
    if (cartonMat.current) {
      cartonMat.current.uniforms.uEmerge.value = emerge;
      cartonMat.current.uniforms.uReveal.value = eco;
    }
    if (bottleMat.current) {
      bottleMat.current.uniforms.uEmerge.value = emerge;
      bottleMat.current.uniforms.uReveal.value = eco;
    }
    if (sheetMat.current) {
      sheetMat.current.uniforms.uEmerge.value = emerge;
      sheetMat.current.uniforms.uReveal.value = eco;
    }
    if (groupRef.current) {
      groupRef.current.visible = eco > 0.01;
      // Slow turntable; eases to stillness + settles down a touch on impact.
      groupRef.current.rotation.y = clock.elapsedTime * 0.06 * (1 - 0.7 * impact);
      groupRef.current.position.y = -0.1 * impact;
    }
  });

  // Sheet hidden on low tier (keeps the family to two forms there).
  const showSheet = tier !== "low";

  return (
    <group ref={groupRef} visible={false}>
      <mesh geometry={cartonGeo} position={[-1.05, -0.1, 0.1]} rotation={[-0.1, 0.4, 0]}>
        <shaderMaterial
          ref={cartonMat}
          vertexShader={productVertGLSL}
          fragmentShader={productFragGLSL}
          uniforms={cartonU}
          transparent
          depthWrite={false}
        />
      </mesh>
      <mesh geometry={bottleGeo} position={[0.15, -0.62, 0]}>
        <shaderMaterial
          ref={bottleMat}
          vertexShader={productVertGLSL}
          fragmentShader={productFragGLSL}
          uniforms={bottleU}
          transparent
          depthWrite={false}
        />
      </mesh>
      {showSheet && (
        <mesh geometry={sheetGeo} position={[1.2, -0.05, 0.05]} rotation={[-0.3, -0.35, 0.1]}>
          <shaderMaterial
            ref={sheetMat}
            vertexShader={productVertGLSL}
            fragmentShader={productFragGLSL}
            uniforms={sheetU}
            transparent
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

// ─── Finale form (R20) ────────────────────────────────────────────────────────
// The held final frame: a single floating refined LIMEX object, breathing
// slowly in a calm sustainable atmosphere. Minimal motion — the shader carries
// the emotion. The tagline rides the caption layer (ROUTES[19].heading).
function FinaleForm({ progress }: { progress: RefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const geometry = useMemo(() => buildCrystalGeometry(1.5), []);
  const uniforms = useMemo(
    () => ({
      uReveal: { value: 0 },
      uBreath: { value: 0 },
      uKeyDir: { value: _keyDir.clone() },
      uColor: { value: new THREE.Color(ACCENT) },
    }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }) => {
    const p = progress.current ?? 0;
    const t = clock.elapsedTime;
    const fin = systemDriver(p, "finale");
    if (matRef.current) {
      matRef.current.uniforms.uReveal.value = fin;
      matRef.current.uniforms.uBreath.value = 0.5 + 0.5 * Math.sin(t * 0.5);
    }
    if (groupRef.current) {
      groupRef.current.visible = fin > 0.01;
      groupRef.current.rotation.y += 0.0014;
      groupRef.current.position.y = Math.sin(t * 0.4) * 0.04;
      groupRef.current.scale.setScalar(0.97 + 0.03 * Math.sin(t * 0.5));
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={matRef}
          vertexShader={finaleVertGLSL}
          fragmentShader={finaleFragGLSL}
          uniforms={uniforms}
          transparent
          depthWrite={false}
        />
      </mesh>
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
      <ResinFlow progress={progress} />
      <RefinedSlab progress={progress} tier={tier} />
      <PackagingForm progress={progress} />
      <BottleAssembly progress={progress} tier={tier} isMobile={isMobile} />
      <ProductEcosystem progress={progress} tier={tier} />
      <FinaleForm progress={progress} />

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
// Motion CHARACTER evolves with the arc. Each route's `systems` array selects a
// data-variant ONCE on mount; the variant maps to a CSS class that defines the
// reveal personality (settling rise / liquid flow / ordered crisp / confident
// product / held finale). The rAF loop is allocation-free + read-free: it writes
// ONLY a single `--a` custom property per caption node. All look (opacity, blur,
// translateY, clip, eyebrow stagger) is derived from `--a` via CSS calc(), so the
// JS does no DOM reads, no transform-string building, and no per-frame objects.
type CaptionVariant = "mineral" | "liquid" | "structured" | "product" | "finale";

function captionVariant(systems: readonly BornSystem[], id: number): CaptionVariant {
  if (id === 20) return "finale";
  // Liquid arc takes priority where resin/stabilize lead the stage (R10–R11).
  if (systems.includes("resin") || systems.includes("stabilize")) return "liquid";
  // Ordered/structured reveal for the lattice + refine stages (R08–R09, R12–R13).
  if (systems.includes("lattice") || systems.includes("refine")) return "structured";
  // Confident product framing once forms emerge (R15–R19).
  if (
    systems.includes("packaging") ||
    systems.includes("bottle") ||
    systems.includes("ecosystem") ||
    systems.includes("impact") ||
    systems.includes("plastic")
  )
    return "product";
  // Early grounded mineral routes (light / cracks / calcium / sheets, R01–R07).
  return "mineral";
}

function BornCaptions({ progress }: { progress: RefObject<number> }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // One-time setup: assign each caption its motion-character variant. Done once
  // on mount so the rAF loop never has to touch classes or attributes per frame.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const nodes = root.children;
    for (let i = 0; i < nodes.length; i++) {
      (nodes[i] as HTMLElement).dataset.variant = captionVariant(
        ROUTES[i].systems,
        ROUTES[i].id,
      );
    }
  }, []);

  // rAF loop — ALLOCATION-FREE + READ-FREE. Writes a single custom property per
  // node; CSS calc() turns `--a` into opacity/blur/translate/clip. Track the last
  // "live" node so we only flip aria-hidden when it actually changes (avoids a
  // per-frame attribute write churn on the a11y tree).
  useEffect(() => {
    let raf = 0;
    let liveIdx = -1;
    const update = () => {
      const p = progress.current ?? 0;
      const root = containerRef.current;
      if (root) {
        const nodes = root.children;
        let topIdx = -1;
        let topA = 0.05;
        for (let i = 0; i < nodes.length; i++) {
          const el = nodes[i] as HTMLElement;
          const a = routeAlpha(p, i);
          el.style.setProperty("--a", a as unknown as string);
          if (a > topA) {
            topA = a;
            topIdx = i;
          }
        }
        // Expose only the most-visible caption to assistive tech; flip once.
        if (topIdx !== liveIdx) {
          if (liveIdx >= 0 && liveIdx < nodes.length)
            (nodes[liveIdx] as HTMLElement).setAttribute("aria-hidden", "true");
          if (topIdx >= 0)
            (nodes[topIdx] as HTMLElement).setAttribute("aria-hidden", "false");
          liveIdx = topIdx;
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
      <div ref={wrapperRef} className="born-scroll-driver born-scroll-driver--5">
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
