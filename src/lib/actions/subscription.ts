/**
 * Subscription Lifecycle Hooks
 *
 * Handles subscription status changes and their side effects:
 * - QR link activation/deactivation
 * - Profile feature degradation
 * - Analytics tracking
 */

'use server'

import { prisma } from '@/lib/db/prisma'
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client'
import { deactivateProfileQrLinks, reactivateProfileQrLinks } from './qr-link'
import { revalidatePath } from 'next/cache'

/**
 * Called when a user's subscription expires
 *
 * Side effects:
 * 1. Updates subscription status to EXPIRED
 * 2. Deactivates all QR links for user's profiles
 * 3. Profile features are degraded to FREE tier (handled by getEffectivePlan)
 *
 * @param userId - The user whose subscription expired
 */
export async function onSubscriptionExpired(userId: string): Promise<void> {
  console.log(`[Subscription Lifecycle] Expiration for user ${userId}`)

  // Update subscription status
  await prisma.subscription.updateMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    data: {
      status: 'EXPIRED',
    },
  })

  // Get all user profiles
  const profiles = await prisma.profile.findMany({
    where: { userId },
    select: { id: true, slug: true },
  })

  // Deactivate QR links for each profile
  for (const profile of profiles) {
    await deactivateProfileQrLinks(profile.id)
    revalidatePath(`/u/${profile.slug}`)
  }

  // Revalidate dashboard
  revalidatePath('/dashboard')

  console.log(
    `[Subscription Lifecycle] Expired: Deactivated QR links for ${profiles.length} profiles`
  )
}

/**
 * Called when a user renews their subscription
 *
 * Side effects:
 * 1. Updates subscription status to ACTIVE
 * 2. Updates expiresAt date
 * 3. Reactivates QR links deactivated within grace period (30 days)
 *
 * @param userId - The user who renewed
 * @param newExpiresAt - New expiration date
 * @returns Number of QR links reactivated
 */
export async function onSubscriptionRenewed(
  userId: string,
  newExpiresAt: Date
): Promise<number> {
  console.log(`[Subscription Lifecycle] Renewal for user ${userId}`)

  // Update subscription
  await prisma.subscription.updateMany({
    where: { userId },
    data: {
      status: 'ACTIVE',
      expiresAt: newExpiresAt,
    },
  })

  // Get all user profiles
  const profiles = await prisma.profile.findMany({
    where: { userId },
    select: { id: true, slug: true },
  })

  // Reactivate QR links for each profile (within grace period)
  let totalReactivated = 0

  for (const profile of profiles) {
    const count = await reactivateProfileQrLinks(profile.id)
    totalReactivated += count
    revalidatePath(`/u/${profile.slug}`)
  }

  // Revalidate dashboard
  revalidatePath('/dashboard')

  console.log(
    `[Subscription Lifecycle] Renewed: Reactivated ${totalReactivated} QR links for ${profiles.length} profiles`
  )

  return totalReactivated
}

/**
 * Called when a user upgrades their subscription plan
 *
 * Side effects:
 * 1. Updates subscription plan and status
 * 2. Updates expiresAt date
 * 3. Reactivates QR links if upgrading from FREE
 * 4. Grants access to new features immediately
 *
 * @param userId - The user who upgraded
 * @param newPlan - New subscription plan
 * @param newExpiresAt - New expiration date
 * @returns Updated subscription object
 */
export async function onSubscriptionUpgraded(
  userId: string,
  newPlan: SubscriptionPlan,
  newExpiresAt: Date
): Promise<void> {
  console.log(`[Subscription Lifecycle] Upgrade for user ${userId} to ${newPlan}`)

  // Get current subscription
  const currentSubscription = await prisma.subscription.findUnique({
    where: { userId },
  })

  // Update subscription
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan: newPlan,
      status: 'ACTIVE',
      expiresAt: newExpiresAt,
    },
    update: {
      plan: newPlan,
      status: 'ACTIVE',
      expiresAt: newExpiresAt,
    },
  })

  // If upgrading from FREE, reactivate QR links
  if (!currentSubscription || currentSubscription.plan === 'FREE') {
    const profiles = await prisma.profile.findMany({
      where: { userId },
      select: { id: true, slug: true },
    })

    let totalReactivated = 0

    for (const profile of profiles) {
      const count = await reactivateProfileQrLinks(profile.id)
      totalReactivated += count
      revalidatePath(`/u/${profile.slug}`)
    }

    console.log(`[Subscription Lifecycle] Upgraded: Reactivated ${totalReactivated} QR links`)
  }

  // Revalidate dashboard
  revalidatePath('/dashboard')

  console.log(`[Subscription Lifecycle] Upgrade complete: ${newPlan}`)
}

/**
 * Called when a user downgrades their subscription plan
 *
 * Side effects:
 * 1. Updates subscription plan
 * 2. May deactivate QR links if downgrading to FREE
 * 3. Features are degraded according to new plan
 *
 * @param userId - The user who downgraded
 * @param newPlan - New subscription plan
 * @param newExpiresAt - New expiration date
 */
export async function onSubscriptionDowngraded(
  userId: string,
  newPlan: SubscriptionPlan,
  newExpiresAt: Date | null
): Promise<void> {
  console.log(`[Subscription Lifecycle] Downgrade for user ${userId} to ${newPlan}`)

  // Update subscription
  await prisma.subscription.updateMany({
    where: { userId },
    data: {
      plan: newPlan,
      expiresAt: newExpiresAt,
    },
  })

  // If downgrading to FREE, deactivate QR links
  if (newPlan === 'FREE') {
    const profiles = await prisma.profile.findMany({
      where: { userId },
      select: { id: true, slug: true },
    })

    for (const profile of profiles) {
      await deactivateProfileQrLinks(profile.id)
      revalidatePath(`/u/${profile.slug}`)
    }

    console.log(
      `[Subscription Lifecycle] Downgraded to FREE: Deactivated QR links for ${profiles.length} profiles`
    )
  }

  // Revalidate dashboard
  revalidatePath('/dashboard')
}

/**
 * Called when a user cancels their subscription
 *
 * Side effects:
 * 1. Updates subscription status to CANCELLED
 * 2. Subscription remains active until expiresAt
 * 3. No auto-renewal
 *
 * @param userId - The user who cancelled
 */
export async function onSubscriptionCancelled(userId: string): Promise<void> {
  console.log(`[Subscription Lifecycle] Cancellation for user ${userId}`)

  await prisma.subscription.updateMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    data: {
      status: 'CANCELLED',
      // expiresAt remains unchanged - subscription active until then
    },
  })

  // Revalidate dashboard to show cancellation notice
  revalidatePath('/dashboard')

  console.log(`[Subscription Lifecycle] Cancelled: Will expire at expiresAt`)
}

/**
 * Background job to check for expired subscriptions
 *
 * Should be called daily via cron job or Vercel Cron
 * Finds all ACTIVE subscriptions past their expiresAt date
 *
 * @returns Number of subscriptions expired
 */
export async function checkExpiredSubscriptions(): Promise<number> {
  console.log('[Subscription Lifecycle] Checking for expired subscriptions...')

  const now = new Date()

  // Find all ACTIVE subscriptions that have expired
  const expiredSubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      expiresAt: {
        lte: now, // Expiration date in the past
      },
    },
    select: {
      userId: true,
    },
  })

  // Process each expired subscription
  for (const subscription of expiredSubscriptions) {
    await onSubscriptionExpired(subscription.userId)
  }

  console.log(
    `[Subscription Lifecycle] Expired ${expiredSubscriptions.length} subscriptions`
  )

  return expiredSubscriptions.length
}

/**
 * Updates subscription payment information after successful payment
 *
 * Called from CinetPay/Lemon Squeezy webhooks
 *
 * @param userId - The user who made payment
 * @param paymentId - External payment transaction ID
 * @param paymentMethod - Payment method used
 */
export async function updateSubscriptionPayment(
  userId: string,
  paymentId: string,
  paymentMethod: 'CINETPAY' | 'LEMONSQUEEZY' | 'MANUAL'
): Promise<void> {
  await prisma.subscription.updateMany({
    where: { userId },
    data: {
      paymentId,
      paymentMethod,
    },
  })

  console.log(`[Subscription Lifecycle] Updated payment info: ${paymentMethod} - ${paymentId}`)
}
