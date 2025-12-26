'use client'

import { useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { updateUserSubscriptionAction } from '@/lib/actions/admin/subscriptions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { User, Subscription } from '@prisma/client'

interface EditSubscriptionDialogProps {
  user: User & {
    subscription: Subscription | null
    profiles: Array<{ id: string; fullName: string; slug: string }>
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditSubscriptionDialog({
  user,
  open,
  onOpenChange,
}: EditSubscriptionDialogProps) {
  const [plan, setPlan] = useState<string>(
    user.subscription?.plan || 'FREE'
  )
  const [status, setStatus] = useState<string>(
    user.subscription?.status || 'ACTIVE'
  )
  const [expiresAt, setExpiresAt] = useState<string>(
    user.subscription?.expiresAt
      ? new Date(user.subscription.expiresAt).toISOString().split('T')[0]
      : ''
  )

  const { execute, isExecuting } = useAction(updateUserSubscriptionAction, {
    onSuccess: ({ data }) => {
      toast.success(data?.message || 'Subscription updated successfully')
      onOpenChange(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Failed to update subscription')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    execute({
      userId: user.id,
      plan: plan as 'FREE' | 'PRO_DIGITAL' | 'PACK_STARTER' | 'CORPORATE',
      status: status as 'ACTIVE' | 'EXPIRED' | 'CANCELLED',
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      paymentMethod: 'MANUAL',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Subscription</DialogTitle>
          <DialogDescription>
            Update subscription for {user.name || user.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan">Plan</Label>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger id="plan">
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FREE">FREE</SelectItem>
                <SelectItem value="PRO_DIGITAL">PRO Digital</SelectItem>
                <SelectItem value="PACK_STARTER">Pack Starter</SelectItem>
                <SelectItem value="CORPORATE">Corporate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expires At (Optional)</Label>
            <Input
              id="expiresAt"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              placeholder="Leave empty for no expiration"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for plans that don't expire (or manual management)
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isExecuting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isExecuting}>
              {isExecuting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
