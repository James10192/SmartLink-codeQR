import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { z } from 'zod'

// Helper: Require auth
async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await import('next/headers').then((mod) => mod.headers()),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  return session
}

// Validation schema
const TestimonialSchema = z.object({
  profileId: z.string(),
  authorName: z.string().min(1),
  authorTitle: z.string().optional(),
  authorCompany: z.string().optional(),
  authorPhoto: z.string().url().optional().or(z.literal('')),
  content: z.string().min(1),
  rating: z.number().int().min(1).max(5).optional(),
  relationship: z.string().optional(),
})

// POST - Create testimonial
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    const validatedData = TestimonialSchema.parse(body)
    const { profileId, ...testimonialData } = validatedData

    // Verify ownership
    const profile = await prisma.profile.findFirst({
      where: {
        id: profileId,
        userId: session.user.id,
      },
      include: {
        user: {
          include: {
            subscription: true,
          },
        },
      },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check PRO tier
    const userPlan = profile.user.subscription?.plan || 'FREE'
    const isPro = ['PRO_DIGITAL', 'PACK_STARTER', 'CORPORATE'].includes(userPlan)

    if (!isPro) {
      return NextResponse.json(
        { error: 'Cette fonctionnalité nécessite le plan PRO' },
        { status: 403 }
      )
    }

    // Create testimonial
    const testimonial = await prisma.testimonial.create({
      data: {
        profileId,
        authorName: testimonialData.authorName,
        authorTitle: testimonialData.authorTitle || null,
        authorCompany: testimonialData.authorCompany || null,
        authorPhoto: testimonialData.authorPhoto || null,
        content: testimonialData.content,
        rating: testimonialData.rating || null,
        relationship: testimonialData.relationship || null,
      },
    })

    return NextResponse.json({ success: true, testimonial })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: error.issues },
        { status: 400 }
      )
    }

    console.error('[API Testimonial POST]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update testimonial
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    const { testimonialId, ...updateData } = body

    if (!testimonialId) {
      return NextResponse.json({ error: 'testimonialId required' }, { status: 400 })
    }

    // Verify ownership
    const testimonial = await prisma.testimonial.findUnique({
      where: { id: testimonialId },
      include: {
        profile: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!testimonial || testimonial.profile.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Update
    const updated = await prisma.testimonial.update({
      where: { id: testimonialId },
      data: {
        authorName: updateData.authorName,
        authorTitle: updateData.authorTitle || null,
        authorCompany: updateData.authorCompany || null,
        authorPhoto: updateData.authorPhoto || null,
        content: updateData.content,
        rating: updateData.rating || null,
        relationship: updateData.relationship || null,
      },
    })

    return NextResponse.json({ success: true, testimonial: updated })
  } catch (error) {
    console.error('[API Testimonial PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete testimonial
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    const { testimonialId } = body

    if (!testimonialId) {
      return NextResponse.json({ error: 'testimonialId required' }, { status: 400 })
    }

    // Verify ownership
    const testimonial = await prisma.testimonial.findUnique({
      where: { id: testimonialId },
      include: {
        profile: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!testimonial || testimonial.profile.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Delete
    await prisma.testimonial.delete({
      where: { id: testimonialId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API Testimonial DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
