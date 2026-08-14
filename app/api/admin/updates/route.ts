import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await prisma.update.findMany({
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ updates }, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching admin updates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, content, category, audience, isPinned, action } = body

    if (!title || !content || !category || !audience) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // action can be 'DRAFT' or 'PUBLISH'
    const publishedAt = action === 'PUBLISH' ? new Date() : null

    const update = await prisma.update.create({
      data: {
        title,
        body: content,
        category,
        audience,
        isPinned: isPinned || false,
        publishedAt
      }
    })

    return NextResponse.json({ update }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
