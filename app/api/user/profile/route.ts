import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        university: true,
        role: true,
        dropsBalance: true,
        phoneNumber: true,
        whatsappNotificationsEnabled: true,
        hasUsedFirstTopupDiscount: true,
        dropTransactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    if (user.role === 'ADMIN' || user.role === 'DRIVER') {
      user.dropsBalance = 0
    }

    return NextResponse.json({ user }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ message: "Error fetching user", error: error.message }, { status: 500 })
  }
}
