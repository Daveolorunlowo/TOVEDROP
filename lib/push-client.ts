/**
 * Requests notification permission and subscribes to push notifications.
 * Returns true if successfully subscribed, false otherwise.
 *
 * Automatically fetches the active server VAPID public key dynamically to avoid
 * any key drift or stale build-time mismatches.
 */
export async function subscribeToPushNotifications(options?: { force?: boolean }): Promise<boolean> {
  if (typeof window === 'undefined') return false

  if (!('Notification' in window)) {
    console.warn('Notifications not supported in this browser')
    return false
  }

  // ── Step 0: Secure context check ─────────────────────────────────────
  // Service Workers and Push API require HTTPS or http://localhost
  if (!window.isSecureContext) {
    console.warn('Push notifications require a secure context (HTTPS or http://localhost).')
    window.alert(
      'Push notifications require a secure connection (HTTPS or localhost).\n\n' +
      'If you are testing from a mobile phone on a local Wi-Fi IP (http://192... or http://172...),\n' +
      'browsers block Push notifications. Please test on http://localhost on your computer,\n' +
      'or use an HTTPS tunnel / deployed domain.'
    )
    return false
  }

  // ── Step 1: Permission — native dialog ───────────────────────────────
  let permission = Notification.permission
  if (permission === 'denied') {
    console.warn('Notification permission previously denied by user')
    showNotificationDeniedAlert()
    return false
  }
  if (permission !== 'granted') {
    try {
      permission = await Notification.requestPermission()
    } catch (e) {
      console.warn('Error requesting notification permission:', e)
      return false
    }
  }
  if (permission !== 'granted') {
    console.warn('Notification permission not granted')
    return false
  }

  // ── Step 2: Push subscription ─────────────────────────────────────────
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.info('Push messaging not supported — permission only mode')
    return true
  }

  // Fetch the active server VAPID public key dynamically
  let vapidPublicKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim()
  try {
    const keyRes = await fetch('/api/user/push/vapid-key')
    if (keyRes.ok) {
      const keyData = await keyRes.json()
      if (keyData.publicKey) {
        vapidPublicKey = keyData.publicKey.trim()
      }
    }
  } catch (err) {
    console.warn('Could not fetch active VAPID key from API, using fallback:', err)
  }

  if (!vapidPublicKey) {
    console.warn('VAPID public key is not configured — skipping push subscription')
    return true
  }

  try {
    // Ensure service worker is registered and ready
    let registration: ServiceWorkerRegistration | undefined
    try {
      registration = await navigator.serviceWorker.getRegistration()
    } catch (e) {}

    if (!registration) {
      registration = await navigator.serviceWorker.register('/sw-custom.js')
    }

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('SW ready timeout')), 6000)
    )

    registration = await Promise.race([
      navigator.serviceWorker.ready,
      timeoutPromise,
    ])

    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey)

    // Check existing push subscription
    let existingSubscription = await registration.pushManager.getSubscription()
    if (existingSubscription) {
      let keyMatches = false
      const rawKey = existingSubscription.options?.applicationServerKey

      if (rawKey) {
        const existingKeyB64 = arrayBufferToBase64Url(rawKey)
        if (existingKeyB64 === vapidPublicKey) {
          keyMatches = true
        }
      }

      // If user requested force resubscribe OR key does not match active server key
      if (options?.force || !keyMatches) {
        console.info('Outdated or mismatched push subscription detected. Unsubscribing...')
        try {
          await existingSubscription.unsubscribe()
        } catch (e) {
          console.warn('Failed to unsubscribe old push subscription:', e)
        }
        existingSubscription = null
      } else {
        // Key matches — ensure subscription is synced with server
        await sendSubscriptionToBackend(existingSubscription)
        return true
      }
    }

    // Subscribe with current VAPID public key
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    })

    await sendSubscriptionToBackend(subscription)
    return true
  } catch (error) {
    console.warn('Push subscription failed:', error)
    return true // Permission was granted, UI toggle stays on
  }
}

/**
 * Requests notification permission only (no push subscription).
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

/**
 * Returns current notification permission status.
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

async function sendSubscriptionToBackend(subscription: PushSubscription) {
  try {
    const res = await fetch('/api/user/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    })
    if (!res.ok) {
      console.warn('Server returned non-200 while saving push subscription:', res.status)
    }
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

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function showNotificationDeniedAlert() {
  if (typeof window === 'undefined') return
  const isWindows = navigator.userAgent.toLowerCase().includes('windows')
  const isMac = navigator.userAgent.toLowerCase().includes('mac')
  const isAndroid = navigator.userAgent.toLowerCase().includes('android')
  const isIOS = /ipad|iphone|ipod/.test(navigator.userAgent.toLowerCase())
  
  let instructions = "Please enable notifications for this site in your browser settings (look for the lock/settings icon in the address bar)."
  
  if (isWindows) {
    instructions = "1. Click the lock/info icon beside the URL in the address bar and set Notifications to 'Allow'.\n2. In Windows Settings > System > Notifications, verify your browser is allowed."
  } else if (isMac) {
    instructions = "1. In browser settings, allow notifications for this site.\n2. In Mac System Settings > Notifications, enable notifications for your browser."
  } else if (isAndroid) {
    instructions = "Tap the tune/lock icon in the address bar > Permissions > Notifications > Allow."
  } else if (isIOS) {
    instructions = "On iOS, open the app from your Home Screen (Add to Home Screen), then allow notifications in Settings > TOVEDROP."
  }

  window.alert(
    `Notification Permission is Blocked\n\n` +
    `${instructions}\n\n` +
    `After enabling notifications, tap the notification toggle again.`
  )
}
