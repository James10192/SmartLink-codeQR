import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { uploadCoverImage, deleteCoverImage, getCoverImagePathFromUrl } from '@/lib/storage/supabase'
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
      return NextResponse.json(
        { error: 'Profile ID required' },
        { status: 400 }
      )
    }

    // Verify profile ownership
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId: session.user.id },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Delete old cover image if exists
    if (profile.coverImageUrl) {
      const oldFilePath = getCoverImagePathFromUrl(profile.coverImageUrl)
      if (oldFilePath) {
        try {
          await deleteCoverImage(oldFilePath)
        } catch (error) {
          console.error('Error deleting old cover image:', error)
          // Continue even if deletion fails
        }
      }
    }

    // Upload new cover image
    const { url, path } = await uploadCoverImage(file, session.user.id, profileId)

    // Update profile with new cover image URL
    await prisma.profile.update({
      where: { id: profileId },
      data: { coverImageUrl: url },
    })

    return NextResponse.json({ success: true, url, path })
  } catch (error) {
    console.error('Cover image upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const { profileId } = body

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID required' },
        { status: 400 }
      )
    }

    // Verify profile ownership
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId: session.user.id },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Delete cover image file
    if (profile.coverImageUrl) {
      const filePath = getCoverImagePathFromUrl(profile.coverImageUrl)
      if (filePath) {
        await deleteCoverImage(filePath)
      }
    }

    // Update profile to remove cover image URL
    await prisma.profile.update({
      where: { id: profileId },
      data: { coverImageUrl: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cover image delete error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    )
  }
}
