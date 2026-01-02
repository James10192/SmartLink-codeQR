import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  Mail,
  Phone,
  Globe,
  Linkedin,
  Twitter,
  Facebook,
  MessageCircle,
  Download,
  MapPin,
  Briefcase,
  Eye,
  Users,
  Calendar,
  ExternalLink,
  Star,
  QrCode,
  Award,
  Building2,
} from 'lucide-react'
import { getPublicProfile } from '@/lib/actions/profile'
import { getPublicProfileTheme } from '@/lib/actions/theme'
import { generateThemeVars } from '@/lib/utils/theme'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VisitorCaptureModal } from '@/components/profile/visitor-capture-modal'
import { ViewTracker } from '@/components/profile/view-tracker'
import { ThemePreviewWrapper } from '@/components/profile/theme-preview-wrapper'
import { canAccessFeature, isSubscriptionActive } from '@/lib/utils/tier-enforcement'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const profile = await getPublicProfile(slug)

  if (!profile) {
    return {
      title: 'Profil introuvable',
      description: 'Ce profil n\'existe pas ou n\'est pas public',
    }
  }

  const description = profile.jobTitle && profile.company
    ? `${profile.jobTitle} chez ${profile.company}`
    : profile.jobTitle || profile.company || 'Professionnel sur SmartLink'

  return {
    title: profile.fullName,
    description: `${description} - ${profile.bio || 'Découvrez mon profil professionnel'}`,
    openGraph: {
      type: 'profile',
      url: `https://smartlink.vercel.app/u/${slug}`,
      title: profile.fullName,
      description,
      images: profile.avatarUrl ? [
        {
          url: profile.avatarUrl,
          width: 400,
          height: 400,
          alt: profile.fullName,
        }
      ] : [],
    },
    twitter: {
      card: 'summary',
      title: profile.fullName,
      description,
      images: profile.avatarUrl ? [profile.avatarUrl] : [],
    },
  }
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}) {
  const { slug } = await params
  const { preview } = await searchParams
  const isPreviewMode = preview === 'true'

  const profile = await getPublicProfile(slug)

  if (!profile) {
    notFound()
  }

  // Get user plan for badges and feature access
  const userPlan = profile.user.subscription?.plan || 'FREE'
  const isPro = ['PRO_DIGITAL', 'PACK_STARTER', 'CORPORATE'].includes(userPlan)

  // Check if subscription is active (not expired)
  const subscriptionActive = isSubscriptionActive(profile.user.subscription)

  // Fetch custom theme (PRO+ feature) - only apply if subscription is active
  const canUseTheme = canAccessFeature(userPlan, 'themeCustomization') && subscriptionActive
  const theme = canUseTheme ? await getPublicProfileTheme(slug) : null
  const themeVars = theme ? generateThemeVars(theme) : {}
  const fontFamily = theme?.fontFamily || 'Inter'

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
    <ThemePreviewWrapper isPreviewMode={isPreviewMode} defaultThemeVars={themeVars}>
      <div
        className="min-h-screen bg-background"
        style={{
          ...themeVars,
          fontFamily,
        } as React.CSSProperties}
      >
      {/* Main Container - LinkedIn-style 2 Column Layout */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header Card - LinkedIn Style */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
              {/* Cover Image/Video */}
              <div className="relative h-48 overflow-hidden bg-muted">
                {profile.videoUrl ? (
                  <video
                    src={profile.videoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : profile.coverImageUrl ? (
                  <Image
                    src={profile.coverImageUrl}
                    alt="Cover"
                    fill
                    className="object-cover"
                    unoptimized={profile.coverImageUrl.includes('supabase.co')}
                  />
                ) : (
                  <div
                    className="h-full w-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent"
                  />
                )}
              </div>

              {/* Profile Info */}
              <div className="px-6 pb-6">
                {/* Avatar with Plan Badge */}
                <div className="relative -mt-16 mb-4 flex items-end gap-4">
                  <div className="relative">
                    <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-card bg-card shadow-lg ring-2 ring-primary/10">
                      <Image
                        src={avatarUrl}
                        alt={profile.fullName}
                        width={128}
                        height={128}
                        className="h-full w-full object-cover"
                        priority
                        unoptimized={avatarUrl.includes('supabase.co')}
                      />
                    </div>
                    {/* Plan Badge */}
                    {userPlan === 'PRO_DIGITAL' && (
                      <Badge
                        className="absolute -bottom-1 -right-1 border-2 border-card bg-primary text-primary-foreground"
                      >
                        <Award className="mr-1 h-3 w-3" />
                        PRO
                      </Badge>
                    )}
                    {userPlan === 'PACK_STARTER' && (
                      <Badge
                        className="absolute -bottom-1 -right-1 border-2 border-card bg-amber-500 text-white"
                      >
                        <Award className="mr-1 h-3 w-3" />
                        STARTER
                      </Badge>
                    )}
                    {userPlan === 'CORPORATE' && (
                      <Badge
                        className="absolute -bottom-1 -right-1 border-2 border-card bg-purple-600 text-white"
                      >
                        <Award className="mr-1 h-3 w-3" />
                        CORP
                      </Badge>
                    )}
                  </div>

                  {/* Statistics */}
                  <div className="mb-2 flex gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{profile.viewsCount} vues</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{profile.contactSaves} contacts</span>
                    </div>
                  </div>
                </div>

                {/* Name & Title */}
                <div className="mb-6">
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

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    className="font-semibold bg-primary hover:bg-primary/90"
                    asChild
                  >
                    <a href={`/api/vcard/${profile.slug}`} download>
                      <Download className="mr-2 h-5 w-5" />
                      Enregistrer le contact
                    </a>
                  </Button>

                  {profile.showCV && profile.cvFileUrl && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="font-semibold border-primary text-primary hover:bg-primary/10"
                      asChild
                    >
                      <a href={`/api/cv/${profile.slug}`} download>
                        <Download className="mr-2 h-5 w-5" />
                        Télécharger CV
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Bio Section */}
            {profile.bio && (
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold text-foreground">
                  À propos
                </h2>
                <p className="whitespace-pre-line text-foreground/80 leading-relaxed">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Experience Section */}
            {profile.experiences.length > 0 && (
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <h2 className="mb-6 text-xl font-semibold text-foreground">
                  Expérience professionnelle
                </h2>
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
              </div>
            )}

            {/* Skills Section */}
            {profile.skills.length > 0 && (
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold text-foreground">
                  Compétences
                </h2>
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
              </div>
            )}

            {/* Projects Section (Only show if user has projects) */}
            {isPro && profile.projects.length > 0 && (
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <h2 className="mb-6 text-xl font-semibold text-foreground">
                  Projets & Réalisations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {profile.projects.map((project) => (
                    <div key={project.id} className="group relative overflow-hidden rounded-lg border transition-shadow hover:shadow-lg">
                      {project.images[0] && (
                        <div className="relative h-48 overflow-hidden bg-muted">
                          <Image
                            src={project.images[0]}
                            alt={project.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="p-4 bg-card">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground">
                            {project.title}
                          </h3>
                          {project.isFeatured && (
                            <Badge variant="secondary" className="shrink-0">
                              <Star className="mr-1 h-3 w-3" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                        {project.technologies.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {project.technologies.map((tech) => (
                              <Badge key={tech} variant="outline" className="text-xs">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {project.url && (
                          <a
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline transition-colors"
                          >
                            Voir le projet
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Testimonials Section (PRO Only) */}
            {isPro && profile.testimonials.length > 0 && (
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <h2 className="mb-6 text-xl font-semibold text-foreground">
                  Témoignages & Recommandations
                </h2>
                <div className="space-y-6">
                  {profile.testimonials.map((testimonial) => (
                    <div key={testimonial.id} className="rounded-lg border bg-muted/50 p-6">
                      <div className="flex items-start gap-4">
                        {testimonial.authorPhoto && (
                          <Image
                            src={testimonial.authorPhoto}
                            alt={testimonial.authorName}
                            width={56}
                            height={56}
                            className="rounded-full"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-foreground">
                                {testimonial.authorName}
                              </p>
                              {testimonial.authorTitle && (
                                <p className="text-sm text-muted-foreground">
                                  {testimonial.authorTitle}
                                  {testimonial.authorCompany && ` · ${testimonial.authorCompany}`}
                                </p>
                              )}
                            </div>
                            {testimonial.rating && (
                              <div className="flex gap-0.5">
                                {Array.from({ length: testimonial.rating }).map((_, i) => (
                                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="mt-3 text-foreground/80 leading-relaxed">
                            "{testimonial.content}"
                          </p>
                          {testimonial.relationship && (
                            <Badge variant="outline" className="mt-2">
                              {testimonial.relationship}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Posts Section (PRO Only) */}
            {isPro && profile.posts.length > 0 && (
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <h2 className="mb-6 text-xl font-semibold text-foreground">
                  Actualités & Publications
                </h2>
                <div className="space-y-6">
                  {profile.posts.map((post) => (
                    <article key={post.id} className="border-b border-border pb-6 last:border-0 last:pb-0">
                      {post.coverImage && (
                        <div className="relative mb-4 h-48 overflow-hidden rounded-lg">
                          <Image
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <h3 className="text-lg font-semibold text-foreground">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="mt-2 text-foreground/70">
                          {post.excerpt}
                        </p>
                      )}
                      {post.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {post.publishedAt && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Publié le {format(new Date(post.publishedAt), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Information Section */}
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-foreground">
                Informations de contact
              </h2>
              <div className="space-y-3">
                <a
                  href={`mailto:${profile.email}`}
                  className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent"
                >
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Email</p>
                    <p className="text-sm font-medium text-foreground">
                      {profile.email}
                    </p>
                  </div>
                </a>

                <a
                  href={`tel:${profile.phoneNumber}`}
                  className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent"
                >
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Téléphone</p>
                    <p className="text-sm font-medium text-foreground">
                      {profile.phoneNumber}
                    </p>
                  </div>
                </a>

                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent"
                  >
                    <Globe className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Site web</p>
                      <p className="text-sm font-medium text-foreground">
                        {profile.website}
                      </p>
                    </div>
                  </a>
                )}
              </div>
            </div>

            {/* Social Networks */}
            {socialLinks.length > 0 && (
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold text-foreground">
                  Réseaux sociaux
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {socialLinks.map((link) => {
                    const Icon = link.icon
                    return (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border border-primary/20 p-3 transition-all hover:border-primary hover:shadow-md hover:bg-primary/5"
                      >
                        <Icon className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          {link.label}
                        </span>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* QR Code Card */}
              <div className="rounded-xl border bg-card p-6 shadow-sm text-center">
                <div className="mb-4 flex items-center justify-center">
                  <div className="rounded-lg p-4 bg-muted">
                    <QrCode className="h-32 w-32 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Scannez pour partager
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Partagez votre profil facilement
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-primary text-primary hover:bg-primary/10"
                >
                  Télécharger QR Code
                </Button>
              </div>

              {/* Profile Views */}
              <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-6 shadow-sm text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Eye className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Vues du profil
                  </span>
                </div>
                <p className="text-4xl font-bold text-primary">
                  {profile.viewsCount.toLocaleString()}
                </p>
              </div>

              {/* SmartLink Branding */}
              <div className="rounded-xl border bg-card p-6 shadow-sm text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                  <span className="text-xl font-bold text-primary-foreground">S</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Créé avec{' '}
                  <Link
                    href="/"
                    className="font-semibold text-primary hover:underline"
                  >
                    SmartLink
                  </Link>
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  asChild
                >
                  <Link href="/">
                    Créer mon profil
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Tracker - Comptage automatique des vues uniques */}
      <ViewTracker profileId={profile.id} />

      {/* Visitor Capture Modal (QR scan) */}
      <VisitorCaptureModal
        profileId={profile.id}
        profileOwnerName={profile.fullName}
      />
      </div>
    </ThemePreviewWrapper>
  )
}
