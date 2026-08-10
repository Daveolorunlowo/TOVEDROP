import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "./prisma"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { sendWelcomeEmail } from "./email"

export const authOptions: NextAuthOptions = {
  // @ts-ignore
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: '/auth',
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          throw new Error("Invalid credentials")
        }

        const isCorrectPassword = await bcrypt.compare(credentials.password, user.password)

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials")
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          dropsBalance: user.dropsBalance,
          university: user.university,
        }
      }
    })
  ],
  events: {
    async createUser({ user }) {
      // Generate a unique referral code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      await prisma.referralCode.create({
        data: {
          userId: user.id,
          code
        }
      })

      // Check for referral cookie
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

      // Grant 3 free drops to new users and send welcome email
      await prisma.user.update({
        where: { id: user.id },
        data: { dropsBalance: 3 }
      })
      if (user.email) {
        await sendWelcomeEmail(user.email, user.name || 'Rider')
      }
    }
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      return true
    },
    async jwt({ token, user, trigger, session, account }) {
      // If user is present (happens on initial sign in)
      if (user) {
        // Credentials login already returns the full DB user
        token.role = user.role
        token.id = user.id
        token.university = user.university
        token.dropsBalance = user.dropsBalance
        
        if (user.role === 'DRIVER') {
          const driver = await prisma.driverProfile.findUnique({
            where: { userId: user.id },
            select: { status: true }
          })
          token.driverStatus = driver?.status ?? null
        } else {
          token.driverStatus = null
        }
      }
      
      if (trigger === "update") {
        if (session?.university) token.university = session.university
        if (session?.role) token.role = session.role
        
        if (token.role === 'DRIVER') {
          const driver = await prisma.driverProfile.findUnique({
            where: { userId: token.id as string },
            select: { status: true }
          })
          token.driverStatus = driver?.status ?? null
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
        session.user.university = token.university as string | null
        session.user.dropsBalance = token.dropsBalance as number
        session.user.driverStatus = token.driverStatus as string | null
      }
      return session
    }
  }
}
