import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const vapidPublicKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim()
  
  if (!vapidPublicKey) {
    return NextResponse.json(
      { error: 'VAPID public key is not configured on the server' }, 
      { status: 500 }
    )
  }

  return NextResponse.json({ 
    publicKey: vapidPublicKey 
  })
}
