import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== "DRIVER") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        withdrawalRequests: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!driverProfile) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json({ driverProfile }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ message: "Error fetching profile", error: error.message }, { status: 500 })
  }
}
