import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { getGeoIPData, hashIP, hashUserAgent, getClientIP } from '@/lib/utils/geoip'

const VisitorCaptureSchema = z.object({
  profileId: z.string(),
  visitorName: z.string().min(1, 'Le nom est requis'),
  visitorContact: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = VisitorCaptureSchema.parse(body)

    // Get IP and user agent
    const ip = getClientIP(request.headers)
    const userAgent = request.headers.get('user-agent') || ''
    const referrer = request.headers.get('referer') || null

    // Hash for privacy
    const ipHash = await hashIP(ip)
    const userAgentHash = await hashUserAgent(userAgent)

    // Get geo data
    const geoData = await getGeoIPData(ip)

    // Check if visitor already exists within last 24 hours
    const existingVisit = await prisma.profileVisitor.findFirst({
      where: {
        profileId: validatedData.profileId,
        ipHash,
        visitedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    })

    if (existingVisit) {
      // Update existing visitor with name and contact
      await prisma.profileVisitor.update({
        where: { id: existingVisit.id },
        data: {
          visitorName: validatedData.visitorName,
          visitorContact: validatedData.visitorContact || null,
        },
      })
    } else {
      // Create new visitor record with name and contact
      await prisma.profileVisitor.create({
        data: {
          profileId: validatedData.profileId,
          city: geoData.city,
          country: geoData.country,
          countryCode: geoData.countryCode,
          region: geoData.region,
          ipHash,
          userAgentHash,
          referrer,
          visitorName: validatedData.visitorName,
          visitorContact: validatedData.visitorContact || null,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Informations enregistrées',
    })
  } catch (error) {
    console.error('[API Capture Visitor]', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Données invalides', issues: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
