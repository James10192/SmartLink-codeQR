import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resyncOAuthImages() {
  console.log('🔄 Starting OAuth image resync...')

  // 1. Récupérer tous les utilisateurs avec compte OAuth
  const usersWithOAuth = await prisma.user.findMany({
    include: {
      accounts: true,
    },
    where: {
      accounts: {
        some: {}, // At least one OAuth account
      },
    },
  })

  console.log(`Found ${usersWithOAuth.length} users with OAuth accounts`)

  for (const user of usersWithOAuth) {
    for (const account of user.accounts) {
      if (!account.accessToken) {
        console.log(
          `⚠️  No access token for ${user.email} (${account.providerId})`
        )
        continue
      }

      let imageUrl: string | null = null

      try {
        if (account.providerId === 'google') {
          const response = await fetch(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            {
              headers: { Authorization: `Bearer ${account.accessToken}` },
            }
          )
          const profile = await response.json()
          imageUrl = profile.picture
        } else if (account.providerId === 'github') {
          const response = await fetch('https://api.github.com/user', {
            headers: {
              Authorization: `Bearer ${account.accessToken}`,
              Accept: 'application/vnd.github.v3+json',
            },
          })
          const profile = await response.json()
          imageUrl = profile.avatar_url
        } else if (account.providerId === 'facebook') {
          const response = await fetch(
            `https://graph.facebook.com/me/picture?type=large&access_token=${account.accessToken}&redirect=false`
          )
          const data = await response.json()
          imageUrl = data.data?.url
        }

        if (imageUrl && imageUrl !== user.image) {
          await prisma.user.update({
            where: { id: user.id },
            data: { image: imageUrl },
          })
          console.log(
            `✅ Updated image for ${user.email} from ${account.providerId}`
          )
        } else if (imageUrl === user.image) {
          console.log(`ℹ️  Image already up-to-date for ${user.email}`)
        }
      } catch (error: any) {
        console.error(`❌ Error syncing ${user.email}:`, error.message)
      }
    }
  }

  console.log('✅ Resync complete!')
  await prisma.$disconnect()
}

resyncOAuthImages().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
