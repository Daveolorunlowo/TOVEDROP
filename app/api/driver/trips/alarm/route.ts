import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { sendPushNotification } from '@/lib/push'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== 'DRIVER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { tripId, minutesUntilPickup } = await req.json()

    if (!tripId) {
      return NextResponse.json({ message: 'Missing tripId' }, { status: 400 })
    }

    // Confirm this trip belongs to this driver
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { rider: { select: { name: true } } }
    })

    if (!trip) {
      return NextResponse.json({ message: 'Trip not found' }, { status: 404 })
    }

    if (trip.driverId !== session.user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const mins = minutesUntilPickup ?? 0
    const isUrgent = mins <= 15

    // Send push alarm notification to the DRIVER themselves
    await sendPushNotification(session.user.id, {
      title: isUrgent ? '⏰ PICKUP TIME NOW!' : '⏰ Pickup in 30 Minutes!',
      message: isUrgent
        ? `Head to ${trip.pickup} now to pick up ${trip.rider?.name || 'your rider'}. Trip at ${trip.time}.`
        : `Get ready! Pick up ${trip.rider?.name || 'your rider'} from ${trip.pickup} at ${trip.time}.`,
      url: '/driver',
      type: 'PICKUP_ALARM',
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error sending driver alarm:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
