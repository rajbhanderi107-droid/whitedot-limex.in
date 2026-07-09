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
  '../model/dairy-container-procedural.glb',
].map((path) => new URL(path, import.meta.url).href);

const cache = window.__WD_CASE_STUDY_MODEL_PRELOADS__ || new Map();
window.__WD_CASE_STUDY_MODEL_PRELOADS__ = cache;

function addPreloadHint(url) {
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
    addPreloadHint(url);
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
