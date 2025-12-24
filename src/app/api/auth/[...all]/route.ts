// Better-Auth API Route
// Handles all authentication endpoints: /api/auth/*

import { auth } from "@/lib/auth/config"
import { toNextJsHandler } from "better-auth/next-js"

export const { GET, POST } = toNextJsHandler(auth)
