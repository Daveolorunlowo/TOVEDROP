import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher'
import { sendPushNotification } from '@/lib/push'

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
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

    if (trip.driverId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    if (trip.driverArrivedAt) {
      return NextResponse.json({ message: 'Already arrived' }, { status: 400 })
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: { driverArrivedAt: new Date() }
    })

    if (pusherServer) {
      await pusherServer.trigger(`trip-${tripId}`, 'driver-arrived', {
        tripId,
        pickup: trip.pickup,
        driverName: trip.driver?.name,
        time: updatedTrip.driverArrivedAt
      }).catch((e) => console.error('Pusher arrive trip trigger error:', e))

      await pusherServer.trigger(`user-${trip.riderId}`, 'driver-arrived', {
        tripId,
        pickup: trip.pickup,
        driverName: trip.driver?.name,
        time: updatedTrip.driverArrivedAt
      }).catch((e) => console.error('Pusher arrive user trigger error:', e))

      await pusherServer.trigger(`user-trips-${trip.riderId}`, 'driver-arrived', {
        tripId,
        pickup: trip.pickup,
        driverName: trip.driver?.name,
        time: updatedTrip.driverArrivedAt
      }).catch((e) => console.error('Pusher arrive user-trips trigger error:', e))
    }

    await sendPushNotification(trip.riderId, {
      title: 'Your driver has arrived! 📍',
      body: `${trip.driver?.name || 'Your driver'} is waiting at ${trip.pickup}.`,
      url: `/dashboard/trips/${tripId}`
    }).catch((e) => console.error('Push notification error:', e))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in driver arrive API', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
