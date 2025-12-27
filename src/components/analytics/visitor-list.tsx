'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'
import { MapPin, Clock, ExternalLink, User, Mail, Phone } from 'lucide-react'
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
  visitorName: string | null
  visitorContact: string | null
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
    <div className="space-y-3 p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-sm">
          Visiteurs récents <span className="text-muted-foreground font-normal">({visitors.length})</span>
        </h4>
        {!isPro && <Badge variant="secondary">FREE: 3 derniers</Badge>}
      </div>
        {/* Visitor cards */}
        <div className="space-y-3">
          {displayedVisitors.map((visitor, index) => {
            // FREE users can see the first 3 visitors WITHOUT blur
            const shouldBlur = false // Never blur for FREE users showing last 3

            // Get initials for avatar
            const initials = visitor.visitorName
              ? visitor.visitorName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : '?'

            return (
              <div
                key={visitor.id}
                className="flex items-start gap-4 rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors"
              >
                {/* Avatar with flag or initials */}
                <Avatar className="h-12 w-12 border-2">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {visitor.countryCode ? getFlagEmoji(visitor.countryCode) : initials}
                  </AvatarFallback>
                </Avatar>

                {/* Visitor info */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Name or Anonymous */}
                  <div className="flex items-center gap-2">
                    {visitor.visitorName ? (
                      <>
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <p className="font-semibold text-sm truncate">{visitor.visitorName}</p>
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <p className="font-medium text-sm text-muted-foreground italic">Visiteur anonyme</p>
                      </>
                    )}
                  </div>

                  {/* Contact info (if provided) */}
                  {visitor.visitorContact && (
                    <div className="flex items-center gap-2 text-xs">
                      {visitor.visitorContact.includes('@') ? (
                        <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      )}
                      <a
                        href={
                          visitor.visitorContact.includes('@')
                            ? `mailto:${visitor.visitorContact}`
                            : `tel:${visitor.visitorContact}`
                        }
                        className="text-primary hover:underline truncate"
                      >
                        {visitor.visitorContact}
                      </a>
                    </div>
                  )}

                  {/* Location */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">
                      {visitor.city && visitor.country
                        ? `${visitor.city}, ${visitor.country}`
                        : visitor.country || 'Lieu inconnu'}
                    </span>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    <span>
                      {formatDistanceToNow(new Date(visitor.visitedAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>

                  {/* Referrer (PRO only) */}
                  {visitor.referrer && isPro && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">depuis {new URL(visitor.referrer).hostname}</span>
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
    </div>
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
