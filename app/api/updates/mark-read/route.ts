import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { updateIds } = await req.json()
    if (!Array.isArray(updateIds) || updateIds.length === 0) {
      return NextResponse.json({ success: true, count: 0 }, { status: 200 })
    }

    const userId = session.user.id

    // Use createMany to batch insert read records, ignoring conflicts (skipping duplicates)
    const result = await prisma.updateRead.createMany({
      data: updateIds.map((updateId: string) => ({
        userId,
        updateId
      })),
      skipDuplicates: true
    })

    return NextResponse.json({ success: true, count: result.count }, { status: 200 })
  } catch (error: any) {
    console.error('Error marking updates as read:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
