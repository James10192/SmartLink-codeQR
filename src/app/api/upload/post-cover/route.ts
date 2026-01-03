import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { supabaseAdmin, ALLOWED_IMAGE_TYPES } from '@/lib/storage/supabase'

export const dynamic = 'force-dynamic'

const MAX_COVER_SIZE = 5 * 1024 * 1024 // 5MB
const POST_COVERS_BUCKET = 'post-covers'

/**
 * Upload a post cover image
 * POST /api/upload/post-cover
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
      return NextResponse.json({ error: 'Profile ID required' }, { status: 400 })
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
        { error: 'Posts feature requires PRO plan' },
        { status: 403 }
      )
    }

    // Validate file size
    if (file.size > MAX_COVER_SIZE) {
      return NextResponse.json(
        { error: `Image too large. Maximum size: ${MAX_COVER_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Use JPG, PNG or WebP' },
        { status: 400 }
      )
    }

    // Generate unique file path
    const fileExtension = file.name.split('.').pop()
    const fileName = `${session.user.id}/${profileId}-post-${Date.now()}.${fileExtension}`

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(POST_COVERS_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      )
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(POST_COVERS_BUCKET).getPublicUrl(data.path)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: data.path,
    })
  } catch (error) {
    console.error('[API Upload Post Cover]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
