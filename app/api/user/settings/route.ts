import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const updateData: any = {}

    if (body.phoneNumber !== undefined) {
      updateData.phoneNumber = body.phoneNumber
    }
    if (body.whatsappNotificationsEnabled !== undefined) {
      updateData.whatsappNotificationsEnabled = body.whatsappNotificationsEnabled
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No data to update" }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData
    })

    return NextResponse.json({ 
      message: "Settings updated successfully", 
      user: {
        phoneNumber: updatedUser.phoneNumber,
        whatsappNotificationsEnabled: updatedUser.whatsappNotificationsEnabled
      }
    }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ message: "Error updating settings", error: error.message }, { status: 500 })
  }
}
