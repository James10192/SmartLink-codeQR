import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Plus } from 'lucide-react'
import { getSession } from '@/lib/auth/session'
import { getUserProfiles } from '@/lib/actions/profile'
import { ProfileCard } from '@/components/profile/profile-card'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export default async function ProfilesPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  const profiles = await getUserProfiles()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes Profils</h1>
          <p className="mt-2 text-muted-foreground">
            Gérez vos profils professionnels SmartLink
          </p>
        </div>
        <Button asChild>
          <Link href="/profile/create">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau profil
          </Link>
        </Button>
      </div>

      {profiles.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>Aucun profil pour le moment</EmptyTitle>
            <EmptyDescription>
              Créez votre premier profil pour commencer à partager vos informations
              professionnelles
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/profile/create">Créer mon premier profil</Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </div>
  )
}
