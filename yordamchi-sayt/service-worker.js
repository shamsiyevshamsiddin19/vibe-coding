/* Yordamchi service worker — network-first navigatsiya, eski keshlarni tozalaydi. */
const CACHE = 'yordamchi-v3-20260727n1';
// Faqat versiyasiz yo'llar — asset versiyalari o'zgarganda ro'yxat eskirmasin.
// Qolgani birinchi tashrifda stale-while-revalidate orqali keshlanadi.
const SHELL = ['./', './index.html'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k)))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // API / bot / dinamik — hech qachon keshlanmaydi
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/boost')) return;

  // Navigatsiya (HTML) — network-first, offline'da index.html
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((r) => { caches.open(CACHE).then((c) => c.put('./index.html', r.clone())); return r; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Statik (css/js/img) — stale-while-revalidate
  e.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req).then((r) => {
        if (r && r.status === 200) caches.open(CACHE).then((c) => c.put(req, r.clone()));
        return r;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
