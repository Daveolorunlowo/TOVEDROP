import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
    }

    const logs = await prisma.adminLoginLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ logs })
  } catch (error: any) {
    return NextResponse.json({ message: 'Error fetching security logs', error: error.message }, { status: 500 })
  }
}
