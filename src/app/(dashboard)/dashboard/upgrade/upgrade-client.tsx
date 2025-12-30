'use client'

import { useState } from 'react'
import { ProductCard } from '@/components/upgrade/product-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Smartphone, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { type LemonSqueezyProduct } from '@/lib/payments/lemonsqueezy'

interface UpgradePageClientProps {
  userId: string
  userEmail: string | null
}

export function UpgradePageClient({ userId, userEmail }: UpgradePageClientProps) {
  const [selectedProduct, setSelectedProduct] = useState<LemonSqueezyProduct>('PRO_YEARLY')
  const [isLoading, setIsLoading] = useState(false)

  const products = [
    {
      id: 'PRO_MONTHLY' as LemonSqueezyProduct,
      name: 'Pro Monthly',
      price: 3000,
      period: '/mois',
      description: 'Renouvellement automatique mensuel',
      features: [
        { text: '3 profils personnalisés', included: true },
        { text: 'QR codes dynamiques illimités', included: true },
        { text: 'Vidéo de présentation', included: true },
        { text: 'Statistiques détaillées', included: true },
        { text: 'Personnalisation du design', included: true },
      ],
    },
    {
      id: 'PRO_YEARLY' as LemonSqueezyProduct,
      name: 'Pro Yearly',
      price: 30000,
      period: '/an',
      description: 'Économisez 6 000 FCFA par an',
      badge: 'Économie 20%',
      badgeVariant: 'success' as const,
      recommended: true,
      features: [
        { text: '3 profils personnalisés', included: true },
        { text: 'QR codes dynamiques illimités', included: true },
        { text: 'Vidéo de présentation', included: true },
        { text: 'Statistiques détaillées', included: true },
        { text: 'Personnalisation du design', included: true },
        { text: 'Économisez 6 000 FCFA', included: true },
      ],
    },
    {
      id: 'PACK_STARTER' as LemonSqueezyProduct,
      name: 'Pack Starter',
      price: 29900,
      period: '',
      description: '1 an PRO + 50 cartes papier QR',
      badge: 'Meilleure offre',
      badgeVariant: 'warning' as const,
      features: [
        { text: 'Tout de Pro Yearly', included: true },
        { text: '50 cartes papier avec QR code', included: true },
        { text: 'Design professionnel personnalisé', included: true },
        { text: 'Livraison incluse (Abidjan)', included: true },
      ],
    },
  ]

  async function handleCheckout() {
    if (!selectedProduct) {
      toast.error('Veuillez sélectionner un produit')
      return
    }

    setIsLoading(true)

    try {
      // Call server action to initialize checkout
      const response = await fetch('/api/checkout/lemon-squeezy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          product: selectedProduct,
          userEmail: userEmail || undefined,
        }),
      })

      const data = await response.json()

      if (!data.success || !data.checkoutUrl) {
        throw new Error(data.error || 'Failed to create checkout')
      }

      // Redirect to Lemon Squeezy checkout
      window.location.href = data.checkoutUrl
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Erreur lors de l\'initialisation du paiement')
      setIsLoading(false)
    }
  }

  const selectedProductData = products.find((p) => p.id === selectedProduct)

  return (
    <div className="container max-w-6xl space-y-8 py-8">
      {/* Header */}
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Choisissez votre plan</h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Débloquez toutes les fonctionnalités de SmartLink
        </p>
      </div>

      {/* Product Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            {...product}
            selected={selectedProduct === product.id}
            onSelect={() => setSelectedProduct(product.id)}
          />
        ))}
      </div>

      {/* Payment Methods Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Méthode de paiement</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Card Payment - Available */}
          <Card
            data-payment-method="card"
            className="cursor-pointer border-2 border-primary transition-all hover:shadow-md"
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CreditCard className="mt-1 h-6 w-6 text-primary" />
                <div className="flex-1">
                  <p className="font-semibold">Carte bancaire</p>
                  <p className="text-sm text-muted-foreground">Visa, Mastercard, Amex</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Money - Coming Soon */}
          <Card
            data-payment-method="mobile_money"
            className="relative cursor-not-allowed border-2 border-muted opacity-50"
          >
            <Badge
              variant="secondary"
              className="absolute right-2 top-2 bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200"
            >
              Bientôt
            </Badge>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Smartphone className="mt-1 h-6 w-6" />
                <div className="flex-1">
                  <p className="font-semibold">Mobile Money / Wave</p>
                  <p className="text-sm text-muted-foreground">Orange, MTN, Moov, Wave</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Les paiements Mobile Money seront disponibles très bientôt
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Button */}
      <div className="flex flex-col items-center gap-4">
        <Button
          size="lg"
          className="w-full sm:w-auto sm:min-w-[320px]"
          onClick={handleCheckout}
          disabled={isLoading}
        >
          {isLoading ? (
            'Chargement...'
          ) : (
            <>
              Payer {selectedProductData?.price.toLocaleString('fr-FR')} FCFA
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Paiement sécurisé par Lemon Squeezy • Annulation possible à tout moment
        </p>
      </div>
    </div>
  )
}
