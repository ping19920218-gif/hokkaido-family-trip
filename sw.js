const CACHE = 'hokkaido-pwa-v22';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    // HTML 走 network-first：在线永远拿最新(含内嵌行程数据)，离线回退缓存
    e.respondWith(fetch(req).then(resp => {
      const cp = resp.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); return resp;
    }).catch(() => caches.match('./index.html').then(r => r || caches.match('./'))));
  } else {
    // 图标/地图瓦片/CDN 走 cache-first + 后台回填
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(resp => {
      const cp = resp.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return resp;
    }).catch(() => r)));
  }
});
