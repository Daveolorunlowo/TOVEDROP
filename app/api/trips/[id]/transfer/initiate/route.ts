import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reason, reasonNote } = await req.json()
    if (!reason) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 })
    }

    const driverId = session.user.id
    const tripId = params.id

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        tripTransfers: {
          where: { status: 'PENDING' }
        }
      }
    })

    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    if (trip.driverId !== driverId) return NextResponse.json({ error: 'Not your trip' }, { status: 403 })
    if (trip.status !== 'CONFIRMED') return NextResponse.json({ error: 'Trip is not confirmed' }, { status: 400 })
    if (trip.tripTransfers.length > 0) return NextResponse.json({ error: 'A transfer is already pending' }, { status: 400 })

    // Check 15 minute limit
    if (trip.isScheduled && trip.scheduledDateTime) {
      const fifteenMinsFromNow = new Date(Date.now() + 15 * 60 * 1000)
      if (new Date(trip.scheduledDateTime) <= fifteenMinsFromNow) {
        return NextResponse.json({ error: 'Too close to pickup time to transfer' }, { status: 400 })
      }
    } else {
       // If not scheduled, but it's confirmed, usually this means it's an ASAP ride.
       // The prompt says "scheduledAt > 15 min from now". If it's an ASAP ride, maybe it can't be transferred?
       // Let's assume non-scheduled rides cannot be transferred if they were booked for now.
       // Or we can just calculate if createdAt + 15m is reached? The prompt specifically mentioned scheduledAt.
       if (!trip.isScheduled) {
           return NextResponse.json({ error: 'ASAP rides cannot be transferred. Please cancel or contact support.' }, { status: 400 })
       }
    }

    const shareToken = crypto.randomBytes(6).toString('hex')
    
    // Expires at 30 min from now, OR 15 min before scheduled trip
    const thirtyMinsFromNow = new Date(Date.now() + 30 * 60 * 1000)
    const fifteenMinsBeforeTrip = new Date(trip.scheduledDateTime!.getTime() - 15 * 60 * 1000)
    
    const expiresAt = thirtyMinsFromNow < fifteenMinsBeforeTrip ? thirtyMinsFromNow : fifteenMinsBeforeTrip

    await prisma.$transaction([
      prisma.tripTransfer.create({
        data: {
          tripId: trip.id,
          fromDriverId: driverId,
          reason,
          reasonNote,
          shareToken,
          expiresAt
        }
      }),
      prisma.driverProfile.update({
        where: { userId: driverId },
        data: {
          transferCount: { increment: 1 }
        }
      })
    ])

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const transferUrl = `${baseUrl}/transfer/${shareToken}`

    return NextResponse.json({ shareToken, transferUrl, expiresAt })

  } catch (error: any) {
    console.error('Transfer initiate error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
