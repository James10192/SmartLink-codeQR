import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { Check, X, Sparkles, Crown, Building2, Gift } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Passer au Pro',
  description: 'Découvrez nos offres premium',
}

interface PlanFeature {
  name: string
  included: boolean
}

interface Plan {
  id: string
  name: string
  displayName: string
  price: string
  period: string
  popular?: boolean
  icon: typeof Sparkles
  tagline: string
  features: PlanFeature[]
  cta: string
}

const PLANS: Plan[] = [
  {
    id: 'FREE',
    name: 'FREE',
    displayName: 'Gratuit',
    price: '0 FCFA',
    period: 'Toujours gratuit',
    icon: Gift,
    tagline: 'Pour tester SmartLink',
    features: [
      { name: '1 profil numérique', included: true },
      { name: 'QR Code personnalisé', included: true },
      { name: 'Partage de contact (vCard)', included: true },
      { name: 'Statistiques basiques (blurrées)', included: true },
      { name: 'Carte de visite vidéo', included: false },
      { name: 'Personnalisation du thème', included: false },
      { name: 'Statistiques complètes', included: false },
      { name: 'Visiteurs illimités', included: false },
    ],
    cta: 'Plan actuel',
  },
  {
    id: 'PRO_DIGITAL',
    name: 'PRO_DIGITAL',
    displayName: 'PRO Digital',
    price: '3 000 FCFA',
    period: '/mois',
    popular: true,
    icon: Sparkles,
    tagline: 'Pour les professionnels',
    features: [
      { name: '3 profils numériques', included: true },
      { name: 'Carte de visite vidéo (30s)', included: true },
      { name: 'Personnalisation complète du thème', included: true },
      { name: 'Statistiques détaillées', included: true },
      { name: 'Visiteurs illimités avec localisation', included: true },
      { name: 'Upload CV illimité', included: true },
      { name: 'Support prioritaire', included: true },
      { name: 'Analyses de sources de trafic', included: true },
    ],
    cta: 'Passer au PRO',
  },
  {
    id: 'PACK_STARTER',
    name: 'PACK_STARTER',
    displayName: 'Pack Starter',
    price: '29 900 FCFA',
    period: 'Paiement unique',
    icon: Crown,
    tagline: 'PRO 1 an + Cartes physiques',
    features: [
      { name: 'Fonctionnalités PRO pendant 1 an', included: true },
      { name: '50 cartes papier avec QR Code', included: true },
      { name: '3 profils numériques', included: true },
      { name: 'Carte de visite vidéo (30s)', included: true },
      { name: 'Personnalisation complète du thème', included: true },
      { name: 'Statistiques détaillées', included: true },
      { name: 'Livraison à Abidjan incluse', included: true },
      { name: 'Design premium sur cartes', included: true },
    ],
    cta: 'Commander le Pack',
  },
  {
    id: 'CORPORATE',
    name: 'CORPORATE',
    displayName: 'Corporate',
    price: 'Sur devis',
    period: 'Contactez-nous',
    icon: Building2,
    tagline: 'Pour les entreprises',
    features: [
      { name: 'Profils illimités', included: true },
      { name: 'Gestion centralisée des équipes', included: true },
      { name: 'Tableau de bord administrateur', included: true },
      { name: 'Branding entreprise', included: true },
      { name: 'Intégration SSO (Single Sign-On)', included: true },
      { name: 'API dédiée', included: true },
      { name: 'Support dédié 24/7', included: true },
      { name: 'Formation équipe incluse', included: true },
    ],
    cta: 'Nous contacter',
  },
]

export default async function UpgradePage() {
  const session = await requireAuth()

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { subscription: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const currentPlan = user.subscription?.plan || 'FREE'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Choisissez votre plan SmartLink
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Démarquez-vous avec une carte de visite numérique professionnelle.
          Passez au PRO pour débloquer toutes les fonctionnalités.
        </p>
      </div>

      {/* Current Plan Badge */}
      {currentPlan !== 'FREE' && (
        <div className="flex justify-center">
          <Badge variant="secondary" className="text-base px-4 py-2">
            Plan actuel : {PLANS.find((p) => p.name === currentPlan)?.displayName}
          </Badge>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {PLANS.map((plan) => {
          const Icon = plan.icon
          const isCurrentPlan = currentPlan === plan.name
          const canUpgrade =
            (currentPlan === 'FREE' && plan.name !== 'FREE') ||
            (currentPlan === 'PRO_DIGITAL' && ['PACK_STARTER', 'CORPORATE'].includes(plan.name)) ||
            (currentPlan === 'PACK_STARTER' && plan.name === 'CORPORATE')

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative flex flex-col',
                plan.popular && 'border-primary shadow-lg scale-105',
                isCurrentPlan && 'border-green-600'
              )}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1 text-sm">
                    Le plus populaire
                  </Badge>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-green-600 text-white px-4 py-1 text-sm">
                    Plan actuel
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8 pt-6">
                <div className="flex justify-center mb-4">
                  <div className={cn(
                    'rounded-full p-3',
                    plan.popular ? 'bg-primary/10' : 'bg-muted'
                  )}>
                    <Icon className={cn(
                      'h-6 w-6',
                      plan.popular ? 'text-primary' : 'text-muted-foreground'
                    )} />
                  </div>
                </div>
                <CardTitle className="text-2xl mb-2">{plan.displayName}</CardTitle>
                <CardDescription className="text-sm">{plan.tagline}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground ml-2">{plan.period}</span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      )}
                      <span className={cn(
                        feature.included ? 'text-foreground' : 'text-muted-foreground'
                      )}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled
                    size="lg"
                  >
                    Plan actuel
                  </Button>
                ) : !canUpgrade ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled
                    size="lg"
                  >
                    Non disponible
                  </Button>
                ) : plan.name === 'CORPORATE' ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    size="lg"
                    asChild
                  >
                    <a href="mailto:support@smartlink.ci">{plan.cta}</a>
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                    asChild
                  >
                    <Link href={`/checkout?plan=${plan.name}`}>
                      {plan.cta}
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Comparaison détaillée des fonctionnalités</CardTitle>
            <CardDescription>
              Trouvez le plan qui correspond à vos besoins
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-4 font-medium">Fonctionnalité</th>
                    {PLANS.map((plan) => (
                      <th key={plan.id} className="text-center py-4 px-4 font-medium">
                        {plan.displayName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    'Profils numériques',
                    'QR Code personnalisé',
                    'Carte de visite vidéo',
                    'Personnalisation du thème',
                    'Statistiques complètes',
                    'Visiteurs illimités',
                  ].map((feature, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-4 px-4 font-medium text-sm">{feature}</td>
                      <td className="text-center py-4 px-4">
                        {feature === 'Profils numériques' ? '1' :
                         feature === 'QR Code personnalisé' ? <Check className="h-5 w-5 text-green-600 mx-auto" /> :
                         <X className="h-5 w-5 text-muted-foreground mx-auto" />}
                      </td>
                      <td className="text-center py-4 px-4">
                        {feature === 'Profils numériques' ? '3' :
                         <Check className="h-5 w-5 text-green-600 mx-auto" />}
                      </td>
                      <td className="text-center py-4 px-4">
                        {feature === 'Profils numériques' ? '3 + 50 cartes' :
                         <Check className="h-5 w-5 text-green-600 mx-auto" />}
                      </td>
                      <td className="text-center py-4 px-4">
                        {feature === 'Profils numériques' ? 'Illimité' :
                         <Check className="h-5 w-5 text-green-600 mx-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Questions fréquentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Comment fonctionne le paiement ?</h3>
              <p className="text-sm text-muted-foreground">
                Vous pouvez payer par Mobile Money (Orange Money, MTN Money, Moov Money) ou par carte bancaire.
                Le paiement est sécurisé par CinetPay.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Puis-je changer de plan plus tard ?</h3>
              <p className="text-sm text-muted-foreground">
                Oui, vous pouvez upgrader votre plan à tout moment. Le changement prend effet immédiatement.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Qu'est-ce que le Pack Starter inclut ?</h3>
              <p className="text-sm text-muted-foreground">
                Le Pack Starter inclut 3 profils numériques PRO + 50 cartes de visite physiques imprimées
                avec votre QR Code personnalisé. Les cartes sont livrées gratuitement à Abidjan.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Comment fonctionne le plan Corporate ?</h3>
              <p className="text-sm text-muted-foreground">
                Le plan Corporate est conçu pour les entreprises avec des besoins spécifiques. Contactez-nous
                pour obtenir un devis personnalisé adapté à la taille de votre équipe.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto">
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6 text-center space-y-4">
            <h2 className="text-2xl font-bold">Prêt à passer au niveau supérieur ?</h2>
            <p className="text-muted-foreground">
              Rejoignez des centaines de professionnels qui utilisent SmartLink pour
              développer leur réseau et optimiser leurs échanges de contacts.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" asChild>
                <a href="#pricing">Choisir un plan</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="mailto:support@smartlink.ci">Nous contacter</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
