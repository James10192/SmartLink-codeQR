/**
 * PostHog Server-Side Client
 *
 * Used for tracking server-side events (webhooks, cron jobs, etc.)
 * Complements client-side PostHog tracking
 *
 * NOTE: PostHog is optional. If not configured, events are simply not tracked.
 */

import { PostHog } from 'posthog-node'

let posthogInstance: PostHog | null = null

/**
 * Check if PostHog is configured
 */
export function isPostHogEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_POSTHOG_KEY
}

/**
 * Get PostHog server-side client singleton (or null if not configured)
 */
export function getPostHogClient(): PostHog | null {
  if (!isPostHogEnabled()) {
    return null
  }

  if (!posthogInstance) {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY!
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

    posthogInstance = new PostHog(apiKey, {
      host,
      flushAt: 1, // Send events immediately (important for serverless)
      flushInterval: 0, // Don't batch events
    })
  }

  return posthogInstance
}

/**
 * Capture an event (safe - does nothing if PostHog not configured)
 */
export function captureEvent(params: {
  distinctId: string
  event: string
  properties?: Record<string, any>
}): void {
  const client = getPostHogClient()
  if (client) {
    client.capture(params)
  } else {
    // PostHog not configured, skip tracking
    if (process.env.NODE_ENV === 'development') {
      console.log('[PostHog] Event not tracked (not configured):', params.event)
    }
  }
}

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
