import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"
import { sendWhatsApp } from "@/lib/whatsapp"

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

      // Refund the drop if dropLotId is set
      if (trip.dropLotId) {
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

      return updatedTrip
    })

    // Notify Rider and Driver via WhatsApp
    const fullTrip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { rider: true, driver: true }
    })
    
    if (fullTrip) {
      const dropRefundStatus = fullTrip.dropLotId ? "Your 1 Drop has been refunded." : "No refund applies."
      const message = `Your TOVEDROP trip for ${fullTrip.date} at ${fullTrip.time} has been cancelled. ${dropRefundStatus}`

      // Notify Rider
      if (fullTrip.rider?.whatsappNotificationsEnabled && fullTrip.rider?.phoneNumber) {
        sendWhatsApp(fullTrip.rider.phoneNumber, message)
      }

      // Notify Driver
      if (fullTrip.driver?.whatsappNotificationsEnabled && fullTrip.driver?.phoneNumber) {
        sendWhatsApp(fullTrip.driver.phoneNumber, message)
      }
    }

    return NextResponse.json({ message: "Trip cancelled and drops refunded", trip: result }, { status: 200 })
  } catch (error: any) {
    if (error.message === "Trip not found" || error.message.startsWith("Cannot cancel") || error.message === "Unauthorized to cancel this trip") {
       return NextResponse.json({ message: error.message }, { status: 400 })
    }
    return NextResponse.json({ message: "Error cancelling trip", error: error.message }, { status: 500 })
  }
}
