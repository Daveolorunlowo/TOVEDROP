// TOVEDROP Custom Service Worker
// Handles push notifications for both riders and drivers

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', function (event) {
  if (!event.data) return

  let data = {}
  try {
    data = event.data.json()
  } catch (e) {
    data = { title: 'TOVEDROP', message: event.data.text() }
  }

  const isAlarm = data.type === 'PICKUP_ALARM'

  const title = data.title || 'TOVEDROP'
  // Support both 'message' and 'body' for compatibility
  const body = data.message || data.body || 'You have a new notification'
  const icon = data.icon || '/icon-192x192.png'
  const badge = '/icon-192x192.png'
  const url = data.url || '/'

  const options = {
    body,
    icon,
    badge,
    data: { url },
    tag: isAlarm ? 'pickup-alarm' : 'tovedrop-notification',
    renotify: true,
    requireInteraction: isAlarm, // Alarm stays until dismissed
    silent: false,
    vibrate: isAlarm
      ? [500, 200, 500, 200, 500, 200, 1000, 200, 1000] // Strong alarm pattern
      : [200, 100, 200], // Normal notification pattern
    actions: isAlarm
      ? [
          { action: 'open', title: '📍 View Trip' },
          { action: 'dismiss', title: 'Dismiss' },
        ]
      : [{ action: 'open', title: 'View' }],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  // If dismiss action, do nothing
  if (event.action === 'dismiss') return

  const targetUrl = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // If there's already an open window, navigate it
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i]
          if ('focus' in client) {
            client.focus()
            if ('navigate' in client) {
              return client.navigate(targetUrl)
            }
            return
          }
        }
        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl)
        }
      })
  )
})

// Handle notification close (optional analytics)
self.addEventListener('notificationclose', function (event) {
  // Could log dismissal analytics here
})
