'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getUserNotifications, markNotificationRead } from '@/lib/actions/notifications'
import { useAction } from 'next-safe-action/hooks'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface NotificationsDropdownProps {
  count?: number
  userPlan: 'FREE' | 'PRO_DIGITAL' | 'PACK_STARTER' | 'CORPORATE'
}

export function NotificationsDropdown({ count = 0, userPlan }: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const isFree = userPlan === 'FREE'

  const { execute: fetchNotifs } = useAction(getUserNotifications, {
    onSuccess: ({ data }) => {
      setNotifications(data?.notifications || [])
      setIsLoading(false)
    },
    onError: () => {
      setIsLoading(false)
    }
  })

  const { execute: markRead } = useAction(markNotificationRead)

  const handleNotificationClick = async (notifId: string) => {
    await markRead({ notificationId: notifId })
    setNotifications(prev =>
      prev.map(n => n.id === notifId ? { ...n, isRead: true } : n)
    )
  }

  const handleDropdownOpen = (open: boolean) => {
    if (open && !isLoading && notifications.length === 0) {
      setIsLoading(true)
      fetchNotifs({ limit: 10, offset: 0 })
    }
  }

  return (
    <DropdownMenu onOpenChange={handleDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-11 w-11 md:h-9 md:w-9"
          suppressHydrationWarning
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {count > 9 ? '9+' : count}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className={cn(
          "w-[calc(100vw-2rem)] max-w-[320px]",
          "md:w-80",
          "z-50"
        )}
        sideOffset={8}
        collisionPadding={16}
        avoidCollisions={true}
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {isFree && (
            <Link href="/dashboard/upgrade" className="text-xs text-primary hover:underline">
              Passer PRO
            </Link>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="py-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : notifications.length > 0 ? (
          <ScrollArea className="max-h-[300px] md:max-h-[400px]">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="cursor-pointer p-3"
                asChild={!!notification.actionUrl}
                onClick={() => handleNotificationClick(notification.id)}
              >
                {notification.actionUrl ? (
                  <Link href={notification.actionUrl}>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm font-medium flex-1",
                          notification.isRead && "text-muted-foreground"
                        )}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: fr
                          })}
                        </span>
                      </div>
                      <p className={cn(
                        "text-xs",
                        isFree ? "text-muted-foreground blur-[2px]" : "text-muted-foreground"
                      )}>
                        {notification.description}
                      </p>
                      {notification.metadata?.count > 1 && (
                        <span className="text-xs text-primary">
                          +{notification.metadata.count - 1} autres
                        </span>
                      )}
                    </div>
                  </Link>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        "text-sm font-medium flex-1",
                        notification.isRead && "text-muted-foreground"
                      )}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: fr
                        })}
                      </span>
                    </div>
                    <p className={cn(
                      "text-xs",
                      isFree ? "text-muted-foreground blur-[2px]" : "text-muted-foreground"
                    )}>
                      {notification.description}
                    </p>
                    {notification.metadata?.count > 1 && (
                      <span className="text-xs text-primary">
                        +{notification.metadata.count - 1} autres
                      </span>
                    )}
                  </div>
                )}
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        ) : (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Aucune notification
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/notifications" className="cursor-pointer w-full text-center text-primary">
            Voir toutes les notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
