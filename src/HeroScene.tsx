import { useEffect, useRef } from "react";
import * as THREE from "three";

const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path}`.replace(/\/{2,}/g, "/");
const ROCK_TEXTURE = assetPath("assets/limex-rock.webp");

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (value: number) => value * value * (3 - 2 * value);

export default function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.innerWidth < 760;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 6.4);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !mobile,
      powerPreference: "high-performance",
    });
    renderer.setClearAlpha(0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);

    scene.add(new THREE.AmbientLight(0xd8fff1, 1.35));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(-2.5, 3, 5);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x89ffd1, 8, 10);
    rimLight.position.set(2.6, -0.4, 2.2);
    scene.add(rimLight);

    const loader = new THREE.TextureLoader();
    const texture = loader.load(ROCK_TEXTURE);
    texture.colorSpace = THREE.SRGBColorSpace;

    const rockMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      alphaMap: texture,
      displacementMap: texture,
      displacementScale: 0.18,
      transparent: true,
      roughness: 0.76,
      metalness: 0.04,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const rock = new THREE.Mesh(new THREE.PlaneGeometry(3.85, 3.85, 56, 56), rockMaterial);
    rock.position.set(mobile ? 0.42 : 1.85, mobile ? 0.42 : 0.05, 0);
    scene.add(rock);

    const pelletCount = mobile ? 320 : 680;
    const pelletPositions = new Float32Array(pelletCount * 3);
    const pelletBase = new Float32Array(pelletCount * 3);
    const pelletDrift = new Float32Array(pelletCount * 3);
    for (let i = 0; i < pelletCount; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random());
      const x = Math.cos(a) * r * 1.05;
      const y = Math.sin(a) * r * 0.72;
      const z = (Math.random() - 0.5) * 0.32;
      const idx = i * 3;
      pelletBase[idx] = x;
      pelletBase[idx + 1] = y;
      pelletBase[idx + 2] = z;
      pelletDrift[idx] = x * 1.8 + (Math.random() - 0.5) * 1.7;
      pelletDrift[idx + 1] = y * 1.15 - 2.2 - Math.random() * 1.8;
      pelletDrift[idx + 2] = z + (Math.random() - 0.5) * 1.6;
    }

    const pellets = new THREE.Points(
      new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(pelletPositions, 3)),
      new THREE.PointsMaterial({
        color: 0xe8efe6,
        size: mobile ? 0.028 : 0.022,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    scene.add(pellets);

    let frame = 0;
    const clock = new THREE.Clock();

    const resize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const animate = () => {
      frame = window.requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const scrollMax = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = reducedMotion ? 0.18 : clamp(window.scrollY / scrollMax);
      const heroBias = 1 - clamp(progress / 0.22);
      const zig = Math.sin(progress * Math.PI * 7.5);
      const x = (mobile ? 0.22 : 1.48) * heroBias + zig * (mobile ? 0.55 : 0.9) * (1 - heroBias);
      const y = (mobile ? 0.42 : 0.05) - progress * (mobile ? 3.45 : 4.55);
      const z = Math.sin(progress * Math.PI * 2) * 0.22;
      const particlePhase = smooth(clamp((progress - 0.5) / 0.24));
      const fadePhase = smooth(clamp((progress - 0.74) / 0.14));

      rock.position.set(x, y, z);
      rock.rotation.z = -0.18 + Math.sin(elapsed * 0.7 + progress * 7) * 0.16 + progress * 1.75;
      rock.rotation.y = Math.sin(elapsed * 0.5 + progress * 8.5) * 0.42 + zig * 0.16;
      rock.rotation.x = Math.cos(elapsed * 0.42 + progress * 7) * 0.18 - progress * 0.28;
      rock.scale.setScalar((mobile ? 0.9 : 1.08) * (1 - particlePhase * 0.18));
      rockMaterial.opacity = 1 - particlePhase * 0.92;

      pellets.position.set(x, y, z);
      pellets.rotation.z = rock.rotation.z + progress * 0.9;
      pellets.rotation.y = progress * 1.8;
      (pellets.material as THREE.PointsMaterial).opacity = particlePhase * (1 - fadePhase);

      for (let i = 0; i < pelletCount; i += 1) {
        const idx = i * 3;
        const wave = Math.sin(elapsed * 1.4 + i * 0.19) * 0.06;
        pelletPositions[idx] = THREE.MathUtils.lerp(pelletBase[idx], pelletDrift[idx], particlePhase) + wave;
        pelletPositions[idx + 1] = THREE.MathUtils.lerp(pelletBase[idx + 1], pelletDrift[idx + 1], particlePhase);
        pelletPositions[idx + 2] = THREE.MathUtils.lerp(pelletBase[idx + 2], pelletDrift[idx + 2], particlePhase);
      }
      pellets.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    window.addEventListener("resize", resize);
    animate();

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      texture.dispose();
      rock.geometry.dispose();
      rockMaterial.dispose();
      pellets.geometry.dispose();
      (pellets.material as THREE.PointsMaterial).dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-scene" aria-hidden="true" />;
}
