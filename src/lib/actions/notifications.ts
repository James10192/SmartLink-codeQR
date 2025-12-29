'use server'

import { createSafeActionClient } from 'next-safe-action'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'

const actionClient = createSafeActionClient()

/**
 * Fetch user notifications with pagination and filtering
 * Returns notifications and unread count
 */
export const getUserNotifications = actionClient
  .schema(z.object({
    limit: z.number().default(10),
    offset: z.number().default(0),
    unreadOnly: z.boolean().default(false),
  }))
  .action(async ({ parsedInput }) => {
    const session = await requireAuth()

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        ...(parsedInput.unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: parsedInput.limit,
      skip: parsedInput.offset,
      include: {
        profile: {
          select: { slug: true, label: true }
        }
      }
    })

    const unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, isRead: false }
    })

    return { notifications, unreadCount }
  })

/**
 * Mark a single notification as read
 * Security: only allows marking own notifications
 */
export const markNotificationRead = actionClient
  .schema(z.object({ notificationId: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await requireAuth()

    await prisma.notification.update({
      where: {
        id: parsedInput.notificationId,
        userId: session.user.id, // Security: own notifications only
      },
      data: { isRead: true }
    })

    return { success: true }
  })

/**
 * Mark all user notifications as read
 */
export const markAllNotificationsRead = actionClient
  .action(async () => {
    const session = await requireAuth()

    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true }
    })

    return { success: true }
  })

/**
 * Delete a notification
 * Security: only allows deleting own notifications
 */
export const deleteNotification = actionClient
  .schema(z.object({ notificationId: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await requireAuth()

    await prisma.notification.delete({
      where: {
        id: parsedInput.notificationId,
        userId: session.user.id, // Security: own notifications only
      }
    })

    return { success: true }
  })

/**
 * Get unread notification count (lightweight query for badges)
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const session = await requireAuth()

  const count = await prisma.notification.count({
    where: {
      userId: session.user.id,
      isRead: false
    }
  })

  return count
}
