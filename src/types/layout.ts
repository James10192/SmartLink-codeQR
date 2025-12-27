import type { LucideIcon } from 'lucide-react'

export interface User {
  id: string
  email: string
  name: string | null
  image?: string | null
  emailVerified: boolean
}

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: string | number
}

export interface Notification {
  id: string
  title: string
  description: string
  time: string
  read: boolean
  href?: string
}

export interface SidebarContextType {
  isCollapsed: boolean
  toggleSidebar: () => void
}

export interface NavbarProps {
  user: User
  notificationCount?: number
}

export interface DashboardLayoutClientProps {
  children: React.ReactNode
  user: User
  notificationCount?: number
}
