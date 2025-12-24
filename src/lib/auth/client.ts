// Better-Auth Client
// Use this in Client Components

import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
})

// Export auth methods
export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient
