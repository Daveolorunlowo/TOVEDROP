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

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { riderId: true, driverId: true }
    })
    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

    // Ensure the requester is part of the trip
    if (trip.riderId !== session.user.id && trip.driverId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const after = searchParams.get('after')

    const whereClause: any = { tripId }
    if (after) {
      const afterDate = new Date(after)
      if (!isNaN(afterDate.getTime())) {
        whereClause.createdAt = { gt: afterDate }
      }
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
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
      select: {
        id: true,
        status: true,
        riderId: true,
        driverId: true,
        shareToken: true,
        rider: { select: { name: true } },
        driver: { select: { name: true } }
      }
    })
    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

    // Ensure the requester is part of the trip
    if (trip.riderId !== session.user.id && trip.driverId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (trip.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Cannot send messages on a cancelled trip' }, { status: 400 })
    }

    // 1. Immediately create message in database
    const message = await prisma.message.create({
      data: {
        tripId,
        senderId: session.user.id,
        content: content.trim()
      }
    })

    const isSenderDriver = session.user.id === trip.driverId
    const recipientId = isSenderDriver ? trip.riderId : trip.driverId
    const senderName = isSenderDriver ? trip.driver?.name : trip.rider?.name

    // 2. Dispatch real-time events concurrently (non-blocking)
    const pushTasks: Promise<any>[] = [
      pusherServer.trigger(`trip-${tripId}`, 'new-message', message).catch(e => console.error("Pusher new-message error:", e))
    ]

    if (recipientId) {
      pushTasks.push(
        pusherServer.trigger(`user-trips-${recipientId}`, 'incoming-message', {
          ...message,
          senderName: senderName ?? 'User',
          tripId
        }).catch(e => console.error("Pusher incoming-message error:", e)),
        pusherServer.trigger(`user-${recipientId}`, 'incoming-message', {
          ...message,
          senderName: senderName ?? 'User',
          tripId
        }).catch(e => console.error("Pusher incoming-message error:", e))
      )

      // Send WebPush notification in background and ensure it's in pushTasks
      const title = `New message from ${senderName ? senderName.split(' ')[0] : (isSenderDriver ? 'driver' : 'rider')}`
      const notificationContent = message.content.length > 50 ? `${message.content.substring(0, 47)}...` : message.content
      const url = isSenderDriver ? (trip.shareToken ? `/trip/${trip.shareToken}` : `/dashboard/trips/${tripId}`) : '/driver'
      pushTasks.push(
        sendWebPush(recipientId, title, notificationContent, url).catch(e => console.error("WebPush error:", e))
      )
    }

    // 3. Race against a 500ms timeout so the sender's UI responds instantaneously while guaranteeing dispatch
    await Promise.race([
      Promise.allSettled(pushTasks),
      new Promise(resolve => setTimeout(resolve, 500))
    ])

    return NextResponse.json({ message }, { status: 201 })
  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
