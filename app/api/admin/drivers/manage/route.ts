import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { driverId, action } = await req.json()
    
    if (!driverId || !action) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 })
    }

    const statusMap: Record<string, string> = {
      approve: "APPROVED",
      suspend: "SUSPENDED",
      unsuspend: "APPROVED",
      reject: "REJECTED"
    }

    if (!statusMap[action]) {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 })
    }

    const profile = await prisma.driverProfile.findFirst({
      where: {
        OR: [
          { userId: driverId },
          { id: driverId }
        ]
      }
    })

    if (!profile) {
      return NextResponse.json({ message: "Driver profile not found" }, { status: 404 })
    }

    const targetStatus = statusMap[action]

    const updatedProfile = await prisma.driverProfile.update({
      where: { id: profile.id },
      data: { status: targetStatus }
    })

    if (action === "approve") {
      await prisma.user.update({
        where: { id: profile.userId },
        data: { role: "DRIVER" }
      })
    }

    const actionPastTense: Record<string, string> = {
      approve: "approved",
      suspend: "suspended",
      unsuspend: "unsuspended",
      reject: "rejected"
    }

    return NextResponse.json({ message: `Driver ${actionPastTense[action]} successfully`, profile: updatedProfile }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ message: "Error updating driver", error: error.message }, { status: 500 })
  }
}
