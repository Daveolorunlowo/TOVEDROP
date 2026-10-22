self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

// ----------------------------------------------------------------------
// Push Notification Event Listener
// ----------------------------------------------------------------------
self.addEventListener('push', function (event) {
  if (event.data) {
    let data = {};
    try {
      data = JSON.parse(event.data.text());
    } catch(e) {
      data = { title: 'TOVEDROP', message: event.data.text() };
    }
    
    const title = data.title || 'TOVEDROP';
    const body = data.message || data.body || 'You have a new update.';
    const url = data.url || '/dashboard';

    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: data.icon || '/icon-192x192.png',
        badge: data.badge || '/icon-192x192.png',
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200],
        tag: data.tag || 'tovedrop-alert-' + Date.now(),
        renotify: true,
        data: { url }
      })
    );
  }
});

// ----------------------------------------------------------------------
// Notification Click Event Listener
// ----------------------------------------------------------------------
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open with the target URL or dashboard, focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// ----------------------------------------------------------------------
// Background Sync for Offline Actions
// ----------------------------------------------------------------------
self.addEventListener('sync', function(event) {
  if (event.tag === 'tovedrop-offline-queue') {
    event.waitUntil(processOfflineQueue());
  }
});

async function processOfflineQueue() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('tovedrop-db', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('requests')) {
        db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('requests')) {
        return resolve();
      }
      
      const tx = db.transaction('requests', 'readwrite');
      const store = tx.objectStore('requests');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = async () => {
        const requests = getAllRequest.result || [];
        
        for (const req of requests) {
          try {
            const fetchOptions = {
              method: req.method,
              headers: req.headers,
              body: req.body
            };
            const res = await fetch(req.url, fetchOptions);
            
            if (res.ok) {
              const deleteTx = db.transaction('requests', 'readwrite');
              deleteTx.objectStore('requests').delete(req.id);
            }
          } catch (error) {
            console.error('Offline queue request failed during sync:', error);
          }
        }
        resolve();
      };
      
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}
