import { NextRequest, NextResponse } from "next/server"
import { verifyFlutterwaveTransaction, creditDropsFromFlutterwave } from "@/lib/flutterwave"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const status = searchParams.get("status")
  const txRef = searchParams.get("tx_ref")
  const transactionId = searchParams.get("transaction_id")

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "")

  // 1. Check if user cancelled
  if (status === "cancelled") {
    return NextResponse.redirect(`${appUrl}/dashboard/buy-drops?payment=cancelled`)
  }

  // 2. Validate transactionId is present for verification
  if (!transactionId) {
    console.error("[Flutterwave Callback] Missing transaction_id:", { status, txRef })
    return NextResponse.redirect(`${appUrl}/dashboard/buy-drops?payment=failed&reason=missing_transaction_id`)
  }

  try {
    // 3. Verify the transaction with Flutterwave API
    const verifyData = await verifyFlutterwaveTransaction(transactionId)

    if (
      verifyData.status !== "success" ||
      !verifyData.data ||
      verifyData.data.status !== "successful"
    ) {
      console.error("[Flutterwave Callback] Transaction verification failed:", verifyData)
      return NextResponse.redirect(`${appUrl}/dashboard/buy-drops?payment=failed&reason=unverified`)
    }

    // 4. Credit Drops to the user idempotently
    const creditResult = await creditDropsFromFlutterwave(verifyData.data)

    const savedParam = creditResult.savedAmount ? `&saved=${creditResult.savedAmount}` : ""
    return NextResponse.redirect(
      `${appUrl}/dashboard/buy-drops?payment=success&added=${creditResult.dropsAmount}${savedParam}`
    )
  } catch (error: any) {
    console.error("[Flutterwave Callback] Error processing transaction:", error)
    return NextResponse.redirect(
      `${appUrl}/dashboard/buy-drops?payment=failed&reason=${encodeURIComponent(error.message || "processing_error")}`
    )
  }
}
