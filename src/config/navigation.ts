import {
  LayoutDashboard,
  Users,
  UserPlus,
  Settings,
  CreditCard,
  TrendingUp,
  Shield,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: string | number
  adminOnly?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Mes Profils',
    href: '/dashboard/profiles',
    icon: Users,
  },
  {
    title: 'Nouveau Profil',
    href: '/profile/create',
    icon: UserPlus,
  },
  {
    title: 'Statistiques',
    href: '/dashboard/analytics',
    icon: TrendingUp,
  },
  {
    title: 'Admin',
    href: '/admin/subscriptions',
    icon: Shield,
    adminOnly: true,
  },
  {
    title: 'Paramètres',
    href: '/dashboard/settings',
    icon: Settings,
  },
]
