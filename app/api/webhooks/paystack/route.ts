import { NextResponse } from "next/server"
import crypto from "crypto"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get("x-paystack-signature")

    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) {
      return NextResponse.json({ message: "Server misconfiguration" }, { status: 500 })
    }

    // Verify Signature
    const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')
    if (hash !== signature) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 })
    }

    const event = JSON.parse(rawBody)

    // Only process charge.success
    if (event.event === 'charge.success') {
      const data = event.data
      const reference = data.reference
      const amountInNaira = data.amount / 100 // Paystack sends in kobo

      // Extract metadata
      const customFields = data.metadata?.custom_fields || []
      const getMeta = (key: string) => customFields.find((f: any) => f.variable_name === key)?.value

      const userId = getMeta("user_id")
      const packageId = getMeta("package_id")
      const dropsAmount = parseInt(getMeta("drops_amount"))
      const isFirstPurchaseDiscount = getMeta("first_purchase_discount") === true || getMeta("first_purchase_discount") === 'true'

      if (!userId || !packageId || !dropsAmount) {
        return NextResponse.json({ message: "Missing required metadata" }, { status: 400 })
      }

      // Check if this reference was already processed
      const existingTx = await prisma.dropTransaction.findFirst({
        where: { reference }
      })

      if (existingTx) {
        return NextResponse.json({ message: "Transaction already processed" }, { status: 200 })
      }

      // Process inside a transaction
      await prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            dropsBalance: { increment: dropsAmount },
            hasUsedFirstTopupDiscount: isFirstPurchaseDiscount ? true : undefined
          }
        })

        const dropTx = await tx.dropTransaction.create({
          data: {
            userId: userId,
            type: 'PURCHASE',
            amount: dropsAmount,
            nairaAmount: amountInNaira,
            package: packageId,
            reference: reference
          }
        })

        const pricePerDrop = amountInNaira / dropsAmount

        await tx.dropLot.create({
          data: {
            userId: userId,
            dropTransactionId: dropTx.id,
            totalDrops: dropsAmount,
            remainingDrops: dropsAmount,
            pricePerDrop: pricePerDrop
          }
        })
      })
    }

    return NextResponse.json({ message: "Webhook processed" }, { status: 200 })
  } catch (error: any) {
    console.error("Paystack Webhook Error:", error)
    return NextResponse.json({ message: "Webhook error" }, { status: 500 })
  }
}
