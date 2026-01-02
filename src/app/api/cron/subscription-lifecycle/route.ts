/**
 * Cron Job: Subscription Lifecycle Management
 *
 * Runs daily at midnight UTC (configured in vercel.json)
 * Unified cron that handles:
 * 1. Check expiring subscriptions (7, 3, 1, 0 days) → send reminders
 * 2. Expire subscriptions past their expiresAt date → deactivate QR links
 *
 * This consolidates check-expiring-subscriptions + expire-subscriptions
 * to meet Vercel Free Plan's 2 cron job limit.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getDaysUntilExpiration } from '@/lib/utils/tier-enforcement'
import { checkExpiredSubscriptions } from '@/lib/actions/subscription'
import {
  sendSubscriptionReminderEmail,
  sendSubscriptionExpiredEmail,
} from '@/lib/actions/email'
import {
  createSubscriptionExpiringNotification,
  createSubscriptionExpiredNotification,
} from '@/lib/notifications/create-notification'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // 1. Verify cron secret for security (critical!)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('[Cron Lifecycle] CRON_SECRET not configured')
      return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 })
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Cron Lifecycle] Invalid authorization header')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Cron Lifecycle] Starting subscription-lifecycle job')

    // ====================================================================
    // PART 1: CHECK EXPIRING SUBSCRIPTIONS (7, 3, 1, 0 days)
    // ====================================================================

    console.log('[Cron Lifecycle] Part 1: Checking expiring subscriptions...')

    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          not: null,
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

    console.log(`[Cron Lifecycle] Found ${subscriptions.length} active subscriptions to check`)

    const reminderDays = [7, 3, 1, 0] // Days to send reminders
    let remindersCount = 0

    for (const subscription of subscriptions) {
      const daysLeft = getDaysUntilExpiration(subscription)

      if (daysLeft === null) continue

      // Check if we should send a reminder for this subscription
      if (reminderDays.includes(daysLeft)) {
        console.log(
          `[Cron Lifecycle] Subscription ${subscription.id} expires in ${daysLeft} days (user: ${subscription.user.email})`
        )

        // Check if we already sent a reminder today for this daysLeft value
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const existingReminder = await prisma.notification.findFirst({
          where: {
            userId: subscription.userId,
            type: 'SUBSCRIPTION_EXPIRING_SOON',
            createdAt: {
              gte: today,
            },
            metadata: {
              path: ['daysLeft'],
              equals: daysLeft,
            },
          },
        })

        if (existingReminder) {
          console.log(
            `[Cron Lifecycle] Already sent reminder today for user ${subscription.userId} (${daysLeft} days)`
          )
          continue
        }

        // Send email reminder
        const emailResult = await sendSubscriptionReminderEmail(subscription.userId, daysLeft)

        if (!emailResult.success) {
          console.error(
            `[Cron Lifecycle] Failed to send reminder email to ${subscription.user.email}:`,
            emailResult.error
          )
        }

        // Create notification
        if (subscription.expiresAt) {
          await createSubscriptionExpiringNotification(
            subscription.userId,
            daysLeft,
            subscription.expiresAt
          )
        }

        remindersCount++
      }
    }

    console.log(`[Cron Lifecycle] Part 1 complete: Sent ${remindersCount} expiration reminders`)

    // ====================================================================
    // PART 2: EXPIRE SUBSCRIPTIONS (past expiresAt date)
    // ====================================================================

    console.log('[Cron Lifecycle] Part 2: Expiring subscriptions...')

    // Get subscriptions that expired today (before calling checkExpiredSubscriptions)
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

    console.log(
      `[Cron Lifecycle] Found ${subscriptionsExpiredToday.length} subscriptions to expire today`
    )

    // Call the existing checkExpiredSubscriptions function
    // This handles:
    // - Updating status to EXPIRED
    // - Deactivating QR links
    // - Revalidating paths
    const expiredCount = await checkExpiredSubscriptions()

    console.log(`[Cron Lifecycle] Expired ${expiredCount} subscriptions via checkExpiredSubscriptions()`)

    // Send emails and notifications for each expired subscription
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
        console.log(`[Cron Lifecycle] Already notified user ${subscription.userId} today`)
        continue
      }

      // Send expiration email
      const emailResult = await sendSubscriptionExpiredEmail(subscription.userId)

      if (emailResult.success) {
        emailsCount++
      } else {
        console.error(
          `[Cron Lifecycle] Failed to send expiration email to ${subscription.user.email}:`,
          emailResult.error
        )
      }

      // Create notification
      await createSubscriptionExpiredNotification(subscription.userId)
      notificationsCount++
    }

    console.log(
      `[Cron Lifecycle] Part 2 complete: Sent ${emailsCount} expiration emails and ${notificationsCount} notifications`
    )

    // ====================================================================
    // FINAL METRICS
    // ====================================================================

    const totalMetrics = {
      success: true,
      part1_reminders: {
        totalSubscriptions: subscriptions.length,
        remindersCount,
      },
      part2_expirations: {
        expiredCount,
        emailsSent: emailsCount,
        notificationsCreated: notificationsCount,
      },
    }

    console.log('[Cron Lifecycle] Job completed successfully:', totalMetrics)

    return NextResponse.json(totalMetrics)
  } catch (error) {
    console.error('[Cron Lifecycle] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
