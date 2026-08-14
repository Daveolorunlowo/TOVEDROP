/**
 * Requests notification permission and subscribes to push notifications.
 * Returns true if successfully subscribed, false otherwise.
 */
export async function subscribeToPushNotifications(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported')
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready

    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription()
    if (existingSubscription) {
      // Send to backend again to ensure it's saved
      await sendSubscriptionToBackend(existingSubscription)
      return true
    }

    // Request notification permission if not yet granted
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('Notification permission denied')
      return false
    }

    const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
    if (!VAPID_PUBLIC_KEY) {
      console.warn('Missing VAPID public key')
      return false
    }

    const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    })

    await sendSubscriptionToBackend(subscription)
    return true
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error)
    return false
  }
}

/**
 * Requests notification permission only (no push subscription).
 * Useful for checking/prompting without full subscription flow.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

/**
 * Returns current notification permission status.
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

async function sendSubscriptionToBackend(subscription: PushSubscription) {
  try {
    await fetch('/api/user/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    })
  } catch (err) {
    console.error('Failed to send subscription to backend:', err)
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
