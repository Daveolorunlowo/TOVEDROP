self.addEventListener('push', function (event) {
  if (event.data) {
    let data = {}
    try {
      data = JSON.parse(event.data.text())
    } catch(e) {
      data = { title: 'TOVEDROP', message: event.data.text() }
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'TOVEDROP', {
        body: data.message,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        requireInteraction: true, // Forces the native popup to stay on screen
        vibrate: [200, 100, 200, 100, 200],
        data: {
          url: data.url || '/'
        }
      })
    )
  }
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((windowClients) => {
        // Check if there is already a window/tab open with the target URL
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i]
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus()
          }
        }
        // If not, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(event.notification.data.url)
        }
      })
    )
  }
})

// ----------------------------------------------------------------------
// Background Sync for Offline Actions
// ----------------------------------------------------------------------

self.addEventListener('sync', function(event) {
  if (event.tag === 'tovedrop-offline-queue') {
    event.waitUntil(processOfflineQueue())
  }
})

async function processOfflineQueue() {
  // Since idb is imported dynamically or we can just use a simple raw IndexedDB API
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('tovedrop-db', 1)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('requests')) {
        db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true })
      }
    }
    
    request.onsuccess = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('requests')) {
        return resolve()
      }
      
      const tx = db.transaction('requests', 'readwrite')
      const store = tx.objectStore('requests')
      const getAllRequest = store.getAll()
      
      getAllRequest.onsuccess = async () => {
        const requests = getAllRequest.result || []
        
        for (const req of requests) {
          try {
            const fetchOptions = {
              method: req.method,
              headers: req.headers,
              body: req.body
            }
            const res = await fetch(req.url, fetchOptions)
            
            if (res.ok) {
              // Remove from queue if successful
              const deleteTx = db.transaction('requests', 'readwrite')
              deleteTx.objectStore('requests').delete(req.id)
            }
          } catch (error) {
            console.error('Offline queue request failed during sync:', error)
            // Leave in queue
          }
        }
        resolve()
      }
      
      getAllRequest.onerror = () => reject(getAllRequest.error)
    }
    
    request.onerror = () => reject(request.error)
  })
}
