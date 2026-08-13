import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"
import { DRIVER_COMPLETION_INCENTIVE, DROP_PACKAGES } from "@/lib/config"
import { sendWebPush } from "@/lib/webpush"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== "DRIVER") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { tripId } = await req.json()
    
    if (!tripId) {
      return NextResponse.json({ message: "Missing trip ID" }, { status: 400 })
    }

    // Fetch system settings for revenue split
    let settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' }
    })
    if (!settings) {
      settings = {
        id: 'default',
        driverPercentage: 70,
        adminPercentage: 10,
        companyPercentage: 20,
        updatedAt: new Date()
      }
    }

    // Wrap in transaction: update trip, update driver stats, distribute revenue
    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({
        where: { id: tripId }
      })

      if (!trip) throw new Error("Trip not found")
      if (trip.driverId !== session.user.id) throw new Error("Not your trip")
      if (trip.status !== "CONFIRMED") throw new Error("Trip cannot be completed")

      const updatedTrip = await tx.trip.update({
        where: { id: tripId },
        data: { status: "COMPLETED" }
      })

      let bookingFee = trip.bookingFeeNaira || 0
      const isFreeDrop = bookingFee === 0
      
      if (isFreeDrop) {
        bookingFee = 45 // Assumed base value for promotional/free drops
      }

      const driverShare = 12 // Flat fee for driver on every ride

      let adminShare = 0
      let platformShare = 0

      // Only calculate admin and platform share on paid drops
      if (!isFreeDrop) {
        const remaining = Math.max(0, bookingFee - driverShare)
        const totalCompanyAdminPercent = settings.adminPercentage + settings.companyPercentage
        
        if (totalCompanyAdminPercent > 0) {
          adminShare = (remaining * settings.adminPercentage) / totalCompanyAdminPercent
          platformShare = (remaining * settings.companyPercentage) / totalCompanyAdminPercent
        }
      }

      const updatedDriverProfile = await tx.driverProfile.update({
        where: { userId: session.user.id },
        data: {
          totalTrips: { increment: 1 },
          walletBalance: { increment: driverShare }
        }
      })

      await tx.walletTransaction.create({
        data: {
          driverId: updatedDriverProfile.id,
          tripId: trip.id,
          type: 'RIDE_EARNING',
          amount: driverShare,
          description: 'Earnings from completed ride'
        }
      })

      // Referral Reward Logic
      const riderTripsCount = await tx.trip.count({
        where: { riderId: trip.riderId, status: "COMPLETED" }
      })

      if (riderTripsCount === 1) {
        const referral = await tx.referral.findUnique({
          where: { referredId: trip.riderId }
        })

        if (referral && referral.status === "PENDING") {
          await tx.user.update({
            where: { id: referral.referrerId },
            data: { dropsBalance: { increment: 3 } } // Give 3 drops to referrer
          })
          await tx.user.update({
            where: { id: trip.riderId },
            data: { dropsBalance: { increment: 2 } } // Give 2 drops to rider
          })
          await tx.referral.update({
            where: { id: referral.id },
            data: { status: "COMPLETED" }
          })
        }
      }

      // Record Admin Revenue
      await tx.adminRevenue.create({
        data: { tripId: trip.id, amount: adminShare }
      })

      // Record Platform Revenue
      await tx.platformRevenue.create({
        data: { tripId: trip.id, amount: platformShare }
      })

      return { trip: updatedTrip, driverShare }
    })

    // (Mock) Send the driver an earnings email
    console.log(`Email sent to driver: You earned ₦${result.driverShare} for completing a ride via TOVEDROP! This is separate from the transport fare your rider already paid you directly.`)

    // Notify Rider via Web Push
    const riderId = result.trip.riderId;
    const title = 'Trip Complete!'
    const message = 'Your TOVEDROP ride is complete. Tap to rate your driver.'
    const url = `/rate/${result.trip.id}`
      
    sendWebPush(riderId, title, message, url)

    return NextResponse.json({ message: "Trip completed successfully", trip: result.trip }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ message: "Error completing trip", error: error.message }, { status: 500 })
  }
}
