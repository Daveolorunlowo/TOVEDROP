import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"
import { processOverdueTrips } from "@/lib/overdue-processor"
import { checkTripOverdue } from "@/lib/trip-schedule"

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const trip = await prisma.trip.findUnique({
      where: { id: params.id }
    })

    if (!trip) {
      return NextResponse.json({ message: "Trip not found" }, { status: 404 })
    }

    // Only participant riders, drivers, or admins can trigger/view this
    if (trip.riderId !== session.user.id && trip.driverId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    // Run processor for this specific trip
    const processResult = await processOverdueTrips(params.id)

    // Re-fetch trip with fresh fields
    const updatedTrip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phoneNumber: true,
            driverProfile: true
          }
        },
        rider: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phoneNumber: true,
            dropsBalance: true
          }
        }
      }
    })

    const overdueCheck = checkTripOverdue(updatedTrip || trip)

    return NextResponse.json({
      success: true,
      isOverdue: overdueCheck.isOverdue,
      minutesPast: overdueCheck.minutesPast,
      processResult,
      trip: updatedTrip
    })
  } catch (error: any) {
    console.error("Error checking overdue trip:", error)
    return NextResponse.json({ message: "Error checking overdue trip", error: error.message }, { status: 500 })
  }
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  return POST(req, context)
}
