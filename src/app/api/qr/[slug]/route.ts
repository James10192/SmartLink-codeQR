import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { generateQRCodeBuffer } from '@/lib/utils/generate-qr'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    // Vérifier que le profil existe et est public
    const profile = await prisma.profile.findUnique({
      where: { slug, isPublic: true },
      select: { id: true, slug: true },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // URL du profil public
    const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/u/${slug}`

    // Récupérer les options depuis les query params
    const searchParams = request.nextUrl.searchParams
    const darkColor = searchParams.get('dark') || '#000000'
    const lightColor = searchParams.get('light') || '#FFFFFF'
    const width = parseInt(searchParams.get('width') || '512')

    // Générer le QR code
    const qrCodeBuffer = await generateQRCodeBuffer(profileUrl, {
      color: {
        dark: darkColor,
        light: lightColor,
      },
      width,
    })

    // Retourner l'image PNG
    return new NextResponse(new Uint8Array(qrCodeBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
