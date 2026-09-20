import { NextResponse, NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { checkRateLimit } from "@/lib/rateLimit"
import { cookies } from "next/headers"
import { sendWelcomeEmail } from "@/lib/email"
import { z } from "zod"
import { withValidation } from "@/lib/with-validation"

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  university: z.string().optional()
})

export const POST = withValidation(registerSchema, async (req: NextRequest, data) => {
 try {
 const rateLimit = checkRateLimit(req, 5, 60 * 1000) // 5 requests per minute
 if (!rateLimit.success) {
 return NextResponse.json({ message: "Too many registration attempts. Please try again later." }, { status: 429 })
 }

 const { name, email, university, password } = data

 const exists = await prisma.user.findUnique({
 where: { email }
 })

 if (exists) {
 if (!exists.password) {
 const hashedPassword = await bcrypt.hash(password, 10)
 await prisma.user.update({
 where: { email },
 data: { password: hashedPassword, name }
 })
 return NextResponse.json({ message: "Password set for existing account" }, { status: 201 })
 }
 return NextResponse.json({ message: "User already exists" }, { status: 400 })
 }

 const hashedPassword = await bcrypt.hash(password, 10)

 const user = await prisma.user.create({
 data: {
 name,
 email,
 university,
 password: hashedPassword,
 role: "RIDER", // Default
 dropsBalance: 3,
 }
 })

 // 1. Generate referral code
 const code = Math.random().toString(36).substring(2, 8).toUpperCase()
 await prisma.referralCode.create({
 data: {
 userId: user.id,
 code
 }
 })

 // 2. Process referral cookie
 const cookieStore = await cookies()
 const refCookie = cookieStore.get('tovedrop_ref')
 if (refCookie?.value) {
 const referrerCode = await prisma.referralCode.findUnique({
 where: { code: refCookie.value }
 })
 if (referrerCode && referrerCode.userId !== user.id) {
 await prisma.referral.create({
 data: {
 referrerId: referrerCode.userId,
 referredId: user.id,
 status: "PENDING"
 }
 })
 }
 }

 // 3. Send welcome email
 if (user.email) {
 await sendWelcomeEmail(user.email, user.name || 'Rider')
 }

 return NextResponse.json({ message: "User registered successfully" }, { status: 201 })
 } catch (error) {
 console.error("REGISTER ERROR:", error)
 return NextResponse.json({ message: "Error registering user", error }, { status: 500 })
 }
}
