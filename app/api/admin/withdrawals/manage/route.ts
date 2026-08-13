import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { requestId, action } = await req.json()
    if (!requestId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ message: "Invalid request data" }, { status: 400 })
    }

    const request = await prisma.withdrawalRequest.findUnique({
      where: { id: requestId }
    })

    if (!request) {
      return NextResponse.json({ message: "Withdrawal request not found" }, { status: 404 })
    }

    if (request.status !== "PENDING") {
      return NextResponse.json({ message: "Request already processed" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      let updatedRequest
      
      if (action === 'approve') {
        updatedRequest = await tx.withdrawalRequest.update({
          where: { id: requestId },
          data: { status: "APPROVED" }
        })
      } else if (action === 'reject') {
        updatedRequest = await tx.withdrawalRequest.update({
          where: { id: requestId },
          data: { status: "REJECTED" }
        })

        // Refund driver
        await tx.driverProfile.update({
          where: { id: request.driverId },
          data: {
            walletBalance: { increment: request.amount }
          }
        })

        // Record refund
        await tx.walletTransaction.create({
          data: {
            driverId: request.driverId,
            type: "ADJUSTMENT",
            amount: request.amount,
            description: `Refund for rejected withdrawal request of ₦${request.amount}`
          }
        })
      }

      return updatedRequest
    })

    return NextResponse.json({ 
      message: `Withdrawal request ${action}d successfully`, 
      request: result 
    }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({ message: "Error processing withdrawal request", error: error.message }, { status: 500 })
  }
}
