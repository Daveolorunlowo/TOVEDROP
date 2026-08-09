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

    const { searchParams } = new URL(req.url)
    const idsParam = searchParams.get("ids")
    if (!idsParam) {
      return NextResponse.json({ trips: [] })
    }

    const ids = idsParam.split(",")
    const trips = await prisma.trip.findMany({
      where: {
        id: { in: ids }
      },
      include: {
        driver: true
      }
    })

    return NextResponse.json({ trips })
  } catch (error) {
    return NextResponse.json({ message: "Error checking trips" }, { status: 500 })
  }
}
