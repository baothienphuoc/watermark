// Service Worker for caching static assets
const CACHE_NAME = 'watermark-app-v2';
const APP_BASE_URL = new URL('.', self.location.href);

const resolveAssetUrl = (path) => new URL(path, APP_BASE_URL).href;

const urlsToCache = [
  resolveAssetUrl('index.html'),
  resolveAssetUrl('src/main.js'),
  resolveAssetUrl('src/styles/main.css'),
  resolveAssetUrl('src/components/WatermarkApp.js'),
  resolveAssetUrl('src/components/BrandSelector.js'),
  resolveAssetUrl('src/components/ImageUploader.js'),
  resolveAssetUrl('src/components/ImageGallery.js'),
  resolveAssetUrl('src/components/KeyboardManager.js'),
  resolveAssetUrl('src/components/DragDropManager.js'),
  resolveAssetUrl('src/services/WatermarkService.js'),
  resolveAssetUrl('src/services/ImageProcessor.js'),
  resolveAssetUrl('src/services/DownloadService.js'),
  resolveAssetUrl('src/config/brands.js'),
  resolveAssetUrl('src/config/constants.js'),
  resolveAssetUrl('src/utils/imageUtils.js'),
  resolveAssetUrl('src/utils/validators.js')
];

const APP_SHELL_URL = resolveAssetUrl('index.html');

const normalizeRequestUrl = (request) => {
  const url = new URL(request.url);
  url.search = '';
  return url.href;
};

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
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      if (event.request.mode === 'navigate') {
        const cachedShell = await cache.match(APP_SHELL_URL);

        try {
          const networkResponse = await fetch(event.request);

          if (networkResponse && networkResponse.ok) {
            return networkResponse;
          }

          return cachedShell || networkResponse;
        } catch (error) {
          return cachedShell || Response.error();
        }
      }

      const cacheKey = normalizeRequestUrl(event.request);
      const cachedResponse = await cache.match(cacheKey);

      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const response = await fetch(event.request);

        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();

        cache.put(cacheKey, responseToCache);

        return response;
      } catch (error) {
        return cachedResponse || Response.error();
      }
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
