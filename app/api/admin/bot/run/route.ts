import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { subHours, subDays } from 'date-fns';

// In a real production app, use something like:
// const CRON_SECRET = process.env.CRON_SECRET || 'dev_secret';

export async function GET(request: Request) {
  // 1. Verify Secret Key (Example implementation)
  const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const now = new Date();
    const twentyFourHoursAgo = subHours(now, 24);
    const sevenDaysAgo = subDays(now, 7);
    const thirtyDaysAgo = subDays(now, 30);
    
    // We will collect alerts in this array
    const alerts: any[] = [];
    
    // ----------------------------------------------------
    // 1. USER BEHAVIOR ANOMALIES
    // ----------------------------------------------------
    
    // A. Rapid Account Activity
    // Flag: 5+ rides booked within 2 hours (we use 24h for simplicity here)
    const rapidBookings = await prisma.trip.groupBy({
      by: ['riderId'],
      where: {
        createdAt: { gte: twentyFourHoursAgo }
      },
      _count: { id: true }
    });

    for (const record of rapidBookings) {
      if (record._count.id >= 5) {
        alerts.push({
          category: 'USER_BEHAVIOR',
          title: 'Suspicious Rapid Booking',
          severity: 'CRITICAL',
          riskScore: 75,
          details: `User booked ${record._count.id} rides in the last 24h.`,
          affectedUsers: JSON.stringify([record.riderId]),
          recommendedAction: 'Review account for payment fraud or bot testing'
        });
      }
    }

    // B. Payment Pattern Anomalies (Pattern Cancel After Acceptance)
    const recentlyCancelledTrips = await prisma.trip.groupBy({
      by: ['riderId'],
      where: {
        status: 'CANCELLED',
        driverId: { not: null },
        createdAt: { gte: sevenDaysAgo }
      },
      _count: {
        id: true
      }
    });

    for (const cancelRecord of recentlyCancelledTrips) {
      if (cancelRecord._count.id > 3) {
        alerts.push({
          category: 'USER_BEHAVIOR',
          title: 'Pattern Cancel After Acceptance',
          severity: 'INVESTIGATE',
          riskScore: 60,
          details: `User cancelled ${cancelRecord._count.id} trips AFTER driver accepted in past 7 days.`,
          affectedUsers: JSON.stringify([cancelRecord.riderId]),
          recommendedAction: 'Review account for drops farming or harassment'
        });
      }
    }

    // ----------------------------------------------------
    // 2. DRIVER BEHAVIOR ANOMALIES
    // ----------------------------------------------------
    
    // A. Rating Collapse
    const recentReviews = await prisma.review.findMany({
      where: { createdAt: { gte: twentyFourHoursAgo } },
      include: { trip: true }
    });
    
    const driverReviewCounts: Record<string, { count: number, totalScore: number }> = {};
    for (const rev of recentReviews) {
      if (rev.trip?.driverId) {
        if (!driverReviewCounts[rev.trip.driverId]) driverReviewCounts[rev.trip.driverId] = { count: 0, totalScore: 0 };
        driverReviewCounts[rev.trip.driverId].count++;
        driverReviewCounts[rev.trip.driverId].totalScore += rev.rating;
      }
    }

    for (const driverId of Object.keys(driverReviewCounts)) {
      const stats = driverReviewCounts[driverId];
      if (stats.count >= 3) {
        const avgRating24h = stats.totalScore / stats.count;
        if (avgRating24h < 3.0) {
          alerts.push({
            category: 'DRIVER_BEHAVIOR',
            title: 'Rating Collapse',
            severity: 'CRITICAL',
            riskScore: 85,
            details: `Driver received ${stats.count} reviews in 24h averaging ${avgRating24h.toFixed(1)} stars.`,
            affectedUsers: JSON.stringify([driverId]),
            recommendedAction: 'Suspend driver temporarily, investigate reviews'
          });
        }
      }
    }

    // B. Driver Inactive Anomaly
    const drivers = await prisma.user.findMany({
      where: { role: 'DRIVER' },
      include: {
        tripsAsDriver: {
          where: {
            status: 'COMPLETED'
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    const sevenDaysAgoForInactive = subDays(now, 7);
    for (const driver of drivers) {
      const recentTrips = driver.tripsAsDriver.filter(t => t.createdAt >= sevenDaysAgoForInactive);
      const olderTrips = driver.tripsAsDriver.filter(t => t.createdAt < sevenDaysAgoForInactive);
      
      if (olderTrips.length > 5 && recentTrips.length === 0) {
        alerts.push({
          category: 'DRIVER_BEHAVIOR',
          title: 'Driver Inactive Anomaly',
          severity: 'MONITOR',
          riskScore: 40,
          details: 'Driver previously active but 0 completed rides in past 7 days.',
          affectedUsers: JSON.stringify([driver.id]),
          recommendedAction: 'Check driver status, offer support'
        });
      }
    }

    // ----------------------------------------------------
    // 3. PLATFORM & DATA INTEGRITY
    // ----------------------------------------------------
    
    // A. Impossible Rides (Zero Distance / Same Pickup & Destination)
    const recentCompletedTrips = await prisma.trip.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: twentyFourHoursAgo }
      }
    });

    for (const trip of recentCompletedTrips) {
      if (trip.pickup.trim().toLowerCase() === trip.destination.trim().toLowerCase()) {
        alerts.push({
          category: 'SYSTEM_INTEGRITY',
          title: 'Impossible Ride Detected',
          severity: 'INVESTIGATE',
          riskScore: 65,
          details: `Trip ${trip.id} completed with identical pickup and destination (${trip.pickup}).`,
          affectedUsers: JSON.stringify([trip.riderId, trip.driverId].filter(Boolean)),
          recommendedAction: 'Verify trip validity, check for ghost rides or drops farming.'
        });
      }
    }

    // ----------------------------------------------------
    // SAVE REPORT
    // ----------------------------------------------------
    const totalUsers = await prisma.user.count();
    const totalDrivers = await prisma.user.count({ where: { role: 'DRIVER' } });
    const totalRides24h = await prisma.trip.count({
      where: { createdAt: { gte: twentyFourHoursAgo } }
    });

    const report = await prisma.anomalyReport.create({
      data: {
        totalRides: totalRides24h,
        totalUsers,
        totalDrivers,
        alerts: {
          create: alerts.map(a => ({
            category: a.category,
            title: a.title,
            severity: a.severity,
            riskScore: a.riskScore,
            details: a.details,
            affectedUsers: a.affectedUsers,
            recommendedAction: a.recommendedAction,
            status: 'PENDING'
          }))
        }
      },
      include: { alerts: true }
    });

    // Mock Email Send
    console.log(`[ANOMALY BOT] Report generated! ${alerts.length} alerts found.`);

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('[ANOMALY_BOT_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
