import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = session.user.role // 'RIDER' or 'DRIVER' (or 'ADMIN' but this is for normal users)

    const audiences = ['ALL']
    if (role === 'RIDER') audiences.push('RIDERS')
    if (role === 'DRIVER') audiences.push('DRIVERS')

    const updates = await prisma.update.findMany({
      where: {
        publishedAt: { not: null },
        audience: { in: audiences as any }
      },
      orderBy: [
        { isPinned: 'desc' },
        { publishedAt: 'desc' }
      ]
    })

    return NextResponse.json({ updates }, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching updates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
