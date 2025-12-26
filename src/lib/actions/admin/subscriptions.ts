'use server'

import { createSafeActionClient } from 'next-safe-action'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client'

const actionClient = createSafeActionClient()

/**
 * Check if current user is admin
 */
async function requireAdmin() {
  const session = await requireAuth()

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (user?.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required')
  }

  return session
}

/**
 * Update user subscription (create or update)
 */
export const updateUserSubscriptionAction = actionClient
  .schema(
    z.object({
      userId: z.string(),
      plan: z.enum(['FREE', 'PRO_DIGITAL', 'PACK_STARTER', 'CORPORATE']),
      status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED']),
      expiresAt: z.date().optional().nullable(),
      paymentMethod: z.enum(['CINETPAY', 'LEMONSQUEEZY', 'MANUAL']).optional().nullable(),
    })
  )
  .action(async ({ parsedInput }) => {
    await requireAdmin()

    const { userId, plan, status, expiresAt, paymentMethod } = parsedInput

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!userExists) {
      throw new Error('User not found')
    }

    // Upsert subscription
    const subscription = await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: plan as SubscriptionPlan,
        status: status as SubscriptionStatus,
        expiresAt: expiresAt || null,
        paymentMethod: paymentMethod || 'MANUAL',
      },
      update: {
        plan: plan as SubscriptionPlan,
        status: status as SubscriptionStatus,
        expiresAt: expiresAt || null,
        paymentMethod: paymentMethod || 'MANUAL',
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
    })

    revalidatePath('/admin/subscriptions')
    revalidatePath('/dashboard')

    return {
      success: true,
      subscription,
      message: `Subscription updated for ${subscription.user.name || subscription.user.email}`,
    }
  })

/**
 * Cancel user subscription
 */
export const cancelSubscriptionAction = actionClient
  .schema(
    z.object({
      userId: z.string(),
    })
  )
  .action(async ({ parsedInput }) => {
    await requireAdmin()

    const subscription = await prisma.subscription.findUnique({
      where: { userId: parsedInput.userId },
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
    })

    if (!subscription) {
      throw new Error('Subscription not found')
    }

    await prisma.subscription.update({
      where: { userId: parsedInput.userId },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    })

    revalidatePath('/admin/subscriptions')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: `Subscription cancelled for ${subscription.user.name || subscription.user.email}`,
    }
  })

/**
 * Activate user subscription
 */
export const activateSubscriptionAction = actionClient
  .schema(
    z.object({
      userId: z.string(),
    })
  )
  .action(async ({ parsedInput }) => {
    await requireAdmin()

    const subscription = await prisma.subscription.findUnique({
      where: { userId: parsedInput.userId },
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
    })

    if (!subscription) {
      throw new Error('Subscription not found')
    }

    await prisma.subscription.update({
      where: { userId: parsedInput.userId },
      data: {
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    })

    revalidatePath('/admin/subscriptions')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: `Subscription activated for ${subscription.user.name || subscription.user.email}`,
    }
  })

/**
 * Get all users with their subscriptions (for admin dashboard)
 */
export async function getAllUsersWithSubscriptions() {
  await requireAdmin()

  const users = await prisma.user.findMany({
    include: {
      subscription: true,
      profiles: {
        select: {
          id: true,
          fullName: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return users
}

/**
 * Get subscription statistics
 */
export async function getSubscriptionStats() {
  await requireAdmin()

  const [totalUsers, freeUsers, proUsers, starterUsers, corporateUsers] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { plan: 'FREE' } }),
    prisma.subscription.count({ where: { plan: 'PRO_DIGITAL' } }),
    prisma.subscription.count({ where: { plan: 'PACK_STARTER' } }),
    prisma.subscription.count({ where: { plan: 'CORPORATE' } }),
  ])

  // Users without subscription are FREE
  const usersWithoutSubscription = totalUsers - (freeUsers + proUsers + starterUsers + corporateUsers)
  const actualFreeUsers = freeUsers + usersWithoutSubscription

  return {
    totalUsers,
    freeUsers: actualFreeUsers,
    proUsers,
    starterUsers,
    corporateUsers,
    paidUsers: proUsers + starterUsers + corporateUsers,
    conversionRate:
      totalUsers > 0 ? ((proUsers + starterUsers + corporateUsers) / totalUsers) * 100 : 0,
  }
}
