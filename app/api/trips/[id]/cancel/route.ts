import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"
import { sendWebPush } from "@/lib/webpush"
import { pusherServer } from '@/lib/pusher'

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const tripId = params.id
    
    let reason = "User cancellation"
    try {
      const body = await req.json()
      if (body.reason) reason = body.reason
    } catch (e) {
      // Ignore if body is empty or invalid
    }

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

      let refunded = false
      let dropsToRefund = 0
      let refundReason = ""

      // Refund the drop if dropLotId is set and the trip hasn't been accepted yet
      if (trip.status === "PENDING") {
        refunded = true
        dropsToRefund = 1 // Basic drops fare for now
        refundReason = "Cancelled before driver acceptance"
        
        if (trip.dropLotId) {
          await tx.dropLot.update({
            where: { id: trip.dropLotId },
            data: { remainingDrops: { increment: dropsToRefund } }
          })
        }

        await tx.user.update({
          where: { id: trip.riderId },
          data: { dropsBalance: { increment: dropsToRefund } }
        })

        await tx.dropTransaction.create({
          data: {
            userId: trip.riderId,
            type: 'REFUND',
            amount: dropsToRefund,
            package: null,
            reference: `refund_${trip.id}`
          }
        })
      } else if (trip.status === "CONFIRMED") {
        refunded = false
        dropsToRefund = 0
        refundReason = "Driver already accepted ride"
      }

      const updatedTrip = await tx.trip.update({
        where: { id: trip.id },
        data: { 
          status: "CANCELLED",
          cancellationRequestedAt: new Date(),
          cancellationConfirmedAt: new Date(),
          dropsRefunded: refunded,
          refundAmount: dropsToRefund,
          cancellationReason: reason,
          cancelledBy: 'RIDER'
        }
      })

      // Create cancellation log
      await tx.cancellationLog.create({
        data: {
          tripId: tripId,
          cancelledBy: 'RIDER',
          tripStateAtCancellation: trip.status,
          dropsRefunded: refunded,
          refundAmount: dropsToRefund,
          reason: refundReason
        }
      })

      return { updatedTrip, refunded, dropsToRefund }
    })

    // Notify Rider and Driver via Web Push and Pusher
    const fullTrip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { rider: true, driver: true }
    })
    
    if (fullTrip) {
      const dropRefundStatus = result.refunded 
        ? "Your 1 Drop has been refunded." 
        : (fullTrip.dropLotId ? "No refund applies because the trip was already accepted by a driver." : "No refund applies.")
      const title = 'Trip Cancelled'
      const message = `Your TOVEDROP trip for ${fullTrip.date} at ${fullTrip.time} has been cancelled. ${dropRefundStatus}`
      const url = '/dashboard/trips'

      // Notify Rider
      if (fullTrip.riderId) {
        sendWebPush(fullTrip.riderId, title, message, url)
      }

      // Notify Driver
      if (fullTrip.driverId) {
        sendWebPush(fullTrip.driverId, title, message, '/driver')
        
        // Pusher event to remove it from driver's list immediately
        await pusherServer.trigger('global-trips', 'trip-cancelled', {
          tripId: tripId,
          driverId: fullTrip.driverId
        }).catch(console.error)
      }
      
      // Update UI for the rider
      await pusherServer.trigger('global-trips', 'trip-updated', {
        tripId: tripId,
        status: 'CANCELLED'
      }).catch(console.error)
    }

    return NextResponse.json({ 
      success: true,
      drops_refunded: result.refunded,
      refund_amount: result.dropsToRefund,
      message: result.refunded ? "Trip cancelled and drops refunded" : "Trip cancelled (no drop refund)", 
      trip: result.updatedTrip 
    }, { status: 200 })
  } catch (error: any) {
    if (error.message === "Trip not found" || error.message.startsWith("Cannot cancel") || error.message === "Unauthorized to cancel this trip") {
       return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: "Error cancelling trip", error: error.message }, { status: 500 })
  }
}
