import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendWebPush } from '@/lib/webpush'
import { sendEmail } from '@/lib/email'

export async function POST() {
  try {
    const now = new Date()
    const fifteenMinsFromNow = new Date(now.getTime() + 15 * 60000)
    const twentyMinsFromNow = new Date(now.getTime() + 20 * 60000)

    // Find scheduled trips between 15-20 mins from now that have a driver but no reminder sent
    const upcomingTrips = await prisma.trip.findMany({
      where: {
        isScheduled: true,
        status: 'CONFIRMED',
        scheduledDateTime: {
          gte: fifteenMinsFromNow,
          lte: twentyMinsFromNow
        },
        driverId: { not: null }
      },
      include: { driver: true }
    })

    let remindersSent = 0

    for (const trip of upcomingTrips) {
      if (!trip.driverId) continue

      // Check if a reminder for 15-min warning was already created
      const existingReminder = await prisma.tripReminder.findFirst({
        where: {
          tripId: trip.id,
          type: '15_MIN_WARNING'
        }
      })

      if (!existingReminder) {
        // Create reminder
        await prisma.tripReminder.create({
          data: {
            tripId: trip.id,
            driverId: trip.driverId,
            remindAt: new Date(),
            type: '15_MIN_WARNING',
            sent: true
          }
        })

        // Send Push Notification
        await sendWebPush(
          trip.driverId,
          'Scheduled Trip in 15 mins!',
          `Your scheduled trip from ${trip.pickup} to ${trip.destination} is coming up at ${trip.time}.`,
          '/driver'
        ).catch(e => console.error('Web Push failed:', e))

        // Send Email via Resend
        if (trip.driver?.email) {
          const emailHtml = `
            <h2>TOVEDROP Trip Reminder</h2>
            <p>Your scheduled trip is coming up in 15 minutes.</p>
            <ul>
              <li><strong>Pickup:</strong> ${trip.pickup}</li>
              <li><strong>Destination:</strong> ${trip.destination}</li>
              <li><strong>Date:</strong> ${trip.date}</li>
              <li><strong>Time:</strong> ${trip.time}</li>
            </ul>
            <p>Please open the TOVEDROP driver dashboard to head to the pickup location.</p>
          `
          await sendEmail(
            trip.driver.email,
            'TOVEDROP: Trip in 15 Minutes',
            emailHtml
          )
        }

        remindersSent++
      }
    }

    return NextResponse.json({ success: true, remindersSent })
  } catch (error) {
    console.error('[SCHEDULED_REMINDER_ERROR]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
