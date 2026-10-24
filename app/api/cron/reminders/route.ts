import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendPushNotification } from '@/lib/push'
import { isAfter, subMinutes, subHours } from 'date-fns'
import { processOverdueTrips } from '@/lib/overdue-processor'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Security check: ensure this is called by Vercel Cron or authorized request
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const { searchParams } = new URL(req.url);
  const keyParam = searchParams.get('key');
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && keyParam !== cronSecret) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const now = new Date();

    // 1. Check for standard TripReminders (1hr, 30m, 10m, exact)
    const pendingReminders = await prisma.tripReminder.findMany({
      where: {
        sent: false,
        remindAt: {
          lte: now
        }
      },
      include: {
        trip: true
      }
    });

    for (const reminder of pendingReminders) {
      if (reminder.trip.status !== 'CONFIRMED' || !reminder.trip.driverId) {
        // Cancel reminder if trip is cancelled, completed, or unassigned
        await prisma.tripReminder.update({
          where: { id: reminder.id },
          data: { sent: true }
        });
        continue;
      }

      await sendPushNotification(reminder.trip.driverId, {
        title: `⏰ TRIP ALARM: Pickup in ${reminder.type}!`,
        body: `Upcoming ride from ${reminder.trip.pickup}. Tap immediately to view trip & start moving!`,
        url: `/driver/trips/${reminder.trip.id}`,
        type: 'REMINDER_URGENT',
        isAlarm: true,
        tripId: reminder.trip.id
      });

      await prisma.tripReminder.update({
        where: { id: reminder.id },
        data: { sent: true }
      });
    }

    // 2. Check for "You're late" alerts (every 5 mins for confirmed trips where scheduledTime < now)
    const lateTrips = await prisma.trip.findMany({
      where: {
        status: 'CONFIRMED',
        isScheduled: true,
        scheduledDateTime: {
          lte: subMinutes(now, 1) // Passed departure time
        },
        driverId: {
          not: null
        }
      }
    });

    // We can track late alerts in a separate table, but to avoid schema changes, 
    // we can use TripReminder and create a new one every 5 mins.
    for (const trip of lateTrips) {
      if (!trip.driverId) continue;

      // Check if we already sent a late alert in the last 5 minutes
      const recentLateAlert = await prisma.tripReminder.findFirst({
        where: {
          tripId: trip.id,
          type: 'LATE',
          createdAt: {
            gte: subMinutes(now, 5)
          }
        }
      });

      if (!recentLateAlert) {
        await sendPushNotification(trip.driverId, {
          title: "🚨 You're Late for Pickup!",
          body: `Your trip from ${trip.pickup} was scheduled to depart already. Please start the trip or contact the rider.`,
          url: `/driver/trips/${trip.id}`,
          type: 'REMINDER_URGENT'
        });

        await prisma.tripReminder.create({
          data: {
            tripId: trip.id,
            driverId: trip.driverId,
            remindAt: now,
            type: 'LATE',
            sent: true
          }
        });
      }
    }

    // 3. Process overdue trip guarantees (compensate riders and warn/penalize late drivers)
    const overdueResults = await processOverdueTrips();

    return NextResponse.json({ 
      success: true, 
      processedReminders: pendingReminders.length,
      lateAlerts: lateTrips.length,
      overdueResults
    });

  } catch (error) {
    console.error('Error in reminders cron:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
