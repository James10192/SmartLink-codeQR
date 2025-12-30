'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductFeature {
  text: string
  included: boolean
}

interface ProductCardProps {
  id: string
  name: string
  price: number
  period: string
  description: string
  features: ProductFeature[]
  badge?: string
  badgeVariant?: 'default' | 'success' | 'warning'
  recommended?: boolean
  selected?: boolean
  onSelect?: () => void
}

export function ProductCard({
  id,
  name,
  price,
  period,
  description,
  features,
  badge,
  badgeVariant = 'default',
  recommended = false,
  selected = false,
  onSelect,
}: ProductCardProps) {
  const getBadgeColor = () => {
    switch (badgeVariant) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
      case 'warning':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200'
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
    }
  }

  return (
    <Card
      data-product={id}
      className={cn(
        'relative cursor-pointer transition-all hover:shadow-lg',
        recommended && 'border-2 border-primary',
        selected && 'ring-2 ring-primary ring-offset-2'
      )}
      onClick={onSelect}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold shadow-sm',
              getBadgeColor()
            )}
          >
            {badge}
          </span>
        </div>
      )}

      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">{name}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>

        {/* Price */}
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-4xl font-bold">{price.toLocaleString('fr-FR')}</span>
          <span className="text-lg text-muted-foreground">FCFA</span>
          {period && <span className="text-sm text-muted-foreground">{period}</span>}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Features list */}
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check
                className={cn(
                  'mt-0.5 h-5 w-5 shrink-0',
                  feature.included ? 'text-green-500' : 'text-muted-foreground/30'
                )}
              />
              <span
                className={cn(
                  'text-sm',
                  feature.included ? 'text-foreground' : 'text-muted-foreground line-through'
                )}
              >
                {feature.text}
              </span>
            </li>
          ))}
        </ul>

        {/* Selection indicator */}
        {selected && (
          <div className="mt-4 rounded-lg bg-primary/10 p-2 text-center text-sm font-medium text-primary">
            Sélectionné
          </div>
        )}
      </CardContent>
    </Card>
  )
}
