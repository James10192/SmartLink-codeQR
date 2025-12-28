/**
 * QR Link Management Actions
 *
 * Server Actions for creating, managing, and tracking dynamic QR codes
 * Uses next-safe-action for type-safe mutations
 */

'use server'

import { createSafeActionClient } from 'next-safe-action'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { generateQrShortCode } from '@/lib/utils/slug'
import {
  canDownloadQr,
  canReactivateQrLinks,
  isSubscriptionActive,
  GRACE_PERIOD_DAYS,
} from '@/lib/utils/tier-enforcement'
import { revalidatePath } from 'next/cache'

const actionClient = createSafeActionClient()

/**
 * Generates a new QR link for a profile
 *
 * Creates a unique short code and stores it in the database
 * Requires PRO+ subscription to generate downloadable QR codes
 *
 * @param profileId - The profile to generate QR link for
 * @returns QrLink object with shortCode
 *
 * @throws Error if user doesn't own profile or lacks subscription
 */
export const generateQrLinkAction = actionClient
  .schema(z.object({ profileId: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await requireAuth()

    // Verify profile ownership
    const profile = await prisma.profile.findFirst({
      where: {
        id: parsedInput.profileId,
        userId: session.user.id,
      },
      include: {
        user: {
          include: {
            subscription: true,
          },
        },
      },
    })

    if (!profile) {
      throw new Error('Profil non trouvé')
    }

    // Check if user can download QR (PRO+ only)
    if (!canDownloadQr(profile.user.subscription)) {
      throw new Error('Passez au plan PRO pour générer des QR codes téléchargeables')
    }

    // Generate unique short code
    let shortCode = generateQrShortCode()
    let attempts = 0
    const MAX_ATTEMPTS = 10

    // Ensure uniqueness (collision handling)
    while (attempts < MAX_ATTEMPTS) {
      const existing = await prisma.qrLink.findUnique({
        where: { shortCode },
      })

      if (!existing) break

      shortCode = generateQrShortCode()
      attempts++
    }

    if (attempts >= MAX_ATTEMPTS) {
      throw new Error('Impossible de générer un code unique, veuillez réessayer')
    }

    // Create QR link
    const qrLink = await prisma.qrLink.create({
      data: {
        shortCode,
        profileId: parsedInput.profileId,
        isActive: true,
      },
    })

    revalidatePath('/dashboard')
    revalidatePath(`/u/${profile.slug}`)

    return {
      success: true,
      qrLink,
      message: 'QR code généré avec succès',
    }
  })

/**
 * Deactivates all QR links for a profile
 *
 * Called when subscription expires
 * Sets isActive=false and records deactivatedAt timestamp
 *
 * @param profileId - The profile whose QR links to deactivate
 */
export async function deactivateProfileQrLinks(profileId: string): Promise<void> {
  await prisma.qrLink.updateMany({
    where: {
      profileId,
      isActive: true,
    },
    data: {
      isActive: false,
      deactivatedAt: new Date(),
    },
  })

  // Revalidate profile page
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { slug: true },
  })

  if (profile) {
    revalidatePath(`/u/${profile.slug}`)
  }
}

/**
 * Reactivates QR links for a profile after subscription renewal
 *
 * Only reactivates links deactivated within GRACE_PERIOD_DAYS (30 days)
 * Clears deactivatedAt timestamp
 *
 * @param profileId - The profile whose QR links to reactivate
 * @returns Number of QR links reactivated
 */
export async function reactivateProfileQrLinks(profileId: string): Promise<number> {
  // Get profile with subscription
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: {
      user: {
        include: {
          subscription: true,
        },
      },
    },
  })

  if (!profile) {
    throw new Error('Profil non trouvé')
  }

  // Verify subscription is active
  if (!isSubscriptionActive(profile.user.subscription)) {
    throw new Error('Abonnement inactif')
  }

  // Calculate grace period cutoff date
  const gracePeriodCutoff = new Date()
  gracePeriodCutoff.setDate(gracePeriodCutoff.getDate() - GRACE_PERIOD_DAYS)

  // Reactivate QR links deactivated within grace period
  const result = await prisma.qrLink.updateMany({
    where: {
      profileId,
      isActive: false,
      deactivatedAt: {
        gte: gracePeriodCutoff, // Within last 30 days
      },
    },
    data: {
      isActive: true,
      deactivatedAt: null,
    },
  })

  // Revalidate profile page
  revalidatePath(`/u/${profile.slug}`)
  revalidatePath('/dashboard')

  return result.count
}

/**
 * Gets an active QR link by short code
 *
 * Increments scan count and updates lastScannedAt
 * Returns null if QR link is inactive or doesn't exist
 *
 * @param shortCode - The QR short code (8 chars)
 * @returns QrLink with profile data, or null if not found/inactive
 */
export async function getActiveQrLink(shortCode: string) {
  const qrLink = await prisma.qrLink.findUnique({
    where: { shortCode },
    include: {
      profile: {
        include: {
          user: {
            include: {
              subscription: true,
            },
          },
        },
      },
    },
  })

  // QR link not found
  if (!qrLink) return null

  // QR link deactivated (subscription expired)
  if (!qrLink.isActive) {
    // Check if can be reactivated
    const canReactivate = canReactivateQrLinks(
      qrLink.profile.user.subscription,
      qrLink.deactivatedAt
    )

    // If within grace period and subscription renewed, auto-reactivate
    if (canReactivate) {
      await prisma.qrLink.update({
        where: { id: qrLink.id },
        data: {
          isActive: true,
          deactivatedAt: null,
        },
      })

      // Return reactivated link
      const reactivatedLink = await prisma.qrLink.findUnique({
        where: { shortCode },
        include: {
          profile: {
            include: {
              user: {
                include: {
                  subscription: true,
                },
              },
            },
          },
        },
      })

      return reactivatedLink
    }

    // Outside grace period or subscription still inactive
    return null
  }

  // Update analytics (increment scan count)
  await prisma.qrLink.update({
    where: { id: qrLink.id },
    data: {
      scanCount: { increment: 1 },
      lastScannedAt: new Date(),
    },
  })

  return qrLink
}

/**
 * Gets or creates the primary QR link for a profile
 *
 * Reuses existing active QR link if available, otherwise creates new one
 * This prevents users from creating multiple QR codes for the same profile
 *
 * @param profileId - The profile ID
 * @returns QrLink object with shortCode
 *
 * @throws Error if user doesn't own profile or lacks subscription
 */
export const getOrCreatePrimaryQrLinkAction = actionClient
  .schema(z.object({ profileId: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await requireAuth()

    // Verify profile ownership
    const profile = await prisma.profile.findFirst({
      where: {
        id: parsedInput.profileId,
        userId: session.user.id,
      },
      include: {
        user: {
          include: {
            subscription: true,
          },
        },
        qrLinks: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!profile) {
      throw new Error('Profil non trouvé')
    }

    // Check if user can download QR (PRO+ only)
    if (!canDownloadQr(profile.user.subscription)) {
      throw new Error('Passez au plan PRO pour générer des QR codes téléchargeables')
    }

    // Return existing active QR link if available
    if (profile.qrLinks.length > 0) {
      return {
        success: true,
        qrLink: profile.qrLinks[0],
        message: 'QR code existant récupéré',
      }
    }

    // Create new QR link
    const result = await generateQrLinkAction({ profileId: parsedInput.profileId })

    return result.data || { success: false, message: 'Erreur lors de la génération du QR code' }
  })

/**
 * Gets all QR links for a profile (for analytics dashboard)
 *
 * @param profileId - The profile ID
 * @returns Array of QR links with scan statistics
 */
export async function getProfileQrLinks(profileId: string) {
  const session = await requireAuth()

  // Verify profile ownership
  const profile = await prisma.profile.findFirst({
    where: {
      id: profileId,
      userId: session.user.id,
    },
  })

  if (!profile) {
    throw new Error('Profil non trouvé')
  }

  const qrLinks = await prisma.qrLink.findMany({
    where: { profileId },
    orderBy: { createdAt: 'desc' },
  })

  return qrLinks
}

/**
 * Deletes a QR link
 *
 * Permanently removes a QR link from the database
 * Use with caution - printed QR codes will stop working
 *
 * @param qrLinkId - The QR link ID to delete
 */
export const deleteQrLinkAction = actionClient
  .schema(z.object({ qrLinkId: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await requireAuth()

    // Verify ownership
    const qrLink = await prisma.qrLink.findUnique({
      where: { id: parsedInput.qrLinkId },
      include: {
        profile: true,
      },
    })

    if (!qrLink || qrLink.profile.userId !== session.user.id) {
      throw new Error('QR link non trouvé')
    }

    await prisma.qrLink.delete({
      where: { id: parsedInput.qrLinkId },
    })

    revalidatePath('/dashboard')
    revalidatePath(`/u/${qrLink.profile.slug}`)

    return {
      success: true,
      message: 'QR code supprimé',
    }
  })
