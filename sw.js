const CACHE = 'derbi-v2';
const ASSETS = [
  './', './index.html', './style.css', './app.js', './manifest.webmanifest',
  './assets/mikail.webp', './assets/beytullah.webp', './assets/ibrahim.webp',
  './assets/mikail_head.webp', './assets/beytullah_head.webp', './assets/ibrahim_head.webp',
  './assets/mikail_torso.webp', './assets/mikail_legL.webp', './assets/mikail_legR.webp', './assets/mikail_arm.webp',
  './assets/beytullah_torso.webp', './assets/beytullah_legL.webp', './assets/beytullah_legR.webp', './assets/beytullah_arm.webp',
  './assets/ibrahim_torso.webp', './assets/ibrahim_legL.webp', './assets/ibrahim_legR.webp', './assets/ibrahim_arm.webp',
  './assets/logo_gs.webp', './assets/logo_fb.webp',
  './icons/icon-192.png', './icons/icon-512.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
