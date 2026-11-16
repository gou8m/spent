/* Spent. service worker.
 *
 * Deliberately small and safe for a finance app:
 *  - Caches ONLY public, non-personal files: the build's static assets, the app icons and one
 *    offline page. It never stores pages, API responses or server-action calls, so nothing about a
 *    signed-in user is ever kept by the worker.
 *  - Page navigations always go to the network. If the network is unreachable, the cached
 *    /offline page is shown instead of the browser's error screen.
 */
const VERSION = "v1";
const STATIC_CACHE = `spent-static-${VERSION}`;
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/icons/192", "/icons/512"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("spent-static-") && k !== STATIC_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return; // server actions and form posts are never touched

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Page loads: network first, offline page if there is no connection.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL).then((r) => r || Response.error())));
    return;
  }

  // Build output and icons are content-hashed or static: serve from cache, refresh in the background.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request)
            .then((response) => {
              if (response.ok) cache.put(request, response.clone());
              return response;
            })
            .catch(() => cached);
          return cached || network;
        }),
      ),
    );
  }
});
