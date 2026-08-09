import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalUsers, totalDrivers, totalTrips, completedTrips, driverProfiles, users,
      platformRevenueThisMonth,
      driverPayoutsThisMonth,
      dropsSoldThisMonth
    ] = await Promise.all([
      prisma.user.count({ where: { role: "RIDER" } }),
      prisma.user.count({ where: { role: "DRIVER" } }),
      prisma.trip.count(),
      prisma.trip.count({ where: { status: "COMPLETED" } }),
      prisma.driverProfile.findMany({ include: { user: true } }),
      prisma.user.findMany({ where: { role: "RIDER" } }),
      prisma.platformRevenue.aggregate({
        where: { createdAt: { gte: firstDayOfMonth } },
        _sum: { amount: true }
      }),
      prisma.walletTransaction.aggregate({
        where: { type: 'RIDE_EARNING', createdAt: { gte: firstDayOfMonth } },
        _sum: { amount: true }
      }),
      prisma.dropTransaction.aggregate({
        where: { type: 'PURCHASE', createdAt: { gte: firstDayOfMonth } },
        _sum: { amount: true, nairaAmount: true }
      })
    ])

    return NextResponse.json({
      stats: {
        totalUsers,
        totalDrivers,
        totalTrips,
        completedTrips,
        platformRevenue: platformRevenueThisMonth._sum.amount || 0,
        driverPayouts: driverPayoutsThisMonth._sum.amount || 0,
        dropsSold: dropsSoldThisMonth._sum.amount || 0,
        nairaCollected: dropsSoldThisMonth._sum.nairaAmount || 0
      },
      drivers: driverProfiles,
      users,
      autoApproveDrivers: process.env.AUTO_APPROVE_DRIVERS === 'true'
    }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ message: "Error fetching admin stats", error: error.message }, { status: 500 })
  }
}
