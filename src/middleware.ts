// Next.js Middleware for Route Protection
// https://nextjs.org/docs/app/building-your-application/routing/middleware

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/api/auth",
]

// Dynamic public routes (profils publics)
const publicPatterns = [
  /^\/u\/[^/]+$/, // /u/[slug] - public profile pages
  /^\/api\/vcard\/[^/]+$/, // /api/vcard/[slug] - vCard download
  /^\/api\/qr\/[^/]+$/, // /api/qr/[slug] - QR code generation
  /^\/api\/webhooks\//, // Webhooks (CinetPay, Lemon Squeezy)
]

function isPublicRoute(pathname: string): boolean {
  // Check static routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return true
  }

  // Check dynamic patterns
  if (publicPatterns.some(pattern => pattern.test(pathname))) {
    return true
  }

  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes without session check
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // For protected routes, check for session cookie
  // Better-Auth uses a cookie for session management
  const sessionCookie = request.cookies.get('better-auth.session_token')

  // If no session cookie and trying to access protected route, redirect to login
  if (!sessionCookie && !pathname.startsWith('/login') && !pathname.startsWith('/signup')) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If has session cookie and trying to access auth pages, redirect to dashboard
  if (sessionCookie && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
