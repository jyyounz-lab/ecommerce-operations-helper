const CACHE = "ecommerce-helper-v2.0.0";
const ASSETS = ["./", "./index.html", "./styles.css", "./app.js", "./calculators.js", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("ecommerce-helper-v") && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", event => {
 const url = new URL(event.request.url);
 if (event.request.method !== "GET" || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
 event.respondWith((async () => {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(event.request);
  // Each version precaches an atomic set of application assets.
  if (cached) return cached;
  try { return await fetch(event.request); }
  catch { return event.request.mode === "navigate" ? await cache.match("./index.html") : Response.error(); }
 })());
});
