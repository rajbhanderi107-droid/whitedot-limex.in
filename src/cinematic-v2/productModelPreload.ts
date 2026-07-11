const modelPreloadCache = new Map<string, Promise<void>>();

export const liveCaseStudyModelUrls = [
  '/case-study/model/bobbin.glb',
  '/case-study/model/paint-container-procedural-red-white.glb',
  '/case-study/model/motor-cover-procedural-black.glb',
  '/case-study/model/araldite-container-procedural.glb',
  '/case-study/model/hand-wash-bottle-duo.glb',
  '/case-study/model/lunchbox-tray-four-color-lineup.glb',
  '/case-study/model/consile-pipe-procedural.glb',
  '/case-study/model/soap-stand-procedural.glb',
  '/case-study/model/oil-bottle-procedural.glb',
  '/case-study/model/dairy-sweet-container-procedural.glb',
  '/case-study/model/lunch-box.glb',
  '/case-study/model/Havmor_D500_Bowl.glb',
];

function addPreloadHint(url: string) {
  if (typeof document === 'undefined') return;
  if (document.head.querySelector(`link[data-wd-model-preload][href="${url}"]`)) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'fetch';
  link.href = url;
  link.type = 'model/gltf-binary';
  link.crossOrigin = 'anonymous';
  link.setAttribute('data-wd-model-preload', 'true');
  document.head.appendChild(link);
}

async function preloadOne(url: string) {
  const response = await fetch(url, {
    cache: 'force-cache',
    credentials: 'same-origin',
    priority: 'high',
  } as RequestInit & { priority: 'high' });

  if (!response.ok) {
    throw new Error(`Could not preload ${url}: ${response.status}`);
  }

  await response.arrayBuffer();
}

export function warmCaseStudyModelCache(urls = liveCaseStudyModelUrls) {
  if (typeof window === 'undefined') return;

  const uniqueUrls = [...new Set(urls.filter(Boolean))];
  uniqueUrls.forEach(addPreloadHint);

  uniqueUrls.forEach((url) => {
    if (modelPreloadCache.has(url)) return;
    modelPreloadCache.set(
      url,
      preloadOne(url).catch((error) => {
        console.warn('[WhiteDot] 3D model preload failed', error);
      }),
    );
  });
}

export function observeViewportModels(root: HTMLElement) {
  const viewers = [...root.querySelectorAll<HTMLElement>('model-viewer[data-model-src]')];
  if (!viewers.length) return () => undefined;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const viewer = entry.target as HTMLElement;
        const src = viewer.dataset.modelSrc;
        if (!src) return;

        if (entry.isIntersecting) {
          if (viewer.getAttribute('src') !== src) viewer.setAttribute('src', src);
        } else {
          viewer.removeAttribute('src');
        }
      });
    },
    { rootMargin: '500px 35%', threshold: 0.01 },
  );

  viewers.forEach((viewer) => observer.observe(viewer));

  return () => {
    observer.disconnect();
    viewers.forEach((viewer) => viewer.removeAttribute('src'));
  };
}
