self.addEventListener('push', function (event) {
  if (event.data) {
    let data = {}
    try {
      data = JSON.parse(event.data.text())
    } catch(e) {
      data = { title: 'TOVEDROP', message: event.data.text() }
    }
    
    const title = data.title || 'TOVEDROP'
    const body = data.message || data.body || 'You have a new update.'
    const url = data.url || '/'
    const isAlarm = !!(data.isAlarm || data.type === 'REMINDER_URGENT' || (title && (title.includes('ALARM') || title.includes('Alarm'))))

    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: data.icon || '/icon-192x192.png',
        badge: data.badge || '/icon-192x192.png',
        requireInteraction: true, // Keep notification awake until dismissed
        vibrate: isAlarm
          ? [600, 200, 600, 200, 600, 200, 1000, 300, 600, 200, 600]
          : [200, 100, 200, 100, 200],
        tag: isAlarm ? 'tovedrop-alarm-' + (data.tripId || 'alert') : (data.tag || 'tovedrop-alert-' + Date.now()),
        renotify: true,
        actions: [
          { action: 'open', title: 'Open Trip 🚗' },
          { action: 'dismiss', title: 'Dismiss' }
        ],
        data: { url, isAlarm, tripId: data.tripId }
      })
    )
  }
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  if (event.action === 'dismiss') {
    return
  }

  const targetUrl = event.notification.data?.url || '/driver'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i]
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus()
        }
      }
      // If not, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
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
