'use client'

import Link from 'next/link'
import { Bell } from 'lucide-react'
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

interface Notification {
  id: string
  title: string
  description: string
  time: string
  read: boolean
  href?: string
}

interface NotificationsDropdownProps {
  count?: number
}

export function NotificationsDropdown({ count = 0 }: NotificationsDropdownProps) {
  // TODO: Remplacer par vraies données API/DB
  const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'Nouveau scan de profil',
      description: 'Votre profil a été scanné 5 fois aujourd\'hui',
      time: 'Il y a 5 min',
      read: false,
    },
    {
      id: '2',
      title: 'CV téléchargé',
      description: 'Quelqu\'un a téléchargé votre CV',
      time: 'Il y a 1h',
      read: false,
    },
    {
      id: '3',
      title: 'Limite de profils',
      description: 'Vous approchez de la limite (1/1 profils)',
      time: 'Il y a 2h',
      read: true,
      href: '/dashboard/subscription',
    },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
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

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {mockNotifications.length > 0 ? (
          <ScrollArea className="max-h-[300px]">
            {mockNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="cursor-pointer p-3"
                asChild={!!notification.href}
              >
                {notification.href ? (
                  <Link href={notification.href}>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-start justify-between">
                        <p className={`text-sm font-medium ${notification.read ? 'text-muted-foreground' : ''}`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {notification.time}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {notification.description}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-start justify-between">
                      <p className={`text-sm font-medium ${notification.read ? 'text-muted-foreground' : ''}`}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {notification.time}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {notification.description}
                    </p>
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
