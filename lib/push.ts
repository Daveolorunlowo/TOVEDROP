import webpush from 'web-push'
import prisma from './prisma'

const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@tovedrop.com'
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
} else {
  console.warn('VAPID keys are missing. Push notifications will not work.')
}

export async function sendPushNotification(
  userId: string,
  payload: { title: string; body?: string; message?: string; icon?: string; url?: string; type?: string }
) {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    })

    if (subscriptions.length === 0) return

    // Normalize: the SW reads 'message', so always set it
    const normalizedPayload = {
      title: payload.title,
      message: payload.message || payload.body || '',
      icon: payload.icon || '/icon-192x192.png',
      url: payload.url || '/',
      type: payload.type || 'NOTIFICATION',
    }

    const notifications = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: JSON.parse(sub.keys)
          },
          JSON.stringify(normalizedPayload)
        )
      } catch (error: any) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          // Subscription has expired or is no longer valid
          await prisma.pushSubscription.delete({ where: { id: sub.id } })
        } else {
          console.error('Error sending push notification', error)
        }
      }
    })

    await Promise.all(notifications)
  } catch (error) {
    console.error('Error in sendPushNotification', error)
  }
}
