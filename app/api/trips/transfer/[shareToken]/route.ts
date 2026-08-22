import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  req: Request,
  props: { params: Promise<{ shareToken: string }> }
) {
  const params = await props.params;
  try {
    const { shareToken } = params

    const transfer = await prisma.tripTransfer.findUnique({
      where: { shareToken },
      include: {
        trip: true,
        fromDriver: {
          select: { name: true }
        }
      }
    })

    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 })
    }

    return NextResponse.json(transfer)

  } catch (error: any) {
    console.error('Transfer fetch error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
