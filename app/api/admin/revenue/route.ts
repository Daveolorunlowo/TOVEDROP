import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const platformRevenues = await prisma.platformRevenue.findMany({
      include: {
        trip: {
          include: {
            driver: {
              include: { user: true }
            },
            walletTransactions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ platformRevenues }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ message: "Error fetching admin revenue", error: error.message }, { status: 500 })
  }
}
