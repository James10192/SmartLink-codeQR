import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyWebhookSignature, checkPayment } from '@/lib/payments/cinetpay'
import { SubscriptionPlan } from '@prisma/client'

/**
 * CinetPay Webhook Handler
 *
 * This endpoint receives payment notifications from CinetPay
 * and automatically activates user subscriptions
 *
 * IMPORTANT: This must be publicly accessible (no auth middleware)
 * Security is ensured through signature verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('[CinetPay Webhook] Received notification:', {
      transactionId: body.cpm_trans_id,
      status: body.cpm_trans_status,
    })

    // CRITICAL: Verify signature to prevent fraud
    const receivedSignature = body.signature

    if (!receivedSignature) {
      console.error('[CinetPay Webhook] Missing signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    const isValid = verifyWebhookSignature(body, receivedSignature)

    if (!isValid) {
      console.error('[CinetPay Webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Extract transaction data
    const transactionId = body.cpm_trans_id
    const transactionStatus = body.cpm_trans_status
    const paymentMethod = body.payment_method

    // Find payment in database
    const payment = await prisma.payment.findUnique({
      where: { transactionId },
      include: { user: true },
    })

    if (!payment) {
      console.error('[CinetPay Webhook] Payment not found:', transactionId)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Already processed
    if (payment.status === 'COMPLETED') {
      console.log('[CinetPay Webhook] Payment already processed:', transactionId)
      return NextResponse.json({ received: true, message: 'Already processed' })
    }

    // Verify with CinetPay API (double-check for security)
    const paymentStatus = await checkPayment(transactionId)
    const isSuccess = paymentStatus.data.cpm_result === '00'

    if (isSuccess) {
      console.log('[CinetPay Webhook] Payment successful:', transactionId)

      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          paidAt: new Date(),
        },
      })

      // Calculate expiration date (1 month from now)
      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + 1)

      // Map payment method
      let cinetPayMethod: 'CINETPAY' | 'MANUAL' = 'CINETPAY'
      if (paymentMethod?.includes('ORANGE')) {
        cinetPayMethod = 'CINETPAY'
      } else if (paymentMethod?.includes('MTN')) {
        cinetPayMethod = 'CINETPAY'
      } else if (paymentMethod?.includes('MOOV')) {
        cinetPayMethod = 'CINETPAY'
      } else if (paymentMethod?.includes('WAVE')) {
        cinetPayMethod = 'CINETPAY'
      }

      // Activate subscription
      await prisma.subscription.upsert({
        where: { userId: payment.userId },
        create: {
          userId: payment.userId,
          plan: payment.plan as SubscriptionPlan,
          status: 'ACTIVE',
          expiresAt,
          paymentMethod: cinetPayMethod,
          paymentId: transactionId,
        },
        update: {
          plan: payment.plan as SubscriptionPlan,
          status: 'ACTIVE',
          expiresAt,
          paymentMethod: cinetPayMethod,
          paymentId: transactionId,
          updatedAt: new Date(),
        },
      })

      console.log('[CinetPay Webhook] Subscription activated for user:', payment.userId)

      // TODO: Send confirmation email to user
      // await sendSubscriptionConfirmationEmail(payment.userId)

      return NextResponse.json({
        received: true,
        message: 'Payment processed successfully',
      })
    } else {
      console.error('[CinetPay Webhook] Payment failed:', {
        transactionId,
        error: paymentStatus.data.cpm_error_message,
      })

      // Update payment as failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
        },
      })

      return NextResponse.json({
        received: true,
        message: 'Payment failed',
      })
    }
  } catch (error) {
    console.error('[CinetPay Webhook] Error processing webhook:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for webhook testing
 * CinetPay might send GET requests to verify the endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'CinetPay webhook endpoint is active',
  })
}
