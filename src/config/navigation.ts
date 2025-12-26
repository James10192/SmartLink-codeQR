import {
  LayoutDashboard,
  Users,
  UserPlus,
  Settings,
  CreditCard,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: string | number
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
    title: 'Abonnement',
    href: '/dashboard/subscription',
    icon: CreditCard,
  },
  {
    title: 'Paramètres',
    href: '/dashboard/settings',
    icon: Settings,
  },
]
