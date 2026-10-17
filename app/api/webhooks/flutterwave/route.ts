import { NextResponse } from "next/server"
import { verifyFlutterwaveTransaction, creditDropsFromFlutterwave } from "@/lib/flutterwave"

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("verif-hash")
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH

    // 1. Validate Flutterwave secret hash if configured
    if (secretHash && signature !== secretHash) {
      console.warn("[Flutterwave Webhook] Invalid verif-hash received:", signature)
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 })
    }

    const payload = await req.json()
    const event = payload?.event
    const data = payload?.data

    // 2. Only process successful charge events
    if (event === "charge.completed" || event === "charge.success") {
      if (!data || !data.id) {
        return NextResponse.json({ message: "Missing transaction data" }, { status: 400 })
      }

      // 3. Independent server-to-server verification for security
      const verifyRes = await verifyFlutterwaveTransaction(data.id)
      if (
        verifyRes.status !== "success" ||
        !verifyRes.data ||
        verifyRes.data.status !== "successful"
      ) {
        console.warn("[Flutterwave Webhook] Transaction verification failed for ID:", data.id)
        return NextResponse.json({ message: "Transaction not verified" }, { status: 400 })
      }

      // 4. Safely and idempotently credit Drops
      const result = await creditDropsFromFlutterwave(verifyRes.data)
      console.log("[Flutterwave Webhook] Successfully processed drop credit:", result)
    }

    return NextResponse.json({ status: "success", message: "Webhook processed" }, { status: 200 })
  } catch (error: any) {
    console.error("[Flutterwave Webhook] Webhook processing error:", error)
    return NextResponse.json({ message: "Webhook error", error: error.message }, { status: 500 })
  }
}
