import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { z } from 'zod'

async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await import('next/headers').then((mod) => mod.headers()),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  return session
}

const PostSchema = z.object({
  profileId: z.string(),
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().optional(),
  content: z.string().min(1),
  coverImage: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string()).default([]),
  isPublished: z.boolean().default(false),
})

// POST - Create post
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    const validatedData = PostSchema.parse(body)
    const { profileId, slug, ...postData } = validatedData

    // Verify ownership
    const profile = await prisma.profile.findFirst({
      where: {
        id: profileId,
        userId: session.user.id,
      },
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

    // Check PRO tier
    const userPlan = profile.user.subscription?.plan || 'FREE'
    const isPro = ['PRO_DIGITAL', 'PACK_STARTER', 'CORPORATE'].includes(userPlan)

    if (!isPro) {
      return NextResponse.json(
        { error: 'Cette fonctionnalité nécessite le plan PRO' },
        { status: 403 }
      )
    }

    // Check slug uniqueness for this profile
    const existingPost = await prisma.post.findFirst({
      where: {
        profileId,
        slug,
      },
    })

    if (existingPost) {
      return NextResponse.json(
        { error: 'Un article avec ce slug existe déjà' },
        { status: 400 }
      )
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        profileId,
        slug,
        title: postData.title,
        excerpt: postData.excerpt || null,
        content: postData.content,
        coverImage: postData.coverImage || null,
        tags: postData.tags,
        isPublished: postData.isPublished,
        publishedAt: postData.isPublished ? new Date() : null,
      },
    })

    return NextResponse.json({ success: true, post })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: error.issues },
        { status: 400 }
      )
    }

    console.error('[API Post POST]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update post
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    const { postId, slug, isPublished, ...updateData } = body

    if (!postId) {
      return NextResponse.json({ error: 'postId required' }, { status: 400 })
    }

    // Verify ownership
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        profile: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!post || post.profile.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // If slug changed, check uniqueness
    if (slug && slug !== post.slug) {
      const existingPost = await prisma.post.findFirst({
        where: {
          profileId: post.profileId,
          slug,
          id: { not: postId },
        },
      })

      if (existingPost) {
        return NextResponse.json(
          { error: 'Un article avec ce slug existe déjà' },
          { status: 400 }
        )
      }
    }

    // Handle publishedAt when isPublished changes
    const publishedAt =
      isPublished !== undefined
        ? isPublished && !post.publishedAt
          ? new Date()
          : post.publishedAt
        : undefined

    // Update
    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        title: updateData.title,
        excerpt: updateData.excerpt || null,
        content: updateData.content,
        coverImage: updateData.coverImage || null,
        tags: updateData.tags,
        ...(slug && { slug }),
        ...(isPublished !== undefined && { isPublished }),
        ...(publishedAt !== undefined && { publishedAt }),
      },
    })

    return NextResponse.json({ success: true, post: updated })
  } catch (error) {
    console.error('[API Post PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete post
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    const { postId } = body

    if (!postId) {
      return NextResponse.json({ error: 'postId required' }, { status: 400 })
    }

    // Verify ownership
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        profile: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!post || post.profile.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Delete
    await prisma.post.delete({
      where: { id: postId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API Post DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
