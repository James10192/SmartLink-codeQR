/**
 * Cron Job: Retry Failed Payments
 *
 * Runs daily at 10:00 AM UTC (configured in vercel.json)
 * Sends retry reminders for payments that failed 3 or 7 days ago
 * Helps recover failed payments without being too spammy
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { sendPaymentRetryReminderEmail } from '@/lib/actions/email'
import { createPaymentRetryReminderNotification } from '@/lib/notifications/create-notification'

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

    console.log('[Cron] Starting retry-failed-payments job')

    // 2. Calculate date ranges for J+3 and J+7
    const now = new Date()
    const threeDaysAgo = new Date(now)
    threeDaysAgo.setDate(now.getDate() - 3)
    threeDaysAgo.setHours(0, 0, 0, 0)

    const threeDaysAgoEnd = new Date(threeDaysAgo)
    threeDaysAgoEnd.setHours(23, 59, 59, 999)

    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const sevenDaysAgoEnd = new Date(sevenDaysAgo)
    sevenDaysAgoEnd.setHours(23, 59, 59, 999)

    // 3. Find failed payments from 3 or 7 days ago
    const failedPayments = await prisma.payment.findMany({
      where: {
        status: 'FAILED',
        OR: [
          {
            // Payments failed exactly 3 days ago
            createdAt: {
              gte: threeDaysAgo,
              lte: threeDaysAgoEnd,
            },
          },
          {
            // Payments failed exactly 7 days ago
            createdAt: {
              gte: sevenDaysAgo,
              lte: sevenDaysAgoEnd,
            },
          },
        ],
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

    console.log(`[Cron] Found ${failedPayments.length} failed payments to retry`)

    // 4. Send reminders for each failed payment
    let remindersCount = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const payment of failedPayments) {
      // Check if we already sent a retry reminder today for this user
      const existingReminder = await prisma.notification.findFirst({
        where: {
          userId: payment.userId,
          type: 'PAYMENT_RETRY_REMINDER',
          createdAt: {
            gte: today,
          },
        },
      })

      if (existingReminder) {
        console.log(`[Cron] Already sent retry reminder today to user ${payment.userId}`)
        continue
      }

      const daysSinceFailed = Math.floor(
        (now.getTime() - payment.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )

      console.log(
        `[Cron] Sending retry reminder to ${payment.user.email} (${daysSinceFailed} days since failure)`
      )

      // Send email reminder
      const emailResult = await sendPaymentRetryReminderEmail(payment.userId, payment.id)

      if (!emailResult.success) {
        console.error(
          `[Cron] Failed to send retry email to ${payment.user.email}:`,
          emailResult.error
        )
      }

      // Create notification
      await createPaymentRetryReminderNotification(payment.userId)

      remindersCount++
    }

    console.log(`[Cron] Sent ${remindersCount} retry reminders`)

    return NextResponse.json({
      success: true,
      remindersCount,
      totalFailedPayments: failedPayments.length,
    })
  } catch (error) {
    console.error('[Cron] retry-failed-payments error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
