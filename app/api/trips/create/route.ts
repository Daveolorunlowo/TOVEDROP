import { NextResponse, NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"
import { sendWebPush } from "@/lib/webpush"
import { pusherServer } from "@/lib/pusher"
import { checkRateLimit } from "@/lib/rateLimit"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  try {
    const rateLimit = checkRateLimit(req, 10, 60 * 1000) // 10 requests per minute
    if (!rateLimit.success) {
      return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 })
    }

    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { pickup, pickupLat, pickupLng, destination, destinationLat, destinationLng, date, time, notes, isPool, isScheduled, scheduledDateTime, idempotencyKey } = await req.json()
    
    if (!pickup || !destination || !date || !time || pickupLat === undefined || pickupLng === undefined || destinationLat === undefined || destinationLng === undefined) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const BOWEN_BOUNDS = { north: 7.6400, south: 7.6080, east: 4.2050, west: 4.1730 }

    const isWithinBounds = (lat: number, lng: number) => {
      return lat >= BOWEN_BOUNDS.south && lat <= BOWEN_BOUNDS.north && lng >= BOWEN_BOUNDS.west && lng <= BOWEN_BOUNDS.east
    }

    if (!isWithinBounds(pickupLat, pickupLng) || !isWithinBounds(destinationLat, destinationLng)) {
      return NextResponse.json({ message: "Locations must be within Bowen University campus bounds." }, { status: 400 })
    }

    // === IDEMPOTENCY CHECK ===
    // If a trip with this idempotency key already exists, return it (dedup)
    if (idempotencyKey) {
      const existingTrip = await prisma.trip.findUnique({
        where: { idempotencyKey }
      })

      if (existingTrip) {
        logger.info("Idempotent trip creation - returning existing trip", {
          action: "CREATE_TRIP_IDEMPOTENT",
          userId: session.user.id,
          tripId: existingTrip.id,
          idempotencyKey,
        })
        return NextResponse.json({ message: "Trip already created", trip: existingTrip }, { status: 200 })
      }
    }

    // === DUPLICATE-TRIP TIME GUARD ===
    // Reject if this rider already has a PENDING trip created in the last 60 seconds
    const recentCutoff = new Date(Date.now() - 60 * 1000)
    const recentPendingTrip = await prisma.trip.findFirst({
      where: {
        riderId: session.user.id,
        status: "PENDING",
        createdAt: { gte: recentCutoff },
      },
      orderBy: { createdAt: "desc" },
    })

    if (recentPendingTrip) {
      logger.warn("Duplicate trip guard triggered - rider has recent PENDING trip", {
        action: "CREATE_TRIP_DUPLICATE_GUARD",
        userId: session.user.id,
        existingTripId: recentPendingTrip.id,
        existingTripCreatedAt: recentPendingTrip.createdAt.toISOString(),
      })
      return NextResponse.json(
        { message: "You already have a pending booking. Check your trips.", trip: recentPendingTrip },
        { status: 409 }
      )
    }

    // Wrap in transaction: check drops, deduct, create trip
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: session.user.id }
      })

      if (!user) {
        throw new Error("User not found")
      }

      if (user.dropsBalance < 1) {
        throw new Error("Insufficient Drops")
      }

      await tx.user.update({
        where: { id: user.id },
        data: { dropsBalance: user.dropsBalance - 1 }
      })

      // Find the oldest DropLot with remaining drops (FIFO)
      const dropLot = await tx.dropLot.findFirst({
        where: { 
          userId: user.id,
          remainingDrops: { gt: 0 }
        },
        orderBy: { createdAt: 'asc' }
      })

      let bookingFeeNaira = 0
      let dropLotId = null

      if (dropLot) {
        bookingFeeNaira = dropLot.pricePerDrop
        dropLotId = dropLot.id

        await tx.dropLot.update({
          where: { id: dropLot.id },
          data: { remainingDrops: dropLot.remainingDrops - 1 }
        })
      }

      await tx.dropTransaction.create({
        data: {
          userId: user.id,
          type: 'BOOKING',
          amount: -1,
        }
      })

      let poolGroupId = null
      if (isPool) {
        // Try to find an existing pending pool ride in the next 30 minutes
        // For simplicity we just look for any PENDING pool ride
        const existingPool = await tx.trip.findFirst({
          where: {
            status: "PENDING",
            isPool: true
          }
        })
        if (existingPool && existingPool.poolGroupId) {
          poolGroupId = existingPool.poolGroupId
        } else {
          poolGroupId = crypto.randomUUID()
        }
      }

      const trip = await tx.trip.create({
        data: {
          riderId: user.id,
          pickup,
          pickupLat,
          pickupLng,
          destination,
          destinationLat,
          destinationLng,
          date,
          time,
          notes,
          status: "PENDING",
          bookingFeeNaira,
          dropLotId,
          isPool: Boolean(isPool),
          poolGroupId,
          isScheduled: Boolean(isScheduled),
          scheduledDateTime: scheduledDateTime ? new Date(scheduledDateTime) : null,
          idempotencyKey: idempotencyKey || null,
        }
      })
      
      return trip
    })

    logger.info("Trip created successfully", {
      action: "CREATE_TRIP_SUCCESS",
      userId: session.user.id,
      tripId: result.id,
      idempotencyKey: idempotencyKey || undefined,
      pickup,
      destination,
    })

    // === RESPOND IMMEDIATELY ===
    // Return success as soon as the trip is durably committed.
    // All downstream notifications are fire-and-forget below.
    const response = NextResponse.json({ message: "Trip created successfully", trip: result }, { status: 201 })

    // Notify drivers in the background via Web Push (fire-and-forget)
    prisma.driverProfile.findMany({
      where: { status: 'APPROVED' },
    }).then(async (drivers) => {
      if (drivers.length > 0) {
        const title = 'New Ride Request'
        const message = `${pickup} → ${destination}\n${date} at ${time}`
        const url = '/driver'
        
        await Promise.all(
          drivers.map(driver => sendWebPush(driver.userId, title, message, url))
        )
      }
    }).catch(err => console.error("Background Web Push driver broadcast failed:", err))

    // Trigger pusher event to all drivers (fire-and-forget)
    pusherServer.trigger('global-trips', 'new-trip', {
      trip: result
    }).catch(err => console.error("Background Pusher trigger failed:", err))

    return response
  } catch (error: any) {
    logger.error("Trip creation failed", error, {
      action: "CREATE_TRIP_ERROR",
      userId: undefined,
    })

    if (error.message === "Insufficient Drops") {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }
    return NextResponse.json({ message: "Error creating trip", error: error.message }, { status: 500 })
  }
}
