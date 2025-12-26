import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function PaymentCancelPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardHeader>
          <div className="flex items-center justify-center">
            <XCircle className="h-16 w-16 text-yellow-600" />
          </div>
          <CardTitle className="text-center text-2xl">
            Paiement annulé
          </CardTitle>
          <CardDescription className="text-center text-base">
            Vous avez annulé le processus de paiement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-white rounded-lg p-6 border border-yellow-200">
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">
                Aucun montant n'a été débité de votre compte.
              </p>
              <p className="text-sm text-muted-foreground">
                Vous pouvez réessayer le paiement à tout moment.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full" size="lg">
              <Link href="/dashboard/upgrade">
                <RefreshCw className="mr-2 h-4 w-4" />
                Réessayer le paiement
              </Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour au tableau de bord
              </Link>
            </Button>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">Besoin d'aide ?</p>
            <p className="text-xs text-muted-foreground">
              Si vous rencontrez des difficultés pour effectuer le paiement,
              n'hésitez pas à contacter notre support à{' '}
              <a href="mailto:support@smartlink.ci" className="text-primary hover:underline">
                support@smartlink.ci
              </a>
            </p>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              💡 Astuce : Assurez-vous d'avoir un solde suffisant sur votre compte Mobile Money
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
