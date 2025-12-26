'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/contexts/sidebar-context'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { MobileBottomNav } from './MobileBottomNav'

interface DashboardLayoutClientProps {
  children: ReactNode
  user: {
    id: string
    email: string
    name: string | null
    image?: string | null
  }
  notificationCount?: number
  currentPlan: string
}

export function DashboardLayoutClient({
  children,
  user,
  notificationCount = 0,
  currentPlan,
}: DashboardLayoutClientProps) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar fixe à gauche */}
      <Sidebar currentPlan={currentPlan} />

      {/* Main content avec padding dynamique */}
      <div
        className={cn(
          'transition-all duration-300',
          // Desktop: padding selon état sidebar
          isCollapsed ? 'md:pl-16' : 'md:pl-64',
          // Mobile: pas de padding (sidebar cachée)
        )}
      >
        {/* Navbar sticky en haut */}
        <Navbar user={user} notificationCount={notificationCount} />

        {/* Contenu principal */}
        <main className="p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav />
    </div>
  )
}
