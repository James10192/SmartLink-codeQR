/**
 * Cron Job: Check Expiring Subscriptions
 *
 * Runs daily at 9:00 AM UTC (configured in vercel.json)
 * Checks for subscriptions expiring in 7, 3, 1, or 0 days
 * Sends email reminders and creates notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getDaysUntilExpiration } from '@/lib/utils/tier-enforcement'
import { sendSubscriptionReminderEmail } from '@/lib/actions/email'
import { createSubscriptionExpiringNotification } from '@/lib/notifications/create-notification'

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

    console.log('[Cron] Starting check-expiring-subscriptions job')

    // 2. Fetch all ACTIVE subscriptions with expiresAt
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

    console.log(`[Cron] Found ${subscriptions.length} active subscriptions to check`)

    // 3. Check each subscription for expiration
    const reminderDays = [7, 3, 1, 0] // Days to send reminders
    let remindersCount = 0

    for (const subscription of subscriptions) {
      const daysLeft = getDaysUntilExpiration(subscription)

      if (daysLeft === null) continue

      // Check if we should send a reminder for this subscription
      if (reminderDays.includes(daysLeft)) {
        console.log(
          `[Cron] Subscription ${subscription.id} expires in ${daysLeft} days (user: ${subscription.user.email})`
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
          console.log(`[Cron] Already sent reminder today for user ${subscription.userId} (${daysLeft} days)`)
          continue
        }

        // Send email reminder
        const emailResult = await sendSubscriptionReminderEmail(subscription.userId, daysLeft)

        if (!emailResult.success) {
          console.error(`[Cron] Failed to send email to ${subscription.user.email}:`, emailResult.error)
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

    console.log(`[Cron] Sent ${remindersCount} expiration reminders`)

    return NextResponse.json({
      success: true,
      remindersCount,
      totalSubscriptions: subscriptions.length,
    })
  } catch (error) {
    console.error('[Cron] check-expiring-subscriptions error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
