self.addEventListener('push', function (event) {
  if (event.data) {
    const data = JSON.parse(event.data.text())
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'TOVEDROP', {
        body: data.message,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
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
