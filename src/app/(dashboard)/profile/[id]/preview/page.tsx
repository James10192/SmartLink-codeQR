import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getProfileById } from '@/lib/actions/profile'
import { PreviewPageClient } from './page-client'

export default async function ProfilePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  const { id } = await params
  const profile = await getProfileById(id)

  if (!profile) {
    notFound()
  }

  return <PreviewPageClient initialProfile={profile} />
}
