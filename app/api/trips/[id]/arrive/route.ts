import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher'
import { sendPushNotification } from '@/lib/push'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const tripId = params.id

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { driver: true }
    })

    if (!trip) {
      return NextResponse.json({ message: 'Trip not found' }, { status: 404 })
    }

    if (trip.driverId !== session.user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    if (trip.driverArrivedAt) {
      return NextResponse.json({ message: 'Already arrived' }, { status: 400 })
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: { driverArrivedAt: new Date() }
    })

    await pusherServer.trigger(`trip-${tripId}`, 'driver-arrived', {
      tripId,
      time: updatedTrip.driverArrivedAt
    })

    await sendPushNotification(trip.riderId, {
      title: 'Your driver has arrived!',
      body: `${trip.driver?.name || 'Your driver'} is at ${trip.pickup}.`,
      url: `/dashboard/trips/${tripId}`
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in driver arrive API', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
