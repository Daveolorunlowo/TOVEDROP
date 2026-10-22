import prisma from "@/lib/prisma"
import { DROP_PACKAGES, FIRST_PURCHASE_DISCOUNT_PERCENTAGE } from "@/lib/config"

export interface FlutterwaveCustomer {
  id: string
  name?: string | null
  email?: string | null
  phoneNumber?: string | null
}

/**
 * Initiates a standard Flutterwave checkout payment link
 */
export async function initiateFlutterwavePayment({
  user,
  pkg,
  finalAmount,
  isFirstPurchase,
  redirectUrl,
  appUrl,
}: {
  user: FlutterwaveCustomer
  pkg: typeof DROP_PACKAGES[number]
  finalAmount: number
  isFirstPurchase: boolean
  redirectUrl: string
  appUrl: string
}) {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY
  if (!secretKey) {
    throw new Error("Flutterwave secret key is not configured. Please set FLUTTERWAVE_SECRET_KEY in your environment.")
  }

  const txRef = `tvd-${user.id.slice(0, 8)}-${pkg.id}-${Date.now()}`

  const response = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: txRef,
      amount: finalAmount,
      currency: "NGN",
      redirect_url: redirectUrl,
      customer: {
        email: user.email || "user@tovedrop.com",
        name: user.name || "Tovedrop User",
        phonenumber: user.phoneNumber || "",
      },
      meta: {
        user_id: user.id,
        package_id: pkg.id,
        drops_amount: pkg.drops,
        first_purchase_discount: isFirstPurchase,
      },
      customizations: {
        title: "TOVEDROP Drops Purchase",
        description: `Purchase ${pkg.drops} Drops (${pkg.name})`,
        logo: `${appUrl}/icons/icon-192x192.png`,
      },
    }),
  })

  const data = await response.json()

  if (data.status !== "success" || !data.data?.link) {
    throw new Error(data.message || "Failed to initialize payment with Flutterwave")
  }

  return {
    authorizationUrl: data.data.link as string,
    reference: txRef,
  }
}

/**
 * Verifies a transaction with Flutterwave API using transaction ID
 */
export async function verifyFlutterwaveTransaction(transactionId: string | number) {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY
  if (!secretKey) {
    throw new Error("Flutterwave secret key is not configured")
  }

  const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    // Prevent caching for fresh verification
    cache: "no-store",
  })

  const json = await response.json()
  return json
}

/**
 * Robustly parses metadata sent back by Flutterwave
 */
export function extractFlutterwaveMeta(flwData: any) {
  let meta = flwData?.meta || {}
  if (typeof meta === "string") {
    try {
      meta = JSON.parse(meta)
    } catch {
      meta = {}
    }
  }

  let userId: string | undefined = meta.user_id
  let packageId: string | undefined = meta.package_id
  let dropsAmount: number = meta.drops_amount ? parseInt(String(meta.drops_amount)) : 0
  let isFirstPurchaseDiscount: boolean =
    meta.first_purchase_discount === true || meta.first_purchase_discount === "true"

  if (Array.isArray(meta)) {
    const findInArray = (k: string) =>
      meta.find((m: any) => m.metaname === k || m.variable_name === k)?.metavalue ||
      meta.find((m: any) => m.metaname === k || m.variable_name === k)?.value
    userId = userId || findInArray("user_id")
    packageId = packageId || findInArray("package_id")
    const da = findInArray("drops_amount")
    if (da) dropsAmount = parseInt(String(da))
    const fpd = findInArray("first_purchase_discount")
    if (fpd !== undefined) isFirstPurchaseDiscount = fpd === true || fpd === "true"
  }

  // Fallback: If packageId is set but dropsAmount was missing, look up from DROP_PACKAGES
  if (packageId && (!dropsAmount || isNaN(dropsAmount))) {
    const pkg = DROP_PACKAGES.find((p) => p.id === packageId)
    if (pkg) {
      dropsAmount = pkg.drops
    }
  }

  return { userId, packageId, dropsAmount, isFirstPurchaseDiscount }
}

/**
 * Safely & idempotently credits Drops to a user's wallet
 */
export async function creditDropsFromFlutterwave(flwData: any) {
  const reference = flwData.tx_ref
  if (!reference) {
    throw new Error("Missing transaction reference (tx_ref)")
  }

  // Idempotency check: Return existing record if already credited
  const existingTx = await prisma.dropTransaction.findFirst({
    where: { reference },
  })

  if (existingTx) {
    return {
      success: true,
      alreadyProcessed: true,
      reference,
      dropsAmount: existingTx.amount,
      userId: existingTx.userId,
    }
  }

  const { userId, packageId, dropsAmount, isFirstPurchaseDiscount } = extractFlutterwaveMeta(flwData)

  if (!userId || !dropsAmount || isNaN(dropsAmount)) {
    throw new Error("Missing required user ID or drops amount from transaction metadata")
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, dropsBalance: true, hasUsedFirstTopupDiscount: true },
  })

  if (!user) {
    throw new Error(`User with ID ${userId} not found`)
  }

  // Flutterwave amounts are in Naira directly
  const amountInNaira = typeof flwData.amount === "number" ? flwData.amount : parseFloat(flwData.amount) || 0
  const pricePerDrop = dropsAmount > 0 ? amountInNaira / dropsAmount : 100

  // Calculate saved amount if first-time discount applied
  let savedAmount: number | null = null
  if (isFirstPurchaseDiscount) {
    const pkg = DROP_PACKAGES.find((p) => p.id === packageId)
    if (pkg) {
      savedAmount = Math.round(pkg.naira * FIRST_PURCHASE_DISCOUNT_PERCENTAGE)
    }
  }

  // Execute database updates inside atomic transaction
  await prisma.$transaction(async (tx) => {
    // 1. Increment user dropsBalance & update discount status
    await tx.user.update({
      where: { id: userId },
      data: {
        dropsBalance: { increment: dropsAmount },
        hasUsedFirstTopupDiscount: isFirstPurchaseDiscount ? true : undefined,
      },
    })

    // 2. Create the PURCHASE dropTransaction
    const dropTx = await tx.dropTransaction.create({
      data: {
        userId,
        type: "PURCHASE",
        amount: dropsAmount,
        nairaAmount: amountInNaira,
        package: packageId || null,
        reference,
      },
    })

    // 3. Create the unspent dropLot
    await tx.dropLot.create({
      data: {
        userId,
        dropTransactionId: dropTx.id,
        totalDrops: dropsAmount,
        remainingDrops: dropsAmount,
        pricePerDrop,
      },
    })
  })

  return {
    success: true,
    alreadyProcessed: false,
    reference,
    dropsAmount,
    userId,
    savedAmount,
  }
}
