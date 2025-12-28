import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const UpdateBioSchema = z.object({
  profileId: z.string(),
  bio: z.string().max(1000),
})

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    const { profileId, bio } = UpdateBioSchema.parse(body)

    // Verify profile ownership
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId: session.user.id },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Update bio
    await prisma.profile.update({
      where: { id: profileId },
      data: { bio },
    })

    return NextResponse.json({ success: true, bio })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', issues: error.issues },
        { status: 400 }
      )
    }

    console.error('Update bio error:', error)
    return NextResponse.json(
      { error: 'Failed to update bio' },
      { status: 500 }
    )
  }
}
