const CACHE_NAME = 'detailing-pwa-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './admin.html',
  './create.html'
];

// Установка: кэшируем ключевые страницы и сразу активируемся
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Активация: забираем контроль над всеми открытыми вкладками и чистим старые кэши
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Перехват запросов (Network First с fallback на Cache)
self.addEventListener('fetch', (event) => {
  // Обрабатываем только GET-запросы
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Если ответ валидный — обновляем копию в кэше
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Если сети нет или отвалилась — отдаем из кэша
        return caches.match(event.request);
      })
  );
});
