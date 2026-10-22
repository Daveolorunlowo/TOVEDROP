import { NextResponse, NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { z } from "zod"
import { withValidation } from "@/lib/with-validation"
import { checkRateLimit } from "@/lib/rateLimit"
import { sendEmail } from "@/lib/email"

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

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const resetUrl = `${appUrl}/reset-password?token=${token}`
      
      await sendEmail(
        email,
        "Reset Your TOVEDROP Password",
        `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border-radius: 12px; background: #0A0D14; color: #ffffff;">
          <h2 style="color: #ea580c; margin-bottom: 12px;">Reset Your TOVEDROP Password</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Hello ${user.name || 'there'},</p>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">We received a request to reset your password. Click the button below to choose a new password:</p>
          <div style="margin: 24px 0;">
            <a href="${resetUrl}" style="background: #ea580c; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
        </div>`
      ).catch(e => console.error("Failed to send password reset email:", e))
    }

    return NextResponse.json({ message: "If an account with that email exists, we sent a password reset link." }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: "Error processing request" }, { status: 500 })
  }
})
