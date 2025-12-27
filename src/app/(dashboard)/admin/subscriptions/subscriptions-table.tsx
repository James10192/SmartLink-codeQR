'use client'

import { useState } from 'react'
import { User, Subscription } from '@prisma/client'
import { EditSubscriptionDialog } from '@/components/admin/edit-subscription-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Edit, Search } from 'lucide-react'

type UserWithSubscription = User & {
  subscription: Subscription | null
  profiles: Array<{ id: string; fullName: string; slug: string }>
}

interface SubscriptionsTableProps {
  users: UserWithSubscription[]
}

export function SubscriptionsTable({ users }: SubscriptionsTableProps) {
  const [selectedUser, setSelectedUser] = useState<UserWithSubscription | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false

    const matchesPlan =
      planFilter === 'all' ||
      (user.subscription?.plan || 'FREE') === planFilter

    const matchesStatus =
      statusFilter === 'all' ||
      (user.subscription?.status || 'ACTIVE') === statusFilter

    return matchesSearch && matchesPlan && matchesStatus
  })

  const handleEditUser = (user: UserWithSubscription) => {
    setSelectedUser(user)
    setDialogOpen(true)
  }

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'FREE':
        return 'secondary'
      case 'PRO_DIGITAL':
        return 'default'
      case 'PACK_STARTER':
        return 'default'
      case 'CORPORATE':
        return 'default'
      default:
        return 'secondary'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default'
      case 'EXPIRED':
        return 'secondary'
      case 'CANCELLED':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="FREE">FREE</SelectItem>
            <SelectItem value="PRO_DIGITAL">PRO Digital</SelectItem>
            <SelectItem value="PACK_STARTER">Pack Starter</SelectItem>
            <SelectItem value="CORPORATE">Corporate</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredUsers.length} of {users.length} users
      </p>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Profiles</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires At</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const plan = user.subscription?.plan || 'FREE'
                const status = user.subscription?.status || 'ACTIVE'
                const expiresAt = user.subscription?.expiresAt

                return (
                  <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name || 'No name'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.profiles.length}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPlanBadgeVariant(plan)}>
                        {plan === 'PRO_DIGITAL' ? 'PRO' : plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>
                    </TableCell>
                    <TableCell>
                      {expiresAt ? (
                        <span className="text-sm">
                          {new Date(expiresAt).toLocaleDateString('fr-FR')}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(user.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      {selectedUser && (
        <EditSubscriptionDialog
          user={selectedUser}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  )
}
