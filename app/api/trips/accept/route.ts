import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"

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
      where: { userId: session.user.id }
    })

    if (!driverProfile || driverProfile.status !== "APPROVED") {
      return NextResponse.json({ message: "Driver is not approved" }, { status: 403 })
    }

    // Atomic update to accept the trip and prevent race conditions
    const result = await prisma.trip.updateMany({
      where: { 
        id: tripId, 
        status: 'PENDING', 
        driverId: null 
      },
      data: { 
        status: 'CONFIRMED', 
        driverId: session.user.id 
      }
    })

    if (result.count === 0) {
      return NextResponse.json({ message: "Trip was already accepted by someone else or is no longer available" }, { status: 409 })
    }

    return NextResponse.json({ message: "Trip accepted successfully" }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ message: "Error accepting trip", error: error.message }, { status: 500 })
  }
}
