import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { redirect } from 'next/navigation'
import { getAllUsersWithSubscriptions, getSubscriptionStats } from '@/lib/actions/admin/subscriptions'
import { SubscriptionsTable } from './subscriptions-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, Crown, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminSubscriptionsPage() {
  const session = await requireAuth()

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  // Redirect if not admin
  if (user?.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const [users, stats] = await Promise.all([
    getAllUsersWithSubscriptions(),
    getSubscriptionStats(),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Subscription Management</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          Manage user subscriptions and plans manually
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs sm:text-sm text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">FREE Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats.freeUsers}</div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {((stats.freeUsers / stats.totalUsers) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid Users</CardTitle>
            <Crown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats.paidUsers}</div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              PRO: {stats.proUsers} | Starter: {stats.starterUsers} | Corporate: {stats.corporateUsers}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs sm:text-sm text-muted-foreground">FREE → Paid conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users & Subscriptions</CardTitle>
          <CardDescription>
            Click on a user row to edit their subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionsTable users={users} />
        </CardContent>
      </Card>
    </div>
  )
}
