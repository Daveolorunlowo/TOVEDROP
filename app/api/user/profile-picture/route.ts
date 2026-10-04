import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { image } = await req.json()

    if (!image || !image.startsWith('data:image/')) {
      return NextResponse.json({ message: 'Invalid image format' }, { status: 400 })
    }

    // Limit base64 length to prevent huge payloads (e.g., ~150KB limit)
    if (image.length > 200000) {
      return NextResponse.json({ message: 'Image too large. Please upload a smaller file.' }, { status: 413 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image }
    })

    return NextResponse.json({ message: 'Profile picture updated', image: updatedUser.image })
  } catch (error: any) {
    console.error('Error updating profile picture:', error)
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 })
  }
}
