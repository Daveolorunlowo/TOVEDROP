import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sendAdminVerificationCode } from '@/lib/email'

const isDev = process.env.NODE_ENV !== 'production'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  const userAgent = req.headers.get('user-agent') ?? 'unknown'

  let email = ''
  let password = ''

  try {
    const body = await req.json()
    email = body.email ?? ''
    password = body.password ?? ''
  } catch (parseErr) {
    console.error('[PORTAL STEP1] Failed to parse request body:', parseErr)
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
  }

  if (!email || !password) {
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
  }

  const deny = async (logEmail: string) => {
    try {
      await prisma.adminLoginLog.create({
        data: { email: logEmail, success: false, ipAddress: ip, userAgent }
      })
    } catch (logErr) {
      console.error('[PORTAL STEP1] Failed to write deny log:', logErr)
    }
    return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
  }

  try {
    // Look up user
    console.log(`[PORTAL STEP1] Attempting login for: ${email}`)
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      console.log('[PORTAL STEP1] User not found')
      return deny(email)
    }
    if (!user.password) {
      console.log('[PORTAL STEP1] User has no password (OAuth-only account?)')
      return deny(email)
    }
    if (user.role !== 'ADMIN') {
      console.log(`[PORTAL STEP1] Role check failed: role=${user.role}`)
      return deny(email)
    }

    const passwordOk = await bcrypt.compare(password, user.password)
    if (!passwordOk) {
      console.log('[PORTAL STEP1] Password mismatch')
      return deny(email)
    }

    console.log('[PORTAL STEP1] Credentials valid, generating code...')

    // Generate a 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Invalidate any existing unused codes for this user
    await prisma.verificationCode.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true }
    })

    await prisma.verificationCode.create({
      data: { userId: user.id, code, expiresAt }
    })

    // Send code via email (console in dev)
    await sendAdminVerificationCode(email, code)

    // Log the successful step 1
    await prisma.adminLoginLog.create({
      data: { email, success: true, ipAddress: ip, userAgent }
    })

    console.log('[PORTAL STEP1] Success — code sent, awaiting step 2')
    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error('[PORTAL STEP1] Unexpected error:', err)
    return NextResponse.json(
      {
        message: isDev
          ? `Server error: ${err?.message ?? String(err)}`
          : 'Server error. Please try again.'
      },
      { status: 500 }
    )
  }
}
