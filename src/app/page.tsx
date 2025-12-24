'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { HeroGeometric } from '@/components/ui/shape-landing-hero'
import { BentoGrid, type BentoItem } from '@/components/ui/bento-grid'
import {
  Smartphone,
  QrCode,
  Download,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  Share2,
  FileText,
  BarChart3,
} from 'lucide-react'

export default function Home() {
  const bentoItems: BentoItem[] = [
    {
      title: "QR Code Intelligent",
      meta: "Scan instantané",
      description:
        "Générez votre QR Code personnalisable en un clic. Vos contacts scannent et enregistrent votre profil automatiquement.",
      icon: <QrCode className="w-4 h-4 text-blue-500" />,
      status: "Actif",
      tags: ["QR", "Partage", "Mobile"],
      colSpan: 2,
      hasPersistentHover: true,
    },
    {
      title: "vCard Automatique",
      meta: "Format standard",
      description: "Téléchargement direct au format .vcf compatible avec tous les téléphones. Fini la saisie manuelle.",
      icon: <Download className="w-4 h-4 text-emerald-500" />,
      status: "Disponible",
      tags: ["vCard", "Contact"],
    },
    {
      title: "CV Accessible 24/7",
      meta: "Cloud storage",
      description: "Téléversez votre CV une fois, accessible partout depuis votre profil public en ligne.",
      icon: <FileText className="w-4 h-4 text-purple-500" />,
      tags: ["PDF", "Cloud"],
      colSpan: 2,
    },
    {
      title: "Analytics Pro",
      meta: "Statistiques",
      description: "Suivez vos vues, téléchargements CV et contacts sauvegardés avec des analytics détaillés.",
      icon: <BarChart3 className="w-4 h-4 text-sky-500" />,
      status: "Pro",
      tags: ["Stats", "Insights"],
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section with Geometric Shapes */}
      <HeroGeometric
        badge="SmartLink"
        title1="Votre contact enregistré"
        title2="en 1 scan"
      />

      {/* CTA Section */}
      <section className="relative -mt-24 pb-16 sm:pb-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-8 text-lg text-muted-foreground">
              Créez votre carte de visite numérique avec QR Code. Partagez votre profil, CV et
              contacts en un instant. Fini les cartes papier perdues.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Se connecter</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="mb-4 text-3xl font-bold">Fonctionnalités Modernes</h2>
            <p className="text-lg text-muted-foreground">
              Tout ce dont vous avez besoin pour un networking professionnel efficace
            </p>
          </div>
          <BentoGrid items={bentoItems} />
        </div>
      </section>

      {/* Problem Section */}
      <section className="border-t bg-muted/30 py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold">Le problème avec les cartes papier</h2>
            <p className="mb-12 text-lg text-muted-foreground">
              Les cartes de visite traditionnelles sont coûteuses, obsolètes et inefficaces.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <XCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
                  <p className="text-sm font-medium">88% finissent à la poubelle en moins d'une semaine</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <XCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
                  <p className="text-sm font-medium">2 min pour saisir manuellement un contact</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <XCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
                  <p className="text-sm font-medium">500 cartes inutiles après un changement de poste</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <XCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
                  <p className="text-sm font-medium">CV papier encombrant et souvent égaré</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Solution/Features Section */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold">La solution moderne et écologique</h2>
            <p className="mb-12 text-lg text-muted-foreground">
              SmartLink vous permet de créer, personnaliser et partager votre profil professionnel en quelques clics.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <QrCode className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>QR Code Personnalisé</CardTitle>
                <CardDescription>
                  Générez votre QR Code unique et partagez-le partout (email, réseaux sociaux, cartes).
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Download className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Contact en 1 Clic</CardTitle>
                <CardDescription>
                  Vos contacts téléchargent votre vCard (.vcf) directement. Fini la saisie manuelle.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Smartphone className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>CV Accessible Partout</CardTitle>
                <CardDescription>
                  Téléversez votre CV une fois, accessible 24/7 via votre profil public.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <TrendingUp className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Analytics Avancés</CardTitle>
                <CardDescription>
                  Suivez le nombre de vues, téléchargements CV et contacts enregistrés (Pro).
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Zap className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Multi-Profils</CardTitle>
                <CardDescription>
                  Créez jusqu'à 3 profils différents (Personnel, Pro, Side Project) avec le plan Pro.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Toujours à Jour</CardTitle>
                <CardDescription>
                  Modifiez vos infos en temps réel. Pas besoin de réimprimer 500 cartes.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="border-t bg-muted/30 py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold">Tarifs simples et transparents</h2>
            <p className="mb-12 text-lg text-muted-foreground">
              Choisissez le plan qui correspond à vos besoins. Pas de frais cachés.
            </p>
          </div>
          <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Freemium */}
            <Card>
              <CardHeader>
                <CardTitle>Freemium</CardTitle>
                <CardDescription>Pour tester SmartLink</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">0 FCFA</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
              </CardHeader>
              <CardContent>
                <Separator className="mb-4" />
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>1 profil</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>QR Code basique</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>vCard download</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>CV téléchargeable</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/signup">Commencer</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Pro Digital */}
            <Card className="relative border-primary">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Populaire</Badge>
              <CardHeader>
                <CardTitle>Pro Digital</CardTitle>
                <CardDescription>Pour les professionnels actifs</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">1 000 FCFA</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
              </CardHeader>
              <CardContent>
                <Separator className="mb-4" />
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>3 profils</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>QR Code personnalisable (couleurs)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>Analytics avancés</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>Support prioritaire</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="/signup">Souscrire</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Pack Starter */}
            <Card>
              <CardHeader>
                <CardTitle>Pack Starter</CardTitle>
                <CardDescription>Digital + Physique</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">15 000 FCFA</span>
                  <span className="text-muted-foreground">/an</span>
                </div>
              </CardHeader>
              <CardContent>
                <Separator className="mb-4" />
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>Tout de Pro Digital</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>50 cartes papier QR (livrées)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>Design professionnel</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/signup">Souscrire</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Corporate */}
            <Card>
              <CardHeader>
                <CardTitle>Corporate</CardTitle>
                <CardDescription>Pour les entreprises</CardDescription>
                <div className="mt-4">
                  <span className="text-2xl font-bold">Sur devis</span>
                </div>
              </CardHeader>
              <CardContent>
                <Separator className="mb-4" />
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>Profils illimités</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>Gestion centralisée</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>Branding personnalisé</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    <span>Support dédié</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/signup">Nous contacter</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Globe className="mx-auto mb-6 h-16 w-16 text-primary" />
            <h2 className="mb-4 text-3xl font-bold">
              Rejoignez les professionnels modernes d'Abidjan
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Créez votre profil gratuitement en moins de 2 minutes. Aucune carte bancaire requise.
            </p>
            <Button size="lg" asChild>
              <Link href="/signup">
                Créer mon profil gratuitement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © 2025 SmartLink. Tous droits réservés.
            </p>
            <div className="flex gap-6">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                À propos
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Confidentialité
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Conditions
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
