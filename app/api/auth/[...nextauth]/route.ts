import NextAuth from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { checkRateLimit } from "@/lib/rateLimit"
import { NextRequest, NextResponse } from "next/server"

const handler = NextAuth(authOptions)

async function rateLimitedHandler(req: NextRequest, ctx: any) {
  const limitRes = checkRateLimit(req, 10, 60 * 1000); // 10 requests per minute
  if (!limitRes.success) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }
  return handler(req, ctx);
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST }
