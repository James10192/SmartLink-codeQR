/**
 * Lemon Squeezy Webhook Handler
 *
 * Handles payment events from Lemon Squeezy (card payments):
 * - order_created: One-time payment completed (PACK_STARTER)
 * - subscription_created: Recurring subscription created (PRO_MONTHLY, PRO_YEARLY)
 * - subscription_updated: Subscription renewed or changed
 * - subscription_cancelled: User cancelled subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import {
  verifyLemonSqueezySignature,
  getProductFromVariantId,
  getSubscriptionPlan,
  getSubscriptionDuration,
  calculateExpirationDate,
  type LemonSqueezyProduct,
} from '@/lib/payments/lemonsqueezy'
import { sendPaymentSuccessEmail, sendPaymentFailedEmail } from '@/lib/actions/email'
import {
  createPaymentSuccessNotification,
  createPaymentFailedNotification,
} from '@/lib/notifications/create-notification'
import { captureEvent } from '@/lib/analytics/posthog'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // 1. Verify webhook signature
    const body = await request.text()
    const signature = request.headers.get('x-signature') || ''
    const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('[Lemon Squeezy Webhook] LEMON_SQUEEZY_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    const isValid = verifyLemonSqueezySignature(body, signature, webhookSecret)

    if (!isValid) {
      console.error('[Lemon Squeezy Webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // 2. Parse webhook event
    const event = JSON.parse(body)
    const eventName = event.meta?.event_name

    if (!eventName) {
      console.error('[Lemon Squeezy Webhook] Missing event_name')
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 })
    }

    console.log(`[Lemon Squeezy Webhook] Received event: ${eventName}`)

    // 3. Handle different event types
    switch (eventName) {
      case 'order_created':
        await handleOrderCreated(event)
        break
      case 'subscription_created':
        await handleSubscriptionCreated(event)
        break
      case 'subscription_updated':
        await handleSubscriptionUpdated(event)
        break
      case 'subscription_cancelled':
        await handleSubscriptionCancelled(event)
        break
      default:
        console.log(`[Lemon Squeezy Webhook] Unhandled event: ${eventName}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Lemon Squeezy Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle order_created event (one-time payments)
 * Used for PACK_STARTER and potentially one-time PRO upgrades
 */
async function handleOrderCreated(event: any): Promise<void> {
  const order = event.data
  const userId = order.attributes.custom_data?.user_id

  if (!userId) {
    console.error('[Lemon Squeezy] Missing user_id in custom_data')
    return
  }

  const amount = parseInt(order.attributes.total)
  const currency = order.attributes.currency
  const status = order.attributes.status // 'paid' or 'failed'
  const variantId = order.attributes.first_order_item?.variant_id

  if (!variantId) {
    console.error('[Lemon Squeezy] Missing variant_id')
    return
  }

  // Determine product from variant ID
  const product = getProductFromVariantId(variantId)

  if (!product) {
    console.error('[Lemon Squeezy] Unknown variant ID:', variantId)
    return
  }

  console.log(`[Lemon Squeezy] Order created: ${product} (${status})`)

  const plan = getSubscriptionPlan(product)

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      userId,
      transactionId: order.id,
      amount,
      currency,
      plan,
      provider: 'LEMONSQUEEZY',
      status: status === 'paid' ? 'COMPLETED' : 'FAILED',
      paidAt: status === 'paid' ? new Date(order.attributes.created_at) : null,
    },
  })

  if (status === 'paid') {
    // Calculate expiration date
    const expiresAt = calculateExpirationDate(product)

    // Create/update subscription
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        status: 'ACTIVE',
        expiresAt,
        paymentMethod: 'LEMONSQUEEZY',
        paymentId: order.id,
      },
      update: {
        plan,
        status: 'ACTIVE',
        expiresAt,
        paymentMethod: 'LEMONSQUEEZY',
        paymentId: order.id,
        updatedAt: new Date(),
      },
    })

    // Send confirmation email and notification
    await sendPaymentSuccessEmail(userId, payment.id)
    await createPaymentSuccessNotification(userId, plan, amount)

    // Track event in PostHog
    captureEvent({
      distinctId: userId,
      event: 'subscription_activated',
      properties: {
        plan,
        product,
        amount,
        currency,
        paymentMethod: 'LEMONSQUEEZY',
        expiresAt: expiresAt.toISOString(),
      },
    })

    console.log(`[Lemon Squeezy] Order completed: ${userId} -> ${plan}`)
  } else {
    // Payment failed
    await sendPaymentFailedEmail(userId, order.id, 'Le paiement n\'a pas été accepté')
    await createPaymentFailedNotification(userId, order.id)

    // Track failure
    captureEvent({
      distinctId: userId,
      event: 'payment_failed',
      properties: {
        plan,
        product,
        amount,
        paymentMethod: 'LEMONSQUEEZY',
        transactionId: order.id,
      },
    })

    console.log(`[Lemon Squeezy] Order failed: ${userId}`)
  }
}

/**
 * Handle subscription_created event (recurring subscriptions)
 * Used for PRO_MONTHLY and PRO_YEARLY
 */
async function handleSubscriptionCreated(event: any): Promise<void> {
  const subscription = event.data
  const userId = subscription.attributes.custom_data?.user_id

  if (!userId) {
    console.error('[Lemon Squeezy] Missing user_id in subscription')
    return
  }

  const variantId = subscription.attributes.variant_id
  const product = getProductFromVariantId(variantId)

  if (!product) {
    console.error('[Lemon Squeezy] Unknown variant ID:', variantId)
    return
  }

  console.log(`[Lemon Squeezy] Subscription created: ${product}`)

  const plan = getSubscriptionPlan(product)
  const expiresAt = calculateExpirationDate(product)

  // Update or create subscription
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan,
      status: 'ACTIVE',
      expiresAt,
      paymentMethod: 'LEMONSQUEEZY',
      paymentId: subscription.id,
    },
    update: {
      plan,
      status: 'ACTIVE',
      expiresAt,
      paymentMethod: 'LEMONSQUEEZY',
      paymentId: subscription.id,
    },
  })

  // Track subscription creation
  captureEvent({
    distinctId: userId,
    event: 'subscription_created',
    properties: {
      plan,
      product,
      subscriptionId: subscription.id,
      expiresAt: expiresAt.toISOString(),
    },
  })

  console.log(`[Lemon Squeezy] Subscription activated: ${userId} -> ${plan}`)
}

/**
 * Handle subscription_updated event (renewals, plan changes)
 */
async function handleSubscriptionUpdated(event: any): Promise<void> {
  const subscription = event.data
  const userId = subscription.attributes.custom_data?.user_id

  if (!userId) {
    console.error('[Lemon Squeezy] Missing user_id in subscription update')
    return
  }

  const status = subscription.attributes.status

  console.log(`[Lemon Squeezy] Subscription updated: ${userId} (status: ${status})`)

  // Handle renewal
  if (status === 'active') {
    const variantId = subscription.attributes.variant_id
    const product = getProductFromVariantId(variantId)

    if (product) {
      const plan = getSubscriptionPlan(product)
      const expiresAt = calculateExpirationDate(product)

      await prisma.subscription.update({
        where: { userId },
        data: {
          status: 'ACTIVE',
          expiresAt,
          updatedAt: new Date(),
        },
      })

      // Track renewal
      captureEvent({
        distinctId: userId,
        event: 'subscription_renewed',
        properties: {
          plan,
          product,
          expiresAt: expiresAt.toISOString(),
        },
      })

      console.log(`[Lemon Squeezy] Subscription renewed: ${userId}`)
    }
  }
}

/**
 * Handle subscription_cancelled event
 */
async function handleSubscriptionCancelled(event: any): Promise<void> {
  const subscription = event.data
  const userId = subscription.attributes.custom_data?.user_id

  if (!userId) {
    console.error('[Lemon Squeezy] Missing user_id in subscription cancellation')
    return
  }

  console.log(`[Lemon Squeezy] Subscription cancelled: ${userId}`)

  // Update subscription status to CANCELLED
  // Subscription remains active until expiresAt
  await prisma.subscription.updateMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    data: {
      status: 'CANCELLED',
      updatedAt: new Date(),
    },
  })

  // Track cancellation
  captureEvent({
    distinctId: userId,
    event: 'subscription_cancelled',
    properties: {
      subscriptionId: subscription.id,
    },
  })

  console.log(`[Lemon Squeezy] Subscription marked as cancelled: ${userId}`)
}
