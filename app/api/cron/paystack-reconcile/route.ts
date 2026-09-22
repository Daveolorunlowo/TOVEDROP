import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// In a real production app, use a CRON_SECRET for security
// const CRON_SECRET = process.env.CRON_SECRET || 'dev_secret';

export async function GET(request: Request) {
  /*
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  */

  try {
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) {
      return NextResponse.json({ message: "Server misconfiguration" }, { status: 500 })
    }

    // Fetch transactions from the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const response = await fetch(`https://api.paystack.co/transaction?status=success&from=${yesterday}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secret}`
      }
    })

    const data = await response.json()
    if (!data.status) {
      return NextResponse.json({ message: "Failed to fetch from Paystack" }, { status: 400 })
    }

    let reconciledCount = 0

    for (const tx of data.data) {
      const reference = tx.reference
      
      const existingTx = await prisma.dropTransaction.findFirst({
        where: { reference }
      })

      if (!existingTx) {
        const amountInNaira = tx.amount / 100
        const customFields = tx.metadata?.custom_fields || []
        const getMeta = (key: string) => customFields.find((f: any) => f.variable_name === key)?.value
        
        const userId = getMeta("user_id")
        const packageId = getMeta("package_id")
        const dropsAmount = parseInt(getMeta("drops_amount"))
        const isFirstPurchaseDiscount = getMeta("first_purchase_discount") === true || getMeta("first_purchase_discount") === 'true'

        if (userId && packageId && dropsAmount) {
          // Process missing transaction
          await prisma.$transaction(async (ptx) => {
            await ptx.user.update({
              where: { id: userId },
              data: {
                dropsBalance: { increment: dropsAmount },
                hasUsedFirstTopupDiscount: isFirstPurchaseDiscount ? true : undefined
              }
            })

            const dropTx = await ptx.dropTransaction.create({
              data: {
                userId: userId,
                type: 'PURCHASE',
                amount: dropsAmount,
                nairaAmount: amountInNaira,
                package: packageId,
                reference: reference
              }
            })

            await ptx.dropLot.create({
              data: {
                userId: userId,
                dropTransactionId: dropTx.id,
                totalDrops: dropsAmount,
                remainingDrops: dropsAmount,
                pricePerDrop: amountInNaira / dropsAmount
              }
            })
          })
          reconciledCount++
        }
      }
    }

    return NextResponse.json({ 
      message: "Reconciliation complete", 
      scanned: data.data.length,
      reconciled: reconciledCount
    }, { status: 200 })

  } catch (error: any) {
    console.error("Reconciliation Error:", error)
    return NextResponse.json({ message: "Reconciliation error", error: error.message }, { status: 500 })
  }
}
