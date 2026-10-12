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
        message: 'No push subscription found on server. Please toggle notification permissions in Settings or your browser first.'
      }, { status: 404 })
    }

    await sendPushNotification(session.user.id, {
      title: 'TOVEDROP Notifications Active! 🔔',
      message: 'Your device is successfully connected. You will receive instant live ride updates!',
      url: '/dashboard'
    })

    return NextResponse.json({
      success: true,
      message: `Test notification sent to ${subscriptions.length} registered device(s)!`
    })
  } catch (error: any) {
    console.error('Error sending test push notification', error)
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
