'use client'

import { useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { createPaymentSessionAction } from '@/lib/actions/payment'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Loader2, CreditCard, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface CheckoutFormProps {
  planKey: 'PRO_DIGITAL' | 'PACK_STARTER' | 'CORPORATE'
  planName: string
  amount: number
  userEmail: string
  userName?: string
}

const MOBILE_MONEY_OPERATORS = [
  {
    id: 'orange',
    name: 'Orange Money',
    description: 'Paiement via Orange Money',
    color: 'bg-orange-100 border-orange-300',
  },
  {
    id: 'mtn',
    name: 'MTN Mobile Money',
    description: 'Paiement via MTN',
    color: 'bg-yellow-100 border-yellow-300',
  },
  {
    id: 'moov',
    name: 'Moov Money',
    description: 'Paiement via Moov',
    color: 'bg-blue-100 border-blue-300',
  },
  {
    id: 'wave',
    name: 'Wave',
    description: 'Paiement via Wave',
    color: 'bg-purple-100 border-purple-300',
  },
]

export function CheckoutForm({
  planKey,
  planName,
  amount,
  userEmail,
  userName,
}: CheckoutFormProps) {
  const router = useRouter()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [operator, setOperator] = useState('orange')

  const { execute, isExecuting } = useAction(createPaymentSessionAction, {
    onSuccess: ({ data }) => {
      if (data?.paymentUrl) {
        toast.success('Redirection vers la page de paiement...')
        // Redirect to CinetPay payment page
        window.location.href = data.paymentUrl
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Erreur lors de l\'initialisation du paiement')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate phone number
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Veuillez entrer un numéro de téléphone valide')
      return
    }

    // Execute payment action
    execute({
      plan: planKey,
      phoneNumber,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Informations de paiement
        </CardTitle>
        <CardDescription>
          Complétez les informations pour procéder au paiement
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Info (pre-filled) */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userEmail}
                disabled
                className="bg-muted"
              />
            </div>

            {userName && (
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  type="text"
                  value={userName}
                  disabled
                  className="bg-muted"
                />
              </div>
            )}
          </div>

          {/* Mobile Money Operator Selection */}
          <div className="space-y-3">
            <Label>Opérateur Mobile Money</Label>
            <RadioGroup value={operator} onValueChange={(value) => setOperator(value as string)}>
              <div className="grid grid-cols-1 gap-3">
                {MOBILE_MONEY_OPERATORS.map((op) => (
                  <div key={op.id}>
                    <RadioGroupItem value={op.id} id={op.id} className="sr-only" />
                    <Label
                      htmlFor={op.id}
                      className={`flex items-center justify-between rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-accent ${
                        operator === op.id
                          ? 'border-primary bg-primary/5'
                          : 'border-muted'
                      }`}
                    >
                      <div>
                        <p className="font-medium">{op.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {op.description}
                        </p>
                      </div>
                      {operator === op.id && (
                        <div className="h-4 w-4 rounded-full bg-primary" />
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">
              Numéro de téléphone Mobile Money
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+225 07 08 09 10 11"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              disabled={isExecuting}
            />
            <p className="text-xs text-muted-foreground">
              Le numéro associé à votre compte {operator === 'orange' && 'Orange Money'}
              {operator === 'mtn' && 'MTN Mobile Money'}
              {operator === 'moov' && 'Moov Money'}
              {operator === 'wave' && 'Wave'}
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isExecuting}
          >
            {isExecuting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initialisation du paiement...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Payer {amount.toLocaleString()} FCFA
              </>
            )}
          </Button>

          {/* Security Notice */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p className="font-medium mb-1">Paiement 100% sécurisé</p>
            <p className="text-xs">
              Vous serez redirigé vers CinetPay pour finaliser votre paiement.
              Votre abonnement sera activé automatiquement après confirmation du paiement.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
