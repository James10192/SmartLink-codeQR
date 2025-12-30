/**
 * Lemon Squeezy Payment Integration
 *
 * Handles card payments for SmartLink subscriptions:
 * - PRO_MONTHLY: 3,000 FCFA/month (recurring)
 * - PRO_YEARLY: 30,000 FCFA/year (recurring)
 * - PACK_STARTER: 29,900 FCFA (one-time payment, includes 1 year PRO + 50 cards)
 */

import { SubscriptionPlan } from '@prisma/client'

// Lemon Squeezy product types
export type LemonSqueezyProduct = 'PRO_MONTHLY' | 'PRO_YEARLY' | 'PACK_STARTER'

interface LemonSqueezyCheckoutParams {
  userId: string
  product: LemonSqueezyProduct
  userEmail?: string
}

interface LemonSqueezyCheckoutResponse {
  checkoutUrl: string
  checkoutId: string
}

const LEMONSQUEEZY_API_URL = 'https://api.lemonsqueezy.com/v1'

/**
 * Initialize Lemon Squeezy checkout session
 * Returns checkout URL for user to complete payment
 */
export async function initLemonSqueezyCheckout(
  params: LemonSqueezyCheckoutParams
): Promise<LemonSqueezyCheckoutResponse> {
  const { userId, product, userEmail } = params

  const apiKey = process.env.LEMON_SQUEEZY_API_KEY
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID

  if (!apiKey || !storeId) {
    throw new Error('Lemon Squeezy API credentials not configured')
  }

  // Get variant ID for this product
  const variantId = getVariantId(product)

  if (!variantId) {
    throw new Error(`Variant ID not configured for product: ${product}`)
  }

  try {
    const response = await fetch(`${LEMONSQUEEZY_API_URL}/checkouts`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: userEmail,
              custom: {
                user_id: userId,
              },
            },
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: storeId,
              },
            },
            variant: {
              data: {
                type: 'variants',
                id: variantId,
              },
            },
          },
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[Lemon Squeezy] Checkout creation failed:', errorData)
      throw new Error('Failed to create Lemon Squeezy checkout')
    }

    const data = await response.json()

    return {
      checkoutUrl: data.data.attributes.url,
      checkoutId: data.data.id,
    }
  } catch (error) {
    console.error('[Lemon Squeezy] initLemonSqueezyCheckout error:', error)
    throw error
  }
}

/**
 * Verify Lemon Squeezy webhook signature
 * Uses HMAC SHA256 to validate webhook authenticity
 */
export function verifyLemonSqueezySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const crypto = require('crypto')
    const hmac = crypto.createHmac('sha256', secret)
    const digest = hmac.update(payload).digest('hex')
    return digest === signature
  } catch (error) {
    console.error('[Lemon Squeezy] Signature verification error:', error)
    return false
  }
}

/**
 * Get variant ID from environment variables
 */
function getVariantId(product: LemonSqueezyProduct): string | undefined {
  const variantIds: Record<LemonSqueezyProduct, string | undefined> = {
    PRO_MONTHLY: process.env.LEMON_SQUEEZY_PRO_MONTHLY_VARIANT_ID,
    PRO_YEARLY: process.env.LEMON_SQUEEZY_PRO_YEARLY_VARIANT_ID,
    PACK_STARTER: process.env.LEMON_SQUEEZY_PACK_STARTER_VARIANT_ID,
  }

  return variantIds[product]
}

/**
 * Get product amount in FCFA
 */
export function getProductAmount(product: LemonSqueezyProduct): number {
  const amounts: Record<LemonSqueezyProduct, number> = {
    PRO_MONTHLY: 3000,
    PRO_YEARLY: 30000,
    PACK_STARTER: 29900,
  }

  return amounts[product]
}

/**
 * Get product display name
 */
export function getProductName(product: LemonSqueezyProduct): string {
  const names: Record<LemonSqueezyProduct, string> = {
    PRO_MONTHLY: 'Pro Monthly',
    PRO_YEARLY: 'Pro Yearly',
    PACK_STARTER: 'Pack Starter',
  }

  return names[product]
}

/**
 * Map Lemon Squeezy product to Prisma SubscriptionPlan
 */
export function getSubscriptionPlan(product: LemonSqueezyProduct): SubscriptionPlan {
  if (product === 'PACK_STARTER') {
    return 'PACK_STARTER'
  }

  // Both PRO_MONTHLY and PRO_YEARLY map to PRO_DIGITAL in database
  return 'PRO_DIGITAL'
}

/**
 * Get subscription duration in months
 */
export function getSubscriptionDuration(product: LemonSqueezyProduct): { months: number } {
  const durations: Record<LemonSqueezyProduct, { months: number }> = {
    PRO_MONTHLY: { months: 1 },
    PRO_YEARLY: { months: 12 },
    PACK_STARTER: { months: 12 }, // 1 year included
  }

  return durations[product]
}

/**
 * Determine product type from variant ID
 * Used in webhooks to identify which product was purchased
 */
export function getProductFromVariantId(variantId: string): LemonSqueezyProduct | null {
  const proMonthlyId = process.env.LEMON_SQUEEZY_PRO_MONTHLY_VARIANT_ID
  const proYearlyId = process.env.LEMON_SQUEEZY_PRO_YEARLY_VARIANT_ID
  const packStarterId = process.env.LEMON_SQUEEZY_PACK_STARTER_VARIANT_ID

  if (variantId === proMonthlyId) return 'PRO_MONTHLY'
  if (variantId === proYearlyId) return 'PRO_YEARLY'
  if (variantId === packStarterId) return 'PACK_STARTER'

  return null
}

/**
 * Check if product is recurring (monthly/yearly subscription)
 */
export function isRecurringProduct(product: LemonSqueezyProduct): boolean {
  return product === 'PRO_MONTHLY' || product === 'PRO_YEARLY'
}

/**
 * Calculate expiration date based on product
 */
export function calculateExpirationDate(product: LemonSqueezyProduct): Date {
  const duration = getSubscriptionDuration(product)
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + duration.months)
  return expiresAt
}
