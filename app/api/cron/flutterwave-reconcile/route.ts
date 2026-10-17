import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { creditDropsFromFlutterwave } from "@/lib/flutterwave"

export async function GET(request: Request) {
  try {
    const secret = process.env.FLUTTERWAVE_SECRET_KEY
    if (!secret) {
      return NextResponse.json({ message: "Flutterwave is not configured" }, { status: 500 })
    }

    // Query recent successful transactions from Flutterwave
    const response = await fetch("https://api.flutterwave.com/v3/transactions?status=successful", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    const json = await response.json()
    if (json.status !== "success" || !Array.isArray(json.data)) {
      return NextResponse.json(
        { message: "Failed to fetch transactions from Flutterwave", error: json.message },
        { status: 400 }
      )
    }

    let reconciledCount = 0

    for (const tx of json.data) {
      const reference = tx.tx_ref
      if (!reference) continue

      // Only inspect Tovedrop drop purchase transactions
      if (typeof reference === "string" && reference.startsWith("tvd-")) {
        const existingTx = await prisma.dropTransaction.findFirst({
          where: { reference },
        })

        if (!existingTx) {
          try {
            await creditDropsFromFlutterwave(tx)
            reconciledCount++
          } catch (err: any) {
            console.error(`[Flutterwave Cron Reconcile] Failed to reconcile tx ${reference}:`, err.message)
          }
        }
      }
    }

    return NextResponse.json(
      {
        message: "Flutterwave reconciliation complete",
        scanned: json.data.length,
        reconciled: reconciledCount,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[Flutterwave Cron Reconcile] Error:", error)
    return NextResponse.json(
      { message: "Reconciliation error", error: error.message },
      { status: 500 }
    )
  }
}
