import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { endpoint, keys } = await req.json()
    if (!endpoint || !keys) {
      return NextResponse.json({ message: 'Missing endpoint or keys' }, { status: 400 })
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: session.user.id,
        endpoint,
        keys: JSON.stringify(keys)
      },
      update: {
        userId: session.user.id,
        keys: JSON.stringify(keys)
      }
    })

    return NextResponse.json({ message: 'Subscription saved successfully' }, { status: 200 })
  } catch (error: any) {
    console.error('Error saving push subscription', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
