const LIVE_CASE_STUDY_MODELS = [
  '../model/bobbin.glb',
  '../model/paint-container-procedural-red-white.glb',
  '../model/motor-cover-procedural-black.glb',
  '../model/araldite-container-procedural.glb',
  '../model/hand-wash-bottle-duo.glb',
  '../model/lunchbox-tray-four-color-lineup.glb',
  '../model/consile-pipe-procedural.glb',
  '../model/soap-stand-procedural.glb',
  '../model/oil-bottle-procedural.glb',
  '../model/dairy-products-container.glb',
].map((path) => new URL(path, import.meta.url).href);

const cache = window.__WD_CASE_STUDY_MODEL_PRELOADS__ || new Map();
window.__WD_CASE_STUDY_MODEL_PRELOADS__ = cache;

// No <link rel="preload" as="fetch" crossorigin> hint: it fetches with
// credentials omitted, which is a different HTTP cache key from the plain
// fetch below (and from model-viewer's own load), so every warmed GLB was
// downloaded twice. The fetch alone warms the entry model-viewer will reuse.
async function preloadModel(url) {
  const response = await fetch(url, {
    cache: 'force-cache',
    credentials: 'same-origin',
    priority: 'high',
  });

  if (!response.ok) {
    throw new Error(`Could not preload ${url}: ${response.status}`);
  }

  await response.arrayBuffer();
}

export function warmCaseStudyModels(urls = LIVE_CASE_STUDY_MODELS) {
  [...new Set(urls.filter(Boolean))].forEach((url) => {
    if (cache.has(url)) return;
    cache.set(
      url,
      preloadModel(url).catch((error) => {
        console.warn('[WhiteDot] 3D model preload failed', error);
      }),
    );
  });
}

warmCaseStudyModels();
