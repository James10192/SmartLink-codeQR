'use client'

import { GlobalSearch } from './GlobalSearch'
import { NotificationsDropdown } from './NotificationsDropdown'
import { UserProfileDropdown } from './UserProfileDropdown'

interface NavbarProps {
  user: {
    name: string | null
    email: string
    image?: string | null
  }
  notificationCount?: number
}

export function Navbar({ user, notificationCount = 0 }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      {/* Global Search (Cmd+K) */}
      <div className="flex-1 max-w-md">
        <GlobalSearch />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions: Notifications + User Profile */}
      <div className="flex items-center gap-2">
        <NotificationsDropdown count={notificationCount} />
        <UserProfileDropdown user={user} />
      </div>
    </header>
  )
}
