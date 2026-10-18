import NextAuth from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { checkRateLimit } from "@/lib/rateLimit"
import { NextRequest, NextResponse } from "next/server"

const handler = NextAuth(authOptions)

async function rateLimitedHandler(req: NextRequest, ctx: any) {
  const path = req.nextUrl.pathname;
  // Only rate-limit credential submission and callbacks, not routine session checks or logging
  if (path.includes('/signin') || path.includes('/callback')) {
    const limitRes = checkRateLimit(req, 20, 60 * 1000); // 20 requests per minute
    if (!limitRes.success) {
      return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    }
  }
  return handler(req, ctx);
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST }
