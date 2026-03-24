self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // ✅ POST request ให้ผ่านตรงๆ ไม่แตะเลย (แก้บั๊กลงเวลาไม่บันทึก)
  if (event.request.method === 'POST') return;

  // โค้ดผ่านทาง เพื่อให้มือถือรู้ว่านี่คือ PWA (แอปพลิเคชัน)
  event.respondWith(fetch(event.request).catch(() => new Response('Network error')));
});
