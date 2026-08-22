import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { pusherServer } from '@/lib/pusher'

function getReasonText(reason: string, note?: string | null) {
  const map: any = {
    VEHICLE_BREAKDOWN: "Vehicle breakdown",
    FAMILY_EMERGENCY: "Family emergency",
    MEDICAL_EMERGENCY: "Medical emergency",
    FUEL_ISSUE: "Fuel shortage",
    STUCK_IN_TRAFFIC: "Unavoidably delayed",
    PERSONAL_EMERGENCY: "Personal emergency",
    OTHER: note || "Unforeseen circumstances"
  }
  return map[reason] || "Unforeseen circumstances"
}

export async function POST(
  req: Request,
  props: { params: Promise<{ shareToken: string }> }
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const acceptingDriverId = session.user.id
    const { shareToken } = params

    // Basic checks first without side effects
    const transferCheck = await prisma.tripTransfer.findUnique({
      where: { shareToken },
      include: {
        trip: {
          include: { rider: true }
        },
        fromDriver: { select: { name: true } }
      }
    })

    if (!transferCheck) return NextResponse.json({ error: 'Transfer not found' }, { status: 404 })
    if (transferCheck.fromDriverId === acceptingDriverId) {
      return NextResponse.json({ error: 'You cannot accept your own transfer' }, { status: 400 })
    }
    if (transferCheck.status !== 'PENDING') {
      return NextResponse.json({ error: 'This trip has already been accepted or expired' }, { status: 400 })
    }
    if (new Date() > transferCheck.expiresAt) {
      return NextResponse.json({ error: 'This transfer link has expired' }, { status: 400 })
    }

    // Atomic update to avoid race conditions
    const result = await prisma.tripTransfer.updateMany({
      where: { 
        shareToken, 
        status: 'PENDING',
        toDriverId: null,
        expiresAt: { gt: new Date() }
      },
      data: { 
        status: 'ACCEPTED',
        toDriverId: acceptingDriverId,
        acceptedAt: new Date()
      }
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'This trip was just accepted by another driver.' }, { status: 400 })
    }

    // Get the accepting driver details
    const newDriver = await prisma.user.findUnique({
      where: { id: acceptingDriverId },
      include: { driverProfile: true }
    })

    // Safe to proceed — this driver won the transfer
    await prisma.trip.update({
      where: { id: transferCheck.tripId },
      data: { driverId: acceptingDriverId }
    })

    // Notify Rider (Email + WhatsApp)
    const reasonText = getReasonText(transferCheck.reason, transferCheck.reasonNote)
    const rider = transferCheck.trip.rider
    const newDriverDetails = `${newDriver?.name} · ${newDriver?.driverProfile?.vehicleMake} ${newDriver?.driverProfile?.vehicleModel}`

    if (rider.email) {
      await sendEmail(
        rider.email,
        "Your TOVEDROP driver has been updated",
        `Hi ${rider.name},

Your trip scheduled for ${transferCheck.trip.time} has been assigned to a new driver. Here's what happened:

${transferCheck.fromDriver.name} transferred your ride to another driver because: ${reasonText}.

Your new driver is:
Name: ${newDriver?.name}
Vehicle: ${newDriver?.driverProfile?.vehicleMake} ${newDriver?.driverProfile?.vehicleModel} · ${newDriver?.driverProfile?.vehiclePlate}

Your pickup time and location remain exactly the same — nothing else about your booking has changed.

If you have any concerns about this change, please contact us.

— The TOVEDROP Team`
      ).catch(e => console.error("Email send failed", e))
    }

    // Trigger Pusher for Rider
    await pusherServer.trigger(`user-trips-${rider.id}`, 'trip-transferred', {
      tripId: transferCheck.tripId
    }).catch(e => console.error("Pusher trigger failed", e))

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Transfer accept error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
