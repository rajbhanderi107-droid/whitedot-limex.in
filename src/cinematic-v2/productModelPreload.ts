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
  '/case-study/model/D500_Bowl.glb',
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
const MAX_CONCURRENT_MODEL_LOADS =
  typeof window !== 'undefined' && window.innerWidth < 1024 ? 2 : 3;
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
    viewer.removeEventListener('error', onFail);
    window.clearTimeout(timer);
    activeLoads--;
    pumpActivationQueue();
  };
  // A GLB that errors, or that never loads within the timeout (stuck
  // decode, GPU/WebGL failure, flaky mobile network), used to just leave the
  // card blank with no signal — mark it so CSS can fall back to a visible
  // placeholder instead of an empty void.
  const onFail = () => { viewer.setAttribute('data-model-failed', 'true'); done(); };

  // Fallback: don't let one stuck/broken model stall the whole queue.
  const timer = window.setTimeout(onFail, MODEL_LOAD_TIMEOUT_MS);
  viewer.addEventListener('load', done, { once: true });
  viewer.addEventListener('error', onFail, { once: true });

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

// ── Mobile model-viewer pool (bounded, LRU) ───────────────────────────────
// On desktop, up to ~70 <model-viewer> elements stay mounted forever once
// activated (see observeViewportModels above) — model-viewer's shared
// renderer makes that cheap. On real mobile Safari, a static grid of 35 live
// products each getting its own persistently-mounted <model-viewer> proved
// unreliable in practice (cards render blank instead of crashing — a step
// forward from the previous marquee crash, but still not "visible"). Rather
// than trust every device to gracefully cope with 35 simultaneous mounted
// instances, cap how many are EVER mounted in the DOM at once on mobile: an
// IntersectionObserver promotes a product's key into a small LRU set as its
// card scrolls into view, evicting the oldest entry once the cap is hit.
// React (see CaseStudyPage.tsx / CaseStudyFeature.tsx) uses that set to
// swap the evicted card's <model-viewer> back out for a placeholder,
// actually unmounting it so the browser can reclaim it — not just hiding it.
export const MAX_MOBILE_ACTIVE_MODELS = 6;

export function observeMobileModelPool(
  root: HTMLElement,
  onChange: (updater: (prev: Set<string>) => Set<string>) => void,
) {
  const cards = [...root.querySelectorAll<HTMLElement>('.csp-pcard[data-product]')];
  if (!cards.length) return () => undefined;

  const order: string[] = [];

  const observer = new IntersectionObserver(
    (entries) => {
      let changed = false;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const key = (entry.target as HTMLElement).dataset.product;
        if (!key || order.includes(key)) return;
        order.push(key);
        changed = true;
      });
      if (!changed) return;
      while (order.length > MAX_MOBILE_ACTIVE_MODELS) order.shift();
      onChange(() => new Set(order));
    },
    { rootMargin: '200px 0px', threshold: 0.01 },
  );

  cards.forEach((card) => observer.observe(card));

  return () => {
    observer.disconnect();
  };
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
