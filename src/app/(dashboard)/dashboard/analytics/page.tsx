import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { canAccessFeature, getVisitorLimit } from '@/lib/utils/tier-enforcement'
import { VisitorList } from '@/components/analytics/visitor-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Eye, Download, Users, TrendingUp, Lock, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Statistiques',
  description: 'Suivez les performances de vos profils',
}

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const session = await requireAuth()

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscription: true,
      profiles: {
        include: {
          visitors: {
            orderBy: { visitedAt: 'desc' },
            take: 100, // Load up to 100 recent visitors
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const plan = user.subscription?.plan || 'FREE'
  const isPro = canAccessFeature(plan, 'fullAnalytics')

  // Aggregate stats across all profiles
  const totalViews = user.profiles.reduce((sum, p) => sum + p.viewsCount, 0)
  const totalCVDownloads = user.profiles.reduce((sum, p) => sum + p.cvDownloads, 0)
  const totalContactSaves = user.profiles.reduce((sum, p) => sum + p.contactSaves, 0)
  const totalVisitors = user.profiles.reduce((sum, p) => sum + p.visitors.length, 0)

  const stats = [
    {
      title: 'Vues totales',
      value: totalViews,
      icon: Eye,
      description: 'Nombre de fois que vos profils ont été consultés',
      blurred: !isPro,
    },
    {
      title: 'CV téléchargés',
      value: totalCVDownloads,
      icon: Download,
      description: 'Nombre de téléchargements de vos CV',
      blurred: !isPro,
    },
    {
      title: 'Contacts sauvegardés',
      value: totalContactSaves,
      icon: Users,
      description: 'Nombre de fois que votre contact a été enregistré',
      blurred: !isPro,
    },
    {
      title: 'Visiteurs uniques',
      value: totalVisitors,
      icon: TrendingUp,
      description: 'Visiteurs uniques sur vos profils',
      blurred: !isPro,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistiques</h1>
        <p className="text-muted-foreground mt-2">
          Suivez les performances de vos profils {isPro ? '' : '(Version limitée FREE)'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className={cn('relative', stat.blurred && 'overflow-hidden')}>
              {/* Blur overlay for FREE users */}
              {stat.blurred && (
                <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-background/30 backdrop-blur-sm z-10 flex items-center justify-center">
                  <Lock className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Upgrade CTA for FREE users */}
      {!isPro && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Débloquez les statistiques complètes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              Avec le plan PRO, accédez à des analytics détaillées pour optimiser votre présence
              en ligne :
            </p>
            <ul className="text-sm space-y-2 list-disc list-inside">
              <li>Statistiques complètes débloquées (vues, téléchargements, contacts)</li>
              <li>Visiteurs illimités avec localisation détaillée</li>
              <li>Évolution dans le temps et tendances</li>
              <li>Sources de trafic et referrers</li>
            </ul>
            <Button asChild>
              <Link href="/dashboard/upgrade">Passer au PRO</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Visitors per profile */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Visiteurs par profil</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Consultez qui a visité chacun de vos profils
            </p>
          </div>
        </div>

        {user.profiles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">Vous n'avez pas encore de profil</p>
              <Button asChild>
                <Link href="/profile/create">Créer mon premier profil</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {user.profiles.map((profile) => (
              <Card key={profile.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 border-b">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{profile.fullName}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {profile.jobTitle || 'Professionnel'}
                        {profile.company && ` · ${profile.company}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono">
                        {profile.visitors.length} visite{profile.visitors.length > 1 ? 's' : ''}
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/u/${profile.slug}`} target="_blank">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Voir
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <VisitorList
                    visitors={profile.visitors.map((v) => ({
                      ...v,
                      visitedAt: new Date(v.visitedAt),
                    }))}
                    isPro={isPro}
                    profileName={profile.fullName}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Help section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">À propos des statistiques</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong className="text-foreground">Vues :</strong> Nombre total de visites sur vos
            profils publics
          </p>
          <p>
            <strong className="text-foreground">CV téléchargés :</strong> Nombre de fois que votre
            CV a été téléchargé par des visiteurs
          </p>
          <p>
            <strong className="text-foreground">Contacts sauvegardés :</strong> Nombre de fois que
            vos coordonnées ont été enregistrées (fichier vCard)
          </p>
          <p>
            <strong className="text-foreground">Visiteurs uniques :</strong> Nombre de personnes
            différentes ayant consulté vos profils (dédupliqués sur 24h)
          </p>
          {!isPro && (
            <p className="text-xs border-t pt-2 mt-3">
              💡 <strong>Note FREE :</strong> Les statistiques détaillées sont accessibles avec le
              plan PRO. <Link href="/dashboard/upgrade" className="text-primary hover:underline">En savoir plus</Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
