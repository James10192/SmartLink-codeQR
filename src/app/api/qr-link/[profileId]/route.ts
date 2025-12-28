/**
 * API QR Link Generation
 *
 * POST /api/qr-link/[profileId]
 * Crée ou récupère un QR link pour un profil (PRO+ uniquement)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { canDownloadQr } from '@/lib/utils/tier-enforcement'
import { generateQrShortCode } from '@/lib/utils/slug'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const { profileId } = await params

    // 1. Verify authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      )
    }

    // 2. Get profile and verify ownership
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
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
      return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 })
    }

    // Verify user owns this profile
    if (profile.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      )
    }

    // 3. Check subscription tier (FREE cannot generate QR codes)
    if (!canDownloadQr(profile.user.subscription)) {
      return NextResponse.json(
        {
          error: 'Passez au plan PRO pour générer des QR codes',
          upgrade_required: true,
          current_plan: profile.user.subscription?.plan || 'FREE',
        },
        { status: 403 }
      )
    }

    // 4. Return existing active QR link if available
    if (profile.qrLinks.length > 0) {
      const existingQrLink = profile.qrLinks[0]
      if (!existingQrLink) {
        throw new Error('QR link invalide')
      }

      return NextResponse.json({
        success: true,
        shortCode: existingQrLink.shortCode,
        message: 'QR link existant récupéré',
      })
    }

    // 5. Generate new unique short code
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
      throw new Error('Impossible de générer un code unique')
    }

    // 6. Create QR link in database
    const qrLink = await prisma.qrLink.create({
      data: {
        shortCode,
        profileId,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      shortCode: qrLink.shortCode,
      message: 'QR link créé avec succès',
    })
  } catch (error) {
    console.error('[QR Link Generation Error]', error)

    return NextResponse.json(
      { error: 'Erreur lors de la génération du QR link' },
      { status: 500 }
    )
  }
}
