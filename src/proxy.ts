// Next.js Proxy for Route Protection (Next.js 16+)
// https://nextjs.org/docs/app/api-reference/file-conventions/proxy

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

// Public routes that don't require authentication
const publicRoutes = [
  "/",
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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for session cookie using Better-Auth helper
  // Note: This only checks cookie existence, not validity (validated in page/API routes)
  const sessionCookie = getSessionCookie(request)

  // Handle auth pages (/login, /signup) FIRST
  if (pathname === "/login" || pathname === "/signup") {
    // If has session cookie, redirect to dashboard
    if (sessionCookie) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    // If no session, allow access to auth pages
    return NextResponse.next()
  }

  // Allow other public routes without session check
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // For protected routes, redirect to login if no session
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
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
