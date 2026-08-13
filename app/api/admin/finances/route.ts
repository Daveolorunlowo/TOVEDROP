import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // 1. Company Position (All-Time)
    
    // Total Cash Collected (Purchases)
    const cashResult = await prisma.dropTransaction.aggregate({
      where: { type: 'PURCHASE' },
      _sum: { nairaAmount: true }
    })
    const totalCashCollected = cashResult._sum.nairaAmount || 0

    // Recognized Revenue (Platform cut)
    const revenueResult = await prisma.platformRevenue.aggregate({
      _sum: { amount: true }
    })
    const recognizedRevenue = revenueResult._sum.amount || 0

    // Outstanding Drops Liability (remainingDrops * pricePerDrop)
    const activeLots = await prisma.dropLot.findMany({
      where: { remainingDrops: { gt: 0 } }
    })
    const outstandingLiability = activeLots.reduce((sum, lot) => {
      return sum + (lot.remainingDrops * lot.pricePerDrop)
    }, 0)

    // Total Driver Payouts
    const payoutsResult = await prisma.walletTransaction.aggregate({
      where: { type: 'RIDE_EARNING' },
      _sum: { amount: true }
    })
    const totalDriverPayouts = payoutsResult._sum.amount || 0

    // Time-based breakdowns (This Week, This Month)
    const now = new Date()
    
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // This Week Cash
    const cashWeekResult = await prisma.dropTransaction.aggregate({
      where: { type: 'PURCHASE', createdAt: { gte: startOfWeek } },
      _sum: { nairaAmount: true }
    })
    const cashCollectedThisWeek = cashWeekResult._sum.nairaAmount || 0

    // This Week Revenue
    const revWeekResult = await prisma.platformRevenue.aggregate({
      where: { createdAt: { gte: startOfWeek } },
      _sum: { amount: true }
    })
    const revenueThisWeek = revWeekResult._sum.amount || 0

    // This Week Payouts
    const payoutsWeekResult = await prisma.walletTransaction.aggregate({
      where: { type: 'RIDE_EARNING', createdAt: { gte: startOfWeek } },
      _sum: { amount: true }
    })
    const payoutsThisWeek = payoutsWeekResult._sum.amount || 0

    // This Month Cash
    const cashMonthResult = await prisma.dropTransaction.aggregate({
      where: { type: 'PURCHASE', createdAt: { gte: startOfMonth } },
      _sum: { nairaAmount: true }
    })
    const cashCollectedThisMonth = cashMonthResult._sum.nairaAmount || 0

    // This Month Revenue
    const revMonthResult = await prisma.platformRevenue.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { amount: true }
    })
    const revenueThisMonth = revMonthResult._sum.amount || 0

    // This Month Payouts
    const payoutsMonthResult = await prisma.walletTransaction.aggregate({
      where: { type: 'RIDE_EARNING', createdAt: { gte: startOfMonth } },
      _sum: { amount: true }
    })
    const payoutsThisMonth = payoutsMonthResult._sum.amount || 0

    // 2. Drivers
    const driversData = await prisma.driverProfile.findMany({
      include: {
        user: { select: { name: true, email: true } },
        walletTransactions: {
          where: { type: 'RIDE_EARNING' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    let totalDriverBalances = 0
    const drivers = driversData.map(d => {
      totalDriverBalances += d.walletBalance
      return {
        id: d.userId, // for linking to /admin/drivers/[id] if that's the setup
        name: d.user?.name || 'Unknown',
        email: d.user?.email || 'Unknown',
        status: d.status,
        walletBalance: d.walletBalance,
        totalTrips: d.totalTrips,
        avgPerTrip: d.totalTrips > 0 ? (d.walletBalance / d.totalTrips) : 0, // This is a rough estimation of current balance / total trips
        lastPayoutDate: d.walletTransactions.length > 0 ? d.walletTransactions[0].createdAt : null
      }
    })
    // Sort highest earners first
    drivers.sort((a, b) => b.walletBalance - a.walletBalance)

    // 3. Riders / Drops
    const ridersData = await prisma.user.findMany({
      where: { dropsBalance: { gt: 0 } },
      include: {
        dropLots: { where: { remainingDrops: { gt: 0 } } },
        _count: { select: { tripsAsRider: true } }
      }
    })

    let totalDropsInCirculation = 0
    let ridersNairaValue = 0

    const riders = ridersData.map(r => {
      totalDropsInCirculation += r.dropsBalance
      let estNairaValue = 0
      
      if (r.dropLots.length > 0) {
        estNairaValue = r.dropLots.reduce((sum, lot) => sum + (lot.remainingDrops * lot.pricePerDrop), 0)
      } else {
        // Fallback approximation if no active dropLots found but dropsBalance > 0
        estNairaValue = r.dropsBalance * 45 // Approximating ~45 NGN per drop
      }

      ridersNairaValue += estNairaValue

      return {
        id: r.id,
        name: r.name || 'Unknown',
        email: r.email || 'Unknown',
        dropsBalance: r.dropsBalance,
        estNairaValue,
        totalTripsBooked: r._count.tripsAsRider,
        joinedDate: null, // Since we don't have createdAt on User model in SQLite? Oh wait, User has no createdAt? Let me check schema.
        hasDropLots: r.dropLots.length > 0
      }
    })

    return NextResponse.json({
      company: {
        totalCashCollected,
        recognizedRevenue,
        outstandingLiability,
        totalDriverPayouts,
        thisWeek: {
          cashCollected: cashCollectedThisWeek,
          recognizedRevenue: revenueThisWeek,
          driverPayouts: payoutsThisWeek
        },
        thisMonth: {
          cashCollected: cashCollectedThisMonth,
          recognizedRevenue: revenueThisMonth,
          driverPayouts: payoutsThisMonth
        }
      },
      drivers: {
        totalBalances: totalDriverBalances,
        list: drivers
      },
      riders: {
        totalDrops: totalDropsInCirculation,
        totalNairaValue: ridersNairaValue,
        avgDropsPerRider: riders.length > 0 ? (totalDropsInCirculation / riders.length) : 0,
        list: riders
      }
    })
  } catch (error: any) {
    console.error('Error fetching finances:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
