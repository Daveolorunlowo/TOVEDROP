import { NextResponse, NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"
import { z } from "zod"
import { withValidation } from "@/lib/with-validation"
import { sendWebPush } from "@/lib/webpush"
import { sendEmail } from "@/lib/email"

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
      where: { id: requestId },
      include: {
        driver: {
          include: { user: true }
        }
      }
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

    // Notify driver via Push Notification and Email asynchronously
    if (request.driver?.userId) {
      if (action === 'approve') {
        sendWebPush(
          request.driver.userId,
          "Withdrawal Approved! 💸",
          `Your payout of ₦${request.amount.toLocaleString()} has been approved and processed.`,
          "/driver/earnings"
        ).catch(e => console.error("[Withdrawal Push Notify Error]:", e))

        if (request.driver.user?.email) {
          sendEmail(
            request.driver.user.email,
            "Your TOVEDROP Payout is Approved! 💸",
            `<p>Hi ${request.driver.user.name || 'Driver'},</p><p>Great news! Your withdrawal request for <strong>₦${request.amount.toLocaleString()}</strong> has been approved by admin and disbursed to your bank account.</p><p>Bank: ${request.driver.bankName || 'N/A'}<br/>Account: ${request.driver.accountNumber || 'N/A'} (${request.driver.accountName || ''})</p>`
          ).catch(e => console.error("[Withdrawal Email Notify Error]:", e))
        }
      } else if (action === 'reject') {
        sendWebPush(
          request.driver.userId,
          "Withdrawal Request Update",
          `Your payout request for ₦${request.amount.toLocaleString()} was declined. The funds have been refunded to your wallet.`,
          "/driver/earnings"
        ).catch(e => console.error("[Withdrawal Push Notify Error]:", e))

        if (request.driver.user?.email) {
          sendEmail(
            request.driver.user.email,
            "Update regarding your TOVEDROP Withdrawal",
            `<p>Hi ${request.driver.user.name || 'Driver'},</p><p>Your withdrawal request for <strong>₦${request.amount.toLocaleString()}</strong> was not approved at this time. The full amount has been refunded back to your driver wallet balance.</p>`
          ).catch(e => console.error("[Withdrawal Email Notify Error]:", e))
        }
      }
    }

    return NextResponse.json({ 
      message: `Withdrawal ${action}d successfully`,
      request: result 
    }, { status: 200 })

  } catch (error: any) {
    console.error("Admin withdrawal manage error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
})
