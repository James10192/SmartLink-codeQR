'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSidebar } from '@/contexts/sidebar-context'
import { NAV_ITEMS } from '@/config/navigation'

interface SidebarProps {
  currentPlan: string
  userRole: string
}

export function Sidebar({ currentPlan, userRole }: SidebarProps) {
  const pathname = usePathname()
  const { isCollapsed, toggleSidebar } = useSidebar()
  const isFree = currentPlan === 'FREE'
  const isAdmin = userRole === 'ADMIN'

  // Filter nav items based on user role
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    // Hide admin-only items for non-admins
    if (item.adminOnly && !isAdmin) return false
    return true
  })

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300',
          // Masquer sur mobile
          'hidden md:block',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Header: Logo + Brand */}
        <div className="flex h-16 items-center border-b border-border px-4">
          {!isCollapsed ? (
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="SmartLink"
                width={32}
                height={32}
                className="rounded-lg flex-shrink-0"
                priority
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold">SmartLink</span>
                <span className="text-xs text-muted-foreground">Dashboard</span>
              </div>
            </Link>
          ) : (
            <Link href="/dashboard" className="mx-auto">
              <Image
                src="/logo.png"
                alt="SmartLink"
                width={32}
                height={32}
                className="rounded-lg"
                priority
              />
            </Link>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1 p-2">
          {visibleNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            const Icon = item.icon

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground',
                  isCollapsed && 'justify-center px-2'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="truncate">{item.title}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            )

            // Tooltip seulement si collapsed
            if (isCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.href}>{linkContent}</div>
          })}
        </nav>

        {/* Upgrade CTA for FREE users */}
        {isFree && (
          <div className={cn('absolute left-0 right-0 px-2', 'bottom-16')}>
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant="default"
                    size="sm"
                    className="w-full px-2 bg-gradient-to-r from-primary to-primary/80"
                  >
                    <Link href="/dashboard/upgrade">
                      <Sparkles className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  Passer au PRO
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                asChild
                variant="default"
                size="sm"
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <Link href="/dashboard/upgrade" className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-medium">Passer au PRO</span>
                </Link>
              </Button>
            )}
          </div>
        )}

        {/* Toggle Button (Bottom) */}
        <div className="absolute bottom-4 left-0 right-0 px-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn('w-full', isCollapsed && 'px-2')}
            onClick={toggleSidebar}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Réduire
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
