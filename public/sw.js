// Life Gamified service worker: offline shell + push notifications.
const CACHE = 'lg-shell-v2';
const SCOPE = self.registration.scope;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll([SCOPE, `${SCOPE}manifest.webmanifest`, `${SCOPE}icons/icon-192.png`])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // never cache Supabase or font requests here
  if (req.mode === 'navigate') {
    // Network first so updates land quickly; fall back to the cached shell offline.
    e.respondWith(fetch(req).then(res => { caches.open(CACHE).then(c => c.put(SCOPE, res.clone())); return res; }).catch(() => caches.match(SCOPE)));
    return;
  }
  if (url.pathname.includes('/assets/') || url.pathname.includes('/icons/')) {
    // Hashed build assets never change: cache first.
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })));
  }
});

self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { data = { title: 'Life Gamified', body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(data.title || 'Life Gamified', {
    body: data.body || '',
    tag: data.tag || 'lg',
    renotify: !!data.tag,
    icon: `${SCOPE}icons/icon-192.png`,
    badge: `${SCOPE}icons/badge.png`,
    data: { url: data.url || SCOPE },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || SCOPE;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if (c.url.startsWith(SCOPE) && 'focus' in c) return c.focus();
    return self.clients.openWindow(target);
  }));
});
