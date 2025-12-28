import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { TrendingUp, Users, Eye, Download, UserPlus, ArrowUpRight, Plus, Sparkles, X } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { getUserProfiles } from '@/lib/actions/profile'
import { prisma } from '@/lib/db/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Tableau de bord',
  description: 'Gérez vos profils professionnels et consultez vos statistiques',
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await requireAuth()

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { subscription: true },
  })

  if (!user) {
    redirect('/login')
  }

  const currentPlan = user.subscription?.plan || 'FREE'
  const isFree = currentPlan === 'FREE'

  const profiles = await getUserProfiles()

  // Calculate total stats
  const totalViews = profiles.reduce((sum, p) => sum + p.viewsCount, 0)
  const totalContacts = profiles.reduce((sum, p) => sum + p.contactSaves, 0)
  const totalCVDownloads = profiles.reduce((sum, p) => sum + p.cvDownloads, 0)

  // Get most viewed profile
  const mostViewedProfile = profiles.length > 0
    ? profiles.reduce((prev, current) => (prev.viewsCount > current.viewsCount ? prev : current))
    : null

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="mt-2 text-sm md:text-base text-muted-foreground">
          Bienvenue, {session.user.name || session.user.email}
        </p>
      </div>

      {/* Upgrade Banner for FREE users */}
      {isFree && (
        <Card className="mb-6 border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="text-base md:text-lg font-semibold">Passez au PRO et débloquez tout le potentiel de SmartLink</h3>
                </div>
                <p className="text-sm md:text-base text-muted-foreground">
                  Créez jusqu'à 3 profils, ajoutez des vidéos, personnalisez votre thème et accédez aux statistiques complètes
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    Carte vidéo 30s
                  </Badge>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    Thème personnalisé
                  </Badge>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    Stats détaillées
                  </Badge>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    Visiteurs illimités
                  </Badge>
                </div>
                <Button asChild className="mt-4">
                  <Link href="/dashboard/upgrade">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Découvrir PRO - 3 000 FCFA/mois
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profils</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{profiles.length}</div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Profil{profiles.length > 1 ? 's' : ''} actif{profiles.length > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vues Totales</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{totalViews}</div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Vues sur tous vos profils
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacts</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{totalContacts}</div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Contacts sauvegardés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CV Téléchargés</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{totalCVDownloads}</div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Téléchargements de CV
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
            <CardDescription>
              Vos profils les plus performants
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Aucun profil créé pour le moment
                </p>
                <Button asChild>
                  <Link href="/profile/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Créer mon premier profil
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {profiles.slice(0, 5).map((profile) => {
                  const initials = profile.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)

                  return (
                    <div key={profile.id} className="flex items-center gap-4">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={profile.avatarUrl || undefined} alt={profile.fullName} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {profile.fullName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {profile.jobTitle || 'Sans titre'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {profile.viewsCount}
                        </div>
                        <div className="flex items-center gap-1">
                          <UserPlus className="h-3 w-3" />
                          {profile.contactSaves}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
            <CardDescription>
              Gérez vos profils et paramètres
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/profile/create">
                <Plus className="mr-2 h-4 w-4" />
                Créer un nouveau profil
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/dashboard/profiles">
                <Users className="mr-2 h-4 w-4" />
                Voir tous mes profils
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/dashboard/analytics">
                <TrendingUp className="mr-2 h-4 w-4" />
                Statistiques
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/dashboard/settings">
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Paramètres du compte
              </Link>
            </Button>

            {isFree && (
              <>
                <Separator className="my-4" />
                <Button asChild className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/dashboard/upgrade">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Passer au PRO
                  </Link>
                </Button>
              </>
            )}

            <Separator className="my-4" />

            {mostViewedProfile && (
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Profil le plus vu</p>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-base md:text-lg font-bold">{mostViewedProfile.fullName}</p>
                <p className="text-sm md:text-base text-muted-foreground">
                  {mostViewedProfile.viewsCount} vues
                </p>
                <Button asChild variant="link" className="px-0 mt-2">
                  <Link href={`/u/${mostViewedProfile.slug}`} target="_blank">
                    Voir le profil
                    <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
