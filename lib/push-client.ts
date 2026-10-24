const cleanKey = (key: string) => (key ? key.trim().replace(/^["']|["']$/g, '').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_') : '')

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
  let vapidPublicKey = cleanKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '')
  let hasServerSubscription: boolean | null = null
  try {
    const keyRes = await fetch('/api/user/push/vapid-key')
    if (keyRes.ok) {
      const keyData = await keyRes.json()
      if (keyData.publicKey) {
        vapidPublicKey = cleanKey(keyData.publicKey)
      }
      if (typeof keyData.hasSubscription === 'boolean') {
        hasServerSubscription = keyData.hasSubscription
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
    let registration = await navigator.serviceWorker.register('/sw-custom.js')
    
    // Check for updates and wait for worker to become active if needed
    try {
      await registration.update()
    } catch (e) {}

    const readyFallback = new Promise<ServiceWorkerRegistration>((resolve) =>
      setTimeout(() => resolve(registration), 2500)
    )

    registration = await Promise.race([
      navigator.serviceWorker.ready,
      readyFallback,
    ])

    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey)

    // Check existing push subscription
    let existingSubscription = await registration.pushManager.getSubscription()
    if (existingSubscription) {
      let keyMatches = false
      const rawKey = existingSubscription.options?.applicationServerKey

      if (rawKey) {
        const existingKeyB64 = arrayBufferToBase64Url(rawKey)
        if (cleanKey(existingKeyB64) === cleanKey(vapidPublicKey)) {
          keyMatches = true
        }
      }

      // If user requested force resubscribe, OR key does not match active server key,
      // OR server reports 0 subscriptions on file for this user (pruned/expired),
      // we must unsubscribe the dead subscription and request a fresh token from FCM.
      const needsFreshSubscription = options?.force || !keyMatches || (hasServerSubscription === false)

      if (needsFreshSubscription) {
        console.info('[PUSH] Outdated, pruned or mismatched push subscription detected. Re-subscribing...')
        try {
          await existingSubscription.unsubscribe()
          // Brief pause for browser and FCM push service to flush old registration
          await new Promise((r) => setTimeout(r, 250))
        } catch (e) {
          console.warn('[PUSH] Failed to unsubscribe old push subscription:', e)
        }
        existingSubscription = null
      } else {
        // Key matches and server has subscription on file — ensure synced
        await sendSubscriptionToBackend(existingSubscription)
        return true
      }
    }

    // Subscribe with current active VAPID public key
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    })

    await sendSubscriptionToBackend(subscription)
    console.info('[PUSH] Successfully subscribed device and synced token with backend.')
    return true
  } catch (error) {
    console.warn('Push subscription failed:', error)
    return false
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
