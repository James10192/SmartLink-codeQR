import { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LockedFeatureCardProps {
  title: string
  description?: string
  icon?: ReactNode
  features?: string[]
  badgeText?: string
  className?: string
  upgradeUrl?: string
}

/**
 * Locked Feature Card Component
 *
 * Displays a feature that's locked for FREE users with an upgrade CTA
 * Used to create FOMO and encourage upgrades to PRO
 *
 * @example
 * ```tsx
 * <LockedFeatureCard
 *   title="Carte de Visite Vidéo"
 *   description="Présentez-vous en 30 secondes"
 *   icon={<Video className="h-6 w-6" />}
 *   features={[
 *     'Vidéo autoplay sur profil',
 *     'Format MP4, WebM, MOV',
 *     'Maximum 30 secondes'
 *   ]}
 * />
 * ```
 */
export function LockedFeatureCard({
  title,
  description,
  icon,
  features,
  badgeText = 'PRO+',
  className,
  upgradeUrl = '/dashboard/upgrade',
}: LockedFeatureCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm z-10" />

      {/* Content */}
      <CardHeader className="relative z-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="rounded-full bg-primary/10 p-3 flex-shrink-0">{icon}</div>
            )}
            <div>
              <CardTitle className="flex items-center gap-2">
                {title}
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {badgeText}
                </Badge>
              </CardTitle>
              {description && (
                <CardDescription className="mt-1">{description}</CardDescription>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-0 space-y-4">
        {features && features.length > 0 && (
          <ul className="space-y-2 text-sm">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="relative z-20 pt-2">
          <Button asChild className="w-full">
            <Link href={upgradeUrl}>Passer au PRO</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Compact Locked Feature Card
 * Smaller variant for inline features
 */
export function LockedFeatureCardCompact({
  title,
  description,
  upgradeUrl = '/dashboard/upgrade',
  className,
}: Pick<LockedFeatureCardProps, 'title' | 'description' | 'upgradeUrl' | 'className'>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center',
        className
      )}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm z-10" />

      {/* Content */}
      <div className="relative z-0 space-y-3">
        <div className="rounded-full bg-primary/10 p-3 inline-flex">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h4 className="font-medium text-base mb-1">{title}</h4>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="relative z-20">
          <Button asChild size="sm">
            <Link href={upgradeUrl}>Débloquer PRO</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
