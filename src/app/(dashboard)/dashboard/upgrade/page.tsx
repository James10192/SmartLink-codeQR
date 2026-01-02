import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth/session'
import { UpgradePageClient } from './upgrade-client'
import { prisma } from '@/lib/db/prisma'

export const metadata: Metadata = {
  title: 'Mettre à niveau',
  description: 'Choisissez votre plan SmartLink',
}

export const dynamic = 'force-dynamic'

export default async function UpgradePage() {
  const session = await requireAuth()

  // Fetch user with subscription
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { subscription: true },
  })

  const currentPlan = user?.subscription?.plan || 'FREE'
  const expiresAt = user?.subscription?.expiresAt

  return (
    <UpgradePageClient
      userId={session.user.id}
      userEmail={session.user.email}
      currentPlan={currentPlan}
      expiresAt={expiresAt}
    />
  )
}
