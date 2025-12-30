/**
 * Cron Job: Expire Subscriptions
 *
 * Runs daily at midnight UTC (configured in vercel.json)
 * Expires all ACTIVE subscriptions that have passed their expiration date
 * Deactivates QR links and sends expiration notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkExpiredSubscriptions } from '@/lib/actions/subscription'
import { prisma } from '@/lib/db/prisma'
import { sendSubscriptionExpiredEmail } from '@/lib/actions/email'
import { createSubscriptionExpiredNotification } from '@/lib/notifications/create-notification'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // 1. Verify cron secret for security (critical!)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('[Cron] CRON_SECRET not configured')
      return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 })
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Cron] Invalid authorization header')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Cron] Starting expire-subscriptions job')

    // 2. Get subscriptions that expired today (before calling checkExpiredSubscriptions)
    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)

    const subscriptionsExpiredToday = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          gte: startOfDay,
          lte: now,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    console.log(`[Cron] Found ${subscriptionsExpiredToday.length} subscriptions to expire today`)

    // 3. Call the existing checkExpiredSubscriptions function
    // This handles:
    // - Updating status to EXPIRED
    // - Deactivating QR links
    // - Revalidating paths
    const expiredCount = await checkExpiredSubscriptions()

    console.log(`[Cron] Expired ${expiredCount} subscriptions via checkExpiredSubscriptions()`)

    // 4. Send emails and notifications for each expired subscription
    let emailsCount = 0
    let notificationsCount = 0

    for (const subscription of subscriptionsExpiredToday) {
      // Check if we already sent expiration notification today
      const existingNotif = await prisma.notification.findFirst({
        where: {
          userId: subscription.userId,
          type: 'SUBSCRIPTION_EXPIRED',
          createdAt: {
            gte: startOfDay,
          },
        },
      })

      if (existingNotif) {
        console.log(`[Cron] Already notified user ${subscription.userId} today`)
        continue
      }

      // Send expiration email
      const emailResult = await sendSubscriptionExpiredEmail(subscription.userId)

      if (emailResult.success) {
        emailsCount++
      } else {
        console.error(
          `[Cron] Failed to send expiration email to ${subscription.user.email}:`,
          emailResult.error
        )
      }

      // Create notification
      await createSubscriptionExpiredNotification(subscription.userId)
      notificationsCount++
    }

    console.log(`[Cron] Sent ${emailsCount} expiration emails and ${notificationsCount} notifications`)

    return NextResponse.json({
      success: true,
      expiredCount,
      emailsSent: emailsCount,
      notificationsCreated: notificationsCount,
    })
  } catch (error) {
    console.error('[Cron] expire-subscriptions error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
