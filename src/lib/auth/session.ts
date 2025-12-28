// Server-side Session Helpers
// Use these in Server Components and API Routes

import { auth } from "@/lib/auth/config"
import { headers } from "next/headers"
import { cache } from "react"

/**
 * Get current session (Server Components)
 * Cached to avoid multiple calls in the same request
 *
 * WORKAROUND for Better-Auth v1.4.9 bug #7008:
 * Using disableCookieCache:true to force DB fetch and refresh cookie
 * This ensures session cookie is always up-to-date
 * @see https://github.com/better-auth/better-auth/issues/7008
 */
export const getSession = cache(async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
      query: {
        disableCookieCache: true, // Workaround: Force DB fetch to refresh cookie
      },
    })

    return session
  } catch (error) {
    console.error("[Get Session Error]", error)
    return null
  }
})

/**
 * Get current user (Server Components)
 * Shorthand for getSession().user
 */
export const getUser = cache(async () => {
  const session = await getSession()
  return session?.user ?? null
})

/**
 * Require authentication (Server Components)
 * Throws error if not authenticated
 */
export async function requireAuth() {
  const session = await getSession()

  if (!session) {
    throw new Error("Unauthorized: Session required")
  }

  return session
}

/**
 * Require user (Server Components)
 * Throws error if not authenticated
 */
export async function requireUser() {
  const session = await requireAuth()
  return session.user
}

/**
 * Get current user with relations (Server Components)
 * Includes profiles and subscription
 */
export async function getCurrentUser() {
  const session = await requireAuth()

  const { prisma } = await import('@/lib/db/prisma')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profiles: true,
      subscription: true,
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return user
}
