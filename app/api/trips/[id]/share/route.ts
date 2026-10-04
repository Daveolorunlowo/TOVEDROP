import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const trip = await prisma.trip.findUnique({
      where: { id }
    })

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Only allow the rider to share their trip
    if (trip.riderId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If it already has a shareToken, return it
    if (trip.shareToken) {
      return NextResponse.json({ shareToken: trip.shareToken })
    }

    // Generate a new secure, URL-safe share token
    const shareToken = crypto.randomBytes(16).toString('hex')

    await prisma.trip.update({
      where: { id: trip.id },
      data: { shareToken }
    })

    return NextResponse.json({ shareToken })
  } catch (error) {
    console.error('Error generating share link:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
