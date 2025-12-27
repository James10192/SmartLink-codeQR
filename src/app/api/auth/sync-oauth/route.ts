import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Endpoint pour synchroniser les données OAuth (notamment l'image)
 * Appelé après chaque OAuth sign-in pour s'assurer que l'image est à jour
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Récupérer la session actuelle
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 2. Récupérer le compte OAuth lié
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: { in: ['google', 'github', 'facebook', 'apple'] },
      },
    })

    if (!account || !account.accessToken) {
      return NextResponse.json({
        success: false,
        message: 'No OAuth account found',
      })
    }

    // 3. Récupérer le profil du provider
    let imageUrl: string | null = null

    if (account.providerId === 'google') {
      imageUrl = await fetchGoogleImage(account.accessToken)
    } else if (account.providerId === 'github') {
      imageUrl = await fetchGithubImage(account.accessToken)
    } else if (account.providerId === 'facebook') {
      imageUrl = await fetchFacebookImage(account.accessToken)
    }

    // 4. Mettre à jour l'image de l'utilisateur si elle a changé
    if (imageUrl && imageUrl !== session.user.image) {
      console.log(
        `[Sync OAuth] Updating user ${session.user.id} image from ${account.providerId}`
      )

      await prisma.user.update({
        where: { id: session.user.id },
        data: { image: imageUrl },
      })

      return NextResponse.json({
        success: true,
        message: 'Image synchronized',
        imageUrl,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Image already up-to-date',
    })
  } catch (error) {
    console.error('[Sync OAuth Error]', error)
    return NextResponse.json(
      { error: 'Failed to sync OAuth data' },
      { status: 500 }
    )
  }
}

// Helpers pour récupérer l'image de chaque provider
async function fetchGoogleImage(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
    const profile = await response.json()
    return profile.picture || null
  } catch (error) {
    console.error('[Fetch Google Image]', error)
    return null
  }
}

async function fetchGithubImage(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })
    const profile = await response.json()
    return profile.avatar_url || null
  } catch (error) {
    console.error('[Fetch GitHub Image]', error)
    return null
  }
}

async function fetchFacebookImage(
  accessToken: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/me/picture?type=large&access_token=${accessToken}&redirect=false`
    )
    const data = await response.json()
    return data.data?.url || null
  } catch (error) {
    console.error('[Fetch Facebook Image]', error)
    return null
  }
}
