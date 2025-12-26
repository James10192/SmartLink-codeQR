import { notFound } from 'next/navigation'
import {
  Mail,
  Phone,
  Globe,
  Linkedin,
  Twitter,
  Facebook,
  MessageCircle,
  Download,
  Share2,
  MapPin,
  Briefcase,
} from 'lucide-react'
import { getPublicProfile } from '@/lib/actions/profile'
import { getPublicProfileTheme } from '@/lib/actions/theme'
import { generateThemeVars } from '@/lib/utils/theme'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import Image from 'next/image'

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
      color: 'hover:bg-[#0077B5] hover:text-white',
    },
    {
      href: profile.twitterUrl,
      icon: Twitter,
      label: 'Twitter',
      show: !!profile.twitterUrl,
      color: 'hover:bg-[#1DA1F2] hover:text-white',
    },
    {
      href: profile.facebookUrl,
      icon: Facebook,
      label: 'Facebook',
      show: !!profile.facebookUrl,
      color: 'hover:bg-[#1877F2] hover:text-white',
    },
    {
      href: profile.whatsappNumber
        ? `https://wa.me/${profile.whatsappNumber.replace(/\+/g, '')}`
        : null,
      icon: MessageCircle,
      label: 'WhatsApp',
      show: !!profile.whatsappNumber,
      color: 'hover:bg-[#25D366] hover:text-white',
    },
  ]

  const socialLinks = socialLinksData
    .filter((link) => link.show && link.href)
    .map((link) => ({
      href: link.href as string,
      icon: link.icon,
      label: link.label,
      color: link.color,
    }))

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{
        ...themeVars,
        fontFamily,
        backgroundColor: theme?.backgroundColor || '#f9fafb',
        color: theme?.textColor || undefined,
      } as React.CSSProperties}
    >
      {/* Container mobile-first */}
      <div className="mx-auto max-w-4xl">
        {/* Profile Card - Style LinkedIn */}
        <Card className="overflow-hidden border-0 shadow-lg md:mt-6 md:rounded-xl">
          {/* Cover Image / Banner */}
          <div className="relative h-32 bg-gradient-to-r from-blue-600 to-cyan-600 sm:h-48 md:h-56">
            {/* Video as cover if exists */}
            {profile.videoUrl && (
              <video
                src={profile.videoUrl}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
          </div>

          {/* Profile Info Section */}
          <div className="relative px-4 pb-6 sm:px-6 lg:px-8">
            {/* Avatar - Overlapping the banner */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6">
              <div className="-mt-16 sm:-mt-20">
                <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-white shadow-xl sm:h-40 sm:w-40">
                  {profile.avatarUrl ? (
                    <Image
                      src={profile.avatarUrl}
                      alt={profile.fullName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 text-6xl font-bold text-white">
                      {profile.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Primary CTA - Mobile: below avatar, Desktop: aligned right */}
              <div className="mt-4 flex flex-1 flex-col gap-2 sm:mt-0 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  size="lg"
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-700 sm:w-auto"
                  asChild
                >
                  <a href={`/api/vcard/${profile.slug}`} download>
                    <Download className="h-4 w-4" />
                    Enregistrer le contact
                  </a>
                </Button>

                {profile.showCV && profile.cvFileUrl && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full gap-2 sm:w-auto"
                    asChild
                  >
                    <a href={`/api/cv/${profile.slug}`} download>
                      <Download className="h-4 w-4" />
                      Télécharger CV
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Name & Title */}
            <div className="mt-4 space-y-1">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {profile.fullName}
              </h1>

              {profile.jobTitle && (
                <p className="text-lg text-gray-700 sm:text-xl">
                  {profile.jobTitle}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                {profile.company && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" />
                    <span>{profile.company}</span>
                  </div>
                )}

                {profile.address && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Informations de contact
            </h2>

            <div className="space-y-3">
              <a
                href={`mailto:${profile.email}`}
                className="flex items-center gap-3 rounded-lg p-3 text-sm transition-all hover:bg-gray-100 active:bg-gray-200"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{profile.email}</p>
                </div>
              </a>

              <a
                href={`tel:${profile.phoneNumber}`}
                className="flex items-center gap-3 rounded-lg p-3 text-sm transition-all hover:bg-gray-100 active:bg-gray-200"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500">Téléphone</p>
                  <p className="font-medium text-gray-900">{profile.phoneNumber}</p>
                </div>
              </a>

              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg p-3 text-sm transition-all hover:bg-gray-100 active:bg-gray-200"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500">Site web</p>
                    <p className="font-medium text-gray-900">{profile.website}</p>
                  </div>
                </a>
              )}
            </div>
          </div>

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <>
              <Separator />
              <div className="px-4 py-6 sm:px-6 lg:px-8">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Réseaux sociaux
                </h2>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {socialLinks.map((link) => {
                    const Icon = link.icon
                    return (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-center gap-2 rounded-lg border-2 border-gray-200 p-4 transition-all ${link.color}`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="hidden text-sm font-medium sm:inline">
                          {link.label}
                        </span>
                      </a>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Footer */}
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500">
            Créé avec{' '}
            <Link
              href="/"
              className="font-semibold text-blue-600 hover:underline"
            >
              SmartLink
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
