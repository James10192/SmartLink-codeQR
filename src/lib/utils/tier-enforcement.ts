import { SubscriptionPlan, SubscriptionStatus, Subscription } from '@prisma/client'

/**
 * Grace period for QR code reactivation after subscription expiration
 * Users can renew within this period to reactivate their QR codes
 */
export const GRACE_PERIOD_DAYS = 30

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

// ==========================================
// SUBSCRIPTION EXPIRATION & LIFECYCLE
// ==========================================

/**
 * Type for subscription objects (can be null/undefined)
 * Supports partial subscription data (only plan, status, expiresAt required)
 */
export type SubscriptionOrNull =
  | Subscription
  | Pick<Subscription, 'plan' | 'status' | 'expiresAt'>
  | null
  | undefined

/**
 * Checks if a subscription is currently active
 *
 * A subscription is active if:
 * 1. It exists
 * 2. Status is ACTIVE
 * 3. Either no expiration date OR expiration date is in the future
 *
 * @param subscription - The user's subscription (can be null)
 * @returns true if subscription is active, false otherwise
 *
 * @example
 * ```typescript
 * const isActive = isSubscriptionActive(user.subscription)
 * if (!isActive) {
 *   // Show upgrade prompt
 * }
 * ```
 */
export function isSubscriptionActive(subscription: SubscriptionOrNull): boolean {
  if (!subscription) return false

  // Check status
  if (subscription.status !== 'ACTIVE') return false

  // Check expiration date
  if (subscription.expiresAt) {
    const now = new Date()
    const expiresAt = new Date(subscription.expiresAt)
    return expiresAt > now
  }

  // No expiration date means active (e.g., lifetime access)
  return true
}

/**
 * Gets the effective plan for a user, accounting for expired subscriptions
 *
 * If subscription is expired, returns FREE regardless of the plan in database
 * This ensures users lose access to premium features when subscription expires
 *
 * @param subscription - The user's subscription (can be null)
 * @returns Effective subscription plan (FREE if expired or null)
 *
 * @example
 * ```typescript
 * const plan = getEffectivePlan(user.subscription)
 * // plan = 'FREE' if subscription expired, otherwise user's actual plan
 *
 * const canUploadVideo = canAccessFeature(plan, 'video')
 * ```
 */
export function getEffectivePlan(subscription: SubscriptionOrNull): SubscriptionPlan {
  if (!subscription || !isSubscriptionActive(subscription)) {
    return 'FREE'
  }

  return subscription.plan
}

/**
 * Checks if user can download QR codes
 *
 * QR download is restricted to PRO+ tiers only:
 * - FREE: Cannot download (must upgrade)
 * - PRO_DIGITAL, PACK_STARTER, CORPORATE: Can download
 *
 * @param subscription - The user's subscription (can be null)
 * @returns true if user can download QR codes
 *
 * @example
 * ```typescript
 * if (!canDownloadQr(user.subscription)) {
 *   return { error: 'Passez au plan PRO pour télécharger votre QR code' }
 * }
 * ```
 */
export function canDownloadQr(subscription: SubscriptionOrNull): boolean {
  const effectivePlan = getEffectivePlan(subscription)

  // FREE users cannot download QR codes
  return effectivePlan !== 'FREE'
}

/**
 * Calculates days until subscription expiration
 *
 * @param subscription - The user's subscription (can be null)
 * @returns Number of days until expiration, or null if no expiration date
 *
 * @example
 * ```typescript
 * const daysLeft = getDaysUntilExpiration(user.subscription)
 * if (daysLeft !== null && daysLeft < 7) {
 *   // Show expiration warning
 * }
 * ```
 */
export function getDaysUntilExpiration(subscription: SubscriptionOrNull): number | null {
  if (!subscription?.expiresAt) return null

  const now = new Date()
  const expiresAt = new Date(subscription.expiresAt)
  const diffMs = expiresAt.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * Checks if QR links can be reactivated after subscription renewal
 *
 * QR links can be reactivated if:
 * 1. Subscription is currently active
 * 2. Deactivation occurred within GRACE_PERIOD_DAYS (30 days)
 *
 * @param subscription - The user's subscription (can be null)
 * @param deactivatedAt - Date when QR links were deactivated
 * @returns true if QR links can be reactivated
 *
 * @example
 * ```typescript
 * const qrLink = await prisma.qrLink.findFirst({
 *   where: { profileId },
 *   orderBy: { deactivatedAt: 'desc' }
 * })
 *
 * if (qrLink?.deactivatedAt && canReactivateQrLinks(user.subscription, qrLink.deactivatedAt)) {
 *   // Reactivate all QR links
 *   await reactivateProfileQrLinks(profileId)
 * }
 * ```
 */
export function canReactivateQrLinks(
  subscription: SubscriptionOrNull,
  deactivatedAt: Date | null
): boolean {
  // Must have active subscription
  if (!isSubscriptionActive(subscription)) return false

  // Must have deactivation date
  if (!deactivatedAt) return false

  // Check if within grace period
  const now = new Date()
  const deactivatedDate = new Date(deactivatedAt)
  const diffMs = now.getTime() - deactivatedDate.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  return diffDays <= GRACE_PERIOD_DAYS
}

/**
 * Gets degraded profile data for expired subscriptions
 *
 * Returns a configuration object indicating which fields should be hidden
 * when a subscription expires
 *
 * @param subscription - The user's subscription (can be null)
 * @returns Object with boolean flags for feature visibility
 *
 * @example
 * ```typescript
 * const degradation = getDegradedProfileData(user.subscription)
 *
 * const profileData = {
 *   ...baseProfile,
 *   videoUrl: degradation.hideVideo ? null : profile.videoUrl,
 *   theme: degradation.hideTheme ? null : profile.theme,
 *   visitors: degradation.limitVisitors
 *     ? profile.visitors.slice(0, 3)
 *     : profile.visitors
 * }
 * ```
 */
export function getDegradedProfileData(subscription: SubscriptionOrNull): {
  hideVideo: boolean
  hideTheme: boolean
  limitVisitors: boolean
  hideFullAnalytics: boolean
} {
  const effectivePlan = getEffectivePlan(subscription)
  const features = TIER_FEATURES[effectivePlan]

  return {
    hideVideo: !features.hasVideo,
    hideTheme: !features.hasThemeCustomization,
    limitVisitors: features.maxVisibleVisitors !== Infinity,
    hideFullAnalytics: !features.hasFullAnalytics,
  }
}

/**
 * Checks if subscription is expiring soon (within 7 days)
 *
 * @param subscription - The user's subscription (can be null)
 * @returns true if subscription expires in 7 days or less
 *
 * @example
 * ```typescript
 * if (isSubscriptionExpiringSoon(user.subscription)) {
 *   // Show renewal reminder banner
 * }
 * ```
 */
export function isSubscriptionExpiringSoon(subscription: SubscriptionOrNull): boolean {
  const daysLeft = getDaysUntilExpiration(subscription)

  if (daysLeft === null) return false

  return daysLeft > 0 && daysLeft <= 7
}