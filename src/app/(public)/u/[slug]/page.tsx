import { notFound } from 'next/navigation'
import { Mail, Phone, Globe, Linkedin, Twitter, Facebook, MessageCircle, Download, Share2 } from 'lucide-react'
import { getPublicProfile } from '@/lib/actions/profile'
import { getPublicProfileTheme } from '@/lib/actions/theme'
import { generateThemeVars } from '@/lib/utils/theme'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const profile = await getPublicProfile(slug)

  if (!profile) {
    notFound()
  }

  // Fetch custom theme (PRO+ feature)
  const theme = await getPublicProfileTheme(slug)
  const themeVars = theme ? generateThemeVars(theme) : {}
  const fontFamily = theme?.fontFamily || 'Inter'

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
    <div
      className="min-h-screen"
      style={{
        ...themeVars,
        fontFamily,
        backgroundColor: theme?.backgroundColor || undefined,
        color: theme?.textColor || undefined,
      } as React.CSSProperties}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl">
          {/* Card principale */}
          <Card className="overflow-hidden">
            {/* En-tête avec avatar/vidéo */}
            <CardHeader className="space-y-6 bg-gradient-to-r from-primary/10 to-primary/5 pb-8">
              <div className="flex flex-col items-center gap-4 text-center">
                {/* Video Section (if exists) - PRO+ feature */}
                {profile.videoUrl && (
                  <div className="w-full max-w-md">
                    <video
                      src={profile.videoUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      controls
                      className="aspect-video w-full rounded-lg shadow-lg object-cover"
                      poster={profile.avatarUrl || undefined}
                    >
                      Votre navigateur ne supporte pas la lecture vidéo.
                    </video>
                  </div>
                )}

                {/* Avatar (only show if no video) */}
                {!profile.videoUrl && (
                  <Avatar className="h-24 w-24">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary text-4xl font-bold text-primary-foreground">
                        {profile.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Avatar>
                )}

                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight">
                    {profile.fullName}
                  </h1>

                  {profile.jobTitle && (
                    <p className="text-lg text-muted-foreground">
                      {profile.jobTitle}
                    </p>
                  )}

                  {profile.company && (
                    <Badge variant="secondary" className="text-sm">
                      {profile.company}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {/* Informations de contact */}
              <div className="space-y-3">
                <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Contact
                </h2>
                <div className="space-y-2">
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center gap-3 rounded-lg p-3 text-sm transition-colors hover:bg-muted"
                  >
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span>{profile.email}</span>
                  </a>

                  <a
                    href={`tel:${profile.phoneNumber}`}
                    className="flex items-center gap-3 rounded-lg p-3 text-sm transition-colors hover:bg-muted"
                  >
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <span>{profile.phoneNumber}</span>
                  </a>

                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg p-3 text-sm transition-colors hover:bg-muted"
                    >
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <span>{profile.website}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Réseaux sociaux */}
              {socialLinks.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                      Réseaux sociaux
                    </h2>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {socialLinks.map((link) => {
                        const Icon = link.icon
                        return (
                          <Button
                            key={link.label}
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="gap-2"
                            >
                              <Icon className="h-4 w-4" />
                              <span className="hidden sm:inline">{link.label}</span>
                            </a>
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Actions */}
              <Separator />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1 gap-2" size="lg" asChild>
                  <a href={`/api/vcard/${profile.slug}`} download>
                    <Download className="h-4 w-4" />
                    Enregistrer le contact
                  </a>
                </Button>

                {profile.showCV && profile.cvFileUrl !== null && (
                  <Button variant="outline" className="flex-1 gap-2" size="lg" asChild>
                    <a href={`/api/cv/${profile.slug}`} download>
                      <Download className="h-4 w-4" />
                      Télécharger CV
                    </a>
                  </Button>
                )}

                <Button variant="outline" size="lg" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  <span className="sr-only">Partager</span>
                </Button>
              </div>

              {/* Stats */}
              <div className="rounded-lg bg-muted p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{profile.viewsCount}</p>
                    <p className="text-xs text-muted-foreground">Vues</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {profile.cvDownloads || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">CV téléchargés</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {profile.contactSaves || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Contacts sauvegardés</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Propulsé par{' '}
              <Link href="/" className="font-medium text-primary hover:underline">
                SmartLink
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
