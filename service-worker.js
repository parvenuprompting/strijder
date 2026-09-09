// Service worker — offline eerst (oefenen in de bus zonder internet)
const CACHE = 'strijder-v1';
const BESTANDEN = ['index.html', 'app.js', 'vragen.json', 'manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BESTANDEN)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
});

self.addEventListener('fetch', e => {
  // alleen lokale bestanden cache-first; OpenRouter-calls gaan direct online
  if (!e.request.url.includes('openrouter')) {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request))
    );
  }
});
