import webpush from 'web-push'
import prisma from './prisma'

const cleanKey = (key: string) => (key ? key.trim().replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_') : '')

const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@tovedrop.com'
const vapidPublicKey = cleanKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '')
const vapidPrivateKey = cleanKey(process.env.VAPID_PRIVATE_KEY || '')

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
  } catch (err) {
    console.warn('Failed to set VAPID details for web-push:', err)
  }
} else {
  console.warn('VAPID keys are missing. Push notifications will not work.')
}

export interface PushResult {
  sent: number
  failed: number
  pruned: number
  errors: string[]
}

export async function sendPushNotification(
  userId: string,
  payload: { title: string; body?: string; message?: string; icon?: string; url?: string; type?: string }
): Promise<PushResult> {
  const result: PushResult = { sent: 0, failed: 0, pruned: 0, errors: [] }

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    })

    if (subscriptions.length === 0) return result

    // Normalize: the SW reads 'message' and 'body', so set both
    const msg = payload.message || payload.body || ''
    const normalizedPayload = {
      title: payload.title,
      message: msg,
      body: msg,
      icon: payload.icon || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      url: payload.url || '/',
      type: payload.type || 'NOTIFICATION',
    }

    const jsonPayload = JSON.stringify(normalizedPayload)

    const notifications = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: JSON.parse(sub.keys)
          },
          jsonPayload,
          {
            TTL: 3600,
            urgency: 'high'
          }
        )
        result.sent++
      } catch (error: any) {
        result.failed++
        const errorMsg = error?.message || error?.body || String(error)
        result.errors.push(`Status ${error?.statusCode}: ${errorMsg}`)

        if (error.statusCode === 404 || error.statusCode === 410 || error.statusCode === 403 || error.statusCode === 401) {
          // Subscription has expired, been revoked, or VAPID credentials mismatched — prune it
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
          result.pruned++
          console.warn(`Pruned invalid push subscription ${sub.id} (status: ${error.statusCode})`)
        } else {
          console.error('Error sending push notification', error)
        }
      }
    })

    await Promise.all(notifications)
  } catch (error: any) {
    console.error('Error in sendPushNotification', error)
    result.errors.push(error?.message || String(error))
  }

  return result
}
