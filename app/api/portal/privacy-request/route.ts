import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { email, type, details } = await req.json()

    if (!email || !type) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 })
    }

    // Attempt to link to a user if they exist
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    })

    const request = await prisma.privacyRequest.create({
      data: {
        email,
        type,
        details,
        userId: user?.id || null,
        status: 'PENDING'
      }
    })

    return NextResponse.json({ success: true, request }, { status: 201 })
  } catch (error) {
    console.error('Privacy Request Error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
