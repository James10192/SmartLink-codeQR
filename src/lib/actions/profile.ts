'use server'

import { createSafeActionClient } from 'next-safe-action'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { auth } from '@/lib/auth/config'
import { ProfileSchema, ProfileUpdateSchema } from '@/lib/validations/profile'
import { revalidatePath } from 'next/cache'
import { getGeoIPData, hashIP, hashUserAgent, getClientIP } from '@/lib/utils/geoip'
import { headers } from 'next/headers'
import { generateProfileSlug } from '@/lib/utils/slug'
import { getEffectivePlan, getDegradedProfileData } from '@/lib/utils/tier-enforcement'

const PROFILE_LIMITS = {
  FREE: 1,
  PRO_DIGITAL: 3,
  PACK_STARTER: 3,
  CORPORATE: Infinity,
} as const

const actionClient = createSafeActionClient()

/**
 * Generates a unique slug for a new profile
 *
 * New format: "firstname-lastname-xxxxx" (e.g., "marcel-djedje-x7k2m")
 * Uses random suffix to ensure uniqueness while keeping URL short
 *
 * @param fullName - User's full name
 * @returns Unique profile slug
 */
async function generateUniqueSlug(fullName: string): Promise<string> {
  let slug = generateProfileSlug(fullName)
  let attempts = 0
  const MAX_ATTEMPTS = 10

  // Ensure uniqueness (collision handling)
  while (attempts < MAX_ATTEMPTS) {
    const existing = await prisma.profile.findUnique({ where: { slug } })

    if (!existing) break

    // Generate new slug with different random suffix
    slug = generateProfileSlug(fullName)
    attempts++
  }

  if (attempts >= MAX_ATTEMPTS) {
    throw new Error('Impossible de générer un slug unique, veuillez réessayer')
  }

  return slug
}

async function canCreateProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profiles: true, subscription: true },
  })

  if (!user) throw new Error('User not found')

  const plan = user.subscription?.plan || 'FREE'
  const currentCount = user.profiles.length
  const limit = PROFILE_LIMITS[plan]

  return {
    allowed: currentCount < limit,
    currentCount,
    limit,
    plan,
  }
}

export const createProfileAction = actionClient
  .schema(ProfileSchema)
  .action(async ({ parsedInput }) => {
    const session = await requireAuth()

    const { allowed, currentCount, limit, plan } = await canCreateProfile(session.user.id)

    if (!allowed) {
      throw new Error(
        `Limite de profils atteinte pour le plan ${plan} (${currentCount}/${limit})`
      )
    }

    const slug = await generateUniqueSlug(parsedInput.fullName)

    const profile = await prisma.profile.create({
      data: {
        ...parsedInput,
        slug,
        userId: session.user.id,
      },
    })

    revalidatePath('/dashboard')

    return { success: true, profile, message: 'Profil créé avec succès' }
  })

export const updateProfileAction = actionClient
  .schema(
    z.object({
      profileId: z.string(),
      data: ProfileUpdateSchema,
    })
  )
  .action(async ({ parsedInput }) => {
    const session = await requireAuth()

    const existingProfile = await prisma.profile.findFirst({
      where: { id: parsedInput.profileId, userId: session.user.id },
    })

    if (!existingProfile) {
      throw new Error('Profil non trouvé')
    }

    let slug = existingProfile.slug
    if (parsedInput.data.fullName && parsedInput.data.fullName !== existingProfile.fullName) {
      slug = await generateUniqueSlug(parsedInput.data.fullName)
    }

    const profile = await prisma.profile.update({
      where: { id: parsedInput.profileId },
      data: { ...parsedInput.data, slug },
    })

    revalidatePath('/dashboard')
    revalidatePath(`/u/${existingProfile.slug}`)

    return { success: true, profile, message: 'Profil mis à jour' }
  })

export const deleteProfileAction = actionClient
  .schema(z.object({ profileId: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await requireAuth()

    const profile = await prisma.profile.findFirst({
      where: { id: parsedInput.profileId, userId: session.user.id },
    })

    if (!profile) throw new Error('Profil non trouvé')

    await prisma.profile.delete({ where: { id: parsedInput.profileId } })

    revalidatePath('/dashboard')

    return { success: true, message: 'Profil supprimé' }
  })

export async function getUserProfiles() {
  const session = await requireAuth()
  return await prisma.profile.findMany({
    where: { userId: session.user.id },
    include: {
      user: {
        include: {
          subscription: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProfileById(profileId: string) {
  const session = await requireAuth()
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: session.user.id },
    include: {
      user: {
        include: {
          subscription: true,
        },
      },
      experiences: {
        orderBy: {
          startDate: 'desc',
        },
      },
      skills: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      projects: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      testimonials: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      posts: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })
  if (!profile) throw new Error('Profil non trouvé')
  return profile
}

export async function getPublicProfile(slug: string) {
  const profile = await prisma.profile.findUnique({
    where: { slug, isPublic: true },
    select: {
      id: true,
      slug: true,
      fullName: true,
      jobTitle: true,
      company: true,
      phoneNumber: true,
      email: true,
      website: true,
      address: true,
      avatarUrl: true,
      coverImageUrl: true,
      cvFileUrl: true,
      videoUrl: true,
      linkedinUrl: true,
      twitterUrl: true,
      facebookUrl: true,
      whatsappNumber: true,
      bio: true,
      showCV: true,
      viewsCount: true,
      cvDownloads: true,
      contactSaves: true,
      userId: true,
      // Include user subscription for plan badge and expiration check
      user: {
        select: {
          subscription: {
            select: {
              plan: true,
              status: true,
              expiresAt: true,
            },
          },
        },
      },
      // Include all enrichment data
      experiences: {
        orderBy: { startDate: 'desc' },
        where: { OR: [{ isCurrent: true }, { endDate: { not: null } }] },
      },
      skills: {
        orderBy: { order: 'asc' },
      },
      projects: {
        orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }],
      },
      testimonials: {
        where: { isPublished: true },
        orderBy: { order: 'asc' },
      },
      posts: {
        where: { isPublished: true },
        orderBy: { publishedAt: 'desc' },
        take: 5, // Only show latest 5 posts
      },
    },
  })

  if (profile) {
    // Check if visitor is the profile owner
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    const isOwner = session?.user?.id === profile.userId

    // Only increment view count for external visitors (not the owner)
    if (!isOwner) {
      await prisma.profile.update({
        where: { id: profile.id },
        data: { viewsCount: { increment: 1 } },
      })
    }

    // Track visitor (PRO+ feature - anonymous)
    // Pass userId to prevent owner from being tracked as visitor
    await trackProfileVisit(profile.id, profile.userId)

    // Apply profile degradation if subscription expired
    const effectivePlan = getEffectivePlan(profile.user.subscription)
    const degradation = getDegradedProfileData(profile.user.subscription)

    // Remove PRO features if subscription expired
    if (degradation.hideVideo) {
      profile.videoUrl = null
    }

    // Limit visible PRO features based on effective plan
    // Note: Projects, testimonials, and posts are PRO-only features
    // They will still be returned but frontend should check effective plan
    return {
      ...profile,
      effectivePlan, // Add effective plan for frontend display
      degradation, // Add degradation flags for conditional rendering
    }
  }

  return profile
}

/**
 * Track anonymous profile visitor
 * RGPD-compliant: stores only city/country, hashed IP
 * Deduplicates visitors within 24 hours
 * Prevents profile owner from being tracked as visitor
 *
 * @param profileId - The profile ID being visited
 * @param profileOwnerId - The user ID of the profile owner
 */
export async function trackProfileVisit(profileId: string, profileOwnerId: string) {
  try {
    // Check if user is authenticated
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    // If visitor is the profile owner, don't track
    if (session?.user?.id === profileOwnerId) {
      return
    }

    const headersList = await headers()
    const ip = getClientIP(headersList)
    const userAgent = headersList.get('user-agent') || ''
    const referrer = headersList.get('referer') || null

    // Hash IP and User-Agent for privacy (RGPD compliance)
    const ipHash = await hashIP(ip)
    const userAgentHash = await hashUserAgent(userAgent)

    // Check if visitor already exists within last 24 hours (deduplication)
    const existingVisit = await prisma.profileVisitor.findFirst({
      where: {
        profileId,
        ipHash,
        visitedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    })

    if (existingVisit) {
      // Already tracked this visitor today, skip
      return
    }

    // Get geographic location from IP (anonymous)
    const geoData = await getGeoIPData(ip)

    // Create visitor record
    await prisma.profileVisitor.create({
      data: {
        profileId,
        city: geoData.city,
        country: geoData.country,
        countryCode: geoData.countryCode,
        region: geoData.region,
        ipHash,
        userAgentHash,
        referrer,
      },
    })

    // Increment unique visitors count (Option B: visitors uniques)
    await prisma.profile.update({
      where: { id: profileId },
      data: { uniqueVisitors: { increment: 1 } },
    })
  } catch (error) {
    // Silent fail - don't break page load if tracking fails
    console.error('Visitor tracking error:', error)
  }
}
