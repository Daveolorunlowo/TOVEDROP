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

    const statusMap: any = {
      approve: "APPROVED",
      suspend: "SUSPENDED",
      unsuspend: "APPROVED"
    }

    if (!statusMap[action]) {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 })
    }

    const updatedProfile = await prisma.driverProfile.update({
      where: { userId: driverId },
      data: { status: statusMap[action] }
    })

    const actionPastTense: any = {
      approve: "approved",
      suspend: "suspended",
      unsuspend: "unsuspended"
    }

    return NextResponse.json({ message: `Driver ${actionPastTense[action]} successfully`, profile: updatedProfile }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ message: "Error updating driver", error: error.message }, { status: 500 })
  }
}
