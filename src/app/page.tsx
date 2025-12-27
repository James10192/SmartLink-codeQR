'use client'

import { useState } from 'react'
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
import CardComparisonTabs from '@/components/ui/card-comparison-tabs'
import { ContactCard } from '@/components/ui/contact-card'
import { ContactForm } from '@/components/contact-form'
import { ContactDialog } from '@/components/contact-dialog'
import { Mail, Phone } from 'lucide-react'
import { PricingDialog } from '@/components/pricing-dialogs'
import { AuthModal } from '@/components/auth/auth-modal'
import FeaturesSectionDemo from '@/components/ui/features-section-demo-2'
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
  const [activePricingDialog, setActivePricingDialog] = useState<string | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('signup')

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
      buttonVariant: "secondary",
      onButtonClick: () => setActivePricingDialog('freemium')
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
      isPopular: true,
      onButtonClick: () => setActivePricingDialog('prodigital')
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
      buttonVariant: "secondary",
      onButtonClick: () => setActivePricingDialog('packstarter')
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section with Geometric Shapes */}
      <HeroGeometric
        badge="SmartLink"
        title1="Votre contact enregistré"
        title2="en 1 scan"
        onSignupClick={() => {
          setAuthModalTab('signup')
          setAuthModalOpen(true)
        }}
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

      {/* Card Comparison Section - Traditional vs SmartLink */}
      <section className="border-t border-white/10 bg-[#0a0a0a] py-16 sm:py-24">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="mb-4 text-3xl font-bold text-white">
              La Révolution du Networking Professionnel
            </h2>
            <p className="text-lg text-white/60">
              Swipez ou attendez pour découvrir comment SmartLink transforme votre carte de visite en un outil moderne et interactif.
            </p>
          </div>

          {/* Tabs Comparison Component */}
          <CardComparisonTabs />

          {/* Optional instruction text */}
          <div className="mx-auto max-w-3xl text-center mt-12">
            <p className="text-sm text-white/50">
              Les onglets changent automatiquement toutes les 5 secondes. Vous pouvez aussi swiper ou cliquer pour comparer.
              Avec SmartLink, vos contacts scannent votre QR Code et enregistrent automatiquement votre profil.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section - REPLACES Problem Section */}
      <section className="border-t border-white/10 bg-[#0a0a0a] py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <ContactCard
              title="Contactez-nous"
              description="Une question ? Besoin d'aide ? Notre équipe est là pour vous accompagner. Remplissez le formulaire et nous vous répondrons dans les plus brefs délais."
              contactInfo={[
                {
                  icon: Mail,
                  label: 'Email',
                  value: 'marcel-_12@outlook.fr',
                },
                {
                  icon: Phone,
                  label: 'Téléphone',
                  value: '+225 07 08 41 34 84',
                },
              ]}
            >
              <ContactForm />
            </ContactCard>
          </div>
        </div>
      </section>

      {/* Solution/Features Section */}
      <section className="py-16 sm:py-24 bg-white dark:bg-[#030303]">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="mb-4 text-3xl font-bold text-foreground">La solution moderne et écologique</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              SmartLink vous permet de créer, personnaliser et partager votre profil professionnel en quelques clics.
            </p>
          </div>

          <FeaturesSectionDemo />
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
            <Button
              size="lg"
              className="bg-white text-black hover:bg-white/90 cursor-pointer"
              onClick={() => {
                setAuthModalTab('signup')
                setAuthModalOpen(true)
              }}
            >
              Créer mon profil gratuitement
              <ArrowRight className="ml-2 h-4 w-4" />
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
              <Link href="#" className="text-sm text-white/60 hover:text-white transition-colors cursor-pointer">
                À propos
              </Link>
              <Link href="#" className="text-sm text-white/60 hover:text-white transition-colors cursor-pointer">
                Confidentialité
              </Link>
              <Link href="#" className="text-sm text-white/60 hover:text-white transition-colors cursor-pointer">
                Conditions
              </Link>
              <ContactDialog trigger={
                <button className="text-sm text-white/60 hover:text-white transition-colors cursor-pointer">
                  Contact
                </button>
              } />
            </div>
            <p className="text-sm text-white/60">
              © 2025 SmartLink. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>

      {/* Pricing Dialogs */}
      {pricingPlans.map((plan) => {
        const planKey = plan.planName.toLowerCase().replace(/\s+/g, '')
        const planType = plan.planName === 'Freemium' ? 'freemium' : plan.planName === 'Pro Digital' ? 'pro' : 'starter'
        return (
          <PricingDialog
            key={plan.planName}
            open={activePricingDialog === planKey}
            onOpenChange={(open) => setActivePricingDialog(open ? planKey : null)}
            planName={plan.planName}
            price={plan.price}
            features={plan.features}
            planType={planType}
            onSignup={() => {
              setAuthModalTab('signup')
              setAuthModalOpen(true)
            }}
            onSubscribe={() => {
              setAuthModalTab('signup')
              setAuthModalOpen(true)
            }}
          />
        )
      })}

      {/* Auth Modal */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultTab={authModalTab}
      />
    </div>
  )
}
