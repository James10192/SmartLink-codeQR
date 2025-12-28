import { Suspense } from 'react'
import { PaymentSuccessContent } from './payment-success-content'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface PaymentSuccessPageProps {
  searchParams: Promise<{
    transaction_id?: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function PaymentSuccessPage({
  searchParams,
}: PaymentSuccessPageProps) {
  const params = await searchParams
  const transactionId = params.transaction_id

  if (!transactionId) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-destructive">
                Transaction non trouvée
              </h1>
              <p className="text-muted-foreground mt-2">
                Aucun identifiant de transaction n'a été fourni.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <Suspense
        fallback={
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="mt-4 text-muted-foreground">
                  Vérification du paiement en cours...
                </p>
              </div>
            </CardContent>
          </Card>
        }
      >
        <PaymentSuccessContent transactionId={transactionId} />
      </Suspense>
    </div>
  )
}
