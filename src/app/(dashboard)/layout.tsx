'use client'

import { SidebarProvider, useSidebar } from '@/contexts/sidebar-context'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { cn } from '@/lib/utils'

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main
        className={cn(
          'flex-1 transition-all duration-300',
          isCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        {children}
      </main>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  )
}
