/**
 * API Route: Initialize Lemon Squeezy Checkout
 *
 * Creates a checkout session for the selected product
 * Returns checkout URL to redirect user
 */

import { NextRequest, NextResponse } from 'next/server'
import { initLemonSqueezyCheckout, type LemonSqueezyProduct } from '@/lib/payments/lemonsqueezy'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const CheckoutSchema = z.object({
  userId: z.string(),
  product: z.enum(['PRO_MONTHLY', 'PRO_YEARLY', 'PACK_STARTER']),
  userEmail: z.string().email().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json()
    const validatedData = CheckoutSchema.parse(body)

    // 2. Initialize Lemon Squeezy checkout
    const { checkoutUrl, checkoutId } = await initLemonSqueezyCheckout({
      userId: validatedData.userId,
      product: validatedData.product,
      userEmail: validatedData.userEmail,
    })

    console.log(`[Checkout API] Created checkout for user ${validatedData.userId}: ${checkoutId}`)

    // 3. Return checkout URL
    return NextResponse.json({
      success: true,
      checkoutUrl,
      checkoutId,
    })
  } catch (error) {
    console.error('[Checkout API] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          issues: error.issues,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create checkout',
      },
      { status: 500 }
    )
  }
}
