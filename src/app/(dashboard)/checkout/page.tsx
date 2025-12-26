import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { redirect } from 'next/navigation'
import { CheckoutForm } from './checkout-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface CheckoutPageProps {
  searchParams: Promise<{
    plan?: string
  }>
}

const PLANS = {
  PRO_DIGITAL: {
    name: 'PRO Digital',
    price: 9900,
    period: '/mois',
    features: [
      '3 profils numériques',
      'Carte de visite vidéo (30s)',
      'Personnalisation complète du thème',
      'Statistiques détaillées',
      'Visiteurs illimités avec localisation',
    ],
  },
  PACK_STARTER: {
    name: 'Pack Starter',
    price: 29900,
    period: 'Une fois',
    features: [
      '3 profils numériques',
      '50 cartes papier avec QR Code',
      'Toutes les fonctionnalités PRO',
      'Livraison à Abidjan incluse',
      'Design premium sur cartes',
    ],
  },
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const session = await requireAuth()
  const params = await searchParams

  const planKey = params.plan as 'PRO_DIGITAL' | 'PACK_STARTER' | undefined

  if (!planKey || !PLANS[planKey]) {
    redirect('/dashboard/upgrade')
  }

  const plan = PLANS[planKey]

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      name: true,
      subscription: true,
    },
  })

  if (!user) {
    redirect('/login')
  }

  // Check if user already has this plan
  if (user.subscription?.plan === planKey) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/dashboard/upgrade">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux plans
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Summary */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Finaliser la commande</h1>
            <p className="text-muted-foreground mt-2">
              Vous êtes à un clic de débloquer toutes les fonctionnalités !
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                <Badge variant="default" className="text-base">
                  {plan.price.toLocaleString()} FCFA
                </Badge>
              </div>
              <CardDescription>Résumé de votre commande</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total</span>
                  <span className="text-2xl font-bold">
                    {plan.price.toLocaleString()} FCFA
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {plan.period === '/mois' ? 'Renouvelé automatiquement chaque mois' : 'Paiement unique'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security badges */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-600" />
                <span>Paiement 100% sécurisé</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>Activation immédiate après paiement</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>Support client 7j/7</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Checkout Form */}
        <div>
          <CheckoutForm
            planKey={planKey}
            planName={plan.name}
            amount={plan.price}
            userEmail={user.email}
            userName={user.name || undefined}
          />
        </div>
      </div>
    </div>
  )
}
