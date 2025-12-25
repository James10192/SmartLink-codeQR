'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle, ArrowRight, Mail } from 'lucide-react'

interface PricingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planName: string
  price: string
  features: string[]
  planType: 'freemium' | 'pro' | 'starter'
}

export function PricingDialog({
  open,
  onOpenChange,
  planName,
  price,
  features,
  planType,
}: PricingDialogProps) {
  const router = useRouter()

  const handleSignup = () => {
    router.push('/signup')
  }

  const handleSubscribe = () => {
    // TODO: Integrate with payment gateway (CinetPay/Lemon Squeezy)
    console.log(`Subscribe to ${planName}`)
    // For now, redirect to signup
    router.push(`/signup?plan=${planType}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{planName}</DialogTitle>
          <DialogDescription>
            <span className="text-3xl font-bold text-foreground">{price}</span>
            <span className="text-muted-foreground">/mois</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Features List */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Fonctionnalités incluses
            </h4>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            {planType === 'freemium' ? (
              <>
                <Button
                  onClick={handleSignup}
                  className="w-full bg-cyan-400 hover:bg-cyan-300 text-black"
                  size="lg"
                >
                  Créer un compte gratuit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={() => {
                    onOpenChange(false)
                    // Trigger scroll to contact section
                    const contactSection = document.querySelector('[class*="Contact Section"]')
                    if (contactSection) {
                      contactSection.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Nous contacter
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleSubscribe}
                  className="w-full bg-cyan-400 hover:bg-cyan-300 text-black"
                  size="lg"
                >
                  Souscrire maintenant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Paiement sécurisé via Mobile Money ou Carte Bancaire
                </p>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
