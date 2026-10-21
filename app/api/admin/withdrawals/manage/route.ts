import { NextResponse, NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"
import { z } from "zod"
import { withValidation } from "@/lib/with-validation"

const adminWithdrawalSchema = z.object({
  requestId: z.string().optional(),
  withdrawalId: z.string().optional(),
  action: z.enum(["approve", "reject"])
}).refine(data => !!(data.requestId || data.withdrawalId), {
  message: "Request ID is required"
})

export const POST = withValidation(adminWithdrawalSchema, async (req: NextRequest, data) => {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const requestId = data.requestId || data.withdrawalId!
    const { action } = data

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
          data: { 
            status: "APPROVED",
            approvedByAdminId: session.user.id
          }
        })
      } else if (action === 'reject') {
        updatedRequest = await tx.withdrawalRequest.update({
          where: { id: requestId },
          data: { 
            status: "REJECTED",
            approvedByAdminId: session.user.id
          }
        })

        // Refund driver
        await tx.driverProfile.update({
          where: { id: request.driverId },
          data: {
            walletBalance: { increment: request.amount }
          }
        })

        await tx.walletTransaction.create({
          data: {
            driverId: request.driverId,
            type: "ADJUSTMENT",
            amount: request.amount,
            description: `Refund for rejected withdrawal request #${requestId}`
          }
        })
      }

      return updatedRequest
    })

    return NextResponse.json({ 
      message: `Withdrawal ${action}d successfully`,
      request: result 
    }, { status: 200 })

  } catch (error: any) {
    console.error("Admin withdrawal manage error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
})
