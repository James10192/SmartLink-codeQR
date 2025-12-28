import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Users, Plus, Sparkles, Lock } from 'lucide-react'
import { getSession } from '@/lib/auth/session'
import { getUserProfiles } from '@/lib/actions/profile'
import { ProfileCard } from '@/components/profile/profile-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { prisma } from '@/lib/db/prisma'
import { SubscriptionPlan } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Mes profils',
  description: 'Gérez tous vos profils professionnels',
}

const PROFILE_LIMITS: Record<SubscriptionPlan, number> = {
  FREE: 1,
  PRO_DIGITAL: 3,
  PACK_STARTER: 3,
  CORPORATE: Infinity,
}

export default async function ProfilesPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  const profiles = await getUserProfiles()

  // Get user subscription plan
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { subscription: true },
  })

  const currentPlan = user?.subscription?.plan || 'FREE'
  const limit = PROFILE_LIMITS[currentPlan]
  const canCreateMore = profiles.length < limit

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Mes Profils
            </h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              {profiles.length} / {limit === Infinity ? '∞' : limit}
            </Badge>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            Gérez vos profils professionnels SmartLink
          </p>
        </div>
        {canCreateMore ? (
          <Button
            className="cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm w-full md:w-auto"
            asChild
          >
            <Link href="/profile/create">
              <Plus className="mr-2 h-5 w-5" />
              Nouveau profil
            </Link>
          </Button>
        ) : (
          <div className="flex flex-col items-stretch md:items-end gap-2">
            <Button
              className="cursor-not-allowed bg-muted text-muted-foreground font-semibold shadow-sm w-full md:w-auto"
              disabled
            >
              <Lock className="mr-2 h-5 w-5" />
              Limite atteinte
            </Button>
            <Button
              variant="link"
              size="sm"
              className="cursor-pointer text-primary hover:text-primary/80 w-full md:w-auto text-center md:text-right"
              asChild
            >
              <Link href="/dashboard/upgrade">
                Passer au PRO pour plus de profils
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Content Section */}
      {profiles.length === 0 ? (
        <Empty className="py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <div className="rounded-full bg-primary/10 p-6">
                <Users className="h-12 w-12 text-primary" />
              </div>
            </EmptyMedia>
            <EmptyTitle className="text-2xl font-bold text-foreground mt-6">
              Aucun profil pour le moment
            </EmptyTitle>
            <EmptyDescription className="text-base text-muted-foreground max-w-md mx-auto">
              Créez votre premier profil pour commencer à partager vos informations
              professionnelles et générer votre QR Code personnalisé
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="mt-8">
            <Button
              size="lg"
              className="cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              asChild
            >
              <Link href="/profile/create">
                <Sparkles className="mr-2 h-5 w-5" />
                Créer mon premier profil
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </div>
  )
}
