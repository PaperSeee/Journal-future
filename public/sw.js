// HqGambler service worker — minimal offline shell.
// Network-first for navigations/data (always fresh stats), cache-first for
// static assets so the app icon + shell load instantly when installed.

const CACHE = "hqgambler-v1";
const ASSETS = ["/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Never cache API/auth — always live.
  if (url.pathname.startsWith("/api")) return;

  // Static Next assets + our icons: cache-first.
  const isStatic =
    url.pathname.startsWith("/_next/static") ||
    /\.(svg|png|ico|webmanifest|woff2?)$/.test(url.pathname);

  if (isStatic) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
            return res;
          }),
      ),
    );
    return;
  }

  // Navigations / everything else: network-first, fall back to cache.
  event.respondWith(
    fetch(request).catch(() => caches.match(request).then((c) => c || Response.error())),
  );
});
