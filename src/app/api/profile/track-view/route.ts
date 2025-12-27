import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { getClientIP, hashIP, hashUserAgent } from '@/lib/utils/geoip'
import { cookies } from 'next/headers'

const TrackViewSchema = z.object({
  profileId: z.string(),
})

/**
 * API endpoint pour tracker les vues uniques de profil
 * Utilise une combinaison de cookies + IP hash pour éviter le double comptage
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { profileId } = TrackViewSchema.parse(body)

    // 1. Vérifier le cookie de vue existant pour ce profil
    const cookieStore = await cookies()
    const viewCookieName = `viewed_${profileId}`
    const existingViewCookie = cookieStore.get(viewCookieName)

    // Si le cookie existe et est récent (< 24h), ne pas compter
    if (existingViewCookie) {
      return NextResponse.json({
        success: true,
        counted: false,
        message: 'Vue déjà comptée (cookie)',
      })
    }

    // 2. Vérifier IP hash pour double sécurité
    const ip = getClientIP(request.headers)
    const userAgent = request.headers.get('user-agent') || ''
    const ipHash = await hashIP(ip)
    const userAgentHash = await hashUserAgent(userAgent)

    // Vérifier si cette IP a déjà visité dans les dernières 24h
    const recentVisit = await prisma.profileVisitor.findFirst({
      where: {
        profileId,
        ipHash,
        userAgentHash,
        visitedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h
        },
      },
    })

    if (recentVisit) {
      // Mettre à jour la date de visite mais ne pas créer un nouveau record
      await prisma.profileVisitor.update({
        where: { id: recentVisit.id },
        data: {
          visitedAt: new Date(),
        },
      })

      // Créer le cookie pour éviter de recompter pendant 24h
      const response = NextResponse.json({
        success: true,
        counted: false,
        message: 'Vue déjà comptée (IP hash)',
      })

      response.cookies.set(viewCookieName, 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 heures
        path: '/',
      })

      return response
    }

    // 3. Nouvelle vue unique : créer un visitor record (sans nom/contact pour l'instant)
    await prisma.profileVisitor.create({
      data: {
        profileId,
        ipHash,
        userAgentHash,
        referrer: request.headers.get('referer') || null,
        // city, country, etc. peuvent être ajoutés via geoip si nécessaire
      },
    })

    // 4. Créer le cookie pour éviter de recompter
    const response = NextResponse.json({
      success: true,
      counted: true,
      message: 'Vue comptée',
    })

    response.cookies.set(viewCookieName, 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 heures
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[API Track View]', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Données invalides' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
