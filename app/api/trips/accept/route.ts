import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"
import { sendWebPush } from "@/lib/webpush"
import { pusherServer } from "@/lib/pusher"

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

    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: session.user.id },
      include: { user: true }
    })

    if (!driverProfile || driverProfile.status !== "APPROVED") {
      return NextResponse.json({ message: "Driver is not approved" }, { status: 403 })
    }

    const shareToken = crypto.randomUUID().replace(/-/g, '').slice(0, 12)

    const targetTrip = await prisma.trip.findUnique({ where: { id: tripId } })
    if (!targetTrip) {
      return NextResponse.json({ message: "Trip not found" }, { status: 404 })
    }

    let whereClause: any = { 
      id: tripId, 
      status: 'PENDING', 
      driverId: null 
    }
    
    if (targetTrip.isPool && targetTrip.poolGroupId) {
      whereClause = {
        poolGroupId: targetTrip.poolGroupId,
        status: 'PENDING',
        driverId: null
      }
    }

    const result = await prisma.trip.updateMany({
      where: whereClause,
      data: { 
        status: 'CONFIRMED', 
        driverId: session.user.id,
        shareToken: shareToken
      }
    })

    if (result.count === 0) {
      return NextResponse.json({ message: "Trip was already accepted by someone else or is no longer available" }, { status: 409 })
    }

    // Notify all affected riders via Web Push and Pusher
    const updatedTrips = await prisma.trip.findMany({
      where: targetTrip.isPool && targetTrip.poolGroupId 
        ? { poolGroupId: targetTrip.poolGroupId, driverId: session.user.id }
        : { id: tripId },
      include: { rider: true }
    })
    
    const driverName = driverProfile.user?.name || "A driver"
    const vehicle = `${driverProfile.vehicleColor} ${driverProfile.vehicleMake} ${driverProfile.vehicleModel}`
    const rating = driverProfile.rating > 0 ? driverProfile.rating.toFixed(1) : 'New'

    for (const trip of updatedTrips) {
      const title = 'Ride Accepted! 🎉'
      const message = `${driverName} is on the way in a ${vehicle} (⭐ ${rating}).\nPickup: ${trip.time} at ${trip.pickup}`
      const url = `/trip/${shareToken}`
      
      sendWebPush(trip.riderId, title, message, url)
      
      await pusherServer.trigger(`user-trips-${trip.riderId}`, 'trip-accepted', {
        tripId: trip.id,
        driverName,
        vehicle,
        rating,
        isPool: trip.isPool
      }).catch(err => console.error("Pusher trigger failed:", err))
    }

    return NextResponse.json({ message: "Trip(s) accepted successfully", shareToken, count: result.count }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ message: "Error accepting trip", error: error.message }, { status: 500 })
  }
}
