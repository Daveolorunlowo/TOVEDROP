import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { type, content } = await req.json()

    if (!type || !content) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 })
    }

    if (!['ISSUE', 'SUGGESTION'].includes(type)) {
      return NextResponse.json({ message: 'Invalid feedback type' }, { status: 400 })
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: session.user.id,
        type,
        content
      }
    })

    return NextResponse.json({ success: true, feedback }, { status: 201 })
  } catch (error: any) {
    console.error('Feedback submission error:', error)
    return NextResponse.json({ message: 'Error submitting feedback', error: error.message }, { status: 500 })
  }
}
