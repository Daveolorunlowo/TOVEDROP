import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getRoleRedirectPath } from './lib/getRoleRedirectPath'

import "@/lib/env";

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone()
  
  // 1. Force HTTPS in production
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") !== "https" &&
    !request.nextUrl.hostname.includes("localhost") 
  ) {
    url.protocol = "https:";
    return NextResponse.redirect(url);
  }

  // 2. CORS Policy for API Routes
  if (url.pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || "";
    if (process.env.NODE_ENV === "production" && origin && origin !== allowedOrigin) {
      return new NextResponse(null, { status: 403, statusText: "Forbidden" });
    }
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const path = request.nextUrl.pathname

  const protectedPrefixes = ['/dashboard', '/book', '/driver', '/admin', '/rate']
  const isProtected = protectedPrefixes.some(p => path.startsWith(p))
  const isGuestOnlyPage = path.startsWith('/auth') || path === '/'

  // No session, trying to access protected area
  if (!token && isProtected) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // Has session, on a page meant for logged-out users
  if (token && isGuestOnlyPage) {
    const redirectPath = getRoleRedirectPath(token.role as string, token.driverStatus as string | null)
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // Has session, wrong role for this section
  if (token) {
    const role = token.role as string
    const driverStatus = token.driverStatus as string | null

    if ((path.startsWith('/admin') || path.startsWith('/api/admin')) && role !== 'ADMIN') {
      if (path.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
      }
      return NextResponse.redirect(new URL(getRoleRedirectPath(role, driverStatus), request.url))
    }
    if (path.startsWith('/driver') && role !== 'DRIVER') {
      return NextResponse.redirect(new URL(getRoleRedirectPath(role, driverStatus), request.url))
    }
    if ((path.startsWith('/dashboard') || path.startsWith('/book') || path.startsWith('/rate')) 
        && role !== 'RIDER') {
      return NextResponse.redirect(new URL(getRoleRedirectPath(role, driverStatus), request.url))
    }
  }

  const response = NextResponse.next();
  if (url.pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", process.env.NEXT_PUBLIC_APP_URL || "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
