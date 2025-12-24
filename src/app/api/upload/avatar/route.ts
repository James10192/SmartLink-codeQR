import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { uploadAvatar, deleteAvatar, getAvatarPathFromUrl } from '@/lib/storage/supabase'
import { prisma } from '@/lib/db/prisma'

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
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Delete old avatar if exists
    if (profile.avatarUrl) {
      const oldPath = getAvatarPathFromUrl(profile.avatarUrl)
      if (oldPath) {
        try {
          await deleteAvatar(oldPath)
        } catch (error) {
          console.error('Error deleting old avatar:', error)
        }
      }
    }

    // Upload new avatar
    const { url, path } = await uploadAvatar(file, session.user.id, profileId)

    // Update profile with new avatar URL
    await prisma.profile.update({
      where: { id: profileId },
      data: { avatarUrl: url },
    })

    return NextResponse.json({
      success: true,
      url,
      message: 'Avatar téléversé avec succès',
    })
  } catch (error) {
    console.error('Avatar upload error:', error)
    const message = error instanceof Error ? error.message : 'Erreur lors du téléchargement'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

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

    if (!profile.avatarUrl) {
      return NextResponse.json({ error: 'No avatar to delete' }, { status: 400 })
    }

    // Delete avatar from storage
    const path = getAvatarPathFromUrl(profile.avatarUrl)
    if (path) {
      await deleteAvatar(path)
    }

    // Update profile to remove avatar URL
    await prisma.profile.update({
      where: { id: profileId },
      data: { avatarUrl: null },
    })

    return NextResponse.json({
      success: true,
      message: 'Avatar supprimé avec succès',
    })
  } catch (error) {
    console.error('Avatar delete error:', error)
    const message = error instanceof Error ? error.message : 'Erreur lors de la suppression'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
