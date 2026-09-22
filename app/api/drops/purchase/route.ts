import { NextResponse, NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"
import { DROP_PACKAGES, FIRST_PURCHASE_DISCOUNT_PERCENTAGE } from "@/lib/config"
import { z } from "zod"
import { withValidation } from "@/lib/with-validation"

const purchaseSchema = z.object({
  packageId: z.string().min(1, "Package ID is required")
})

export const POST = withValidation(purchaseSchema, async (req: NextRequest, data) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { packageId } = data
    
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
    if (!user.hasUsedFirstTopupDiscount) {
      finalAmount = pkg.naira * (1 - FIRST_PURCHASE_DISCOUNT_PERCENTAGE)
    }

    // Convert to kobo for Paystack
    const amountInKobo = Math.round(finalAmount * 100)

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ message: "Paystack is not configured" }, { status: 500 })
    }

    // Initialize Paystack Transaction
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: user.email,
        amount: amountInKobo,
        metadata: {
          custom_fields: [
            {
              display_name: "User ID",
              variable_name: "user_id",
              value: user.id
            },
            {
              display_name: "Package ID",
              variable_name: "package_id",
              value: pkg.id
            },
            {
              display_name: "Drops Amount",
              variable_name: "drops_amount",
              value: pkg.drops
            },
            {
              display_name: "First Purchase Discount",
              variable_name: "first_purchase_discount",
              value: !user.hasUsedFirstTopupDiscount
            }
          ]
        }
      })
    })

    const paystackData = await response.json()

    if (!paystackData.status) {
      return NextResponse.json({ message: paystackData.message || "Failed to initialize payment" }, { status: 400 })
    }

    return NextResponse.json({ 
      message: "Payment initialized",
      authorizationUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference
    }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ message: "Error purchasing drops", error: error.message }, { status: 500 })
  }
})
