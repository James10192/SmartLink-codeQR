'use server'

import { createSafeActionClient } from 'next-safe-action'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { ProfileSchema, ProfileUpdateSchema } from '@/lib/validations/profile'
import { revalidatePath } from 'next/cache'

const PROFILE_LIMITS = {
  FREE: 1,
  PRO_DIGITAL: 3,
  PACK_STARTER: 3,
  CORPORATE: Infinity,
} as const

const actionClient = createSafeActionClient()

async function generateUniqueSlug(fullName: string): Promise<string> {
  let baseSlug = fullName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  let slug = baseSlug
  let counter = 1

  while (await prisma.profile.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`
    counter++
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
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProfileById(profileId: string) {
  const session = await requireAuth()
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: session.user.id },
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
      avatarUrl: true,
      cvFileUrl: true,
      linkedinUrl: true,
      twitterUrl: true,
      facebookUrl: true,
      whatsappNumber: true,
      showCV: true,
      viewsCount: true,
      cvDownloads: true,
      contactSaves: true,
    },
  })

  if (profile) {
    await prisma.profile.update({
      where: { id: profile.id },
      data: { viewsCount: { increment: 1 } },
    })
  }

  return profile
}
