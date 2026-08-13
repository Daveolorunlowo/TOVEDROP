import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { feedbackId, action } = await req.json()

    if (!feedbackId || !action) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 })
    }

    let status = 'OPEN'
    if (action === 'review') status = 'REVIEWED'
    else if (action === 'resolve') status = 'RESOLVED'
    else return NextResponse.json({ message: 'Invalid action' }, { status: 400 })

    const updated = await prisma.feedback.update({
      where: { id: feedbackId },
      data: { status }
    })

    return NextResponse.json({ success: true, feedback: updated }, { status: 200 })
  } catch (error: any) {
    console.error('Manage feedback error:', error)
    return NextResponse.json({ message: 'Error managing feedback', error: error.message }, { status: 500 })
  }
}
