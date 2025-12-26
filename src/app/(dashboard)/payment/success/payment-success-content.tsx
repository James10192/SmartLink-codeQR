'use client'

import { useEffect, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { verifyPaymentAction } from '@/lib/actions/payment'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PaymentSuccessContentProps {
  transactionId: string
}

export function PaymentSuccessContent({ transactionId }: PaymentSuccessContentProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  const { execute, result, isExecuting } = useAction(verifyPaymentAction)

  useEffect(() => {
    // Verify payment on mount
    execute({ transactionId })
  }, [execute, transactionId])

  useEffect(() => {
    // Auto-redirect countdown after successful payment
    if (result?.data?.success && result?.data?.status === 'COMPLETED') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            router.push('/dashboard')
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [result, router])

  // Loading state
  if (isExecuting) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Vérification du paiement...</h2>
              <p className="text-muted-foreground mt-2">
                Veuillez patienter pendant que nous confirmons votre paiement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Success state
  if (result?.data?.success && result?.data?.status === 'COMPLETED') {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <div className="flex items-center justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-center text-2xl">
            Paiement confirmé !
          </CardTitle>
          <CardDescription className="text-center text-base">
            Votre abonnement a été activé avec succès
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono font-medium">{transactionId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Statut</span>
                <span className="font-medium text-green-600">Confirmé</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-center text-muted-foreground">
              Redirection automatique dans {countdown} seconde{countdown > 1 ? 's' : ''}...
            </p>
            <Button asChild className="w-full" size="lg">
              <Link href="/dashboard">
                Accéder au tableau de bord
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Merci pour votre confiance ! 🎉
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Failed state
  if (result?.data?.status === 'FAILED') {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <div className="flex items-center justify-center">
            <XCircle className="h-16 w-16 text-red-600" />
          </div>
          <CardTitle className="text-center text-2xl">
            Paiement échoué
          </CardTitle>
          <CardDescription className="text-center text-base">
            {result.data.message || 'Une erreur est survenue lors du paiement'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-white rounded-lg p-4 border border-red-200">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono font-medium">{transactionId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Statut</span>
                <span className="font-medium text-red-600">Échoué</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full" size="lg" variant="default">
              <Link href="/dashboard/upgrade">
                Réessayer le paiement
              </Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/dashboard">
                Retour au tableau de bord
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Si le problème persiste, contactez notre support.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  return (
    <Card className="border-yellow-200 bg-yellow-50/50">
      <CardHeader>
        <div className="flex items-center justify-center">
          <XCircle className="h-16 w-16 text-yellow-600" />
        </div>
        <CardTitle className="text-center text-2xl">
          Erreur de vérification
        </CardTitle>
        <CardDescription className="text-center text-base">
          Impossible de vérifier le statut du paiement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-white rounded-lg p-4 border border-yellow-200">
          <p className="text-sm text-muted-foreground text-center">
            Transaction ID: <span className="font-mono font-medium">{transactionId}</span>
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => execute({ transactionId })}
            className="w-full"
            size="lg"
          >
            Réessayer la vérification
          </Button>
          <Button asChild className="w-full" variant="outline">
            <Link href="/dashboard">
              Retour au tableau de bord
            </Link>
          </Button>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Votre paiement peut être en cours de traitement. Vérifiez à nouveau dans quelques minutes.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
