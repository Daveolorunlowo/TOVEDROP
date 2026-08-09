import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const isDev = process.env.NODE_ENV !== 'production'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  const userAgent = req.headers.get('user-agent') ?? 'unknown'

  try {
    const { email, code } = await req.json()

    if (!email || !code) {
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Invalid code' }, { status: 401 })
    }

    // Find the most recent unused code for this user
    const record = await prisma.verificationCode.findFirst({
      where: { userId: user.id, used: false },
      orderBy: { createdAt: 'desc' }
    })

    const deny = async (reason: string) => {
      await prisma.adminLoginLog.create({
        data: { email, success: false, ipAddress: ip, userAgent }
      })
      return NextResponse.json({ message: reason }, { status: 401 })
    }

    if (!record) return deny('No active verification code found. Please request a new one.')
    if (record.used) return deny('This code has already been used.')
    if (new Date() > record.expiresAt) return deny('This code has expired. Please request a new one.')
    if (record.code !== code) return deny('Invalid code.')

    // Mark the code as used
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { used: true }
    })

    // Log successful step 2
    await prisma.adminLoginLog.create({
      data: { email, success: true, ipAddress: ip, userAgent }
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[PORTAL STEP2] Unexpected error:', err)
    return NextResponse.json(
      { message: isDev ? `Server error: ${err?.message ?? String(err)}` : 'Server error. Please try again.' },
      { status: 500 }
    )
  }
}
