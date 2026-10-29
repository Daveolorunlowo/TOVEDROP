import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const trip = await prisma.trip.findUnique({
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
            phoneNumber: true
          }
        },
        review: true
      }
    })

    if (!trip) {
      return NextResponse.json({ message: "Trip not found" }, { status: 404 })
    }

    if (trip.riderId !== session.user.id && trip.driverId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    // Proactive check: If trip is PENDING and pickup time has passed without driver acceptance, expire & refund it
    if (trip.status === 'PENDING' && !trip.driverId) {
      const { expireAllPendingTripsPastPickup } = await import('@/lib/trip-expiration')
      const expiredCount = await expireAllPendingTripsPastPickup({ tripId: trip.id })
      if (expiredCount > 0) {
        const refreshedTrip = await prisma.trip.findUnique({
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
                phoneNumber: true
              }
            },
            review: true
          }
        })
        if (refreshedTrip) {
          return NextResponse.json({ trip: refreshedTrip })
        }
      }
    }

    // Proactive check: If trip is overdue and uncompensated, process it immediately
    if (trip.status === 'CONFIRMED' && !trip.driverArrivedAt && !trip.driverDepartedAt && !trip.riderCompensatedAt) {
      const { checkTripOverdue } = await import('@/lib/trip-schedule')
      const overdueStatus = checkTripOverdue(trip)
      if (overdueStatus.isOverdue) {
        const { processOverdueTrips } = await import('@/lib/overdue-processor')
        await processOverdueTrips(trip.id)
        
        const refreshedTrip = await prisma.trip.findUnique({
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
                phoneNumber: true
              }
            },
            review: true
          }
        })
        if (refreshedTrip) {
          return NextResponse.json({ trip: refreshedTrip })
        }
      }
    }

    return NextResponse.json({ trip })
  } catch (error: any) {
    return NextResponse.json({ message: "Error fetching trip", error: error.message }, { status: 500 })
  }
}
