import { NextResponse, NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"
import { pusherServer } from "@/lib/pusher"
import { sendWebPush } from "@/lib/webpush"

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    const params = await context.params
    const tripId = params.id
    const { lat, lng } = await req.json().catch(() => ({}))

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { rider: true, driver: true }
    })

    if (!trip) return NextResponse.json({ message: "Trip not found" }, { status: 404 })

    const isRider = trip.riderId === session.user.id
    const isDriver = trip.driverId === session.user.id
    if (!isRider && !isDriver) return NextResponse.json({ message: "Forbidden" }, { status: 403 })

    const senderRole = isRider ? "RIDER" : "DRIVER"
    const content = `🚨 SOS triggered by ${senderRole} (${session.user.name}) on Trip ${tripId}. ${lat ? `Location: ${lat}, ${lng}` : ''}`

    // Log it as high priority feedback
    await prisma.feedback.create({
      data: {
        userId: session.user.id,
        type: "SOS",
        content,
        status: "OPEN" // Admin will need to resolve it
      }
    })

    // Alert admins via pusher
    if (pusherServer) {
      await pusherServer.trigger('admin-alerts', 'sos-triggered', {
        tripId,
        sender: session.user.name,
        role: senderRole,
        content,
        lat, lng
      }).catch(err => console.error("Pusher SOS trigger failed:", err))
    }

    // Instant Web Push to all Admins
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true }
      })
      if (admins.length > 0) {
        await Promise.allSettled(
          admins.map(adm => sendWebPush(adm.id, '🚨 SOS EMERGENCY ALERT!', content, `/admin`))
        )
      }
    } catch (err) {
      console.error("[SOS] Admin push notification failed:", err)
    }

    return NextResponse.json({ message: "SOS Alert Sent" }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ message: "Error", error: error.message }, { status: 500 })
  }
}
