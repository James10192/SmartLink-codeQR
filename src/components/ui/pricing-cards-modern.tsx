'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PricingPlan {
  name: string
  badge?: string
  price: string
  period?: string
  description: string
  features: string[]
  buttonText: string
  buttonVariant: 'outline' | 'primary'
  highlighted?: boolean
  onButtonClick: () => void
}

interface PricingCardsModernProps {
  plans: PricingPlan[]
}

export default function PricingCardsModern({ plans }: PricingCardsModernProps) {
  return (
    <div className="flex items-end justify-center px-8 pb-20 mt-12">
      {plans.map((plan, index) => {
        // Tailles progressives : Free (petite), Pro (grande - highlighted), Starter (moyenne)
        const isHighlighted = plan.highlighted
        const heightClass = isHighlighted
          ? 'min-h-[580px]' // Pro - la plus grande
          : index === 0
            ? 'min-h-[520px]' // Free - petite
            : 'min-h-[550px]' // Starter - moyenne

        // Margins pour le chevauchement - overlap minimal pour tout voir
        const marginClass = index === 0
          ? '' // Première carte : pas de marge
          : index === 1
            ? '-ml-4' // Carte du milieu : chevauche minimalement la première
            : '-ml-4' // Dernière carte : chevauche minimalement la deuxième

        return (
          <div
            key={plan.name}
            className={cn(
              'relative w-full max-w-sm p-8 transition-all duration-300 rounded-2xl flex-shrink-0',
              isHighlighted
                ? 'bg-card text-foreground scale-105 shadow-2xl border-2 border-primary z-10'
                : 'bg-card/50 text-foreground border border-border z-0',
              heightClass,
              marginClass
            )}
          >
            {/* Badge */}
            {plan.badge && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                  {plan.badge}
                </span>
              </div>
            )}

            {/* Plan Name */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-primary">
                {plan.name}
              </h3>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-5xl font-bold">
                  {plan.price.split(' ')[0]}
                </span>
                <span className="text-xl">
                  {plan.price.split(' ')[1]}
                </span>
                {plan.period && (
                  <span className="text-sm ml-1 text-muted-foreground">
                    {plan.period}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground">
                {plan.description}
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 mt-0.5 text-primary" />
                  <span className="text-sm">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* Button */}
            <button
              onClick={plan.onButtonClick}
              className={cn(
                "w-full py-3 px-6 rounded-lg font-semibold transition-colors",
                plan.buttonVariant === 'primary'
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {plan.buttonText}
            </button>
          </div>
        )
      })}
    </div>
  )
}
