import { NextResponse, NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { withValidation } from "@/lib/with-validation"
import { checkRateLimit } from "@/lib/rateLimit"

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters")
})

export const POST = withValidation(resetPasswordSchema, async (req: NextRequest, { token, newPassword }) => {
  try {
    const rateLimit = checkRateLimit(req, 5, 60 * 1000)
    if (!rateLimit.success) {
      return NextResponse.json({ message: "Too many requests. Try again later." }, { status: 429 })
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!resetToken || resetToken.expiresAt < new Date()) {
      return NextResponse.json({ message: "Invalid or expired reset token" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password and delete the token so it can't be reused
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword }
      }),
      prisma.passwordResetToken.delete({
        where: { id: resetToken.id }
      })
    ])

    return NextResponse.json({ message: "Password updated successfully" }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: "Error resetting password" }, { status: 500 })
  }
})
