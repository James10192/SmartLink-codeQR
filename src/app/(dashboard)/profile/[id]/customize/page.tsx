import { notFound } from 'next/navigation'
import { getProfileById } from '@/lib/actions/profile'
import { getProfileTheme as getTheme } from '@/lib/actions/theme'
import { CustomizePageClient } from './page-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Paintbrush, Eye, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { canAccessFeature } from '@/lib/utils/tier-enforcement'

interface CustomizeProfilePageProps {
  params: Promise<{ id: string }>
}

export default async function CustomizeProfilePage({ params }: CustomizeProfilePageProps) {
  const { id } = await params

  try {
    const profile = await getProfileById(id)
    const theme = await getTheme(id)

    // Check tier access
    const plan = profile.user.subscription?.plan || 'FREE'
    const hasAccess = canAccessFeature(plan, 'themeCustomization')

    if (!hasAccess) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Link
              href={`/profile/${id}/preview`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au profil
            </Link>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">Personnalisation du thème</h1>
          </div>

          <div className="mx-auto max-w-2xl">
            <Card className="relative overflow-hidden">
              {/* Blur overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm z-10" />

              {/* Content */}
              <CardHeader className="relative z-0">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Paintbrush className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Personnalisation avancée</CardTitle>
                    <CardDescription>Disponible avec le plan PRO ou supérieur</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-0 space-y-4">
                <p className="text-muted-foreground">
                  Débloquez la personnalisation complète de votre profil avec le plan PRO :
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Couleurs de marque personnalisées</li>
                  <li>Choix de mise en page (centré, grille, minimal)</li>
                  <li>Sections personnalisées (portfolio, témoignages)</li>
                  <li>Logo personnalisé</li>
                  <li>Polices de caractères</li>
                </ul>
                <div className="relative z-20 pt-4">
                  <Button asChild className="w-full">
                    <Link href="/dashboard/upgrade">Passer au PRO</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href={`/profile/${id}/preview`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au profil
          </Link>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Personnaliser {profile.fullName}</h1>
              <p className="mt-2 text-muted-foreground">
                Créez un profil unique à votre image
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href={`/u/${profile.slug}`} target="_blank">
                <Eye className="mr-2 h-4 w-4" />
                Aperçu public
              </Link>
            </Button>
          </div>
        </div>

        <CustomizePageClient
          profileId={id}
          slug={profile.slug}
          initialTheme={theme}
        />
      </div>
    )
  } catch (error) {
    console.error('Error loading customize page:', error)
    notFound()
  }
}
