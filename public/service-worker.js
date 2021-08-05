// Declare variables for Cache items
const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";
const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/assets/css/styles.css",
    "/manifest.webmanifest",
    "/assets/js/db.js",
    "/assets/js/index.js",
    "/assets/images/icons/icon-192x192.png",
    "/assets/images/icons/icon-512x512.png",
    "https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css",
    "https://cdn.jsdelivr.net/npm/chart.js@2.8.0"
];

// Install
self.addEventListener("install", function (event) {
    // pre cache for static assets
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("Files successfully captured")
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    // Activate immediately once browser has loaded
    self.skipWaiting();
});

// Activate
self.addEventListener("activate", function(event) {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log("Removing old cache data", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

// Fetch
self.addEventListener("fetch", function(event) {
    if(event.request.url.includes("/api/transaction")) {
        event.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                console.log("fetch request: ", event)
                return fetch(event.request)
                    .then(response => {
                        // If a good response, clone it and store in cache
                        if(response.status === 200) {
                            cache.put(event.request.url, response.clone());
                        }
                        // Return response
                        return response;
                    })
                    // Catch 
                    .catch(err => {
                        // If Network Request fails, attempt to retrieve from cache
                        return cache.match(event.request);
                });
            })
        );

        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then (response => {
                return response || fetch(event.request);
            });
        })
    )
});