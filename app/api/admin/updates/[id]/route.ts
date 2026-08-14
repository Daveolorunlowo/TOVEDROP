import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    const body = await req.json()
    const { title, content, category, audience, isPinned, action } = body

    // action can be 'DRAFT' (save as draft/unpublish) or 'PUBLISH' (publish now)
    // If not provided, we just update the fields without changing publishedAt
    const updateData: any = {}
    if (title) updateData.title = title
    if (content) updateData.body = content
    if (category) updateData.category = category
    if (audience) updateData.audience = audience
    if (isPinned !== undefined) updateData.isPinned = isPinned
    
    if (action === 'PUBLISH') {
      updateData.publishedAt = new Date()
    } else if (action === 'DRAFT') {
      updateData.publishedAt = null
    }

    const update = await prisma.update.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ update }, { status: 200 })
  } catch (error: any) {
    console.error('Error updating update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    await prisma.update.delete({
      where: { id }
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Error deleting update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
