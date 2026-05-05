const CACHE = "roulette-trainer-v2";
const ASSETS = [
  "/roulette-trainer/",
  "/roulette-trainer/index.html",
  "/roulette-trainer/manifest.json",
  "/roulette-trainer/js/data.js",
  "/roulette-trainer/js/state.js",
  "/roulette-trainer/js/audio.js",
  "/roulette-trainer/js/questions.js",
  "/roulette-trainer/js/wheel.js",
  "/roulette-trainer/js/sectors.js",
  "/roulette-trainer/js/reference.js",
  "/roulette-trainer/js/session.js",
  "/roulette-trainer/js/app.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);
  if (
    url.origin !== location.origin ||
    !url.pathname.startsWith("/roulette-trainer/")
  )
    return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(e.request)),
  );
});
