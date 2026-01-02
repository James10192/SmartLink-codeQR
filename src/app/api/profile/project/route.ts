import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

/**
 * Add a new project to a profile
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    const { profileId, title, description, images } = body

    if (!profileId || !title) {
      return NextResponse.json(
        { error: 'Profile ID and title are required' },
        { status: 400 }
      )
    }

    // Verify profile belongs to user
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: { user: { include: { subscription: true } } },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Verify user has PRO plan
    const userPlan = profile.user.subscription?.plan || 'FREE'
    const isPro = ['PRO_DIGITAL', 'PACK_STARTER', 'CORPORATE'].includes(userPlan)

    if (!isPro) {
      return NextResponse.json(
        { error: 'Projects feature requires PRO plan' },
        { status: 403 }
      )
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        profileId,
        title,
        description: description || null,
        images: images || [],
      },
    })

    return NextResponse.json({ success: true, project })
  } catch (error) {
    console.error('[API Project Create]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Delete a project from a profile
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    const { profileId, projectId } = body

    if (!profileId || !projectId) {
      return NextResponse.json(
        { error: 'Profile ID and project ID are required' },
        { status: 400 }
      )
    }

    // Verify project belongs to user's profile
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { profile: true },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.profile.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete project
    await prisma.project.delete({
      where: { id: projectId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API Project Delete]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
