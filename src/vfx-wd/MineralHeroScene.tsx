import { useEffect, useRef } from "react";
import type { Texture } from "three";

const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path}`.replace(/\/{2,}/g, "/");
const ROCK_TEXTURE = assetPath("assets/limex-rock.webp");

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
      mineralGroup.position.set(mobile ? 0.68 : 1.88, mobile ? 0.78 : 0.08, 0);
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

      const target = { x: 0, y: 0 };
      const current = { x: 0, y: 0 };
      const clock = new THREE.Clock();
      let frame = 0;

      const onPointerMove = (event: PointerEvent) => {
        target.x = (event.clientX / window.innerWidth - 0.5) * 2;
        target.y = -(event.clientY / window.innerHeight - 0.5) * 2;
      };

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
        current.x = THREE.MathUtils.lerp(current.x, target.x, 0.045);
        current.y = THREE.MathUtils.lerp(current.y, target.y, 0.045);

        mineralGroup.position.x = (mobile ? 0.68 : 1.88) + current.x * (mobile ? 0.09 : 0.18);
        mineralGroup.position.y = (mobile ? 0.78 : 0.08) + current.y * 0.1;
        mineralGroup.rotation.y = elapsed * 0.075 + current.x * 0.18;
        mineralGroup.rotation.x = -0.08 + current.y * 0.1;

        mineral.rotation.y = elapsed * 0.09 + 0.42;
        mineral.rotation.x = Math.sin(elapsed * 0.18) * 0.05 - 0.13;
        mineral.rotation.z = -0.23 + Math.sin(elapsed * 0.13) * 0.045;
        facets.rotation.copy(mineral.rotation);
        facets.rotation.y -= elapsed * 0.02;

        dust.rotation.y = -elapsed * 0.026;
        dust.rotation.z = Math.sin(elapsed * 0.16) * 0.035;
        ringOne.rotation.z = elapsed * 0.05;

        const attribute = dustGeometry.getAttribute("position");
        for (let i = 0; i < dustCount; i += 1) {
          const idx = i * 3;
          const angle = dustAngles[i] + elapsed * (0.035 + (i % 7) * 0.002);
          const wave = Math.sin(elapsed * 0.42 + i * 0.17) * 0.075;
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

      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("resize", resize);
      animate();

      cleanup = () => {
        window.cancelAnimationFrame(frame);
        window.removeEventListener("pointermove", onPointerMove);
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
