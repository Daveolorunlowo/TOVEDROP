import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher'
import { sendPushNotification } from '@/lib/push'

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const tripId = params.id
    const { content } = await req.json()

    if (!content) {
      return NextResponse.json({ message: 'Message content is required' }, { status: 400 })
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        rider: true,
        driver: true
      }
    })

    if (!trip) {
      return NextResponse.json({ message: 'Trip not found' }, { status: 404 })
    }

    if (trip.riderId !== session.user.id && trip.driverId !== session.user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const message = await prisma.message.create({
      data: {
        tripId,
        senderId: session.user.id,
        content
      },
      include: {
        sender: {
          select: { id: true, name: true }
        }
      }
    })

    await pusherServer.trigger(`trip-${tripId}`, 'new-message', message)

    // Send push notification to the other party
    const recipientId = session.user.id === trip.riderId ? trip.driverId : trip.riderId
    if (recipientId) {
      await sendPushNotification(recipientId, {
        title: `New message from ${message.sender.name || 'User'}`,
        body: content,
        url: `/dashboard/trips/${tripId}`
      })
    }

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error in messages API', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
