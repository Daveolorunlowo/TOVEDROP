import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'DRIVER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id: tripId } = await params
    const body = await req.json()
    const { minutesBefore, sound, vibrate } = body

    if (!tripId || typeof minutesBefore !== 'number' || minutesBefore <= 0) {
      return NextResponse.json({ message: 'Invalid alarm parameters' }, { status: 400 })
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { rider: true }
    })

    if (!trip) {
      return NextResponse.json({ message: 'Trip not found' }, { status: 404 })
    }

    if (trip.driverId !== session.user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Calculate pickup datetime
    let scheduledAt = new Date(`${trip.date}T${trip.time}`)
    if (isNaN(scheduledAt.getTime())) {
      scheduledAt = new Date(`${trip.date} ${trip.time}`)
    }
    if (isNaN(scheduledAt.getTime())) {
      scheduledAt = new Date(trip.date)
    }

    if (isNaN(scheduledAt.getTime())) {
      return NextResponse.json({ message: 'Invalid trip scheduled date or time' }, { status: 400 })
    }

    const remindAt = new Date(scheduledAt.getTime() - minutesBefore * 60 * 1000)

    // Delete any existing unsent reminder for this trip and driver
    await prisma.tripReminder.deleteMany({
      where: {
        tripId,
        driverId: session.user.id,
        sent: false
      }
    })

    // Create the new trip reminder
    const reminder = await prisma.tripReminder.create({
      data: {
        tripId,
        driverId: session.user.id,
        remindAt,
        type: `${minutesBefore}min`,
        sent: false
      }
    })

    // Also update driver profile alarm settings if sound/vibrate provided
    if (sound || vibrate !== undefined) {
      await prisma.driverProfile.updateMany({
        where: { userId: session.user.id },
        data: {
          alarmEnabled: true,
          ...(sound ? { alarmSound: sound } : {}),
          ...(vibrate !== undefined ? { alarmVibrate: vibrate } : {})
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: `Alarm set for ${minutesBefore} minutes before pickup!`,
      reminder: {
        id: reminder.id,
        remindAt: reminder.remindAt,
        minutesBefore,
        type: reminder.type
      }
    })
  } catch (error: any) {
    console.error('Error setting trip alarm:', error)
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'DRIVER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id: tripId } = await params

    await prisma.tripReminder.deleteMany({
      where: {
        tripId,
        driverId: session.user.id,
        sent: false
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Alarm removed for this trip'
    })
  } catch (error: any) {
    console.error('Error removing trip alarm:', error)
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'DRIVER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id: tripId } = await params

    const reminders = await prisma.tripReminder.findMany({
      where: {
        tripId,
        driverId: session.user.id,
        sent: false
      },
      orderBy: { remindAt: 'asc' }
    })

    return NextResponse.json({ success: true, reminders })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
