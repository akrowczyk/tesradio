// TESRADIO service worker — caches the app shell only, never the audio streams.
const CACHE = 'tesradio-shell-v1';
const SHELL = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/icon.svg',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isAudio =
    req.destination === 'audio' ||
    /\.(mp3|aac|m3u8|ogg|opus|flac|wav)(\?|$)/i.test(url.pathname) ||
    url.hostname.includes('streamtheworld') ||
    url.hostname.includes('surfernetwork') ||
    url.hostname.includes('streamguys') ||
    url.hostname.includes('shoutcast') ||
    url.hostname.includes('icecast') ||
    url.hostname.includes('somafm');
  if (isAudio) return; // pass through, never cache

  // App shell: cache-first, fall back to network, refresh in background
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const clone = res.clone();
              caches.open(CACHE).then((c) => c.put(req, clone));
            }
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
