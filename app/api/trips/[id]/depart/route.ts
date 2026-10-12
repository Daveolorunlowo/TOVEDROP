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
      include: { driver: true, rider: true }
    })

    if (!trip) {
      return NextResponse.json({ message: 'Trip not found' }, { status: 404 })
    }

    if (trip.driverId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    if (trip.driverDepartedAt) {
      return NextResponse.json({ message: 'Ride has already taken off / departed' }, { status: 400 })
    }

    const now = new Date()
    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        driverDepartedAt: now,
        driverArrivedAt: trip.driverArrivedAt || now
      }
    })

    // Real-time broadcast on Pusher channel
    if (pusherServer) {
      await pusherServer.trigger(`trip-${tripId}`, 'driver-departed', {
        tripId,
        departedAt: updatedTrip.driverDepartedAt?.toISOString(),
        time: updatedTrip.driverDepartedAt?.toISOString()
      }).catch((e) => console.error('Pusher depart trigger error:', e))

      await pusherServer.trigger(`user-${trip.riderId}`, 'trip-departed', {
        tripId,
        destination: trip.destination,
        driverName: trip.driver?.name,
        departedAt: updatedTrip.driverDepartedAt?.toISOString()
      }).catch((e) => console.error('Pusher rider depart trigger error:', e))

      await pusherServer.trigger(`user-trips-${trip.riderId}`, 'trip-departed', {
        tripId,
        destination: trip.destination,
        driverName: trip.driver?.name,
        departedAt: updatedTrip.driverDepartedAt?.toISOString()
      }).catch((e) => console.error('Pusher user-trips depart trigger error:', e))
    }

    // Web push notification to rider
    await sendPushNotification(trip.riderId, {
      title: 'Taking Off! 🚗💨',
      body: `${trip.driver?.name || 'Your driver'} is now taking off with you to ${trip.destination}. Safe travels!`,
      url: `/dashboard/trips/${tripId}`
    }).catch((e) => console.error('Push notification error:', e))

    return NextResponse.json({
      success: true,
      departedAt: updatedTrip.driverDepartedAt
    })
  } catch (error) {
    console.error('Error in driver depart API', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
