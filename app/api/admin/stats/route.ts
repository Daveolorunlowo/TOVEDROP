import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"

export const dynamic = 'force-dynamic';

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
      totalUsers,
      totalDrivers,
      totalTrips,
      completedTrips,
      pendingTrips,
      cancelledTrips,
      driverProfiles,
      users,
      platformRevenueThisMonth,
      driverPayoutsThisMonth,
      dropsSoldThisMonth,
      withdrawalRequests,
      feedbacks,
      recentTripsRaw,
      recentDropsRaw,
      recentRevenuesRaw,
      recentPayoutsRaw,
      recentPurchasedDropsRaw,
      totalReferrals,
      successfulReferrals
    ] = await Promise.all([
      prisma.user.count({ where: { role: "RIDER" } }),
      prisma.user.count({ where: { role: "DRIVER" } }),
      prisma.trip.count(),
      prisma.trip.count({ where: { status: "COMPLETED" } }),
      prisma.trip.count({ where: { status: "PENDING" } }),
      prisma.trip.count({ where: { status: "CANCELLED" } }),
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
      prisma.trip.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { id: true, createdAt: true, status: true, rider: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.dropTransaction.findMany({
        where: { type: 'PURCHASE' },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, createdAt: true, amount: true, nairaAmount: true, user: { select: { name: true } } }
      }),
      prisma.platformRevenue.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { amount: true, createdAt: true }
      }),
      prisma.walletTransaction.findMany({
        where: { type: 'RIDE_EARNING', createdAt: { gte: sevenDaysAgo } },
        select: { amount: true, createdAt: true }
      }),
      prisma.dropTransaction.findMany({
        where: { type: 'PURCHASE', createdAt: { gte: sevenDaysAgo } },
        select: { amount: true, nairaAmount: true, createdAt: true }
      }),
      prisma.referral.count(),
      prisma.referral.count({ where: { status: 'COMPLETED' } })
    ])

    // Build Daily Events (7 days multi-event timeline)
    const dailyMap: Record<string, {
      date: string;
      day: string;
      trips: number;
      completedTrips: number;
      cancelledTrips: number;
      revenue: number;
      driverEarnings: number;
      dropsCount: number;
      dropsNaira: number;
    }> = {}

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const day = d.toLocaleDateString('en-US', { weekday: 'short' })
      dailyMap[key] = {
        date: key,
        day,
        trips: 0,
        completedTrips: 0,
        cancelledTrips: 0,
        revenue: 0,
        driverEarnings: 0,
        dropsCount: 0,
        dropsNaira: 0,
      }
    }

    recentTripsRaw.forEach(trip => {
      const key = trip.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (dailyMap[key]) {
        dailyMap[key].trips++
        if (trip.status === 'COMPLETED') dailyMap[key].completedTrips++
        if (trip.status === 'CANCELLED') dailyMap[key].cancelledTrips++
      }
    })

    recentRevenuesRaw.forEach(rev => {
      const key = rev.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (dailyMap[key]) {
        dailyMap[key].revenue += Number(rev.amount || 0)
      }
    })

    recentPayoutsRaw.forEach(pay => {
      const key = pay.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (dailyMap[key]) {
        dailyMap[key].driverEarnings += Number(pay.amount || 0)
      }
    })

    recentPurchasedDropsRaw.forEach(drop => {
      const key = drop.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (dailyMap[key]) {
        dailyMap[key].dropsCount += Number(drop.amount || 0)
        dailyMap[key].dropsNaira += Number(drop.nairaAmount || 0)
      }
    })

    const dailyEvents = Object.values(dailyMap)
    const chartData = dailyEvents.map(d => ({ date: d.date, trips: d.trips }))

    // Distributions
    const tripDistribution = [
      { name: 'Completed', value: completedTrips, color: '#10B981' },
      { name: 'Pending', value: pendingTrips, color: '#F59E0B' },
      { name: 'Cancelled', value: cancelledTrips, color: '#EF4444' },
      { name: 'Other', value: Math.max(0, totalTrips - (completedTrips + pendingTrips + cancelledTrips)), color: '#3B82F6' },
    ]

    const approvedDriversCount = driverProfiles.filter(d => d.status === 'APPROVED').length
    const pendingDriversCount = driverProfiles.filter(d => d.status === 'PENDING').length
    const suspendedDriversCount = driverProfiles.filter(d => d.status === 'SUSPENDED').length

    const fleetDistribution = [
      { name: 'Approved', value: approvedDriversCount, color: '#10B981' },
      { name: 'Pending Review', value: pendingDriversCount, color: '#FF6B00' },
      { name: 'Suspended', value: suspendedDriversCount, color: '#EF4444' },
    ]

    // Build Recent Activity Feed (mix of latest trips and drops)
    const activityMap = [
      ...recentTripsRaw.slice(0, 10).map(t => ({
        id: `trip-${t.id}`,
        type: 'TRIP',
        status: t.status,
        title: `Ride ${t.status.toLowerCase()}`,
        desc: t.rider ? `${t.rider.name} requested a ride` : 'Ride requested',
        time: t.createdAt
      })),
      ...recentDropsRaw.map(d => ({
        id: `drop-${d.id}`,
        type: 'DROP_PURCHASE',
        status: 'COMPLETED',
        title: 'Drops Purchased',
        desc: d.user ? `${d.user.name} bought ${d.amount} drops (₦${(d.nairaAmount || 0).toLocaleString()})` : `User bought ${d.amount} drops`,
        time: d.createdAt
      }))
    ]
    const recentActivity = activityMap
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 12)

    return NextResponse.json({
      stats: {
        totalUsers,
        totalDrivers,
        totalTrips,
        completedTrips,
        pendingTrips,
        cancelledTrips,
        platformRevenue: platformRevenueThisMonth._sum.amount || 0,
        driverPayouts: driverPayoutsThisMonth._sum.amount || 0,
        dropsSold: dropsSoldThisMonth._sum.amount || 0,
        nairaCollected: dropsSoldThisMonth._sum.nairaAmount || 0,
        totalReferrals,
        successfulReferrals
      },
      chartData,
      dailyEvents,
      tripDistribution,
      fleetDistribution,
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
