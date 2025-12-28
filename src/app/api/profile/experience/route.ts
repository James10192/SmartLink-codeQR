import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const ExperienceSchema = z.object({
  profileId: z.string(),
  position: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)).optional().nullable(),
  isCurrent: z.boolean(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'FREELANCE', 'INTERNSHIP', 'CONTRACT']),
  description: z.string().optional(),
})

const UpdateExperienceSchema = ExperienceSchema.extend({
  experienceId: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    const data = ExperienceSchema.parse(body)

    // Verify profile ownership
    const profile = await prisma.profile.findFirst({
      where: { id: data.profileId, userId: session.user.id },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Create experience
    const experience = await prisma.experience.create({
      data: {
        profileId: data.profileId,
        position: data.position,
        company: data.company,
        location: data.location || null,
        startDate: data.startDate,
        endDate: data.endDate || null,
        isCurrent: data.isCurrent,
        employmentType: data.employmentType,
        description: data.description || null,
      },
    })

    return NextResponse.json({ success: true, experience })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', issues: error.issues },
        { status: 400 }
      )
    }

    console.error('Create experience error:', error)
    return NextResponse.json(
      { error: 'Failed to create experience' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    const data = UpdateExperienceSchema.parse(body)

    // Verify profile ownership
    const profile = await prisma.profile.findFirst({
      where: { id: data.profileId, userId: session.user.id },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Update experience
    const experience = await prisma.experience.update({
      where: { id: data.experienceId },
      data: {
        position: data.position,
        company: data.company,
        location: data.location || null,
        startDate: data.startDate,
        endDate: data.endDate || null,
        isCurrent: data.isCurrent,
        employmentType: data.employmentType,
        description: data.description || null,
      },
    })

    return NextResponse.json({ success: true, experience })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', issues: error.issues },
        { status: 400 }
      )
    }

    console.error('Update experience error:', error)
    return NextResponse.json(
      { error: 'Failed to update experience' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    const { profileId, experienceId } = z.object({
      profileId: z.string(),
      experienceId: z.string(),
    }).parse(body)

    // Verify profile ownership
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId: session.user.id },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Delete experience
    await prisma.experience.delete({
      where: { id: experienceId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', issues: error.issues },
        { status: 400 }
      )
    }

    console.error('Delete experience error:', error)
    return NextResponse.json(
      { error: 'Failed to delete experience' },
      { status: 500 }
    )
  }
}
