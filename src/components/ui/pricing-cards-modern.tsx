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
    <div className="flex flex-col md:flex-row md:items-end justify-center gap-6 md:gap-0 px-4 sm:px-6 md:px-8 pb-12 md:pb-20 mt-8 md:mt-12">
      {plans.map((plan, index) => {
        // Tailles progressives : Free (petite), Pro (grande - highlighted), Starter (moyenne)
        const isHighlighted = plan.highlighted
        const heightClass = isHighlighted
          ? 'md:min-h-[580px]' // Pro - la plus grande (desktop only)
          : index === 0
            ? 'md:min-h-[520px]' // Free - petite (desktop only)
            : 'md:min-h-[550px]' // Starter - moyenne (desktop only)

        // Margins pour le chevauchement - overlap minimal pour tout voir (desktop only)
        const marginClass = index === 0
          ? '' // Première carte : pas de marge
          : index === 1
            ? 'md:-ml-4' // Carte du milieu : chevauche minimalement la première (desktop only)
            : 'md:-ml-4' // Dernière carte : chevauche minimalement la deuxième (desktop only)

        return (
          <div
            key={plan.name}
            className={cn(
              'relative w-full max-w-sm p-6 sm:p-8 transition-all duration-300 rounded-2xl flex-shrink-0',
              isHighlighted
                ? 'bg-card text-foreground md:scale-105 shadow-2xl border-2 border-primary md:z-10'
                : 'bg-card/50 text-foreground border border-border md:z-0',
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
            <div className="mb-5 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-primary">
                {plan.name}
              </h3>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-4xl sm:text-5xl font-bold">
                  {plan.price.split(' ')[0]}
                </span>
                <span className="text-lg sm:text-xl">
                  {plan.price.split(' ')[1]}
                </span>
                {plan.period && (
                  <span className="text-xs sm:text-sm ml-1 text-muted-foreground">
                    {plan.period}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-muted-foreground">
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
