/* Marco XP root service worker.
   Bump CACHE on every deploy that changes shell assets: marco-xp-vN. */
const CACHE = "marco-xp-v3";

const SHELL = [
  "/",
  "/index.html",
  "/css/xp.css",
  "/js/icons.js",
  "/js/apps.js",
  "/js/wm.js",
  "/content/content.json",
  "/manifest.json",
  "/favicon.svg",
  "/icons/xp-192.png",
  "/icons/xp-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith("marco-xp-") && k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  /* The roulette trainer has its own service worker scoped to its folder
     (cache roulette-trainer-v*). Never touch it. */
  if (url.pathname.startsWith("/roulette-trainer/")) return;
  if (e.request.method !== "GET" || url.origin !== location.origin) return;

  /* Navigations: network-first so deploys land, cached shell as offline fallback. */
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(e.request).then((hit) => hit || caches.match("/index.html")))
    );
    return;
  }

  /* content.json: stale-while-revalidate — instant render, fresh next visit. */
  if (url.pathname === "/content/content.json") {
    e.respondWith(
      caches.open(CACHE).then(async (c) => {
        const cached = await c.match(e.request);
        const refresh = fetch(e.request)
          .then((res) => { if (res.ok) c.put(e.request, res.clone()); return res; })
          .catch(() => cached);
        return cached || refresh;
      })
    );
    return;
  }

  /* Everything else: cache-first with network fill. */
  e.respondWith(
    caches.match(e.request).then(
      (hit) =>
        hit ||
        fetch(e.request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
    )
  );
});
