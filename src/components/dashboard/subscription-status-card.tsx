'use client'

import { Subscription, SubscriptionPlan, SubscriptionStatus } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, AlertCircle, Clock, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { getDaysUntilExpiration } from '@/lib/utils/tier-enforcement'

interface SubscriptionStatusCardProps {
  subscription: Subscription | null
}

export function SubscriptionStatusCard({ subscription }: SubscriptionStatusCardProps) {
  // FREE plan (no subscription)
  if (!subscription) {
    return (
      <Card className="border-2 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Abonnement Gratuit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Vous êtes actuellement sur le plan gratuit. Passez à PRO pour débloquer toutes les
            fonctionnalités.
          </p>
          <Button asChild className="w-full">
            <Link href="/dashboard/upgrade">
              Passer au PRO
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { plan, status, expiresAt } = subscription
  const daysLeft = getDaysUntilExpiration(subscription)

  // Determine card styling based on status and days left
  const getCardStyle = () => {
    if (status === 'EXPIRED') {
      return 'border-red-500 border-2'
    }
    if (status === 'CANCELLED') {
      return 'border-orange-500 border-2'
    }
    if (daysLeft !== null && daysLeft <= 3) {
      return 'border-orange-500 border-2'
    }
    if (daysLeft !== null && daysLeft <= 7) {
      return 'border-yellow-500 border-2'
    }
    return 'border-green-500 border-2'
  }

  const getStatusIcon = () => {
    if (status === 'EXPIRED') {
      return <AlertCircle className="h-5 w-5 text-red-500" />
    }
    if (status === 'CANCELLED') {
      return <AlertCircle className="h-5 w-5 text-orange-500" />
    }
    if (status === 'ACTIVE') {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }
    return <Clock className="h-5 w-5 text-muted-foreground" />
  }

  const getStatusText = () => {
    if (status === 'EXPIRED') {
      return 'Expiré'
    }
    if (status === 'CANCELLED') {
      return 'Annulé (actif jusqu\'à expiration)'
    }
    if (status === 'ACTIVE') {
      return 'Actif'
    }
    return status
  }

  const getPlanName = (plan: SubscriptionPlan): string => {
    const names: Record<SubscriptionPlan, string> = {
      FREE: 'Gratuit',
      PRO_DIGITAL: 'Pro',
      PACK_STARTER: 'Pack Starter',
      CORPORATE: 'Corporate',
    }
    return names[plan]
  }

  // Calculate progress percentage
  const getProgressPercentage = (): number => {
    if (!expiresAt || daysLeft === null) return 0

    const now = new Date()
    const startDate = new Date(expiresAt)
    startDate.setMonth(startDate.getMonth() - (plan === 'PRO_DIGITAL' ? 1 : 12))

    const totalDuration = expiresAt.getTime() - startDate.getTime()
    const elapsed = now.getTime() - startDate.getTime()

    return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))
  }

  return (
    <Card className={getCardStyle()}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span>{getPlanName(plan)}</span>
          </div>
          <span className="text-sm font-normal text-muted-foreground">{getStatusText()}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {expiresAt && daysLeft !== null && status === 'ACTIVE' && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Jours restants</span>
                <span
                  className={`font-semibold ${
                    daysLeft <= 3
                      ? 'text-red-500'
                      : daysLeft <= 7
                        ? 'text-orange-500'
                        : 'text-green-500'
                  }`}
                >
                  {daysLeft} {daysLeft === 1 ? 'jour' : 'jours'}
                </span>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
            </div>

            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="text-muted-foreground">
                Expire le{' '}
                <span className="font-semibold text-foreground">
                  {expiresAt.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </p>
            </div>
          </>
        )}

        {status === 'EXPIRED' && (
          <>
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
              <p className="font-semibold">Votre abonnement a expiré</p>
              <p className="mt-1 text-xs">
                Vos QR codes sont désactivés. Renouvelez dans les 30 jours pour tout récupérer.
              </p>
            </div>
            <Button asChild variant="destructive" className="w-full">
              <Link href="/dashboard/upgrade">
                Réactiver maintenant
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </>
        )}

        {status === 'CANCELLED' && expiresAt && (
          <>
            <div className="rounded-lg bg-orange-50 p-3 text-sm text-orange-800 dark:bg-orange-950 dark:text-orange-200">
              <p className="font-semibold">Abonnement annulé</p>
              <p className="mt-1 text-xs">
                Vous conservez l'accès jusqu'au{' '}
                {expiresAt.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/upgrade">Renouveler l'abonnement</Link>
            </Button>
          </>
        )}

        {status === 'ACTIVE' && daysLeft !== null && daysLeft <= 7 && (
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard/upgrade">
              Renouveler maintenant
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}

        {status === 'ACTIVE' && plan !== 'PACK_STARTER' && plan !== 'CORPORATE' && (
          <Button asChild variant="default" className="w-full">
            <Link href="/dashboard/upgrade">
              Mettre à niveau
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
