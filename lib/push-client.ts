export async function subscribeToPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported')
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    
    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription()
    if (existingSubscription) {
      // Could send to backend again just to be safe
      await sendSubscriptionToBackend(existingSubscription)
      return true
    }

    // Subscribe
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

async function sendSubscriptionToBackend(subscription: PushSubscription) {
  await fetch('/api/user/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription)
  })
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
