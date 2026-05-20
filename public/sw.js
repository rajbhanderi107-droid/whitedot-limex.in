// White Dot LLP — Continuity Layer service worker.
// Strategy: stale-while-revalidate over the app shell and same-origin assets.
// Bumping CACHE_VERSION invalidates all prior caches on next activation.
// Removable via `npm run remove:continuity:wd`.

const CACHE_VERSION = "wd-continuity-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./assets/whitedot-logo-enhanced.svg",
  "./assets/whitedot-symbol.svg",
  "./assets/india-map-source.svg",
  "./assets/limex-rock.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(staleWhileRevalidate(request));
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok && response.type === "basic") {
        cache.put(request, response.clone()).catch(() => undefined);
      }
      return response;
    })
    .catch(() => cached);

  return cached || network;
}
