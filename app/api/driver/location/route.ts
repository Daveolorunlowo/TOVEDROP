import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { pusherServer } from '@/lib/pusher'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    // Only allow authenticated drivers to broadcast location
    if (!session || !session.user || session.user.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { driverId, driverName, lat, lng, heading, speed, status } = body

    if (!driverId || lat === undefined || lng === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Trigger pusher event to global driver locations channel
    await pusherServer.trigger('global-driver-locations', 'location-update', {
      driverId,
      driverName,
      lat,
      lng,
      heading,
      speed,
      status, // 'AVAILABLE' | 'ON_TRIP'
      timestamp: Date.now()
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to broadcast driver location:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
