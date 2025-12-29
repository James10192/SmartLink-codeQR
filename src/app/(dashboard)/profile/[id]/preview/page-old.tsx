import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Mail,
  Phone,
  Globe,
  MapPin,
  Building2,
  Eye,
  Users,
  Download,
  Calendar,
  ExternalLink,
  Star,
  Pencil,
  Plus,
  Lock,
  Award,
  Sparkles,
  Linkedin,
  Twitter,
  Facebook,
  MessageCircle,
} from 'lucide-react'
import { getSession } from '@/lib/auth/session'
import { getProfileById } from '@/lib/actions/profile'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

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

  // Get user plan for feature access
  const userPlan = profile.user.subscription?.plan || 'FREE'
  const isPro = ['PRO_DIGITAL', 'PACK_STARTER', 'CORPORATE'].includes(userPlan)

  // Generate DiceBear avatar URL if no custom avatar
  const avatarUrl = profile.avatarUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.fullName)}`

  const socialLinksData = [
    {
      href: profile.linkedinUrl,
      icon: Linkedin,
      label: 'LinkedIn',
      show: !!profile.linkedinUrl,
    },
    {
      href: profile.twitterUrl,
      icon: Twitter,
      label: 'Twitter',
      show: !!profile.twitterUrl,
    },
    {
      href: profile.facebookUrl,
      icon: Facebook,
      label: 'Facebook',
      show: !!profile.facebookUrl,
    },
    {
      href: profile.whatsappNumber
        ? `https://wa.me/${profile.whatsappNumber.replace(/\+/g, '')}`
        : null,
      icon: MessageCircle,
      label: 'WhatsApp',
      show: !!profile.whatsappNumber,
    },
  ]

  const socialLinks = socialLinksData
    .filter((link) => link.show && link.href)
    .map((link) => ({
      href: link.href as string,
      icon: link.icon,
      label: link.label,
    }))

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar - Preview Mode */}
      <div className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 max-w-7xl">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Mode Prévisualisation</span>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              {profile.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="cursor-pointer" asChild>
              <Link href={`/u/${profile.slug}`} target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                Voir profil public
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
              {/* Cover Image */}
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
                {profile.videoUrl && (
                  <video
                    src={profile.videoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              {/* Profile Info */}
              <CardContent className="px-6 pb-6">
                <div className="relative -mt-16 mb-4 flex items-end justify-between">
                  <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-card bg-card shadow-lg ring-2 ring-primary/10">
                    <Image
                      src={avatarUrl}
                      alt={profile.fullName}
                      width={128}
                      height={128}
                      className="h-full w-full object-cover"
                      priority
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer border-primary/20 hover:bg-primary/10"
                    asChild
                  >
                    <Link href={`/profile/${profile.id}/edit#header`}>
                      <Pencil className="h-4 w-4 mr-2" />
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

            {/* Bio Section */}
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground">À propos</CardTitle>
                <Button variant="ghost" size="sm" className="cursor-pointer" asChild>
                  <Link href={`/profile/${profile.id}/edit#bio`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {profile.bio ? (
                  <p className="whitespace-pre-line text-foreground/80 leading-relaxed">
                    {profile.bio}
                  </p>
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      Ajoutez une bio pour présenter votre parcours
                    </p>
                    <Button size="sm" variant="outline" className="cursor-pointer" asChild>
                      <Link href={`/profile/${profile.id}/edit#bio`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter une bio
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Experience Section */}
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground">Expérience professionnelle</CardTitle>
                <Button size="sm" className="cursor-pointer bg-primary hover:bg-primary/90" asChild>
                  <Link href={`/profile/${profile.id}/edit#experience`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {profile.experiences.length > 0 ? (
                  <div className="space-y-6">
                    {profile.experiences.map((exp) => (
                      <div key={exp.id} className="relative pl-8 pb-6 border-l-2 border-border last:pb-0">
                        <div className="absolute left-0 top-0 -ml-[9px] h-4 w-4 rounded-full border-2 border-card bg-primary" />
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold text-foreground">
                            {exp.position}
                          </h3>
                          <p className="font-medium text-foreground/80">
                            {exp.company}
                            {exp.location && ` · ${exp.location}`}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(exp.startDate), 'MMM yyyy', { locale: fr })}
                              {' - '}
                              {exp.isCurrent
                                ? "Aujourd'hui"
                                : exp.endDate
                                ? format(new Date(exp.endDate), 'MMM yyyy', { locale: fr })
                                : 'Présent'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {exp.employmentType.replace('_', ' ')}
                            </Badge>
                          </div>
                          {exp.description && (
                            <p className="mt-2 text-foreground/70 leading-relaxed">
                              {exp.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      Ajoutez vos expériences professionnelles pour enrichir votre profil
                    </p>
                    <Button size="sm" className="cursor-pointer bg-primary hover:bg-primary/90" asChild>
                      <Link href={`/profile/${profile.id}/edit#experience`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter une expérience
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skills Section */}
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground">Compétences</CardTitle>
                <Button size="sm" className="cursor-pointer bg-primary hover:bg-primary/90" asChild>
                  <Link href={`/profile/${profile.id}/edit#skills`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <Badge
                        key={skill.id}
                        className="px-3 py-1.5 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
                        style={{
                          opacity: skill.level === 'EXPERT' ? 1 : skill.level === 'ADVANCED' ? 0.9 : skill.level === 'INTERMEDIATE' ? 0.75 : 0.6,
                        }}
                      >
                        {skill.name}
                        {skill.level !== 'INTERMEDIATE' && (
                          <span className="ml-1 text-xs opacity-75">
                            ({skill.level.toLowerCase()})
                          </span>
                        )}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      Ajoutez vos compétences techniques et soft skills
                    </p>
                    <Button size="sm" className="cursor-pointer bg-primary hover:bg-primary/90" asChild>
                      <Link href={`/profile/${profile.id}/edit#skills`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter des compétences
                      </Link>
                    </Button>
                  </div>
                )}
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
                      <Link href="/dashboard/upgrade">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Passer au PRO
                      </Link>
                    </Button>
                  </div>
                ) : profile.projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.projects.map((project) => (
                      <div key={project.id} className="rounded-lg border overflow-hidden">
                        {project.images[0] && (
                          <div className="relative h-40 bg-muted">
                            <Image
                              src={project.images[0]}
                              alt={project.title}
                              fill
                              className="object-cover"
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

            {/* CV Section */}
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground">CV</CardTitle>
                <Button variant="ghost" size="sm" className="cursor-pointer" asChild>
                  <Link href={`/profile/${profile.id}/edit#cv`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {profile.cvFileUrl ? (
                  <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Download className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">CV téléchargé</p>
                        <p className="text-sm text-muted-foreground">
                          Visible sur le profil public
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="cursor-pointer" asChild>
                      <a href={profile.cvFileUrl} target="_blank" rel="noopener noreferrer">
                        Voir
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      Ajoutez votre CV (PDF, 5MB max)
                    </p>
                    <Button size="sm" variant="outline" className="cursor-pointer" asChild>
                      <Link href={`/profile/${profile.id}/edit#cv`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Uploader mon CV
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full cursor-pointer justify-start"
                    asChild
                  >
                    <Link href={`/u/${profile.slug}`} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-2" />
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
                          <Link href="/dashboard/upgrade">
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
