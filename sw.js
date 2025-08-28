// Service Worker for caching static assets
const CACHE_NAME = 'watermark-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/styles/main.css',
  '/src/components/WatermarkApp.js',
  '/src/components/BrandSelector.js',
  '/src/components/ImageUploader.js',
  '/src/components/ImageGallery.js',
  '/src/components/KeyboardManager.js',
  '/src/components/DragDropManager.js',
  '/src/services/WatermarkService.js',
  '/src/services/ImageProcessor.js',
  '/src/services/DownloadService.js',
  '/src/config/brands.js',
  '/src/config/constants.js',
  '/src/utils/imageUtils.js',
  '/src/utils/validators.js'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
