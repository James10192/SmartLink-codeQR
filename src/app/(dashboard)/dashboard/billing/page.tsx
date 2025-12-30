import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { SubscriptionStatusCard } from '@/components/dashboard/subscription-status-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PaymentStatus, SubscriptionPlan } from '@prisma/client'
import { formatDistance } from 'date-fns'
import { fr } from 'date-fns/locale'

export const metadata: Metadata = {
  title: 'Facturation',
  description: 'Gérez votre abonnement et consultez votre historique de paiements',
}

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  const session = await requireAuth()

  // Fetch user with subscription and payment history
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscription: true,
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  function getStatusBadgeVariant(status: PaymentStatus): 'default' | 'secondary' | 'destructive' {
    switch (status) {
      case 'COMPLETED':
        return 'default'
      case 'PENDING':
        return 'secondary'
      case 'FAILED':
      case 'CANCELLED':
      case 'REFUNDED':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  function getStatusText(status: PaymentStatus): string {
    const statusTexts: Record<PaymentStatus, string> = {
      PENDING: 'En attente',
      COMPLETED: 'Payé',
      FAILED: 'Échoué',
      CANCELLED: 'Annulé',
      REFUNDED: 'Remboursé',
    }
    return statusTexts[status]
  }

  function getPlanName(plan: SubscriptionPlan): string {
    const planNames: Record<SubscriptionPlan, string> = {
      FREE: 'Gratuit',
      PRO_DIGITAL: 'Pro',
      PACK_STARTER: 'Pack Starter',
      CORPORATE: 'Corporate',
    }
    return planNames[plan]
  }

  return (
    <div className="container max-w-5xl space-y-8 py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Facturation</h1>
        <p className="text-muted-foreground">
          Gérez votre abonnement et consultez votre historique de paiements
        </p>
      </div>

      {/* Subscription Status Card */}
      <SubscriptionStatusCard subscription={user.subscription} />

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des paiements</CardTitle>
          <CardDescription>
            Consultez tous vos paiements effectués sur SmartLink
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user.payments.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Aucun paiement enregistré</p>
            </div>
          ) : (
            <div className="overflow-x-auto" data-testid="table-container">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden md:table-cell">ID Transaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>
                            {payment.paidAt?.toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            }) ||
                              payment.createdAt.toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistance(payment.createdAt, new Date(), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getPlanName(payment.plan)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {payment.amount.toLocaleString('fr-FR')} {payment.currency}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {payment.provider === 'LEMONSQUEEZY' && 'Carte'}
                          {payment.provider === 'CINETPAY' && 'Mobile Money'}
                          {payment.provider !== 'LEMONSQUEEZY' &&
                            payment.provider !== 'CINETPAY' &&
                            payment.provider}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(payment.status)}>
                          {getStatusText(payment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                        {payment.transactionId.substring(0, 16)}...
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Besoin d'aide ?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Questions sur votre facture ?</h3>
            <p className="text-sm text-muted-foreground">
              Contactez notre équipe support à{' '}
              <a href="mailto:support@smartlink.ci" className="text-primary hover:underline">
                support@smartlink.ci
              </a>
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Problème de paiement ?</h3>
            <p className="text-sm text-muted-foreground">
              Si vous rencontrez des difficultés avec votre paiement, vérifiez que votre méthode
              de paiement est valide et réessayez. En cas de problème persistant, contactez-nous.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
