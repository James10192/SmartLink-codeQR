'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { MapPin, Clock, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface Visitor {
  id: string
  city: string | null
  country: string | null
  countryCode: string | null
  visitedAt: Date
  referrer: string | null
}

interface VisitorListProps {
  visitors: Visitor[]
  isPro: boolean
  profileName: string
}

/**
 * Display visitor list with FOMO blur logic for FREE users
 * - FREE: Show 3 last visitors (blurred) + upgrade CTA
 * - PRO+: Show all visitors with full details
 */
export function VisitorList({ visitors, isPro, profileName }: VisitorListProps) {
  const displayedVisitors = isPro ? visitors : visitors.slice(0, 3)
  const hiddenCount = visitors.length - displayedVisitors.length

  if (visitors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>Visiteurs récents</span>
            {!isPro && <Badge variant="secondary">FREE: 3 derniers</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Aucun visiteur pour le moment</p>
            <p className="text-xs mt-1">
              Partagez votre profil <span className="font-medium">{profileName}</span> pour voir
              qui le consulte
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>
            Visiteurs récents <span className="text-muted-foreground">({visitors.length})</span>
          </span>
          {!isPro && <Badge variant="secondary">FREE: 3 derniers</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Visitor cards */}
        <div className="space-y-2">
          {displayedVisitors.map((visitor, index) => {
            const isBlurred = !isPro

            return (
              <div
                key={visitor.id}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 transition-all',
                  isBlurred && 'blur-sm select-none'
                )}
              >
                {/* Flag emoji */}
                {visitor.countryCode && (
                  <div className="flex-shrink-0 text-2xl" aria-label={visitor.country || 'Unknown'}>
                    {getFlagEmoji(visitor.countryCode)}
                  </div>
                )}

                {/* Location and time */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <p className="font-medium text-sm truncate">
                      {visitor.city && visitor.country
                        ? `${visitor.city}, ${visitor.country}`
                        : visitor.country || 'Lieu inconnu'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    <span>
                      {formatDistanceToNow(new Date(visitor.visitedAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>
                  {visitor.referrer && isPro && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        depuis {new URL(visitor.referrer).hostname}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* FOMO upgrade CTA for FREE users */}
        {!isPro && hiddenCount > 0 && (
          <div className="mt-4 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-center">
            <p className="text-sm font-medium mb-1">
              {hiddenCount} visiteur{hiddenCount > 1 ? 's' : ''} masqué{hiddenCount > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Débloquez tous les visiteurs et découvrez qui consulte votre profil
            </p>
            <Button asChild size="sm" className="w-full">
              <Link href="/dashboard/upgrade">Passer au PRO</Link>
            </Button>
          </div>
        )}

        {/* Hint for FREE users with no hidden visitors */}
        {!isPro && hiddenCount === 0 && visitors.length === 3 && (
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground mb-2">
              Passez au PRO pour voir tous vos visiteurs sans limite
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/upgrade">Découvrir PRO</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Get flag emoji from ISO country code
 * Example: "FR" → "🇫🇷", "CI" → "🇨🇮"
 */
function getFlagEmoji(countryCode: string): string {
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
  } catch {
    return '🌍' // Fallback to globe emoji
  }
}
