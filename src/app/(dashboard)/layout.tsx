import { requireAuth } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { SidebarProvider } from '@/contexts/sidebar-context'
import { DashboardLayoutClient } from '@/components/layout/DashboardLayoutClient'
import { prisma } from '@/lib/db/prisma'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. Fetch session server-side
  const session = await requireAuth()

  // 2. Fetch user with subscription
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { subscription: true },
  })

  if (!user) {
    redirect('/login')
  }

  // 3. Mock notification count (TODO: remplacer par vraie requête DB)
  const notificationCount = 3

  const currentPlan = user.subscription?.plan || 'FREE'
  const userRole = user.role

  // 4. Passer données au Client Component
  return (
    <SidebarProvider>
      <DashboardLayoutClient
        user={{
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }}
        notificationCount={notificationCount}
        currentPlan={currentPlan}
        userRole={userRole}
      >
        {children}
      </DashboardLayoutClient>
    </SidebarProvider>
  )
}
