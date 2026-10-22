import { NextResponse } from "next/server"
import crypto from "crypto"
import prisma from "@/lib/prisma"
import { pusherServer } from "@/lib/pusher"
import { sendWebPush } from "@/lib/webpush"

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

      // Instant Real-Time Alert to User & Admins
      if (pusherServer) {
        await pusherServer.trigger(`user-${userId}`, 'drops-updated', {
          amount: dropsAmount,
          message: `+${dropsAmount} Drops added to your balance! 💧`
        }).catch(err => console.error("[Paystack Webhook] Pusher drops-updated failed:", err))

        await pusherServer.trigger('admin-alerts', 'new-drops-purchase', {
          userId,
          amount: dropsAmount,
          nairaAmount: amountInNaira,
          reference
        }).catch(err => console.error("[Paystack Webhook] Pusher admin-alerts failed:", err))
      }

      await sendWebPush(
        userId,
        'Drops Added! 💧',
        `+${dropsAmount} Drops have been successfully credited to your wallet. Happy riding!`,
        '/dashboard'
      ).catch(err => console.error("[Paystack Webhook] Web Push failed:", err))
    }

    return NextResponse.json({ message: "Webhook processed" }, { status: 200 })
  } catch (error: any) {
    console.error("Paystack Webhook Error:", error)
    return NextResponse.json({ message: "Webhook error" }, { status: 500 })
  }
}
