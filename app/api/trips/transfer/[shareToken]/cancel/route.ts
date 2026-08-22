import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'

export async function POST(
  req: Request,
  props: { params: Promise<{ shareToken: string }> }
) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const driverId = session.user.id
    const { shareToken } = params

    const transfer = await prisma.tripTransfer.findUnique({
      where: { shareToken }
    })

    if (!transfer) return NextResponse.json({ error: 'Transfer not found' }, { status: 404 })
    if (transfer.fromDriverId !== driverId) return NextResponse.json({ error: 'Not your transfer' }, { status: 403 })
    if (transfer.status !== 'PENDING') return NextResponse.json({ error: 'Transfer cannot be cancelled in this state' }, { status: 400 })

    await prisma.tripTransfer.update({
      where: { id: transfer.id },
      data: { status: 'CANCELLED' }
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Transfer cancel error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
