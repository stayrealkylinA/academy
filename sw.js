// Keeps the app working offline. Shows the saved copy right away and
// quietly fetches the newest version in the background for next time.
const CACHE = 'academy-v19';
// 3D pictures live in their own store, so app updates don't download them again
const PICS = 'academy-pics-v1';
const FILES = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== PICS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // pictures and voice clips never change: use the saved one, download only if missing
  const path = new URL(e.request.url).pathname;
  if (path.includes('/emoji/') || path.includes('/voice/')){   // pictures + recorded voice clips
    e.respondWith(caches.open(PICS).then(async cache => {
      const hit = await cache.match(e.request, {ignoreSearch: true});
      if (hit) return hit;
      const res = await fetch(e.request);
      if (res && res.ok) cache.put(e.request, res.clone());
      return res;
    }));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(e.request, {ignoreSearch: true});
    const fresh = fetch(e.request).then(res => {
      if (res && res.ok) cache.put(e.request, res.clone());
      return res;
    }).catch(() => cached);
    return cached || fresh;
  }));
});
