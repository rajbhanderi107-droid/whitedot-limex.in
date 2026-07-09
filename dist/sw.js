// White Dot LLP — service worker retirement stub.
//
// The app retired the Continuity precache service worker (see src/main.tsx:
// "Retire any previously-registered service worker ... so it cannot serve
// stale cached content over the new experience.").
//
// This stub guarantees that any browser still running the OLD caching service
// worker will: skip waiting, purge every cache it created, and unregister
// itself — so the next normal navigation is served fresh from the network
// instead of a stale app shell.
//
// It deliberately does NOT force-navigate open tabs. On some devices the
// still-executing old cached page re-registered a service worker on its own
// reload, which combined with a forced client.navigate() here produced an
// endless reload loop. Purging caches + unregistering is sufficient — no
// forced reload is needed for that to take effect on the next real load.
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
    })(),
  );
});
