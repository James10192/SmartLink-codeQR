import { SubscriptionPlan } from '@prisma/client'

/**
 * Tier Features Configuration
 * Defines what features are available for each subscription plan
 */
export const TIER_FEATURES = {
  FREE: {
    maxProfiles: 1,
    hasVideo: false,
    hasThemeCustomization: false,
    hasFullAnalytics: false,
    maxVisibleVisitors: 3, // Last 3 visitors, blurred
  },
  PRO_DIGITAL: {
    maxProfiles: 3,
    hasVideo: true,
    hasThemeCustomization: true,
    hasFullAnalytics: true,
    maxVisibleVisitors: Infinity,
  },
  PACK_STARTER: {
    maxProfiles: 3,
    hasVideo: true,
    hasThemeCustomization: true,
    hasFullAnalytics: true,
    maxVisibleVisitors: Infinity,
  },
  CORPORATE: {
    maxProfiles: Infinity,
    hasVideo: true,
    hasThemeCustomization: true,
    hasFullAnalytics: true,
    maxVisibleVisitors: Infinity,
  },
} as const

/**
 * Check if a subscription plan has access to a specific feature
 *
 * @param plan - The user's subscription plan
 * @param feature - The feature to check access for
 * @returns true if the plan has access to the feature, false otherwise
 *
 * @example
 * ```typescript
 * const canUploadVideo = canAccessFeature(user.subscription.plan, 'video')
 * if (!canUploadVideo) {
 *   return { error: 'Upgrade to PRO to unlock video business cards' }
 * }
 * ```
 */
export function canAccessFeature(
  plan: SubscriptionPlan,
  feature: 'video' | 'themeCustomization' | 'fullAnalytics'
): boolean {
  switch (feature) {
    case 'video':
      return TIER_FEATURES[plan].hasVideo
    case 'themeCustomization':
      return TIER_FEATURES[plan].hasThemeCustomization
    case 'fullAnalytics':
      return TIER_FEATURES[plan].hasFullAnalytics
  }
}

/**
 * Get the maximum number of profiles allowed for a subscription plan
 *
 * @param plan - The user's subscription plan
 * @returns The maximum number of profiles allowed
 *
 * @example
 * ```typescript
 * const maxProfiles = getProfileLimit(user.subscription.plan)
 * const currentProfiles = user.profiles.length
 *
 * if (currentProfiles >= maxProfiles) {
 *   return { error: 'Profile limit reached. Upgrade to create more profiles.' }
 * }
 * ```
 */
export function getProfileLimit(plan: SubscriptionPlan): number {
  return TIER_FEATURES[plan].maxProfiles
}

/**
 * Get the number of visible visitors for a subscription plan
 * Used to implement the freemium blur strategy:
 * - FREE users: see 3 recent visitors (blurred)
 * - PRO+ users: see all visitors with full details
 *
 * @param plan - The user's subscription plan
 * @returns The maximum number of visible visitors
 *
 * @example
 * ```typescript
 * const visitorLimit = getVisitorLimit(user.subscription.plan)
 * const displayedVisitors = isPro ? visitors : visitors.slice(0, visitorLimit)
 * ```
 */
export function getVisitorLimit(plan: SubscriptionPlan): number {
  return TIER_FEATURES[plan].maxVisibleVisitors
}

/**
 * Check if a user can create a new profile based on their subscription plan
 *
 * @param plan - The user's subscription plan
 * @param currentProfileCount - The number of profiles the user currently has
 * @returns true if the user can create another profile, false otherwise
 *
 * @example
 * ```typescript
 * const canCreate = canCreateProfile(
 *   user.subscription.plan,
 *   user.profiles.length
 * )
 *
 * if (!canCreate) {
 *   return { error: 'Profile limit reached for your plan' }
 * }
 * ```
 */
export function canCreateProfile(
  plan: SubscriptionPlan,
  currentProfileCount: number
): boolean {
  const limit = getProfileLimit(plan)
  return currentProfileCount < limit
}

/**
 * Get user-friendly feature names for display in upgrade CTAs
 */
export const FEATURE_NAMES = {
  video: 'Carte de Visite Vidéo',
  themeCustomization: 'Personnalisation du Thème',
  fullAnalytics: 'Statistiques Détaillées',
} as const

/**
 * Get upgrade CTA message for a specific feature
 *
 * @param feature - The feature that requires upgrade
 * @returns User-friendly message to display
 *
 * @example
 * ```typescript
 * if (!canAccessFeature(plan, 'video')) {
 *   const message = getUpgradeMessage('video')
 *   // "Passez au plan PRO pour débloquer Carte de Visite Vidéo"
 * }
 * ```
 */
export function getUpgradeMessage(
  feature: keyof typeof FEATURE_NAMES
): string {
  return `Passez au plan PRO pour débloquer ${FEATURE_NAMES[feature]}`
}
