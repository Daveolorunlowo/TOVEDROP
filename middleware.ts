import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Run env validation when middleware boots
import "@/lib/env";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // 1. Force HTTPS in production
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") !== "https" &&
    // Allow localhost in production mode if someone runs it locally
    !request.nextUrl.hostname.includes("localhost") 
  ) {
    url.protocol = "https:";
    return NextResponse.redirect(url);
  }

  // 2. CORS Policy for API Routes (locking down to production domain)
  // Assuming NEXT_PUBLIC_APP_URL is the primary production domain
  if (url.pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || "";
    
    // In production, enforce CORS
    if (process.env.NODE_ENV === "production" && origin && origin !== allowedOrigin) {
      return new NextResponse(null, {
        status: 403,
        statusText: "Forbidden",
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }
  }

  // 3. Admin Lock for /admin and /api/admin
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/admin")) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    // Check if user is logged in and is an ADMIN
    if (!token || token.role !== "ADMIN") {
      // If it's an API route, return 401/403 JSON
      if (url.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
      }
      // If it's a page route, redirect to home
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 4. Default CORS headers for allowed origins
  const response = NextResponse.next();
  if (url.pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", process.env.NEXT_PUBLIC_APP_URL || "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  return response;
}

// Apply middleware to API routes and admin pages
export const config = {
  matcher: [
    "/api/:path*",
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
