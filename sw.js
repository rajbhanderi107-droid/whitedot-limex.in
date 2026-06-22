// White Dot LLP — service worker retirement stub.
//
// The app retired the Continuity precache service worker (see src/main.tsx:
// "Retire any previously-registered service worker ... so it cannot serve
// stale cached content over the new experience.").
//
// This stub guarantees that any browser still running the OLD caching service
// worker will: skip waiting, purge every cache it created, unregister itself,
// and reload open tabs against the network — so users always receive the
// latest deployed build instead of a stale app shell.
//
// It deliberately has NO fetch handler, so it never intercepts requests.
// Removable via `npm run remove:continuity:wd`.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      } catch {
        /* cache API unavailable — nothing to purge */
      }
      await self.clients.claim();
      try {
        await self.registration.unregister();
      } catch {
        /* already gone */
      }
      // Force-refresh any open windows so the stale shell is replaced.
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.navigate(client.url);
      }
    })(),
  );
});
