/*
 * Minimal service worker: it makes the site installable and shows a friendly offline page when a page cannot be reached.
 * It deliberately caches nothing else: pages, orders, pickup passes and API answers are personal and must always come from the server.
 */
const CACHE = "sap-shell-v2";
const OFFLINE = "/offline.html"; // a plain page with no scripts, so it also works with no connection

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.add(OFFLINE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Navigation preload: the browser sends its own page request to the server at once, with its normal headers (the server
      // tells a page load from an in-app move by them), and the worker only steps in when that request fails.
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.mode !== "navigate") return; // everything that is not opening a page goes straight to the network
  event.respondWith(
    (async () => {
      try {
        const preloaded = await event.preloadResponse;
        return preloaded || (await fetch(req));
      } catch {
        return (await caches.match(OFFLINE)) || Response.error();
      }
    })(),
  );
});
