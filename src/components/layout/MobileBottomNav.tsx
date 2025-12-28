'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/config/navigation'
import { cn } from '@/lib/utils'

interface MobileBottomNavProps {
  userRole: string
}

/**
 * Vérifie si un tab est actif en fonction du pathname
 * - Route racine "/dashboard" : match exact uniquement
 * - Autres routes : match avec sous-routes (startsWith)
 */
function isTabActive(pathname: string, itemHref: string): boolean {
  // Route racine : match exact uniquement (sinon matcherait toutes les routes)
  if (itemHref === '/dashboard') {
    return pathname === '/dashboard'
  }

  // Autres routes : match parent + sous-routes
  return pathname === itemHref || pathname.startsWith(itemHref + '/')
}

/**
 * Enhanced Mobile Bottom Navigation - Vision Style
 *
 * Design inspiré de Vision avec:
 * - Position collée au bottom (pas élevée)
 * - Background séparé avec liquid glass effect
 * - Centrage parfait avec max-w-lg
 * - Icônes 20px (h-5 w-5)
 * - Font 10px pour les labels
 * - Dot indicator + sliding background
 * - Animations de scale sur hover/active
 */
export function MobileBottomNav({ userRole }: MobileBottomNavProps) {
  const pathname = usePathname()
  const isAdmin = userRole === 'ADMIN'

  // Filtrer les items - EXCLURE "Nouveau Profil"
  const visibleItems = NAV_ITEMS.filter((item) => {
    // Exclure "Nouveau Profil" (/profile/create)
    if (item.href === '/profile/create') return false
    // Exclure admin items pour non-admins
    if (item.adminOnly && !isAdmin) return false
    return true
  })

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[9999] md:hidden will-change-transform"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        // Force GPU acceleration + prevent Safari mobile scroll bugs
        transform: 'translate3d(0, 0, 0)',
        WebkitTransform: 'translate3d(0, 0, 0)',
        // Respect safe areas (iPhone notch, etc.)
        paddingBottom: 'env(safe-area-inset-bottom)',
        // Prevent WebKit touch callout
        WebkitTouchCallout: 'none' as any,
      }}
    >
      {/* Liquid Glass Background - Séparé comme dans Vision */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border/20 shadow-[0_-4px_30px_rgba(0,0,0,0.1)]" />

      {/* Container centré avec max-width */}
      <div className="relative flex items-center justify-around h-16 w-full px-1">
        {visibleItems.map((item) => {
          const isActive = isTabActive(pathname, item.href)
          const Icon = item.icon

          // Labels courts pour mobile
          const shortLabels: Record<string, string> = {
            'Dashboard': 'Accueil',
            'Mes Profils': 'Profils',
            'Statistiques': 'Stats',
            'Abonnement': 'Premium',
            'Admin': 'Admin',
            'Paramètres': 'Réglages',
          }

          const label = shortLabels[item.title] || item.title

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center py-2 px-1.5 rounded-xl flex-1',
                'transition-colors duration-200',
                'hover:scale-105 active:scale-95',
                // Text colors
                isActive ? 'text-primary' : 'text-muted-foreground',
                !isActive && 'hover:text-primary'
              )}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label={item.title}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Sliding Glass Indicator - Même animation que Vision */}
              {isActive && (
                <motion.span
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-primary/15 backdrop-blur-sm rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.25)]"
                  transition={{
                    type: 'spring',
                    bounce: 0.2,
                    duration: 0.5,
                  }}
                />
              )}

              {/* Active indicator dot - Petit point au-dessus comme Vision */}
              {isActive && (
                <motion.span
                  layoutId="activeTabDot"
                  className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-primary"
                  transition={{
                    type: 'spring',
                    bounce: 0.3,
                    duration: 0.5,
                  }}
                />
              )}

              {/* Icon avec animation de scale */}
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: 'spring', bounce: 0.4, duration: 0.4 }}
              >
                <Icon
                  className="relative z-10 h-5 w-5 mb-0.5"
                  aria-hidden="true"
                />
              </motion.div>

              {/* Label - 10px comme Vision */}
              <span
                className={cn(
                  'relative z-10 text-[10px] whitespace-nowrap',
                  isActive ? 'font-semibold' : 'font-medium'
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
