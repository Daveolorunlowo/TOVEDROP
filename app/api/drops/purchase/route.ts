import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"
import { DROP_PACKAGES, FIRST_PURCHASE_DISCOUNT_PERCENTAGE } from "@/lib/config"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { packageId } = await req.json()
    
    const pkg = DROP_PACKAGES.find(p => p.id === packageId)
    if (!pkg) {
      return NextResponse.json({ message: "Invalid package" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    if (user.role === 'ADMIN' || user.role === 'DRIVER') {
      return NextResponse.json({ message: "Admins and Drivers cannot possess drops" }, { status: 403 })
    }

    let finalAmount = pkg.naira
    let isFirstTimeDiscountApplied = false

    if (!user.hasUsedFirstTopupDiscount) {
      // Apply discount
      finalAmount = pkg.naira * (1 - FIRST_PURCHASE_DISCOUNT_PERCENTAGE)
      isFirstTimeDiscountApplied = true
    }

    // MOCK PAYSTACK INITIALIZATION
    // Suppose the payment is immediately successful for testing
    const paystackRef = `mock_ref_${Date.now()}`

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          dropsBalance: { increment: pkg.drops },
          hasUsedFirstTopupDiscount: true
        }
      })

      const dropTx = await tx.dropTransaction.create({
        data: {
          userId: user.id,
          type: 'PURCHASE',
          amount: pkg.drops,
          nairaAmount: finalAmount,
          package: pkg.id,
          reference: paystackRef
        }
      })

      const pricePerDrop = finalAmount / pkg.drops

      await tx.dropLot.create({
        data: {
          userId: user.id,
          dropTransactionId: dropTx.id,
          totalDrops: pkg.drops,
          remainingDrops: pkg.drops,
          pricePerDrop: pricePerDrop
        }
      })

      return updatedUser
    })

    return NextResponse.json({ 
      message: "Drops purchased successfully",
      dropsBalance: result.dropsBalance,
      chargedAmount: finalAmount,
      discountApplied: isFirstTimeDiscountApplied
    }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ message: "Error purchasing drops", error: error.message }, { status: 500 })
  }
}
