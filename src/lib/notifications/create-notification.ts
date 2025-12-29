import { prisma } from '@/lib/db/prisma'
import { SubscriptionPlan, NotificationType } from '@prisma/client'

interface VisitorData {
  city?: string | null
  country?: string | null
  visitorName?: string | null
}

interface NotificationContent {
  title: string
  description: string
  actionUrl: string
}

/**
 * Get notification content based on type, visitor data, and user plan
 * FREE users get generic messages with upgrade CTA
 * PRO users get detailed location information
 */
function getNotificationContent(
  type: NotificationType,
  visitorData: VisitorData,
  plan: SubscriptionPlan
): NotificationContent {
  const isFree = plan === 'FREE'

  switch (type) {
    case 'PROFILE_VIEW': {
      if (isFree) {
        return {
          title: 'Activité sur votre profil',
          description: 'Un visiteur a consulté votre profil. Passez à PRO pour voir les détails.',
          actionUrl: '/dashboard/upgrade'
        }
      } else {
        const location = visitorData.city && visitorData.country
          ? `${visitorData.city}, ${visitorData.country}`
          : visitorData.country || 'Localisation inconnue'

        return {
          title: 'Nouveau visiteur',
          description: `Un visiteur de ${location} a consulté votre profil`,
          actionUrl: '/dashboard/analytics'
        }
      }
    }

    case 'CV_DOWNLOAD': {
      if (isFree) {
        return {
          title: 'CV téléchargé',
          description: 'Quelqu\'un a téléchargé votre CV. Passez à PRO pour en savoir plus.',
          actionUrl: '/dashboard/upgrade'
        }
      } else {
        const location = visitorData.city && visitorData.country
          ? `${visitorData.city}, ${visitorData.country}`
          : visitorData.country || 'Localisation inconnue'

        return {
          title: 'CV téléchargé',
          description: `Un visiteur de ${location} a téléchargé votre CV`,
          actionUrl: '/dashboard/analytics'
        }
      }
    }

    case 'CONTACT_SAVE': {
      if (isFree) {
        return {
          title: 'Contact enregistré',
          description: 'Quelqu\'un a enregistré votre contact. Passez à PRO pour voir qui.',
          actionUrl: '/dashboard/upgrade'
        }
      } else {
        const location = visitorData.city && visitorData.country
          ? `${visitorData.city}, ${visitorData.country}`
          : visitorData.country || 'Localisation inconnue'

        const name = visitorData.visitorName
          ? `${visitorData.visitorName} (${location})`
          : `Un visiteur de ${location}`

        return {
          title: 'Contact enregistré',
          description: `${name} a enregistré votre contact`,
          actionUrl: '/dashboard/analytics'
        }
      }
    }

    case 'SUBSCRIPTION_LIMIT': {
      return {
        title: 'Limite de profils atteinte',
        description: 'Vous avez atteint la limite de profils pour votre plan. Passez à PRO pour créer plus de profils.',
        actionUrl: '/dashboard/upgrade'
      }
    }

    default:
      return {
        title: 'Nouvelle notification',
        description: 'Vous avez une nouvelle notification',
        actionUrl: '/dashboard'
      }
  }
}

/**
 * Check if a notification already exists for this type/profile in the last 24 hours
 * Returns the existing notification if found
 */
async function findRecentNotification(
  userId: string,
  profileId: string | null,
  type: NotificationType
): Promise<{ id: string; metadata: any } | null> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  return await prisma.notification.findFirst({
    where: {
      userId,
      profileId,
      type,
      createdAt: {
        gte: twentyFourHoursAgo
      }
    },
    select: {
      id: true,
      metadata: true
    }
  })
}

/**
 * Aggregate existing notification by incrementing count in metadata
 */
async function aggregateNotification(
  notificationId: string,
  currentMetadata: any
): Promise<void> {
  const count = (currentMetadata?.count || 1) + 1

  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      metadata: {
        ...currentMetadata,
        count
      },
      // Update timestamp to show as recent
      updatedAt: new Date()
    }
  })
}

/**
 * Create a new notification for profile view event
 * Implements 24h deduplication - aggregates if notification already exists
 */
export async function createProfileViewNotification(
  userId: string,
  profileId: string,
  visitorData: VisitorData,
  userPlan: SubscriptionPlan
): Promise<void> {
  try {
    // Check for existing notification in last 24h
    const existingNotif = await findRecentNotification(userId, profileId, 'PROFILE_VIEW')

    if (existingNotif) {
      // Aggregate instead of creating new
      await aggregateNotification(existingNotif.id, existingNotif.metadata)
      return
    }

    // Create new notification
    const content = getNotificationContent('PROFILE_VIEW', visitorData, userPlan)

    await prisma.notification.create({
      data: {
        userId,
        profileId,
        type: 'PROFILE_VIEW',
        title: content.title,
        description: content.description,
        actionUrl: content.actionUrl,
        metadata: {
          city: visitorData.city,
          country: visitorData.country,
          count: 1
        },
        isRead: false
      }
    })
  } catch (error) {
    // Silent fail - don't break the user flow if notification creation fails
    console.error('[Notification] Failed to create PROFILE_VIEW notification:', error)
  }
}

/**
 * Create a new notification for CV download event
 */
export async function createCVDownloadNotification(
  userId: string,
  profileId: string,
  userPlan: SubscriptionPlan,
  visitorData: VisitorData = {}
): Promise<void> {
  try {
    // Check for existing notification in last 24h
    const existingNotif = await findRecentNotification(userId, profileId, 'CV_DOWNLOAD')

    if (existingNotif) {
      await aggregateNotification(existingNotif.id, existingNotif.metadata)
      return
    }

    const content = getNotificationContent('CV_DOWNLOAD', visitorData, userPlan)

    await prisma.notification.create({
      data: {
        userId,
        profileId,
        type: 'CV_DOWNLOAD',
        title: content.title,
        description: content.description,
        actionUrl: content.actionUrl,
        metadata: {
          city: visitorData.city,
          country: visitorData.country,
          count: 1
        },
        isRead: false
      }
    })
  } catch (error) {
    console.error('[Notification] Failed to create CV_DOWNLOAD notification:', error)
  }
}

/**
 * Create a new notification for contact save (vCard download) event
 */
export async function createContactSaveNotification(
  userId: string,
  profileId: string,
  userPlan: SubscriptionPlan,
  visitorData: VisitorData = {}
): Promise<void> {
  try {
    // Check for existing notification in last 24h
    const existingNotif = await findRecentNotification(userId, profileId, 'CONTACT_SAVE')

    if (existingNotif) {
      await aggregateNotification(existingNotif.id, existingNotif.metadata)
      return
    }

    const content = getNotificationContent('CONTACT_SAVE', visitorData, userPlan)

    await prisma.notification.create({
      data: {
        userId,
        profileId,
        type: 'CONTACT_SAVE',
        title: content.title,
        description: content.description,
        actionUrl: content.actionUrl,
        metadata: {
          city: visitorData.city,
          country: visitorData.country,
          visitorName: visitorData.visitorName,
          count: 1
        },
        isRead: false
      }
    })
  } catch (error) {
    console.error('[Notification] Failed to create CONTACT_SAVE notification:', error)
  }
}

/**
 * Create notification for subscription limit reached
 */
export async function createSubscriptionLimitNotification(
  userId: string
): Promise<void> {
  try {
    // Check if similar notification exists in last 7 days (longer dedup for this type)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const existingNotif = await prisma.notification.findFirst({
      where: {
        userId,
        type: 'SUBSCRIPTION_LIMIT',
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    })

    if (existingNotif) {
      // Don't spam with subscription limit warnings
      return
    }

    const content = getNotificationContent('SUBSCRIPTION_LIMIT', {}, 'FREE')

    await prisma.notification.create({
      data: {
        userId,
        type: 'SUBSCRIPTION_LIMIT',
        title: content.title,
        description: content.description,
        actionUrl: content.actionUrl,
        metadata: {},
        isRead: false
      }
    })
  } catch (error) {
    console.error('[Notification] Failed to create SUBSCRIPTION_LIMIT notification:', error)
  }
}
