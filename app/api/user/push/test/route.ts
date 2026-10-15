import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { sendPushNotification } from '@/lib/push'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: session.user.id }
    })

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        requiresResubscribe: true,
        message: 'No push subscription found on server. Please enable notifications on this device first.'
      }, { status: 404 })
    }

    const result = await sendPushNotification(session.user.id, {
      title: 'TOVEDROP Notifications Active! 🔔',
      message: 'Your device is successfully connected. You will receive instant live ride updates!',
      url: '/dashboard'
    })

    if (result.sent === 0) {
      return NextResponse.json({
        success: false,
        requiresResubscribe: true,
        message: result.pruned > 0
          ? 'Device push subscription had expired credentials and was reset. Please tap Send Test Alert again to re-sync.'
          : 'Could not deliver test notification to your device. Please ensure notifications are enabled in your OS settings.',
        details: result
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Test notification sent to ${result.sent} registered device(s)!`
    })
  } catch (error: any) {
    console.error('Error sending test push notification', error)
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
