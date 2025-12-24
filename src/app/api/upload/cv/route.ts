import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { uploadCV, deleteCV, getFilePathFromUrl } from '@/lib/storage/supabase'
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

    // Delete old CV if exists
    if (profile.cvFileUrl) {
      const oldFilePath = getFilePathFromUrl(profile.cvFileUrl)
      if (oldFilePath) {
        try {
          await deleteCV(oldFilePath)
        } catch (error) {
          console.error('Error deleting old CV:', error)
          // Continue even if deletion fails
        }
      }
    }

    // Upload new CV
    const { url, path } = await uploadCV(file, session.user.id, profileId)

    // Update profile with new CV URL
    await prisma.profile.update({
      where: { id: profileId },
      data: { cvFileUrl: url },
    })

    return NextResponse.json({
      success: true,
      url,
      path,
      message: 'CV téléchargé avec succès',
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth()

    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profileId')

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

    if (!profile.cvFileUrl) {
      return NextResponse.json({ error: 'No CV to delete' }, { status: 404 })
    }

    // Delete from Supabase Storage
    const filePath = getFilePathFromUrl(profile.cvFileUrl)
    if (filePath) {
      await deleteCV(filePath)
    }

    // Update profile
    await prisma.profile.update({
      where: { id: profileId },
      data: { cvFileUrl: null },
    })

    return NextResponse.json({
      success: true,
      message: 'CV supprimé avec succès',
    })
  } catch (error: any) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
