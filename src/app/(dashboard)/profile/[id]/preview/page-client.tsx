'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import {
  Eye,
  Download,
  Users,
  ExternalLink,
  Lock,
  Sparkles,
  Calendar,
  Building2,
  MapPin,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EditableAvatar } from '@/components/profile/editable-avatar'
import { EditableCover } from '@/components/profile/editable-cover'
import { EditableBio } from '@/components/profile/editable-bio'
import { EditableExperiences } from '@/components/profile/editable-experiences'
import { EditableSkills } from '@/components/profile/editable-skills'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Image from 'next/image'
import type { Profile } from '@prisma/client'

interface ProfileWithRelations extends Profile {
  user: {
    subscription: {
      plan: string
    } | null
  }
  experiences: Array<{
    id: string
    position: string
    company: string
    location: string | null
    startDate: Date
    endDate: Date | null
    isCurrent: boolean
    employmentType: string
    description: string | null
  }>
  skills: Array<{
    id: string
    name: string
    level: string
  }>
  projects: Array<{
    id: string
    title: string
    description: string | null
    images: string[]
  }>
}

interface PreviewPageClientProps {
  initialProfile: ProfileWithRelations
}

export function PreviewPageClient({ initialProfile }: PreviewPageClientProps) {
  const [profile, setProfile] = useState(initialProfile)

  const userPlan = profile.user.subscription?.plan || 'FREE'
  const isPro = ['PRO_DIGITAL', 'PACK_STARTER', 'CORPORATE'].includes(userPlan)

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar - Edit Mode */}
      <div className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 max-w-7xl">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Mode Édition</span>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              {profile.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="cursor-pointer" asChild>
              <Link href={`/u/${profile.slug}`} target="_blank">
                <Eye className="h-4 w-4 mr-2" />
                Prévisualiser
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="cursor-pointer" asChild>
              <Link href="/dashboard/profiles">
                Retour
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header Card */}
            <Card className="relative overflow-hidden border-border bg-card shadow-sm">
              {/* Editable Cover Image */}
              <EditableCover
                profileId={profile.id}
                currentCoverUrl={profile.coverImageUrl}
                onUpdate={(url) => setProfile({ ...profile, coverImageUrl: url })}
              />

              {/* Profile Info */}
              <CardContent className="px-6 pb-6">
                <div className="relative -mt-16 mb-4 flex items-end gap-4">
                  {/* Editable Avatar */}
                  <EditableAvatar
                    profileId={profile.id}
                    currentAvatarUrl={profile.avatarUrl}
                    fullName={profile.fullName}
                    onUpdate={(url) => setProfile({ ...profile, avatarUrl: url })}
                  />

                  <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer border-primary/20 hover:bg-primary/10"
                    asChild
                  >
                    <Link href={`/profile/${profile.id}/edit#header`}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Modifier les infos
                    </Link>
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">
                      {profile.fullName}
                    </h1>
                    {profile.jobTitle && (
                      <p className="mt-1 text-lg text-foreground/80">
                        {profile.jobTitle}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      {profile.company && (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          <span>{profile.company}</span>
                        </div>
                      )}
                      {profile.address && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{profile.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <Eye className="mx-auto h-4 w-4 mb-1 text-primary" />
                      <div className="text-2xl font-bold text-foreground">{profile.viewsCount}</div>
                      <div className="text-xs text-muted-foreground">Vues</div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <Users className="mx-auto h-4 w-4 mb-1 text-primary" />
                      <div className="text-2xl font-bold text-foreground">{profile.contactSaves}</div>
                      <div className="text-xs text-muted-foreground">Contacts</div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <Download className="mx-auto h-4 w-4 mb-1 text-primary" />
                      <div className="text-2xl font-bold text-foreground">{profile.cvDownloads}</div>
                      <div className="text-xs text-muted-foreground">CV</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Editable Bio Section */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">À propos</CardTitle>
              </CardHeader>
              <CardContent>
                <EditableBio
                  profileId={profile.id}
                  initialBio={profile.bio}
                  onUpdate={(bio) => setProfile({ ...profile, bio })}
                />
              </CardContent>
            </Card>

            {/* Experience Section */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Expérience professionnelle</CardTitle>
              </CardHeader>
              <CardContent>
                <EditableExperiences
                  profileId={profile.id}
                  experiences={profile.experiences}
                  onUpdate={(experiences) => setProfile({ ...profile, experiences })}
                />
              </CardContent>
            </Card>

            {/* Skills Section */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Compétences</CardTitle>
              </CardHeader>
              <CardContent>
                <EditableSkills
                  profileId={profile.id}
                  skills={profile.skills}
                  onUpdate={(skills) => setProfile({ ...profile, skills })}
                />
              </CardContent>
            </Card>

            {/* Projects Section - PRO Feature */}
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-foreground">Projets & Réalisations</CardTitle>
                  {!isPro && (
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                      <Lock className="h-3 w-3 mr-1" />
                      PRO
                    </Badge>
                  )}
                </div>
                {isPro && (
                  <Button size="sm" className="cursor-pointer bg-primary hover:bg-primary/90" asChild>
                    <Link href={`/profile/${profile.id}/edit#projects`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter
                    </Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {!isPro ? (
                  <div className="rounded-lg border-2 border-dashed border-amber-500/30 bg-amber-500/5 p-8 text-center">
                    <Lock className="mx-auto h-12 w-12 text-amber-600 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Déverrouillez cette fonctionnalité
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                      Présentez vos projets et réalisations avec des images et des liens. Disponible avec le plan PRO.
                    </p>
                    <Button className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-white" asChild>
                      <Link href="/pricing">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Passer au PRO
                      </Link>
                    </Button>
                  </div>
                ) : profile.projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.projects.map((project) => (
                      <div key={project.id} className="rounded-lg border overflow-hidden group hover:shadow-lg transition-shadow">
                        {project.images[0] && (
                          <div className="relative h-40 bg-muted">
                            <Image
                              src={project.images[0]}
                              alt={project.title}
                              fill
                              className="object-cover"
                              unoptimized={project.images[0].includes('supabase.co')}
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold text-foreground">{project.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {project.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      Ajoutez vos projets pour mettre en valeur vos réalisations
                    </p>
                    <Button size="sm" className="cursor-pointer bg-primary hover:bg-primary/90" asChild>
                      <Link href={`/profile/${profile.id}/edit#projects`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un projet
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Quick Actions */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-foreground">Actions rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {isPro ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full cursor-pointer justify-start"
                      asChild
                    >
                      <Link href={`/profile/${profile.id}/customize`}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Personnaliser le thème
                      </Link>
                    </Button>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed border-amber-500/30 bg-amber-500/5 p-3 text-center">
                      <Lock className="mx-auto h-8 w-8 text-amber-600 mb-2" />
                      <p className="text-xs text-muted-foreground mb-2">
                        Personnalisation du thème disponible en PRO
                      </p>
                      <Button size="sm" className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-white w-full" asChild>
                        <Link href="/pricing">
                          Passer au PRO
                        </Link>
                      </Button>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full cursor-pointer justify-start"
                    asChild
                  >
                    <Link href={`/u/${profile.slug}`} target="_blank">
                      <Eye className="h-4 w-4 mr-2" />
                      Profil public
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Plan Status */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-foreground">Votre plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Plan actuel</span>
                      <Badge className="bg-primary text-primary-foreground">
                        {userPlan}
                      </Badge>
                    </div>
                    {!isPro && (
                      <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                        <p className="text-sm font-medium text-foreground mb-2">
                          Passez au PRO pour :
                        </p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>✨ Projets & réalisations</li>
                          <li>✨ Témoignages clients</li>
                          <li>✨ Articles & actualités</li>
                          <li>✨ Personnalisation thème</li>
                          <li>✨ Statistiques avancées</li>
                        </ul>
                        <Button size="sm" className="w-full mt-3 cursor-pointer bg-primary hover:bg-primary/90" asChild>
                          <Link href="/pricing">
                            Découvrir PRO
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
