const VERSION = 1;
const OFFLINE_URL = "/offline";
const CACHE_NAME = `${VERSION}.cheqii-cache`;
const CACHED_URLS = ["/", OFFLINE_URL];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHED_URLS)));
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    fetch(e.request)
      .then((fetchResponse) => {
        // Always avoid stale data if possible, fetch first then check cache
        const requestUrl = new URL(e.request.url);
        if (
          fetchResponse.status === 200 &&
          fetchResponse.type === "basic" &&
          requestUrl.protocol.match(/^(http|https):/)
        ) {
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
          return fetchResponse;
        }
        return caches.match(e.request).then((cacheResponse) => cacheResponse || fetchResponse);
      })
      .catch((err) => {
        console.log(err);
        caches.open(CACHE_NAME).then((cache) => cache.match(OFFLINE_URL));
      })
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((cacheName) =>
      Promise.all(
        cacheName.reduce((acc, key) => {
          if (key.indexOf(VERSION) !== 0) {
            acc.push(caches.delete(key));
          }
          return acc;
        }, [])
      )
    )
  );
});
