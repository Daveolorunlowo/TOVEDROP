import webpush from 'web-push'
import prisma from '@/lib/prisma'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:support@tovedrop.com`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
}

export async function sendWebPush(userId: string, title: string, message: string, url: string = '/') {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log(`[Web Push - not sent, missing VAPID keys] To User: ${userId} — ${title}: ${message}`)
    return
  }

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    })

    if (subscriptions.length === 0) return

    const payload = JSON.stringify({
      title,
      message,
      url: url.startsWith('http') ? url : `${APP_URL}${url}`
    })

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: JSON.parse(sub.keys)
        }
        await webpush.sendNotification(pushSubscription, payload)
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription has expired or is no longer valid
          await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } })
        } else {
          console.error('Failed to send push notification to an endpoint', err)
        }
      }
    })

    await Promise.all(sendPromises)
  } catch (error) {
    console.error('Failed to dispatch web push notifications:', error)
  }
}
