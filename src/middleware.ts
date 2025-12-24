// Next.js Middleware for Route Protection
// https://nextjs.org/docs/app/building-your-application/routing/middleware

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth/config"

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
  /^\/api\/vcard\/[^/]+$/, // /api/vcard/[id] - vCard download
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

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    // If no session and trying to access protected route, redirect to login
    if (!session) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("from", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // If authenticated and trying to access auth pages, redirect to dashboard
    if (pathname === "/login" || pathname === "/signup") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error("[Middleware Auth Error]", error)
    // On error, allow the request to continue (fail open for development)
    return NextResponse.next()
  }
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
