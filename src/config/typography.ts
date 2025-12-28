/**
 * Typography Configuration - Mobile-First Responsive Typography
 *
 * Based on 2025 mobile UI/UX standards:
 * - Mobile: 18-20px body text, 16px minimum (prevents iOS auto-zoom)
 * - Heading hierarchy: H1 32-40px, H2 24-32px, H3 18-24px
 * - Mobile-first approach with Tailwind responsive prefixes
 *
 * @see https://www.learnui.design/blog/mobile-desktop-website-font-size-guidelines.html
 * @see https://agnikii.co.uk/insights/responsive-website-font-size-guidelines/
 */

export const typography = {
  // Page Titles (H1) - Main page headings
  // Mobile: 24px → Tablet: 30px → Desktop: 36px
  pageTitle: 'text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight',

  // Section Titles (H2) - Major sections within a page
  // Mobile: 20px → Tablet: 24px → Desktop: 30px
  sectionTitle: 'text-xl sm:text-2xl md:text-3xl font-semibold',

  // Card Titles (H3) - Cards and major components
  // Mobile: 16px → Tablet: 18px → Desktop: 20px
  cardTitle: 'text-base sm:text-lg md:text-xl font-semibold',

  // Card Small Titles - Smaller card headings
  // Mobile: 14px → Tablet: 16px
  cardSmallTitle: 'text-sm sm:text-base font-medium',

  // Body Text - Standard paragraph text
  // 16px - mobile standard, prevents iOS auto-zoom
  body: 'text-base',

  // Body Small - Secondary body text
  // 14px - for less important content
  bodySmall: 'text-sm',

  // Descriptions - Muted descriptive text
  // Mobile: 14px → Tablet: 16px
  description: 'text-sm sm:text-base text-muted-foreground',

  // Small Labels - Form labels, small UI elements
  // Mobile: 12px → Tablet: 14px
  label: 'text-xs sm:text-sm',

  // Stats Large - Large statistic numbers
  // Mobile: 24px → Tablet: 30px → Desktop: 36px
  statLarge: 'text-2xl sm:text-3xl md:text-4xl font-bold',

  // Stats Medium - Medium statistic numbers
  // Mobile: 20px → Tablet: 24px
  statMedium: 'text-xl sm:text-2xl font-bold',
} as const

export type TypographyKey = keyof typeof typography
