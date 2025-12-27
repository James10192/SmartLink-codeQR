import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const SkillSchema = z.object({
  profileId: z.string(),
  name: z.string().min(1),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    const data = SkillSchema.parse(body)

    // Verify profile ownership
    const profile = await prisma.profile.findFirst({
      where: { id: data.profileId, userId: session.user.id },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Create skill
    const skill = await prisma.skill.create({
      data: {
        profileId: data.profileId,
        name: data.name,
        level: data.level,
      },
    })

    return NextResponse.json({ success: true, skill })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', issues: error.errors },
        { status: 400 }
      )
    }

    console.error('Create skill error:', error)
    return NextResponse.json(
      { error: 'Failed to create skill' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    const { profileId, skillId } = z.object({
      profileId: z.string(),
      skillId: z.string(),
    }).parse(body)

    // Verify profile ownership
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId: session.user.id },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Delete skill
    await prisma.skill.delete({
      where: { id: skillId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', issues: error.errors },
        { status: 400 }
      )
    }

    console.error('Delete skill error:', error)
    return NextResponse.json(
      { error: 'Failed to delete skill' },
      { status: 500 }
    )
  }
}
