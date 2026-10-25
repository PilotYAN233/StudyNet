/* StudyNet service worker — static shell only, never caches AI requests */
const VERSION = 'studynet-v1.0.1';
const CORE = [
  './',
  './index.html',
  './chat.html',
  './mistakes.html',
  './plan.html',
  './focus.html',
  './settings.html',
  './404.html',
  './offline.html',
  './manifest.webmanifest',
  './assets/css/base.css',
  './assets/css/pages.css',
  './assets/js/core.js',
  './assets/js/ui.js',
  './assets/js/ai.js',
  './assets/js/shell.js',
  './assets/js/dashboard.js',
  './assets/js/chat.js',
  './assets/js/mistakes.js',
  './assets/js/plan.js',
  './assets/js/focus.js',
  './assets/js/settings.js',
  './assets/vendor/katex/katex.min.css',
  './assets/vendor/katex/katex.min.js',
  './assets/fonts/manrope-latin.woff2',
  './assets/icons/favicon.svg',
  './assets/icons/icon-180.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/maskable-512.png',
  './assets/img/og-cover.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return (await caches.match('./offline.html')) || (await caches.match('./index.html'));
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
