import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher'
import { sendWebPush } from '@/lib/webpush'
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const params = await context.params
    const tripId = params.id
    if (!tripId) return NextResponse.json({ error: 'Missing tripId' }, { status: 400 })

    const trip = await prisma.trip.findUnique({ where: { id: tripId } })
    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

    // Ensure the requester is part of the trip
    if (trip.riderId !== session.user.id && trip.driverId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const messages = await prisma.message.findMany({
      where: { tripId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ messages }, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const params = await context.params
    const tripId = params.id
    if (!tripId) return NextResponse.json({ error: 'Missing tripId' }, { status: 400 })

    const { content } = await req.json()
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid message content' }, { status: 400 })
    }

    const trip = await prisma.trip.findUnique({ 
      where: { id: tripId },
      include: {
        rider: true,
        driver: true
      }
    })
    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

    // Ensure the requester is part of the trip
    if (trip.riderId !== session.user.id && trip.driverId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Ensure the trip is active enough for chatting (not completely dead)
    if (trip.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Cannot send messages on a cancelled trip' }, { status: 400 })
    }

    const message = await prisma.message.create({
      data: {
        tripId,
        senderId: session.user.id,
        content: content.trim()
      }
    })

    // Trigger realtime event on the trip's channel
    await pusherServer.trigger(`trip-${tripId}`, 'new-message', message)

    // Send push notification to the recipient
    const isSenderDriver = session.user.id === trip.driverId
    const recipientId = isSenderDriver ? trip.riderId : trip.driverId
    const senderName = isSenderDriver ? trip.driver?.name : trip.rider?.name

    if (recipientId) {
      const title = `New message from ${senderName ? senderName.split(' ')[0] : (isSenderDriver ? 'driver' : 'rider')}`
      const notificationContent = message.content.length > 50 ? `${message.content.substring(0, 47)}...` : message.content
      const url = isSenderDriver ? (trip.shareToken ? `/trip/${trip.shareToken}` : '/dashboard/trips') : '/driver'
      sendWebPush(recipientId, title, notificationContent, url)
    }

    return NextResponse.json({ message }, { status: 201 })
  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
