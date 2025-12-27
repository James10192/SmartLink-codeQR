import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, Users, Download, Contact, MapPin, Mail, Phone, Clock, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'

export default async function AnalyticsPage() {
  const session = await requireAuth()

  // Fetch all user profiles with visitors
  const profiles = await prisma.profile.findMany({
    where: { userId: session.user.id },
    include: {
      visitors: {
        orderBy: { visitedAt: 'desc' },
      },
    },
  })

  // Calculate total stats
  const totalViews = profiles.reduce((sum, p) => sum + p.viewsCount, 0)
  const totalUniqueVisitors = profiles.reduce((sum, p) => sum + p.uniqueVisitors, 0)
  const totalCVDownloads = profiles.reduce((sum, p) => sum + p.cvDownloads, 0)
  const totalContactSaves = profiles.reduce((sum, p) => sum + p.contactSaves, 0)
  const totalVisitorsWithInfo = profiles.reduce(
    (sum, p) => sum + p.visitors.filter((v) => v.visitorName).length,
    0
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Analysez les performances de vos profils en détail
        </p>
      </div>

      {/* Global Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Page Views (Option A) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Vues</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Option A: Toutes les pages vues
            </p>
          </CardContent>
        </Card>

        {/* Unique Visitors (Option B) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Visiteurs Uniques</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUniqueVisitors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Option B: Visiteurs uniques par jour
            </p>
          </CardContent>
        </Card>

        {/* CV Downloads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CV Téléchargés</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCVDownloads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total téléchargements de CV
            </p>
          </CardContent>
        </Card>

        {/* Contact Saves */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Contacts Sauvés</CardTitle>
            <Contact className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContactSaves.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Téléchargements de vCard
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-Profile Analytics */}
      <div className="space-y-6">
        {profiles.map((profile) => (
          <Card key={profile.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{profile.fullName}</CardTitle>
                  <CardDescription className="mt-1">
                    {profile.jobTitle} {profile.company && `• ${profile.company}`}
                  </CardDescription>
                  <Link
                    href={`/u/${profile.slug}`}
                    className="text-sm text-primary hover:underline mt-2 inline-block"
                    target="_blank"
                  >
                    Voir le profil public →
                  </Link>
                </div>
                <Badge variant="secondary">{profile.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats Grid for this profile */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5" />
                    Vues Totales
                  </p>
                  <p className="text-2xl font-bold">{profile.viewsCount.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Users className="h-3.5 w-3.5" />
                    Visiteurs Uniques
                  </p>
                  <p className="text-2xl font-bold">{profile.uniqueVisitors.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Download className="h-3.5 w-3.5" />
                    CV
                  </p>
                  <p className="text-2xl font-bold">{profile.cvDownloads.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Contact className="h-3.5 w-3.5" />
                    Contacts
                  </p>
                  <p className="text-2xl font-bold">{profile.contactSaves.toLocaleString()}</p>
                </div>
              </div>

              <Separator />

              {/* Visitors List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Visiteurs récents ({profile.visitors.length})
                  </h3>
                  {profile.visitors.filter((v) => v.visitorName).length > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {profile.visitors.filter((v) => v.visitorName).length} avec coordonnées
                    </Badge>
                  )}
                </div>

                {profile.visitors.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun visiteur pour le moment
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {profile.visitors.map((visitor) => (
                      <div
                        key={visitor.id}
                        className="flex items-start gap-3 rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-shrink-0 mt-1">
                          {visitor.countryCode && (
                            <span className="text-2xl" title={visitor.country || undefined}>
                              {getFlagEmoji(visitor.countryCode)}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 space-y-2">
                          {/* Visitor Name (if provided) */}
                          {visitor.visitorName && (
                            <div className="flex items-center gap-2">
                              <Badge variant="default" className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Visiteur identifié
                              </Badge>
                              <p className="font-semibold text-foreground">
                                {visitor.visitorName}
                              </p>
                            </div>
                          )}

                          {/* Contact Info (if provided) */}
                          {visitor.visitorContact && (
                            <div className="flex items-center gap-2 text-sm">
                              {visitor.visitorContact.includes('@') ? (
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              <span className="text-foreground">{visitor.visitorContact}</span>
                            </div>
                          )}

                          {/* Location */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>
                              {visitor.city || 'Ville inconnue'}, {visitor.country || 'Pays inconnu'}
                            </span>
                          </div>

                          {/* Timestamp */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(new Date(visitor.visitedAt), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Différence Option A vs Option B</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  <strong>Option A (Vues Totales)</strong> : Compte chaque visite de page, même si
                  la même personne revient plusieurs fois
                </li>
                <li>
                  <strong>Option B (Visiteurs Uniques)</strong> : Compte uniquement les visiteurs
                  uniques par période de 24h (déduplication par IP)
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}
