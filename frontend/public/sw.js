const CACHE_VERSION = 'music-screen-v1'
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`
const APP_SHELL_URLS = ['/', '/favicon.svg']
const CACHEABLE_DESTINATIONS = new Set(['document', 'script', 'style', 'image', 'font'])
const CACHEABLE_EXTENSIONS = /\.(?:js|css|html|svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf)$/i

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_URLS)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => !cacheName.startsWith(CACHE_VERSION))
          .map((cacheName) => caches.delete(cacheName)),
      ),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  const requestUrl = new URL(request.url)
  if (requestUrl.origin !== self.location.origin) return

  const isNavigation = request.mode === 'navigate'
  const isCacheableAsset =
    CACHEABLE_DESTINATIONS.has(request.destination) || CACHEABLE_EXTENSIONS.test(requestUrl.pathname)

  if (!isNavigation && !isCacheableAsset) return

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkResponse = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const responseToCache = response.clone()
            caches.open(isNavigation ? APP_SHELL_CACHE : RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return response
        })
        .catch(() => cachedResponse)

      return cachedResponse || networkResponse
    }),
  )
})
