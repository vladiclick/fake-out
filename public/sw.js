/* Fake Out — service worker kill-switch.
   Earlier versions cached same-origin assets cache-first, which in dev served
   stale Vite/React module chunks and crashed the app. This version purges all
   caches, unregisters itself, and reloads open clients so nothing stays stale. */

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((c) => c.navigate(c.url));
    })(),
  );
});
