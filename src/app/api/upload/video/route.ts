import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { uploadVideo, deleteVideo, getVideoPathFromUrl } from '@/lib/storage/supabase'
import { prisma } from '@/lib/db/prisma'
import { canAccessFeature } from '@/lib/utils/tier-enforcement'

/**
 * POST /api/upload/video
 *
 * Upload a video business card (PRO+ feature)
 * - Max size: 30MB
 * - Max duration: 30 seconds (validated client-side)
 * - Formats: MP4, WebM, MOV
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const formData = await request.formData()

    const file = formData.get('file') as File
    const profileId = formData.get('profileId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!profileId) {
      return NextResponse.json({ error: 'No profile ID provided' }, { status: 400 })
    }

    // Verify ownership
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId: session.user.id },
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

    // TIER CHECK: Video feature is PRO+ only
    const plan = profile.user.subscription?.plan || 'FREE'
    if (!canAccessFeature(plan, 'video')) {
      return NextResponse.json(
        {
          error: 'Passez au plan PRO pour débloquer les cartes de visite vidéo',
          upgradeRequired: true,
        },
        { status: 403 }
      )
    }

    // Delete old video if exists (save storage space)
    if (profile.videoUrl) {
      const oldPath = getVideoPathFromUrl(profile.videoUrl)
      if (oldPath) {
        try {
          await deleteVideo(oldPath)
        } catch (error) {
          console.error('Error deleting old video:', error)
          // Continue even if deletion fails (orphaned file is better than failed upload)
        }
      }
    }

    // Upload new video
    const { url, path } = await uploadVideo(file, session.user.id, profileId)

    // Update profile with new video URL
    await prisma.profile.update({
      where: { id: profileId },
      data: { videoUrl: url },
    })

    return NextResponse.json({
      success: true,
      url,
      message: 'Vidéo téléversée avec succès',
    })
  } catch (error) {
    console.error('Video upload error:', error)
    const message = error instanceof Error ? error.message : 'Erreur lors du téléchargement'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/upload/video?profileId=xxx
 *
 * Delete a video business card
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId')

    if (!profileId) {
      return NextResponse.json({ error: 'No profile ID provided' }, { status: 400 })
    }

    // Verify ownership
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId: session.user.id },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!profile.videoUrl) {
      return NextResponse.json({ error: 'No video to delete' }, { status: 400 })
    }

    // Delete video from storage
    const path = getVideoPathFromUrl(profile.videoUrl)
    if (path) {
      await deleteVideo(path)
    }

    // Update profile to remove video URL
    await prisma.profile.update({
      where: { id: profileId },
      data: { videoUrl: null },
    })

    return NextResponse.json({
      success: true,
      message: 'Vidéo supprimée avec succès',
    })
  } catch (error) {
    console.error('Video delete error:', error)
    const message = error instanceof Error ? error.message : 'Erreur lors de la suppression'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
