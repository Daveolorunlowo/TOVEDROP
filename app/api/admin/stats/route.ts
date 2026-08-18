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

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalUsers, totalDrivers, totalTrips, completedTrips, driverProfiles, users,
      platformRevenueThisMonth,
      driverPayoutsThisMonth,
      dropsSoldThisMonth,
      withdrawalRequests,
      feedbacks,
      recentTripsRaw,
      recentDropsRaw,
      totalReferrals,
      successfulReferrals
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
      }),
      prisma.withdrawalRequest.findMany({
        include: { driver: { include: { user: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.feedback.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' }
      }),
      // For chart data and recent activity
      prisma.trip.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { id: true, createdAt: true, status: true, rider: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.dropTransaction.findMany({
        where: { type: 'PURCHASE' },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, createdAt: true, amount: true, user: { select: { name: true } } }
      }),
      prisma.referral.count(),
      prisma.referral.count({ where: { status: 'COMPLETED' } })
    ])

    // Build Chart Data (Trips per day over last 7 days)
    const chartDataMap: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      chartDataMap[dateStr] = 0
    }
    recentTripsRaw.forEach(trip => {
      const dateStr = trip.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (chartDataMap[dateStr] !== undefined) {
        chartDataMap[dateStr]++
      }
    })
    const chartData = Object.keys(chartDataMap).map(date => ({
      date,
      trips: chartDataMap[date]
    }))

    // Build Recent Activity Feed (mix of latest trips and drops)
    const activityMap = [
      ...recentTripsRaw.slice(0, 10).map(t => ({
        id: `trip-${t.id}`,
        type: 'TRIP',
        title: `Ride ${t.status.toLowerCase()}`,
        desc: t.rider ? `${t.rider.name} requested a ride` : 'Ride requested',
        time: t.createdAt
      })),
      ...recentDropsRaw.map(d => ({
        id: `drop-${d.id}`,
        type: 'DROP_PURCHASE',
        title: 'Drops Purchased',
        desc: d.user ? `${d.user.name} bought ${d.amount} drops` : `User bought ${d.amount} drops`,
        time: d.createdAt
      }))
    ]
    const recentActivity = activityMap
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 10)

    return NextResponse.json({
      stats: {
        totalUsers,
        totalDrivers,
        totalTrips,
        completedTrips,
        platformRevenue: platformRevenueThisMonth._sum.amount || 0,
        driverPayouts: driverPayoutsThisMonth._sum.amount || 0,
        dropsSold: dropsSoldThisMonth._sum.amount || 0,
        nairaCollected: dropsSoldThisMonth._sum.nairaAmount || 0,
        totalReferrals,
        successfulReferrals
      },
      chartData,
      recentActivity,
      drivers: driverProfiles,
      users,
      withdrawalRequests,
      feedbacks,
      autoApproveDrivers: process.env.AUTO_APPROVE_DRIVERS === 'true'
    }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ message: "Error fetching admin stats", error: error.message }, { status: 500 })
  }
}
