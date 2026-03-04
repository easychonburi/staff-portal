self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // โค้ดผ่านทาง เพื่อให้มือถือรู้ว่านี่คือ PWA (แอปพลิเคชัน)
  event.respondWith(fetch(event.request).catch(() => new Response('Network error')));
});
