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
  '/case-study/model/dairy-container-procedural.glb',
  '/case-study/model/rectangle-container-d250.glb',
  '/case-study/model/product-15-g1-clip.glb',
  '/case-study/model/round-pipe-procedural.glb',
  '/case-study/model/product-17-appliance-tray.glb',
  '/case-study/model/product-18-impeller.glb',
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

// ── Staggered, concurrency-limited model activation ──────────────────────────
// The case-study marquee holds ~26 <model-viewer> elements (13 models x2 for the
// infinite-scroll loop). Setting `src` on all of them at once makes three.js
// parse every GLB back-to-back on the main thread — that burst is what froze the
// tab ("page isn't responding"). Instead we feed src-activation through a queue
// that keeps at most MAX_CONCURRENT parses in flight and hands each one to the
// browser during idle time, so the main thread never blocks long enough to hang.
// Everything still loads — just spread across a few frames instead of one.
const MAX_CONCURRENT_MODEL_LOADS = 3;
const MODEL_LOAD_TIMEOUT_MS = 8000;

type ActivationTask = { viewer: HTMLElement; src: string };

const activationQueue: ActivationTask[] = [];
const queuedViewers = new WeakSet<HTMLElement>();
let activeLoads = 0;

const scheduleIdle: (cb: () => void) => void =
  typeof window !== 'undefined' &&
  'requestIdleCallback' in window
    ? (cb) => (window as typeof window & {
        requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
      }).requestIdleCallback(cb, { timeout: 300 })
    : (cb) => window.setTimeout(cb, 32);

function pumpActivationQueue() {
  while (activeLoads < MAX_CONCURRENT_MODEL_LOADS && activationQueue.length) {
    const task = activationQueue.shift()!;
    activeLoads++;
    scheduleIdle(() => runActivation(task));
  }
}

function runActivation({ viewer, src }: ActivationTask) {
  // Card may have been torn down (route change) before its turn came up.
  if (!viewer.isConnected) {
    activeLoads--;
    pumpActivationQueue();
    return;
  }

  let settled = false;
  const done = () => {
    if (settled) return;
    settled = true;
    viewer.removeEventListener('load', done);
    viewer.removeEventListener('error', done);
    window.clearTimeout(timer);
    activeLoads--;
    pumpActivationQueue();
  };

  // Fallback: don't let one stuck/broken model stall the whole queue.
  const timer = window.setTimeout(done, MODEL_LOAD_TIMEOUT_MS);
  viewer.addEventListener('load', done, { once: true });
  viewer.addEventListener('error', done, { once: true });

  if (viewer.getAttribute('src') !== src) {
    viewer.setAttribute('src', src);
  } else {
    done();
  }
}

function enqueueActivation(viewer: HTMLElement, src: string) {
  if (queuedViewers.has(viewer)) return;
  if (viewer.getAttribute('src') === src) return;
  queuedViewers.add(viewer);
  activationQueue.push({ viewer, src });
  pumpActivationQueue();
}

export function observeViewportModels(root: HTMLElement) {
  const viewers = [...root.querySelectorAll<HTMLElement>('model-viewer[data-model-src]')];
  if (!viewers.length) return () => undefined;

  // Load each model exactly once when it first nears the viewport, then stop
  // observing it. Activation goes through the shared concurrency queue above so
  // GLB parsing is staggered instead of bursting. model-viewer 3.x shares one
  // WebGL context and skips rendering offscreen scenes, so keeping loaded
  // models attached is cheap — we never detach (detaching forced re-parse).
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const viewer = entry.target as HTMLElement;
        const src = viewer.dataset.modelSrc;
        if (src) enqueueActivation(viewer, src);
        observer.unobserve(viewer);
      });
    },
    { rootMargin: '900px 40%', threshold: 0.01 },
  );

  viewers.forEach((viewer) => observer.observe(viewer));

  return () => {
    observer.disconnect();
  };
}
