import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || session.user.role !== 'DRIVER') {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { amount } = await req.json()
    if (!amount || amount <= 0) {
      return NextResponse.json({ message: "Invalid amount" }, { status: 400 })
    }

    const profile = await prisma.driverProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!profile) {
      return NextResponse.json({ message: "Driver profile not found" }, { status: 404 })
    }

    if (!profile.bankName || !profile.accountNumber || !profile.accountName) {
      return NextResponse.json({ message: "Please set up your bank details first" }, { status: 400 })
    }

    if (profile.walletBalance < amount) {
      return NextResponse.json({ message: "Insufficient wallet balance" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Deduct balance
      const updatedProfile = await tx.driverProfile.update({
        where: { id: profile.id },
        data: {
          walletBalance: { decrement: amount }
        }
      })

      // Record withdrawal transaction
      await tx.walletTransaction.create({
        data: {
          driverId: profile.id,
          type: "WITHDRAWAL",
          amount: -amount,
          description: `Withdrawal request for ₦${amount}`
        }
      })

      // Create withdrawal request
      const withdrawalRequest = await tx.withdrawalRequest.create({
        data: {
          driverId: profile.id,
          amount: amount,
          status: "PENDING"
        }
      })

      return { profile: updatedProfile, request: withdrawalRequest }
    })

    return NextResponse.json({ 
      message: "Withdrawal request submitted successfully", 
      balance: result.profile.walletBalance,
      request: result.request
    }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({ message: "Error processing withdrawal request", error: error.message }, { status: 500 })
  }
}
