import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createCVDownloadNotification } from '@/lib/notifications/create-notification'
import { getEffectivePlan } from '@/lib/utils/tier-enforcement'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Get public profile
    const profile = await prisma.profile.findUnique({
      where: { slug, isPublic: true },
      select: {
        id: true,
        cvFileUrl: true,
        showCV: true,
      },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    if (!profile.showCV || !profile.cvFileUrl) {
      return NextResponse.json(
        { error: 'CV not available' },
        { status: 404 }
      )
    }

    // Increment CV downloads counter
    await prisma.profile.update({
      where: { id: profile.id },
      data: { cvDownloads: { increment: 1 } },
    })

    // Create notification for profile owner
    const fullProfile = await prisma.profile.findUnique({
      where: { id: profile.id },
      include: {
        user: {
          include: {
            subscription: true
          }
        }
      }
    })

    if (fullProfile) {
      const plan = getEffectivePlan(fullProfile.user.subscription)
      await createCVDownloadNotification(fullProfile.userId, profile.id, plan)
    }

    // Redirect to the actual CV file URL
    return NextResponse.redirect(profile.cvFileUrl)
  } catch (error) {
    console.error('Error downloading CV:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
