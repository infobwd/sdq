// sw.js - Service Worker for Teacher Dashboard
const CACHE_NAME = 'teacher-dashboard-v1.0.0';
const urlsToCache = [
    './teacher-dashboard.html',
    './teacher-dashboard.css',
    'https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js',
    'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.js'
];

// Install event
self.addEventListener('install', function(event) {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch(function(error) {
                console.log('Cache install failed:', error);
            })
    );
    
    // Force activation of new service worker
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', function(event) {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(function() {
            // Take control of all clients
            return self.clients.claim();
        })
    );
});

// Fetch event - Network First strategy for API calls, Cache First for static assets
self.addEventListener('fetch', function(event) {
    const requestUrl = new URL(event.request.url);
    
    // Handle Google Apps Script API calls
    if (requestUrl.hostname.includes('script.google.com')) {
        event.respondWith(
            fetch(event.request)
                .then(function(response) {
                    // Clone the response as it can only be consumed once
                    const responseClone = response.clone();
                    
                    // Only cache successful responses
                    if (response.status === 200) {
                        caches.open(CACHE_NAME + '-api').then(function(cache) {
                            cache.put(event.request, responseClone);
                        });
                    }
                    
                    return response;
                })
                .catch(function() {
                    // If network fails, try to get from cache
                    return caches.match(event.request).then(function(cachedResponse) {
                        if (cachedResponse) {
                            // Add offline indicator to response
                            return new Response(cachedResponse.body, {
                                status: 200,
                                statusText: 'OK (Offline)',
                                headers: cachedResponse.headers
                            });
                        }
                        
                        // Return offline response
                        return new Response(JSON.stringify({
                            success: false,
                            message: 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต',
                            offline: true
                        }), {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                    });
                })
        );
        return;
    }
    
    // Handle static assets - Cache First strategy
    if (requestUrl.pathname.endsWith('.css') || 
        requestUrl.pathname.endsWith('.js') || 
        requestUrl.pathname.endsWith('.woff2') ||
        requestUrl.hostname.includes('fonts.googleapis.com') ||
        requestUrl.hostname.includes('cdnjs.cloudflare.com')) {
        
        event.respondWith(
            caches.match(event.request).then(function(cachedResponse) {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return fetch(event.request).then(function(response) {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone the response
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, responseToCache);
                    });
                    
                    return response;
                });
            })
        );
        return;
    }
    
    // Handle HTML pages - Network First with Cache Fallback
    if (event.request.destination === 'document') {
        event.respondWith(
            fetch(event.request)
                .then(function(response) {
                    // Clone and cache the response
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(function() {
                    // If network fails, serve from cache
                    return caches.match(event.request).then(function(cachedResponse) {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        
                        // Return offline page if available
                        return caches.match('./offline.html');
                    });
                })
        );
        return;
    }
    
    // Default behavior for other requests
    event.respondWith(
        fetch(event.request).catch(function() {
            return caches.match(event.request);
        })
    );
});

// Background sync for offline data
self.addEventListener('sync', function(event) {
    if (event.tag === 'background-sync-assessment') {
        event.waitUntil(syncOfflineAssessments());
    }
});

// Handle offline assessment sync
async function syncOfflineAssessments() {
    try {
        // Get offline assessments from IndexedDB
        const offlineAssessments = await getOfflineAssessments();
        
        for (const assessment of offlineAssessments) {
            try {
                // Try to sync with server
                const response = await fetch(assessment.url, {
                    method: 'POST',
                    body: assessment.data
                });
                
                if (response.ok) {
                    // Remove from offline storage on successful sync
                    await removeOfflineAssessment(assessment.id);
                    
                    // Notify main thread of successful sync
                    self.clients.matchAll().then(clients => {
                        clients.forEach(client => {
                            client.postMessage({
                                type: 'ASSESSMENT_SYNCED',
                                data: assessment
                            });
                        });
                    });
                }
            } catch (error) {
                console.log('Failed to sync assessment:', error);
            }
        }
    } catch (error) {
        console.log('Background sync failed:', error);
    }
}

// Message handling
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            version: CACHE_NAME
        });
    }
    
    if (event.data && event.data.type === 'CACHE_ASSESSMENT') {
        // Cache assessment data for offline use
        caches.open(CACHE_NAME + '-assessments').then(function(cache) {
            cache.put(new Request(event.data.url), new Response(JSON.stringify(event.data.data)));
        });
    }
});

// Helper functions for IndexedDB operations
function getOfflineAssessments() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('OfflineAssessments', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['assessments'], 'readonly');
            const store = transaction.objectStore('assessments');
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => resolve(getAllRequest.result);
            getAllRequest.onerror = () => reject(getAllRequest.error);
        };
        
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('assessments')) {
                const store = db.createObjectStore('assessments', { keyPath: 'id', autoIncrement: true });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

function removeOfflineAssessment(id) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('OfflineAssessments', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['assessments'], 'readwrite');
            const store = transaction.objectStore('assessments');
            const deleteRequest = store.delete(id);
            
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
        };
    });
}

// Periodic cleanup of old cache entries
setInterval(function() {
    caches.keys().then(function(cacheNames) {
        cacheNames.forEach(function(cacheName) {
            if (cacheName.includes('-api')) {
                caches.open(cacheName).then(function(cache) {
                    cache.keys().then(function(requests) {
                        requests.forEach(function(request) {
                            cache.match(request).then(function(response) {
                                if (response) {
                                    const cacheDate = new Date(response.headers.get('date'));
                                    const now = new Date();
                                    const hoursDiff = (now - cacheDate) / (1000 * 60 * 60);
                                    
                                    // Remove cache entries older than 24 hours
                                    if (hoursDiff > 24) {
                                        cache.delete(request);
                                    }
                                }
                            });
                        });
                    });
                });
            }
        });
    });
}, 60 * 60 * 1000); // Run every hour

console.log('Service Worker script loaded');
