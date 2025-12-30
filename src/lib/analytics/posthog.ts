/**
 * PostHog Server-Side Client
 *
 * Used for tracking server-side events (webhooks, cron jobs, etc.)
 * Complements client-side PostHog tracking
 */

import { PostHog } from 'posthog-node'

let posthogInstance: PostHog | null = null

/**
 * Get PostHog server-side client singleton
 */
export function getPostHogClient(): PostHog {
  if (!posthogInstance) {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

    if (!apiKey) {
      throw new Error('NEXT_PUBLIC_POSTHOG_KEY not defined')
    }

    posthogInstance = new PostHog(apiKey, {
      host,
      flushAt: 1, // Send events immediately (important for serverless)
      flushInterval: 0, // Don't batch events
    })
  }

  return posthogInstance
}

/**
 * Singleton export for convenience
 */
export const posthog = getPostHogClient()

/**
 * Shutdown PostHog client (cleanup)
 * Call this at the end of serverless functions if needed
 */
export async function shutdownPostHog(): Promise<void> {
  if (posthogInstance) {
    await posthogInstance.shutdown()
    posthogInstance = null
  }
}
