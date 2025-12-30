/**
 * Email Actions - Transactional Emails with Resend
 *
 * Sends payment-related emails using React Email templates.
 * All functions are server-side only ('use server').
 */

'use server'

import { prisma } from '@/lib/db/prisma'
import { resend, EMAIL_CONFIG } from '@/lib/email/resend'
import { render } from '@react-email/components'

// Import email templates
import SubscriptionReminderEmail from '@/lib/email/templates/subscription-reminder'
import SubscriptionExpiredEmail from '@/lib/email/templates/subscription-expired'
import PaymentSuccessEmail from '@/lib/email/templates/payment-success'
import PaymentFailedEmail from '@/lib/email/templates/payment-failed'
import PaymentRetryReminderEmail from '@/lib/email/templates/payment-retry-reminder'

interface EmailResult {
  success: boolean
  error?: string
}

/**
 * Send subscription expiration reminder (7j, 3j, 1j, 0j)
 */
export async function sendSubscriptionReminderEmail(
  userId: string,
  daysLeft: number
): Promise<EmailResult> {
  try {
    console.log(`[Email] Sending subscription reminder to user ${userId} (${daysLeft} days left)`)

    // Fetch user and subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    })

    if (!user || !user.email) {
      console.error('[Email] User not found or no email')
      return { success: false, error: 'User not found or no email' }
    }

    if (!user.subscription || !user.subscription.expiresAt) {
      console.error('[Email] No active subscription or expiration date')
      return { success: false, error: 'No active subscription' }
    }

    const planName = getPlanDisplayName(user.subscription.plan)
    const renewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/upgrade`

    // Render email template
    const emailHtml = await render(
      SubscriptionReminderEmail({
        userName: user.name || 'Utilisateur',
        planName,
        daysLeft,
        expiresAt: user.subscription.expiresAt,
        renewUrl,
      })
    )

    // Send email
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      replyTo: EMAIL_CONFIG.replyTo,
      to: user.email,
      subject: getSubjectForReminder(daysLeft),
      html: emailHtml,
    })

    if (result.error) {
      console.error('[Email] Resend error:', result.error)
      return { success: false, error: result.error.message }
    }

    console.log(`[Email] Reminder sent successfully to ${user.email} (ID: ${result.data?.id})`)
    return { success: true }
  } catch (error) {
    console.error('[Email] sendSubscriptionReminderEmail error:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Send subscription expired notification
 */
export async function sendSubscriptionExpiredEmail(userId: string): Promise<EmailResult> {
  try {
    console.log(`[Email] Sending subscription expired email to user ${userId}`)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    })

    if (!user || !user.email) {
      console.error('[Email] User not found or no email')
      return { success: false, error: 'User not found or no email' }
    }

    if (!user.subscription || !user.subscription.expiresAt) {
      console.error('[Email] No subscription data')
      return { success: false, error: 'No subscription data' }
    }

    const planName = getPlanDisplayName(user.subscription.plan)
    const renewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/upgrade`

    const emailHtml = await render(
      SubscriptionExpiredEmail({
        userName: user.name || 'Utilisateur',
        planName,
        expiredAt: user.subscription.expiresAt,
        renewUrl,
      })
    )

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      replyTo: EMAIL_CONFIG.replyTo,
      to: user.email,
      subject: '⚠️ Votre abonnement SmartLink a expiré',
      html: emailHtml,
    })

    if (result.error) {
      console.error('[Email] Resend error:', result.error)
      return { success: false, error: result.error.message }
    }

    console.log(`[Email] Expired notification sent to ${user.email} (ID: ${result.data?.id})`)
    return { success: true }
  } catch (error) {
    console.error('[Email] sendSubscriptionExpiredEmail error:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Send payment success confirmation
 */
export async function sendPaymentSuccessEmail(
  userId: string,
  paymentId: string
): Promise<EmailResult> {
  try {
    console.log(`[Email] Sending payment success email to user ${userId}`)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    })

    if (!user || !user.email) {
      console.error('[Email] User not found or no email')
      return { success: false, error: 'User not found or no email' }
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      console.error('[Email] Payment not found')
      return { success: false, error: 'Payment not found' }
    }

    const planName = getPlanDisplayName(payment.plan)
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    const expiresAt =
      user.subscription?.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

    const emailHtml = await render(
      PaymentSuccessEmail({
        userName: user.name || 'Utilisateur',
        planName,
        amount: payment.amount,
        currency: payment.currency,
        paymentDate: payment.paidAt || payment.createdAt,
        expiresAt,
        transactionId: payment.transactionId,
        dashboardUrl,
      })
    )

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      replyTo: EMAIL_CONFIG.replyTo,
      to: user.email,
      subject: `✅ Paiement confirmé - Bienvenue dans SmartLink ${planName}`,
      html: emailHtml,
    })

    if (result.error) {
      console.error('[Email] Resend error:', result.error)
      return { success: false, error: result.error.message }
    }

    console.log(`[Email] Success confirmation sent to ${user.email} (ID: ${result.data?.id})`)
    return { success: true }
  } catch (error) {
    console.error('[Email] sendPaymentSuccessEmail error:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Send payment failed notification
 */
export async function sendPaymentFailedEmail(
  userId: string,
  transactionId: string,
  errorMessage?: string
): Promise<EmailResult> {
  try {
    console.log(`[Email] Sending payment failed email to user ${userId}`)

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || !user.email) {
      console.error('[Email] User not found or no email')
      return { success: false, error: 'User not found or no email' }
    }

    const payment = await prisma.payment.findFirst({
      where: { transactionId },
    })

    if (!payment) {
      console.error('[Email] Payment not found')
      return { success: false, error: 'Payment not found' }
    }

    const planName = getPlanDisplayName(payment.plan)
    const retryUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/upgrade`

    const emailHtml = await render(
      PaymentFailedEmail({
        userName: user.name || 'Utilisateur',
        planName,
        amount: payment.amount,
        currency: payment.currency,
        transactionId: payment.transactionId,
        errorMessage: errorMessage || 'Le paiement n\'a pas pu être traité',
        retryUrl,
      })
    )

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      replyTo: EMAIL_CONFIG.replyTo,
      to: user.email,
      subject: '⚠️ Échec du paiement SmartLink - Action requise',
      html: emailHtml,
    })

    if (result.error) {
      console.error('[Email] Resend error:', result.error)
      return { success: false, error: result.error.message }
    }

    console.log(`[Email] Failed notification sent to ${user.email} (ID: ${result.data?.id})`)
    return { success: true }
  } catch (error) {
    console.error('[Email] sendPaymentFailedEmail error:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Send payment retry reminder (J+3, J+7)
 */
export async function sendPaymentRetryReminderEmail(
  userId: string,
  failedPaymentId: string
): Promise<EmailResult> {
  try {
    console.log(`[Email] Sending payment retry reminder to user ${userId}`)

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || !user.email) {
      console.error('[Email] User not found or no email')
      return { success: false, error: 'User not found or no email' }
    }

    const payment = await prisma.payment.findUnique({
      where: { id: failedPaymentId },
    })

    if (!payment) {
      console.error('[Email] Payment not found')
      return { success: false, error: 'Payment not found' }
    }

    const planName = getPlanDisplayName(payment.plan)
    const retryUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/upgrade`

    // Calculate days since failed
    const daysSinceFailed = Math.floor(
      (Date.now() - payment.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    const emailHtml = await render(
      PaymentRetryReminderEmail({
        userName: user.name || 'Utilisateur',
        planName,
        amount: payment.amount,
        currency: payment.currency,
        failedDate: payment.createdAt,
        daysSinceFailed,
        transactionId: payment.transactionId,
        retryUrl,
      })
    )

    const isUrgent = daysSinceFailed >= 7
    const subject = isUrgent
      ? '⚠️ Dernier rappel - Paiement en attente'
      : '🔔 Rappel - Paiement en attente'

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      replyTo: EMAIL_CONFIG.replyTo,
      to: user.email,
      subject,
      html: emailHtml,
    })

    if (result.error) {
      console.error('[Email] Resend error:', result.error)
      return { success: false, error: result.error.message }
    }

    console.log(`[Email] Retry reminder sent to ${user.email} (ID: ${result.data?.id})`)
    return { success: true }
  } catch (error) {
    console.error('[Email] sendPaymentRetryReminderEmail error:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

// ==================== Helper Functions ====================

/**
 * Get human-readable plan name
 */
function getPlanDisplayName(plan: string): string {
  const planNames: Record<string, string> = {
    FREE: 'Gratuit',
    PRO_DIGITAL: 'Pro',
    PACK_STARTER: 'Pack Starter',
    CORPORATE: 'Corporate',
  }
  return planNames[plan] || plan
}

/**
 * Generate subject line for reminder emails based on days left
 */
function getSubjectForReminder(daysLeft: number): string {
  if (daysLeft === 0) {
    return '⚠️ Dernier jour - Votre abonnement SmartLink expire aujourd\'hui'
  }
  if (daysLeft === 1) {
    return '⏰ Plus qu\'1 jour - Renouvelez votre abonnement SmartLink'
  }
  if (daysLeft === 3) {
    return '📅 Plus que 3 jours - N\'oubliez pas de renouveler'
  }
  return `🔔 Rappel - Votre abonnement SmartLink expire dans ${daysLeft} jours`
}
