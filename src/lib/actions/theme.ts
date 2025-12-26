'use server'

import { createSafeActionClient } from 'next-safe-action'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'
import { canAccessFeature } from '@/lib/utils/tier-enforcement'
import { revalidatePath } from 'next/cache'
import { ThemeLayout } from '@prisma/client'
import { DEFAULT_THEME } from '@/lib/utils/theme'

/**
 * Zod schema for theme customization
 * Validates colors, layout, and custom sections
 */
const ThemeSchema = z.object({
  profileId: z.string(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur invalide (format: #RRGGBB)'),
  secondaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur invalide (format: #RRGGBB)')
    .optional()
    .nullable(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur invalide (format: #RRGGBB)'),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur invalide (format: #RRGGBB)'),
  layout: z.enum(['CENTERED', 'LEFT_ALIGNED', 'CARD_GRID', 'MINIMAL']),
  fontFamily: z.string().optional().nullable(),
  customSections: z.any().optional().nullable(), // JSON field
  logoUrl: z.string().url().optional().nullable(),
})

const actionClient = createSafeActionClient()

/**
 * Save or update theme for a profile (PRO+ only)
 *
 * @example
 * ```typescript
 * const result = await saveThemeAction({
 *   profileId: 'xxx',
 *   primaryColor: '#000000',
 *   backgroundColor: '#ffffff',
 *   textColor: '#000000',
 *   layout: 'CENTERED'
 * })
 * ```
 */
export const saveThemeAction = actionClient.schema(ThemeSchema).action(async ({ parsedInput }) => {
  const session = await requireAuth()

  // Verify profile ownership
  const profile = await prisma.profile.findFirst({
    where: { id: parsedInput.profileId, userId: session.user.id },
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

  // TIER CHECK: Theme customization is PRO+ only
  const plan = profile.user.subscription?.plan || 'FREE'
  if (!canAccessFeature(plan, 'themeCustomization')) {
    throw new Error('Passez au plan PRO pour personnaliser votre thème')
  }

  // Upsert theme (create if doesn't exist, update if exists)
  const theme = await prisma.profileTheme.upsert({
    where: { profileId: parsedInput.profileId },
    create: {
      profileId: parsedInput.profileId,
      primaryColor: parsedInput.primaryColor,
      secondaryColor: parsedInput.secondaryColor,
      backgroundColor: parsedInput.backgroundColor,
      textColor: parsedInput.textColor,
      layout: parsedInput.layout as ThemeLayout,
      fontFamily: parsedInput.fontFamily,
      customSections: parsedInput.customSections,
      logoUrl: parsedInput.logoUrl,
    },
    update: {
      primaryColor: parsedInput.primaryColor,
      secondaryColor: parsedInput.secondaryColor,
      backgroundColor: parsedInput.backgroundColor,
      textColor: parsedInput.textColor,
      layout: parsedInput.layout as ThemeLayout,
      fontFamily: parsedInput.fontFamily,
      customSections: parsedInput.customSections,
      logoUrl: parsedInput.logoUrl,
    },
  })

  // Revalidate public profile page to show new theme
  revalidatePath(`/u/${profile.slug}`)

  return { success: true, theme, message: 'Thème sauvegardé avec succès' }
})

/**
 * Get theme for a profile
 * Returns null if no theme exists (will use defaults)
 *
 * @param profileId - The profile ID
 * @returns The theme or null
 */
export async function getProfileTheme(profileId: string) {
  const session = await requireAuth()

  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: session.user.id },
    include: { theme: true },
  })

  if (!profile) {
    throw new Error('Profil non trouvé')
  }

  return profile.theme
}

/**
 * Delete theme for a profile (reset to defaults)
 *
 * @param profileId - The profile ID
 */
export const deleteThemeAction = actionClient
  .schema(z.object({ profileId: z.string() }))
  .action(async ({ parsedInput }) => {
    const session = await requireAuth()

    const profile = await prisma.profile.findFirst({
      where: { id: parsedInput.profileId, userId: session.user.id },
    })

    if (!profile) {
      throw new Error('Profil non trouvé')
    }

    // Delete theme (profile will use default colors)
    await prisma.profileTheme.delete({
      where: { profileId: parsedInput.profileId },
    })

    revalidatePath(`/u/${profile.slug}`)

    return { success: true, message: 'Thème réinitialisé aux valeurs par défaut' }
  })

/**
 * Get theme for public profile (no auth required)
 * Used by public profile page to apply custom styling
 *
 * @param slug - The profile slug
 * @returns The theme or default theme
 */
export async function getPublicProfileTheme(slug: string) {
  const profile = await prisma.profile.findUnique({
    where: { slug, isPublic: true },
    include: { theme: true },
  })

  if (!profile) {
    return null
  }

  // Return custom theme or defaults
  return profile.theme || DEFAULT_THEME
}
