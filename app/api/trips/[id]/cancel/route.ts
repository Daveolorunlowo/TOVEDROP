import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"
import { sendWebPush } from "@/lib/webpush"
import { pusherServer } from "@/lib/pusher"
import { revalidatePath } from "next/cache"

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
 const params = await context.params;
 try {
 const session = await getServerSession(authOptions)
 
 if (!session || !session.user) {
 return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
 }

 const tripId = params.id

 const result = await prisma.$transaction(async (tx) => {
 const trip = await tx.trip.findUnique({
 where: { id: tripId },
 })

 if (!trip) {
 throw new Error("Trip not found")
 }

 // Check if user is the rider
 if (trip.riderId !== session.user.id) {
 throw new Error("Unauthorized to cancel this trip")
 }

 // Allow cancellation if PENDING or CONFIRMED
 if (trip.status === "COMPLETED" || trip.status === "CANCELLED") {
 throw new Error(`Cannot cancel a trip that is ${trip.status}`)
 }

 const updatedTrip = await tx.trip.update({
 where: { id: trip.id },
 data: { status: "CANCELLED" }
 })

 let refunded = false
 // Refund the drop if dropLotId is set and the trip hasn't been accepted yet, OR if it's confirmed but the driver hasn't arrived
 if (trip.dropLotId && (trip.status === "PENDING" || (trip.status === "CONFIRMED" && !trip.driverArrivedAt))) {
 refunded = true
 await tx.dropLot.update({
 where: { id: trip.dropLotId },
 data: { remainingDrops: { increment: 1 } }
 })

 await tx.user.update({
 where: { id: trip.riderId },
 data: { dropsBalance: { increment: 1 } }
 })

 await tx.dropTransaction.create({
 data: {
 userId: trip.riderId,
 type: 'REFUND',
 amount: 1,
 package: null,
 reference: `refund_${trip.id}`
 }
 })
 }

 return { updatedTrip, refunded }
 })

 // Notify Rider and Driver via Web Push
 const fullTrip = await prisma.trip.findUnique({
 where: { id: tripId },
 include: { rider: true, driver: true }
 })
 
 if (fullTrip) {
 let refundReason = "No refund applies."
 if (result.refunded) {
 refundReason = "Your 1 Drop has been refunded."
 } else if (fullTrip.dropLotId) {
 refundReason = "No refund applies because the driver has already arrived."
 }

 const title = 'Trip Cancelled'
 const message = `Your TOVEDROP trip for ${fullTrip.date} at ${fullTrip.time} has been cancelled. ${refundReason}`
 const url = `/dashboard/trips/${tripId}`

  // Fast guaranteed dispatch of cancellation notifications
  const cancelTasks: Promise<any>[] = []

  // Notify Rider
  if (fullTrip.riderId) {
    cancelTasks.push(
      sendWebPush(fullTrip.riderId, title, message, url).catch(e => console.error("[Cancel WebPush Error]:", e)),
      pusherServer.trigger(`user-trips-${fullTrip.riderId}`, 'trip-cancelled', { tripId, title, message }).catch(e => console.error("Pusher error:", e)),
      pusherServer.trigger(`user-${fullTrip.riderId}`, 'trip-cancelled', { tripId, title, message }).catch(e => console.error("Pusher error:", e))
    )
  }

  // Notify Driver
  if (fullTrip.driverId) {
    cancelTasks.push(
      sendWebPush(fullTrip.driverId, title, message, '/driver').catch(e => console.error("[Cancel Driver WebPush Error]:", e)),
      pusherServer.trigger(`user-trips-${fullTrip.driverId}`, 'trip-cancelled', { tripId, title, message }).catch(e => console.error("Pusher error:", e)),
      pusherServer.trigger(`user-${fullTrip.driverId}`, 'trip-cancelled', { tripId, title, message }).catch(e => console.error("Pusher error:", e))
    )
  }
  
  // Also notify global and admin channels
  if (pusherServer) {
    cancelTasks.push(
      pusherServer.trigger(`trip-${tripId}`, 'trip-cancelled', { tripId, title, message }).catch(e => console.error("Pusher error:", e)),
      pusherServer.trigger('admin-alerts', 'trip-cancelled', { tripId, title, message }).catch(e => console.error("Pusher error:", e))
    )
  }

  // Await push tasks with 700ms race ceiling to guarantee delivery before response
  await Promise.race([
    Promise.allSettled(cancelTasks),
    new Promise(r => setTimeout(r, 700))
  ])
 }
 
 revalidatePath('/dashboard')
 revalidatePath('/dashboard/trips')
 revalidatePath('/driver')
 revalidatePath('/admin')

 return NextResponse.json({ 
 message: result.refunded ? "Trip cancelled and drops refunded" : "Trip cancelled (no drop refund)", 
 trip: result.updatedTrip 
 }, { status: 200 })
 } catch (error: any) {
 if (error.message === "Trip not found" || error.message.startsWith("Cannot cancel") || error.message === "Unauthorized to cancel this trip") {
 return NextResponse.json({ message: error.message }, { status: 400 })
 }
 return NextResponse.json({ message: "Error cancelling trip", error: error.message }, { status: 500 })
 }
}
