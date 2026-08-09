import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { university } = await req.json()
    if (!university) {
      return NextResponse.json({ message: "Missing university" }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { university }
    })

    return NextResponse.json({ message: "University updated successfully", user: updatedUser }, { status: 200 })
  } catch (error) {
    console.error("Error updating university:", error)
    return NextResponse.json({ message: "Error updating university" }, { status: 500 })
  }
}
