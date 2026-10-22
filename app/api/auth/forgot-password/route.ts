import { NextResponse, NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { z } from "zod"
import { withValidation } from "@/lib/with-validation"
import { checkRateLimit } from "@/lib/rateLimit"
// Note: We need a mailer setup to actually send the email. Using a mock log for now.

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export const POST = withValidation(forgotPasswordSchema, async (req: NextRequest, { email }) => {
  try {
    const rateLimit = checkRateLimit(req, 3, 60 * 1000) // 3 requests per min
    if (!rateLimit.success) {
      return NextResponse.json({ message: "Too many requests. Try again later." }, { status: 429 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    
    // Always return the same response so we don't leak whether an email exists or not
    if (user) {
      const token = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 3600000) // 1 hour

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt
        }
      })

      // TODO: Replace with actual email sending logic (e.g. Resend)
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`
      console.log(`[MAILER MOCK] Send password reset to ${email}: ${resetUrl}`)
    }

    return NextResponse.json({ message: "If an account with that email exists, we sent a password reset link." }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: "Error processing request" }, { status: 500 })
  }
})
