// Server-side Session Helpers
// Use these in Server Components and API Routes

import { auth } from "@/lib/auth/config"
import { headers } from "next/headers"
import { cache } from "react"

/**
 * Get current session (Server Components)
 * Cached to avoid multiple calls in the same request
 */
export const getSession = cache(async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
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
