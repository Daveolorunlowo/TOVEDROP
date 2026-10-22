import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { sendWebPush } from '@/lib/webpush'
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

export async function POST(req: Request, { params }: { params: Promise<{ shareToken: string }> }) {
 try {
 const session = await getServerSession(authOptions)
 if (!session?.user || session.user.role !== 'DRIVER') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 const acceptingDriverId = session.user.id
 const resolvedParams = await params;
 const { shareToken } = resolvedParams

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

 if (rider.phoneNumber && rider.whatsappNotificationsEnabled) {
 await sendWhatsAppMessage(
 rider.phoneNumber,
 `⚠ TOVEDROP: Your driver for ${transferCheck.trip.time} has changed.\nNew driver: ${newDriverDetails}\nReason: ${reasonText}. Same pickup time and location. No action needed from you.`
 ).catch(e => console.error("WhatsApp send failed", e))
 }

  // Immediate real-time notifications to Rider and Original Driver
  const transferTasks: Promise<any>[] = []

  // Push notification to Rider
  transferTasks.push(
    sendWebPush(
      rider.id,
      "Driver Updated for your Ride 🚗",
      `Your trip scheduled for ${transferCheck.trip.time} has been transferred to ${newDriver?.name || 'a new driver'}.`,
      `/dashboard/trips/${transferCheck.tripId}`
    ).catch(e => console.error("Transfer rider push failed:", e))
  )

  // Push notification to transferring driver
  if (transferCheck.fromDriverId) {
    transferTasks.push(
      sendWebPush(
        transferCheck.fromDriverId,
        "Trip Transfer Accepted! ✅",
        `${newDriver?.name || 'Another driver'} accepted your transferred ride for ${transferCheck.trip.time}.`,
        "/driver"
      ).catch(e => console.error("Transfer driver push failed:", e))
    )
  }

  // Trigger Pusher for Rider, Driver, and Global Trip
  if (pusherServer) {
    transferTasks.push(
      pusherServer.trigger(`user-trips-${rider.id}`, 'trip-transferred', {
        tripId: transferCheck.tripId,
        newDriverName: newDriver?.name,
        newDriverVehicle: `${newDriver?.driverProfile?.vehicleMake ?? ''} ${newDriver?.driverProfile?.vehicleModel ?? ''}`
      }).catch(e => console.error("Pusher rider trigger failed:", e)),
      pusherServer.trigger(`user-${rider.id}`, 'trip-transferred', {
        tripId: transferCheck.tripId,
        newDriverName: newDriver?.name
      }).catch(e => console.error("Pusher user trigger failed:", e)),
      pusherServer.trigger(`user-${transferCheck.fromDriverId}`, 'transfer-accepted', {
        tripId: transferCheck.tripId,
        acceptedBy: newDriver?.name
      }).catch(e => console.error("Pusher fromDriver trigger failed:", e)),
      pusherServer.trigger(`trip-${transferCheck.tripId}`, 'trip-transferred', {
        tripId: transferCheck.tripId,
        newDriverName: newDriver?.name
      }).catch(e => console.error("Pusher trip trigger failed:", e))
    )
  }

  await Promise.race([
    Promise.allSettled(transferTasks),
    new Promise(r => setTimeout(r, 600))
  ])

  return NextResponse.json({ success: true })

 } catch (error: any) {
 console.error('Transfer accept error:', error)
 return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
 }
}
