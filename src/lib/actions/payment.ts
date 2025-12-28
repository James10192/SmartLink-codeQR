'use server'

import { createSafeActionClient } from 'next-safe-action'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import {
  initPayment,
  checkPayment,
  generateTransactionId,
  getSubscriptionAmount,
  getPlanDisplayName,
} from '@/lib/payments/cinetpay'
import { revalidatePath } from 'next/cache'
import { SubscriptionPlan } from '@prisma/client'

const actionClient = createSafeActionClient()

/**
 * Create a payment session with CinetPay
 * Returns a payment URL where the user will be redirected
 */
export const createPaymentSessionAction = actionClient
  .schema(
    z.object({
      plan: z.enum(['PRO_DIGITAL', 'PACK_STARTER', 'CORPORATE']),
      phoneNumber: z.string().optional(),
    })
  )
  .action(async ({ parsedInput }) => {
    const session = await requireAuth()

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    const { plan, phoneNumber } = parsedInput

    // Get amount for this plan
    const amount = getSubscriptionAmount(plan)

    if (amount === 0) {
      throw new Error('This plan requires contacting sales. Please email support@smartlink.ci')
    }

    // Generate unique transaction ID
    const transactionId = generateTransactionId()

    // Create pending payment record
    await prisma.payment.create({
      data: {
        userId: session.user.id,
        transactionId,
        amount,
        currency: 'XOF',
        plan: plan as SubscriptionPlan,
        provider: 'CINETPAY',
        status: 'PENDING',
      },
    })

    // Initialize payment with CinetPay
    const paymentResponse = await initPayment({
      amount,
      transactionId,
      description: getPlanDisplayName(plan),
      customerName: user.name || 'SmartLink User',
      customerEmail: user.email,
      customerPhoneNumber: phoneNumber,
      currency: 'XOF',
      channels: 'MOBILE_MONEY', // Only Mobile Money for now
      metadata: {
        userId: session.user.id,
        plan,
      },
    })

    return {
      success: true,
      paymentUrl: paymentResponse.data.payment_url,
      transactionId,
      message: 'Payment session created. Redirecting to payment page...',
    }
  })

/**
 * Verify payment status
 * Called after user returns from CinetPay
 */
export const verifyPaymentAction = actionClient
  .schema(
    z.object({
      transactionId: z.string(),
    })
  )
  .action(async ({ parsedInput }) => {
    const session = await requireAuth()

    const { transactionId } = parsedInput

    // Check if payment exists and belongs to user
    const payment = await prisma.payment.findFirst({
      where: {
        transactionId,
        userId: session.user.id,
      },
    })

    if (!payment) {
      throw new Error('Payment not found')
    }

    // Already processed
    if (payment.status === 'COMPLETED') {
      return {
        success: true,
        status: 'COMPLETED',
        message: 'Payment already processed',
      }
    }

    // Check status with CinetPay
    const paymentStatus = await checkPayment(transactionId)

    const isSuccess = paymentStatus.data.cpm_result === '00' // '00' means success

    if (isSuccess) {
      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          paidAt: new Date(),
        },
      })

      // Calculate expiration date based on plan
      const expiresAt = new Date()
      if (payment.plan === 'PACK_STARTER') {
        // Pack Starter: PRO features for 1 year
        expiresAt.setMonth(expiresAt.getMonth() + 12)
      } else {
        // PRO Digital: 1 month subscription
        expiresAt.setMonth(expiresAt.getMonth() + 1)
      }

      await prisma.subscription.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          plan: payment.plan,
          status: 'ACTIVE',
          expiresAt,
          paymentMethod: 'CINETPAY',
        },
        update: {
          plan: payment.plan,
          status: 'ACTIVE',
          expiresAt,
          paymentMethod: 'CINETPAY',
          updatedAt: new Date(),
        },
      })

      revalidatePath('/dashboard')
      revalidatePath('/dashboard/subscription')

      return {
        success: true,
        status: 'COMPLETED',
        message: 'Payment successful! Your subscription has been activated.',
      }
    } else {
      // Payment failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
        },
      })

      return {
        success: false,
        status: 'FAILED',
        message: paymentStatus.data.cpm_error_message || 'Payment failed',
      }
    }
  })

/**
 * Get user's payment history
 */
export async function getUserPayments() {
  const session = await requireAuth()

  const payments = await prisma.payment.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return payments
}

/**
 * Cancel a pending payment
 */
export const cancelPaymentAction = actionClient
  .schema(
    z.object({
      transactionId: z.string(),
    })
  )
  .action(async ({ parsedInput }) => {
    const session = await requireAuth()

    const payment = await prisma.payment.findFirst({
      where: {
        transactionId: parsedInput.transactionId,
        userId: session.user.id,
        status: 'PENDING',
      },
    })

    if (!payment) {
      throw new Error('Payment not found or already processed')
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'CANCELLED',
      },
    })

    return {
      success: true,
      message: 'Payment cancelled',
    }
  })
