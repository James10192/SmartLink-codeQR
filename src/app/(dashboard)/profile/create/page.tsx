import { requireAuth } from '@/lib/auth/session'
import CreateProfileForm from './create-profile-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Créer un profil',
  description: 'Créez un nouveau profil SmartLink',
}

export const dynamic = 'force-dynamic'

export default async function CreateProfilePage() {
  // Server-side auth check
  await requireAuth()

  // Render the Client Component form
  return <CreateProfileForm />
}
