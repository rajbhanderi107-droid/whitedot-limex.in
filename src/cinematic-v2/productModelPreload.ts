const modelPreloadCache = new Map<string, Promise<void>>();

export const liveCaseStudyModelUrls = [
  '/case-study/model/bobbin.glb',
  '/case-study/model/paint-container-procedural-red-white.glb',
  '/case-study/model/motor-cover-procedural-black.glb',
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

// NOTE: deliberately no <link rel="preload" as="fetch" crossorigin> hint here.
// That hint issues a *credentials-omit* CORS request, while model-viewer (and
// preloadOne below) fetch with the default same-origin credentials mode — the
// two use different HTTP cache keys, so the hint made every warmed GLB download
// twice instead of once. The plain fetch below warms the same cache entry
// model-viewer will hit, which is what we actually want.
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
// Raised from 2/3: these limits were set when a single GLB could be 15-49MB and
// parsing one blocked the main thread long enough to hang the tab. Post-shrink
// the median model is ~250KB, and the old ceiling was throttling mobile so hard
// that cards were evicted before their turn in the queue came up.
const MAX_CONCURRENT_MODEL_LOADS =
  typeof window !== 'undefined' && window.innerWidth < 1024 ? 4 : 6;
// How long one model may hold a concurrency slot before the queue moves on.
// This is a *scheduling* deadline, not a failure verdict: the model keeps
// loading in the background and pops in whenever it finishes.
const MODEL_SLOT_TIMEOUT_MS = 6000;

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

  // Releasing the concurrency slot and declaring the model dead are two
  // different things. Previously a single 8s timer did both: on a slow phone
  // connection a perfectly good GLB that simply hadn't arrived yet got tagged
  // data-model-failed, and the CSS then hid it *permanently* — the card stayed
  // a "3D" placeholder even after the model finished downloading. That is the
  // "models don't show" symptom. Now the timer only frees the queue slot.
  let slotReleased = false;
  const releaseSlot = () => {
    if (slotReleased) return;
    slotReleased = true;
    window.clearTimeout(timer);
    activeLoads--;
    pumpActivationQueue();
  };

  const onLoad = () => {
    viewer.removeAttribute('data-model-failed');
    releaseSlot();
  };
  // Only a real load error marks the card as failed, so CSS can surface the
  // placeholder ring instead of an empty void.
  const onFail = () => {
    viewer.setAttribute('data-model-failed', 'true');
    releaseSlot();
  };

  const timer = window.setTimeout(releaseSlot, MODEL_SLOT_TIMEOUT_MS);
  viewer.addEventListener('load', onLoad, { once: true });
  viewer.addEventListener('error', onFail, { once: true });

  if (viewer.getAttribute('src') !== src) {
    // model-viewer applies its OWN viewport gate unless loading is "eager"
    // (the default "auto" behaves lazily). That is a second gate on top of the
    // LRU pool, and it is the one that never opened: the pool would mount and
    // set src on a card scrolling into view, model-viewer would decline to
    // fetch because it judged the element not close enough yet, and the card
    // was evicted before it ever changed its mind — so it stayed a blank
    // placeholder forever. Verified directly: flipping a pending viewer to
    // eager made it fetch and load from 3300px off-screen. The pool already
    // decides what deserves to load, so let it be the only gate.
    viewer.setAttribute('loading', 'eager');
    viewer.setAttribute('src', src);
  } else {
    releaseSlot();
  }
}

function enqueueActivation(viewer: HTMLElement, src: string) {
  if (queuedViewers.has(viewer)) return;
  if (viewer.getAttribute('src') === src) return;
  queuedViewers.add(viewer);
  activationQueue.push({ viewer, src });
  pumpActivationQueue();
}

// ── model-viewer pool (bounded, LRU) — ALL viewports ──────────────────────
// An IntersectionObserver promotes a product's key into a small LRU set as its
// card scrolls into view, evicting the oldest once the cap is hit. React (see
// CaseStudyPage.tsx / CaseStudyFeature.tsx) uses that set to swap an evicted
// card's <model-viewer> back out for a placeholder, actually unmounting it so
// the browser can reclaim it — not just hiding it.
//
// This used to be mobile-only, on the assumption that ~70 mounted viewers were
// cheap on desktop because model-viewer shares one WebGL context. That
// assumption was wrong, and it was masked for a long time by a bug: the models
// were so oversized that most of them hit an 8s load timeout, got tagged
// data-model-failed and were hidden by CSS, so only a handful were ever really
// live. Once the GLBs were shrunk 138MB -> 13MB they all started loading
// successfully — 70 live scenes holding ~5.3M triangles — and that reliably
// froze the renderer on desktop as well as mobile. The pool is the actual fix;
// nothing should depend on models failing to load.
//
// Cards are duplicated for the marquee loop, so N keys means up to 2N mounted
// viewers. Keep the desktop cap comfortably above the number of cards visible
// at once so scrolling doesn't visibly pop.
// 6 was chosen back when each GLB was megabytes of 4K-textured, 100k+ triangle
// geometry. After the 138MB -> 9MB / 3.3M -> 1.5M triangle pass a mounted model
// costs a fraction of what it did, and a cap that tight evicted cards before
// they finished loading. 10 still keeps mobile far below the level that crashes
// Safari (the failure was ~70 live scenes) while leaving a card loaded long
// enough to be seen.
export const MAX_MOBILE_ACTIVE_MODELS = 10;
export const MAX_DESKTOP_ACTIVE_MODELS = 12;

export function maxActiveModels() {
  return typeof window !== 'undefined' && window.innerWidth < 1024
    ? MAX_MOBILE_ACTIVE_MODELS
    : MAX_DESKTOP_ACTIVE_MODELS;
}

// NOTE: there was briefly an initialMobileModelPool() here that pre-seeded this
// set so the grid's first cards rendered without waiting for an
// IntersectionObserver callback. It was removed: the "IO never fires" symptom it
// chased was an artifact of testing in a backgrounded window, and on a real
// phone the seed made the page eagerly build 6 WebGL contexts during initial
// load for a grid that is far below the fold. Let the pool fill on scroll.

export function observeMobileModelPool(
  root: HTMLElement,
  onChange: (updater: (prev: Set<string>) => Set<string>) => void,
) {
  const cards = [...root.querySelectorAll<HTMLElement>('.csp-pcard[data-product]')];
  if (!cards.length) return () => undefined;

  const cap = maxActiveModels();
  const order: string[] = [];

  const observer = new IntersectionObserver(
    (entries) => {
      let changed = false;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const key = (entry.target as HTMLElement).dataset.product;
        if (!key) return;
        // Re-entering a card refreshes its recency so the marquee's looping
        // cards don't evict the ones currently on screen.
        const at = order.indexOf(key);
        if (at !== -1) {
          if (at === order.length - 1) return;
          order.splice(at, 1);
        }
        order.push(key);
        changed = true;
      });
      if (!changed) return;
      while (order.length > cap) order.shift();
      onChange(() => new Set(order));
    },
    // Generous lead time on purpose. At 200px a card (~380px tall on a phone)
    // was promoted barely before it hit the screen, so with only 2 concurrent
    // loads the model was still downloading when scrolling evicted it again —
    // measured on a real mobile viewport, a full scroll of 35 products fired
    // just 9 GLB requests and left most cards as permanent placeholders.
    // Promoting ~2 cards ahead gives each model time to actually finish.
    { rootMargin: '800px 0px', threshold: 0.01 },
  );

  cards.forEach((card) => observer.observe(card));

  return () => {
    observer.disconnect();
  };
}

// Activate every mounted viewer straight away, no IntersectionObserver.
// Only for the mobile path: the LRU pool already caps how many viewers exist in
// the DOM at MAX_MOBILE_ACTIVE_MODELS and only mounts ones at or near the
// viewport, so the set is bounded and viewport-relevant by construction — the
// IO gate adds nothing there except a dependency on a callback the browser
// delays or drops entirely while the document is backgrounded. Activation still
// goes through the shared concurrency queue, so parses stay staggered.
export function activateMountedModels(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('model-viewer[data-model-src]').forEach((viewer) => {
    const src = viewer.dataset.modelSrc;
    if (src) enqueueActivation(viewer, src);
  });
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
