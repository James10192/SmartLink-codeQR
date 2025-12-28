/**
 * QR Code Generation API
 *
 * Two modes:
 * 1. Preview (no shortCode): Generates QR pointing to /u/[slug] - for viewing in dialog
 * 2. Download (with shortCode): Generates QR pointing to /q/[shortCode] - permanent QR for PRO users
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { generateQRCodeBuffer, generateQRCodeSVG } from '@/lib/utils/generate-qr'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const searchParams = request.nextUrl.searchParams

    // 1. Get profile
    const profile = await prisma.profile.findUnique({
      where: { slug },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 })
    }

    // 2. Determine QR URL based on shortCode presence
    const shortCode = searchParams.get('shortCode')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    let qrUrl: string
    let filename: string

    if (shortCode) {
      // Download mode: QR points to /q/[shortCode] (permanent)
      qrUrl = `${appUrl}/q/${shortCode}`
      filename = `smartlink-${slug}-permanent`
    } else {
      // Preview mode: QR points to /u/[slug] (dynamic)
      qrUrl = `${appUrl}/u/${slug}`
      filename = `smartlink-${slug}`
    }

    // 3. Get format and customization options
    const format = searchParams.get('format') || 'png' // 'png' or 'svg'
    const darkColor = searchParams.get('dark') || '#000000'
    const lightColor = searchParams.get('light') || '#FFFFFF'
    const width = parseInt(searchParams.get('width') || '512')

    // 4. Generate QR code in requested format
    if (format === 'svg') {
      const svgString = await generateQRCodeSVG(qrUrl, {
        color: {
          dark: darkColor,
          light: lightColor,
        },
        width,
      })

      return new NextResponse(svgString, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Content-Disposition': shortCode
            ? `attachment; filename="${filename}.svg"` // Download with attachment
            : `inline; filename="${filename}.svg"`, // Preview inline
          'Cache-Control': shortCode ? 'public, max-age=31536000' : 'no-cache', // Permanent QR cached forever, preview not cached
        },
      })
    }

    // Default: PNG format
    const qrCodeBuffer = await generateQRCodeBuffer(qrUrl, {
      color: {
        dark: darkColor,
        light: lightColor,
      },
      width,
    })

    return new NextResponse(new Uint8Array(qrCodeBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': shortCode
          ? `attachment; filename="${filename}.png"` // Download with attachment
          : `inline; filename="${filename}.png"`, // Preview inline
        'Cache-Control': shortCode ? 'public, max-age=31536000' : 'no-cache', // Permanent QR cached forever, preview not cached
      },
    })
  } catch (error) {
    console.error('[QR Generation Error]', error)

    return NextResponse.json(
      { error: 'Erreur lors de la génération du QR code' },
      { status: 500 }
    )
  }
}
