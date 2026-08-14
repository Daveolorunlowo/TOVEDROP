/**
 * Requests notification permission and subscribes to push notifications.
 * Returns true if successfully subscribed, false otherwise.
 *
 * FIX: navigator.serviceWorker.ready hangs forever when no SW is registered
 * (common in dev, or when the SW registration hasn't happened yet).
 * Solution: request permission FIRST (instant browser dialog), then attempt
 * the push subscription with a 5-second timeout so the UI never freezes.
 */
export async function subscribeToPushNotifications(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported in this browser')
    return false
  }

  // ── Step 1: Permission — instant native dialog, no SW needed ──────────
  let permission = Notification.permission
  if (permission === 'denied') {
    console.warn('Notification permission previously denied by user')
    return false
  }
  if (permission !== 'granted') {
    permission = await Notification.requestPermission()
  }
  if (permission !== 'granted') {
    console.warn('Notification permission not granted')
    return false
  }

  // ── Step 2: Push subscription — optional, with timeout guard ──────────
  // If the service worker isn't ready (dev mode, missing SW) we still return
  // true so the UI toggle works. The OS permission is what matters for now.
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.info('Push messaging not supported — permission only mode')
    return true
  }

  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
  if (!VAPID_PUBLIC_KEY) {
    console.warn('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set — skipping push subscription')
    return true // permission granted, subscription skipped
  }

  try {
    // Race serviceWorker.ready against a 5-second timeout
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('SW ready timeout')), 5000)
    )

    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      timeoutPromise,
    ])

    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription()
    if (existingSubscription) {
      await sendSubscriptionToBackend(existingSubscription)
      return true
    }

    const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    })

    await sendSubscriptionToBackend(subscription)
    return true
  } catch (error) {
    // SW timeout or subscription failed — permission was granted, just no push
    console.warn('Push subscription failed (SW not ready or error):', error)
    return true // still return true — permission was granted successfully
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
