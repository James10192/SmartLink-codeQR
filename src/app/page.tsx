'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { HeroGeometric } from '@/components/ui/shape-landing-hero'
import { BentoGrid, type BentoItem } from '@/components/ui/bento-grid'
import { PricingCard, type PricingCardProps } from '@/components/ui/animated-glassy-pricing'
import { GlowingEffect } from '@/components/ui/glowing-effect'
import { ImageComparison } from '@/components/ui/image-comparison'
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

  const pricingPlans: PricingCardProps[] = [
    {
      planName: "Freemium",
      description: "Pour tester SmartLink",
      price: "0 FCFA",
      features: [
        "1 profil",
        "QR Code basique",
        "vCard download",
        "CV téléchargeable"
      ],
      buttonText: "Commencer",
      buttonVariant: "secondary"
    },
    {
      planName: "Pro Digital",
      description: "Pour les professionnels",
      price: "1 000 FCFA",
      features: [
        "3 profils",
        "QR Code personnalisable",
        "Analytics avancés",
        "Support prioritaire"
      ],
      buttonText: "Souscrire",
      buttonVariant: "primary",
      isPopular: true
    },
    {
      planName: "Pack Starter",
      description: "Digital + Physique",
      price: "15 000 FCFA",
      features: [
        "Tout de Pro Digital",
        "50 cartes papier QR",
        "Design professionnel",
        "Livraison incluse"
      ],
      buttonText: "Souscrire",
      buttonVariant: "secondary"
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section with Geometric Shapes */}
      <HeroGeometric
        badge="SmartLink"
        title1="Votre contact enregistré"
        title2="en 1 scan"
      />

      {/* Bento Grid Features */}
      <section className="py-16 sm:py-24 bg-[#030303]">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="mb-4 text-3xl font-bold text-white">Fonctionnalités Modernes</h2>
            <p className="text-lg text-white/60">
              Tout ce dont vous avez besoin pour un networking professionnel efficace
            </p>
          </div>
          <BentoGrid items={bentoItems} />
        </div>
      </section>

      {/* Image Comparison Section - Traditional vs SmartLink */}
      <section className="border-t border-white/10 bg-[#0a0a0a] py-16 sm:py-24">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="mb-4 text-3xl font-bold text-white">
              La Révolution du Networking Professionnel
            </h2>
            <p className="text-lg text-white/60">
              Comparez l'ancien et le nouveau. Glissez pour découvrir comment SmartLink transforme votre carte de visite en un outil moderne et interactif.
            </p>
          </div>

          {/* Comparison Component */}
          <div className="mx-auto max-w-6xl">
            <ImageComparison
              beforeImage="/traditional-card-optimized.webp"
              afterImage="/smartlink-qr-card-optimized.webp"
              beforeLabel="Traditionnel"
              afterLabel="SmartLink QR"
              className="shadow-2xl"
            />
          </div>

          {/* Optional instruction text */}
          <div className="mx-auto max-w-3xl text-center mt-12">
            <p className="text-sm text-white/50">
              Glissez le curseur pour comparer les deux formats.
              Avec SmartLink, vos contacts scannent votre QR Code et enregistrent automatiquement votre profil.
            </p>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="border-t border-white/10 bg-[#0a0a0a] py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">Le problème avec les cartes papier</h2>
            <p className="mb-12 text-lg text-white/60">
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
      <section className="py-16 sm:py-24 bg-[#030303]">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="mb-4 text-3xl font-bold text-white">La solution moderne et écologique</h2>
            <p className="mb-8 text-lg text-white/60">
              SmartLink vous permet de créer, personnaliser et partager votre profil professionnel en quelques clics.
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* QR Code Personnalisé */}
            <div className="min-h-[14rem]">
              <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-white/10 p-2 md:rounded-[1.5rem] md:p-3">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-black/40 backdrop-blur-sm p-6 shadow-sm">
                  <div className="relative flex flex-1 flex-col justify-between gap-3">
                    <div className="w-fit rounded-lg border-[0.75px] border-white/10 bg-white/5 p-2">
                      <QrCode className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-white">
                        QR Code Personnalisé
                      </h3>
                      <p className="text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-white/60">
                        Générez votre QR Code unique et partagez-le partout (email, réseaux sociaux, cartes).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact en 1 Clic */}
            <div className="min-h-[14rem]">
              <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-white/10 p-2 md:rounded-[1.5rem] md:p-3">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-black/40 backdrop-blur-sm p-6 shadow-sm">
                  <div className="relative flex flex-1 flex-col justify-between gap-3">
                    <div className="w-fit rounded-lg border-[0.75px] border-white/10 bg-white/5 p-2">
                      <Download className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-white">
                        Contact en 1 Clic
                      </h3>
                      <p className="text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-white/60">
                        Vos contacts téléchargent votre vCard (.vcf) directement. Fini la saisie manuelle.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CV Accessible Partout */}
            <div className="min-h-[14rem]">
              <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-white/10 p-2 md:rounded-[1.5rem] md:p-3">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-black/40 backdrop-blur-sm p-6 shadow-sm">
                  <div className="relative flex flex-1 flex-col justify-between gap-3">
                    <div className="w-fit rounded-lg border-[0.75px] border-white/10 bg-white/5 p-2">
                      <Smartphone className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-white">
                        CV Accessible Partout
                      </h3>
                      <p className="text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-white/60">
                        Téléversez votre CV une fois, accessible 24/7 via votre profil public.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Avancés */}
            <div className="min-h-[14rem]">
              <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-white/10 p-2 md:rounded-[1.5rem] md:p-3">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-black/40 backdrop-blur-sm p-6 shadow-sm">
                  <div className="relative flex flex-1 flex-col justify-between gap-3">
                    <div className="w-fit rounded-lg border-[0.75px] border-white/10 bg-white/5 p-2">
                      <TrendingUp className="h-4 w-4 text-sky-400" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-white">
                        Analytics Avancés
                      </h3>
                      <p className="text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-white/60">
                        Suivez le nombre de vues, téléchargements CV et contacts enregistrés (Pro).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Multi-Profils */}
            <div className="min-h-[14rem]">
              <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-white/10 p-2 md:rounded-[1.5rem] md:p-3">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-black/40 backdrop-blur-sm p-6 shadow-sm">
                  <div className="relative flex flex-1 flex-col justify-between gap-3">
                    <div className="w-fit rounded-lg border-[0.75px] border-white/10 bg-white/5 p-2">
                      <Zap className="h-4 w-4 text-yellow-400" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-white">
                        Multi-Profils
                      </h3>
                      <p className="text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-white/60">
                        Créez jusqu'à 3 profils différents (Personnel, Pro, Side Project) avec le plan Pro.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Toujours à Jour */}
            <div className="min-h-[14rem]">
              <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-white/10 p-2 md:rounded-[1.5rem] md:p-3">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-black/40 backdrop-blur-sm p-6 shadow-sm">
                  <div className="relative flex flex-1 flex-col justify-between gap-3">
                    <div className="w-fit rounded-lg border-[0.75px] border-white/10 bg-white/5 p-2">
                      <Shield className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-white">
                        Toujours à Jour
                      </h3>
                      <p className="text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-white/60">
                        Modifiez vos infos en temps réel. Pas besoin de réimprimer 500 cartes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 sm:py-24 bg-[#030303] relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="mx-auto max-w-3xl text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Tarifs simples et transparents
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Choisissez le plan qui correspond à vos besoins. Pas de frais cachés.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8 md:gap-6 justify-center items-stretch w-full max-w-6xl mx-auto">
            {pricingPlans.map((plan) => (
              <PricingCard key={plan.planName} {...plan} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-white/10 bg-[#0a0a0a] py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Globe className="mx-auto mb-6 h-16 w-16 text-cyan-400" />
            <h2 className="mb-4 text-3xl font-bold text-white">
              Rejoignez les professionnels modernes d'Abidjan
            </h2>
            <p className="mb-8 text-lg text-white/60">
              Créez votre profil gratuitement en moins de 2 minutes. Aucune carte bancaire requise.
            </p>
            <Button size="lg" asChild className="bg-white text-black hover:bg-white/90">
              <Link href="/signup">
                Créer mon profil gratuitement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-8">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="SmartLink Logo"
                width={40}
                height={40}
                className="opacity-90"
              />
              <span className="text-lg font-semibold text-white">SmartLink</span>
            </div>
            <div className="flex gap-6">
              <Link href="#" className="text-sm text-white/60 hover:text-white transition-colors">
                À propos
              </Link>
              <Link href="#" className="text-sm text-white/60 hover:text-white transition-colors">
                Confidentialité
              </Link>
              <Link href="#" className="text-sm text-white/60 hover:text-white transition-colors">
                Conditions
              </Link>
              <Link href="#" className="text-sm text-white/60 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
            <p className="text-sm text-white/60">
              © 2025 SmartLink. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
