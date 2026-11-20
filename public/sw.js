/* Spent. service worker.
 *
 * What it keeps on the device, and why it is safe for a finance app:
 *  1. Static files (the build's JS/CSS/fonts, app icons, the offline page). Nothing personal.
 *  2. The last successfully loaded copy of the main app pages (Home, Transactions, Budgets,
 *     Goals, Accounts, Reports, Recurring, Groups, People, Loans, Calendar, Settings), so they open instantly on a slow connection
 *     and can still be read offline. These copies are personal, so they are
 *       - only ever shown when the network is slow (4s) or unreachable, never instead of fresh data,
 *       - deleted the moment the user is signed out (the login page tells us to; see PwaRegister),
 *       - never created from a redirected response (a signed-out visitor cannot cache anything).
 *  Server actions and every non-GET request always go to the network untouched.
 */
const VERSION = "v3";
const STATIC_CACHE = `spent-static-${VERSION}`;
const PAGES_CACHE = `spent-pages-${VERSION}`;
const OFFLINE_URL = "/offline.html"; // plain static HTML (see public/offline.html)
const PRECACHE = [OFFLINE_URL, "/icons/192", "/icons/512"];
const SLOW_NETWORK_MS = 4000;

const CACHEABLE_PAGE_PREFIXES = ["/dashboard", "/transactions", "/budgets", "/goals", "/accounts", "/reports", "/recurring", "/profile", "/groups", "/people", "/loans", "/calendar"];
const isCacheablePage = (pathname) => CACHEABLE_PAGE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => (k.startsWith("spent-static-") && k !== STATIC_CACHE) || (k.startsWith("spent-pages-") && k !== PAGES_CACHE))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// The page asks us to forget every saved page (sent from the login screen, i.e. after sign-out).
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "purge-pages") event.waitUntil(caches.delete(PAGES_CACHE));
});

function fetchWithTimeout(request, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("slow")), ms);
    fetch(request).then(
      (response) => {
        clearTimeout(timer);
        resolve(response);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function handleNavigation(request) {
  const url = new URL(request.url);
  const cacheable = isCacheablePage(url.pathname);
  const pages = cacheable ? await caches.open(PAGES_CACHE) : null;
  const saved = pages ? await pages.match(request.url, { ignoreVary: true }) : undefined;

  try {
    // With a saved copy to fall back on, do not make the user wait on a slow connection.
    const response = await (saved ? fetchWithTimeout(request, SLOW_NETWORK_MS) : fetch(request));
    if (pages && response.ok && response.type === "basic" && !response.redirected) pages.put(request.url, response.clone());
    // Signed out: a redirect to the login page means whatever we saved belongs to someone who left.
    if (pages && response.redirected && new URL(response.url).pathname.startsWith("/login")) await caches.delete(PAGES_CACHE);
    return response;
  } catch {
    if (saved) return saved;
    return (await caches.match(OFFLINE_URL)) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return; // server actions and form posts are never touched

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
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
