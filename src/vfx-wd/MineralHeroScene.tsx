import { useEffect, useRef } from "react";
import type { Texture } from "three";

const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path}`.replace(/\/{2,}/g, "/");
const ROCK_TEXTURE = assetPath("assets/limex-rock.webp");

function randomWaypoint(
  xRange: number,
  yRange: number,
  zRange: number,
): { x: number; y: number; z: number } {
  return {
    x: (Math.random() - 0.5) * 2 * xRange,
    y: (Math.random() - 0.5) * 2 * yRange,
    z: (Math.random() - 0.5) * 2 * zRange,
  };
}

export default function MineralHeroScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let cleanup = () => {};

    const startScene = async () => {
      const THREE = await import("three");
      if (disposed) return;

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const mobile = window.innerWidth < 760;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(0, 0, mobile ? 7.6 : 7.1);

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: !mobile,
        powerPreference: "high-performance",
      });
      renderer.setClearAlpha(0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.15 : 1.45));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.04;

      scene.add(new THREE.AmbientLight(0xf5efe1, 1.2));

      const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
      keyLight.position.set(-3.6, 4.5, 4.8);
      scene.add(keyLight);

      const rimLight = new THREE.PointLight(0xb9c5e1, 5.8, 13);
      rimLight.position.set(3.5, -0.5, 2.8);
      scene.add(rimLight);

      const warmCore = new THREE.PointLight(0xd8b27a, 3.2, 9);
      warmCore.position.set(-1.2, -2.2, 3.2);
      scene.add(warmCore);

      const mineralGroup = new THREE.Group();
      // Centered anchor so the mineral can roam to every edge and corner.
      const baseX = 0;
      const baseY = 0;
      mineralGroup.position.set(baseX, baseY, 0);
      scene.add(mineralGroup);

      const geometry = new THREE.IcosahedronGeometry(mobile ? 1.55 : 2.04, mobile ? 3 : 5);
      const position = geometry.getAttribute("position");
      const vertex = new THREE.Vector3();
      for (let i = 0; i < position.count; i += 1) {
        vertex.fromBufferAttribute(position, i).normalize();
        const mineralNoise =
          Math.sin(vertex.x * 8.1 + vertex.y * 2.6) * 0.052 +
          Math.cos(vertex.y * 9.4 + vertex.z * 3.8) * 0.044 +
          Math.sin(vertex.z * 7.2 + vertex.x * 4.6) * 0.035;
        vertex.multiplyScalar(1 + mineralNoise);
        position.setXYZ(i, vertex.x * (mobile ? 1.0 : 1.05), vertex.y * 0.92, vertex.z * 0.96);
      }
      geometry.computeVertexNormals();

      const material = new THREE.MeshPhysicalMaterial({
        color: 0xe8e0d0,
        roughness: 0.82,
        metalness: 0.05,
        clearcoat: 0.28,
        clearcoatRoughness: 0.78,
        emissive: 0x191714,
        emissiveIntensity: 0.18,
      });

      const textureLoader = new THREE.TextureLoader();
      let texture: Texture | null = null;
      textureLoader.load(ROCK_TEXTURE, (loadedTexture) => {
        if (disposed) {
          loadedTexture.dispose();
          return;
        }
        texture = loadedTexture;
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTexture.wrapS = THREE.RepeatWrapping;
        loadedTexture.wrapT = THREE.RepeatWrapping;
        loadedTexture.repeat.set(1.35, 1.35);
        material.map = loadedTexture;
        material.bumpMap = loadedTexture;
        material.bumpScale = 0.16;
        material.needsUpdate = true;
      });

      const mineral = new THREE.Mesh(geometry, material);
      mineral.rotation.set(-0.16, 0.45, -0.22);
      mineralGroup.add(mineral);

      const facetMaterial = new THREE.MeshStandardMaterial({
        color: 0xf3ead8,
        transparent: true,
        opacity: 0.14,
        roughness: 0.68,
        metalness: 0.12,
        wireframe: true,
      });
      const facets = new THREE.Mesh(geometry.clone(), facetMaterial);
      facets.scale.setScalar(1.008);
      mineralGroup.add(facets);

      const dustCount = mobile ? 240 : 620;
      const dustPositions = new Float32Array(dustCount * 3);
      const dustAngles = new Float32Array(dustCount);
      const dustRadius = new Float32Array(dustCount);
      for (let i = 0; i < dustCount; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 1.6 + Math.random() * (mobile ? 1.3 : 2.35);
        const idx = i * 3;
        dustAngles[i] = angle;
        dustRadius[i] = radius;
        dustPositions[idx] = Math.cos(angle) * radius;
        dustPositions[idx + 1] = (Math.random() - 0.5) * (mobile ? 2.2 : 3.0);
        dustPositions[idx + 2] = Math.sin(angle) * radius * 0.55;
      }

      const dustGeometry = new THREE.BufferGeometry();
      dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
      const dustMaterial = new THREE.PointsMaterial({
        color: 0xf1e7cf,
        size: mobile ? 0.026 : 0.021,
        transparent: true,
        opacity: mobile ? 0.34 : 0.42,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const dust = new THREE.Points(dustGeometry, dustMaterial);
      mineralGroup.add(dust);

      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xb9c5e1,
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
      });
      const ringOne = new THREE.Mesh(new THREE.TorusGeometry(2.75, 0.008, 8, 96), ringMaterial);
      ringOne.rotation.set(Math.PI / 2.25, 0.16, 0.24);
      mineralGroup.add(ringOne);

      // Random antigravity drift — full-viewport waypoint system.
      // The mineral wanders to every edge and corner, never on a fixed path.
      const roamX = mobile ? 1.7 : 3.2;
      const roamY = mobile ? 2.7 : 2.2;
      const roamZ = mobile ? 0.7 : 1.1;
      let waypointFrom = { x: 0, y: 0, z: 0 };
      let waypointTo = randomWaypoint(roamX, roamY, roamZ);
      let waypointProgress = 0;
      // Each leg gets its own random speed so the motion never feels metronomic.
      let waypointSpeed = 0.05 + Math.random() * 0.06;
      const current = { x: 0, y: 0, z: 0 };

      const clock = new THREE.Clock();
      let frame = 0;

      const resize = () => {
        const nextMobile = window.innerWidth < 760;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.position.z = nextMobile ? 7.6 : 7.1;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, nextMobile ? 1.15 : 1.45));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.render(scene, camera);
      };

      const animate = () => {
        if (!reducedMotion) {
          frame = window.requestAnimationFrame(animate);
        }

        const elapsed = clock.getElapsedTime();
        const dt = Math.min(clock.getDelta(), 0.05);

        // Advance waypoint progress; on arrival pick a fresh random target
        // anywhere on screen with a new random travel speed.
        waypointProgress += dt * waypointSpeed;
        if (waypointProgress >= 1) {
          waypointFrom = { ...waypointTo };
          waypointTo = randomWaypoint(roamX, roamY, roamZ);
          waypointSpeed = 0.05 + Math.random() * 0.06;
          waypointProgress = 0;
        }

        // Smooth hermite interpolation between waypoints
        const t = waypointProgress;
        const ease = t * t * (3 - 2 * t);
        const driftX = waypointFrom.x + (waypointTo.x - waypointFrom.x) * ease;
        const driftY = waypointFrom.y + (waypointTo.y - waypointFrom.y) * ease;
        const driftZ = waypointFrom.z + (waypointTo.z - waypointFrom.z) * ease;

        // Layer organic wobble on top of drift for a weightless feel
        const wobbleX = Math.sin(elapsed * 0.31) * 0.08 + Math.sin(elapsed * 0.73) * 0.04;
        const wobbleY = Math.cos(elapsed * 0.27) * 0.07 + Math.sin(elapsed * 0.61) * 0.035;

        current.x = THREE.MathUtils.lerp(current.x, driftX + wobbleX, 0.03);
        current.y = THREE.MathUtils.lerp(current.y, driftY + wobbleY, 0.03);
        current.z = THREE.MathUtils.lerp(current.z, driftZ, 0.03);

        mineralGroup.position.x = baseX + current.x;
        mineralGroup.position.y = baseY + current.y;
        mineralGroup.position.z = current.z;

        // Slow organic rotation — no fixed axis, feels weightless
        mineralGroup.rotation.y = elapsed * 0.042 + Math.sin(elapsed * 0.19) * 0.12;
        mineralGroup.rotation.x = -0.08 + Math.sin(elapsed * 0.15) * 0.08 + Math.cos(elapsed * 0.23) * 0.04;

        mineral.rotation.y = elapsed * 0.065 + 0.42;
        mineral.rotation.x = Math.sin(elapsed * 0.13) * 0.06 - 0.13;
        mineral.rotation.z = -0.23 + Math.sin(elapsed * 0.09) * 0.05 + Math.cos(elapsed * 0.17) * 0.03;
        facets.rotation.copy(mineral.rotation);
        facets.rotation.y -= elapsed * 0.015;

        dust.rotation.y = -elapsed * 0.018;
        dust.rotation.z = Math.sin(elapsed * 0.11) * 0.025;
        ringOne.rotation.z = elapsed * 0.035;

        const attribute = dustGeometry.getAttribute("position");
        for (let i = 0; i < dustCount; i += 1) {
          const idx = i * 3;
          const angle = dustAngles[i] + elapsed * (0.025 + (i % 7) * 0.0015);
          const wave = Math.sin(elapsed * 0.32 + i * 0.17) * 0.06;
          attribute.setXYZ(
            i,
            Math.cos(angle) * dustRadius[i],
            dustPositions[idx + 1] + wave,
            Math.sin(angle) * dustRadius[i] * 0.55,
          );
        }
        attribute.needsUpdate = true;

        renderer.render(scene, camera);
      };

      window.addEventListener("resize", resize);
      animate();

      cleanup = () => {
        window.cancelAnimationFrame(frame);
        window.removeEventListener("resize", resize);
        texture?.dispose();
        geometry.dispose();
        material.dispose();
        facets.geometry.dispose();
        facetMaterial.dispose();
        dustGeometry.dispose();
        dustMaterial.dispose();
        ringOne.geometry.dispose();
        ringMaterial.dispose();
        renderer.dispose();
      };
    };

    startScene();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <canvas ref={canvasRef} className="vfx-wd-hero-canvas" aria-hidden="true" />;
}
