import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth/session'
import { UpgradePageClient } from './upgrade-client'

export const metadata: Metadata = {
  title: 'Passer au Pro',
  description: 'Choisissez votre plan SmartLink',
}

export const dynamic = 'force-dynamic'

export default async function UpgradePage() {
  const session = await requireAuth()

  return <UpgradePageClient userId={session.user.id} userEmail={session.user.email} />
}
