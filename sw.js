const CACHE = 'broiler-v2';
const ASSETS = [
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS.map(url => new Request(url, {mode: 'cors'}))))
      .catch(() => caches.open(CACHE).then(c => c.addAll(['./index.html','./manifest.json'])))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network-first for same-origin HTML, cache-first for assets
  const url = new URL(e.request.url);
  const isHTML = e.request.destination === 'document';
  
  if (isHTML) {
    e.respondWith(
      fetch(e.request)
        .then(r => { const c = r.clone(); caches.open(CACHE).then(ch => ch.put(e.request, c)); return r; })
        .catch(() => caches.match('./index.html'))
    );
  } else {
    e.respondWith(
      caches.match(e.request)
        .then(r => r || fetch(e.request)
          .then(nr => { const c = nr.clone(); caches.open(CACHE).then(ch => ch.put(e.request, c)); return nr; })
          .catch(() => caches.match('./index.html'))
        )
    );
  }
});
