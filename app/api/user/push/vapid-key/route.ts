import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const vapidPublicKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim()
  
  if (!vapidPublicKey) {
    return NextResponse.json(
      { error: 'VAPID public key is not configured on the server' }, 
      { status: 500 }
    )
  }

  let hasSubscription = false
  let subscriptionCount = 0

  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.id) {
      subscriptionCount = await prisma.pushSubscription.count({
        where: { userId: session.user.id }
      })
      hasSubscription = subscriptionCount > 0
    }
  } catch (err) {
    // If database check errors, default hasSubscription to false so client can attempt sync
    console.warn('[VAPID KEY API] Error checking user subscription count:', err)
  }

  return NextResponse.json({ 
    publicKey: vapidPublicKey,
    hasSubscription,
    subscriptionCount
  })
}
