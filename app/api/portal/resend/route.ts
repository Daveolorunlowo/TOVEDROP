import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sendAdminVerificationCode } from '@/lib/email'

const isDev = process.env.NODE_ENV !== 'production'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  const userAgent = req.headers.get('user-agent') ?? 'unknown'

  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.password || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
    }

    const passwordOk = await bcrypt.compare(password, user.password)
    if (!passwordOk) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
    }

    // Rate limit: check if a code was created within the last 60 seconds
    const recentCode = await prisma.verificationCode.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    if (recentCode) {
      const secondsSinceLastCode = (Date.now() - new Date(recentCode.createdAt).getTime()) / 1000
      if (secondsSinceLastCode < 60) {
        const waitSeconds = Math.ceil(60 - secondsSinceLastCode)
        return NextResponse.json(
          { message: `Please wait ${waitSeconds} seconds before requesting a new code.`, waitSeconds },
          { status: 429 }
        )
      }
    }

    // Invalidate all existing codes
    await prisma.verificationCode.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true }
    })

    // Generate new code
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await prisma.verificationCode.create({
      data: { userId: user.id, code, expiresAt }
    })

    await sendAdminVerificationCode(email, code)

    await prisma.adminLoginLog.create({
      data: { email, success: true, ipAddress: ip, userAgent }
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[PORTAL RESEND] Unexpected error:', err)
    return NextResponse.json(
      { message: isDev ? `Server error: ${err?.message ?? String(err)}` : 'Server error. Please try again.' },
      { status: 500 }
    )
  }
}
