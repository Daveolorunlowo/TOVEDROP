import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || session.user.role !== "DRIVER") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: session.user.id },
      include: { 
        user: true,
        walletTransactions: { orderBy: { createdAt: 'desc' }, include: { trip: true } }
      }
    })

    if (!driverProfile) {
      return NextResponse.json({ driverProfile: null, pendingTrips: [], confirmedTrips: [] })
    }

    // Get all pending trips (available for anyone to accept)
    const pendingTrips = await prisma.trip.findMany({
      where: { status: "PENDING" },
      include: { rider: true },
      orderBy: { createdAt: "desc" }
    })

    // Get trips accepted by this driver
    const confirmedTrips = await prisma.trip.findMany({
      where: { driverId: session.user.id, status: "CONFIRMED" },
      include: { rider: true },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ driverProfile, pendingTrips, confirmedTrips })
  } catch (error: any) {
    return NextResponse.json({ message: "Error fetching data", error: error.message }, { status: 500 })
  }
}
