const CACHE = 'celebrate-v1'
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json', '/robots.txt', '/sitemap.xml', '/favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request))
    return
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, '/index.html'))
    return
  }

  event.respondWith(cacheFirst(event.request))
})

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const clone = response.clone()
    const cache = await caches.open(CACHE)
    cache.put(request, clone)
  }
  return response
}

async function networkFirst(request, fallbackUrl) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const clone = response.clone()
      const cache = await caches.open(CACHE)
      cache.put(request, clone)
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    if (fallbackUrl) return caches.match(fallbackUrl)
    throw new Error('offline')
  }
}
