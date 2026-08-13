import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getRoleRedirectPath } from './lib/getRoleRedirectPath'

export async function middleware(request: any) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const path = request.nextUrl.pathname

  const protectedPrefixes = ['/dashboard', '/book', '/driver', '/admin', '/rate']
  const isProtected = protectedPrefixes.some(p => path.startsWith(p))
  const isGuestOnlyPage = path.startsWith('/auth') || path === '/'

  // No session, trying to access protected area
  if (!token && isProtected) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
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

    if (path.startsWith('/admin') && role !== 'ADMIN') {
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

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*', '/book/:path*', '/driver/:path*', 
    '/admin/:path*', '/rate/:path*', '/auth/:path*'
  ],
}
