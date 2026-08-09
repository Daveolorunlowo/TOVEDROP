import webpush from 'web-push'
import prisma from './prisma'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:test@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
)

export async function sendPushNotification(userId: string, payload: { title: string, body: string, icon?: string, url?: string }) {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    })

    if (subscriptions.length === 0) return

    const notifications = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: JSON.parse(sub.keys)
          },
          JSON.stringify(payload)
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
