/**
 * Theme utilities for generating CSS variables and validating colors
 */

import { ThemeLayout } from '@prisma/client'

/**
 * Validate hex color format
 *
 * @param color - Color string to validate
 * @returns true if valid hex color
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color)
}

/**
 * Default theme values
 * Used when no custom theme exists
 */
export const DEFAULT_THEME = {
  primaryColor: '#000000',
  secondaryColor: null,
  backgroundColor: '#ffffff',
  textColor: '#000000',
  layout: 'CENTERED' as ThemeLayout,
  fontFamily: null,
  customSections: null,
  logoUrl: null,
}

/**
 * Preset themes for quick selection
 * Users can choose from these presets or create custom
 */
export const THEME_PRESETS = [
  {
    id: 'modern-dark',
    name: 'Moderne Sombre',
    description: 'Design épuré avec fond sombre',
    primaryColor: '#6366f1',
    backgroundColor: '#0f172a',
    textColor: '#f1f5f9',
    layout: 'CENTERED' as ThemeLayout,
  },
  {
    id: 'professional',
    name: 'Professionnel',
    description: 'Design classique pour les entreprises',
    primaryColor: '#1e40af',
    backgroundColor: '#ffffff',
    textColor: '#1e293b',
    layout: 'LEFT_ALIGNED' as ThemeLayout,
  },
  {
    id: 'creative',
    name: 'Créatif',
    description: 'Design coloré et dynamique',
    primaryColor: '#ec4899',
    backgroundColor: '#fdf4ff',
    textColor: '#831843',
    layout: 'CARD_GRID' as ThemeLayout,
  },
  {
    id: 'minimal',
    name: 'Minimaliste',
    description: 'Design épuré et simple',
    primaryColor: '#000000',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    layout: 'MINIMAL' as ThemeLayout,
  },
  {
    id: 'gradient',
    name: 'Dégradé',
    description: 'Design avec dégradés modernes',
    primaryColor: '#8b5cf6',
    backgroundColor: '#faf5ff',
    textColor: '#581c87',
    layout: 'CENTERED' as ThemeLayout,
  },
] as const

/**
 * Convert hex color to HSL format
 * Tailwind v4 requires HSL format for CSS variables
 *
 * @param hex - Hex color string (e.g., "#ff0000")
 * @returns HSL string (e.g., "0 100% 50%")
 */
export function hexToHsl(hex: string): string {
  // Remove # if present
  const sanitized = hex.replace('#', '')

  // Parse RGB values
  const r = parseInt(sanitized.substring(0, 2), 16) / 255
  const g = parseInt(sanitized.substring(2, 4), 16) / 255
  const b = parseInt(sanitized.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  // Convert to degrees and percentages
  h = Math.round(h * 360)
  s = Math.round(s * 100)
  const lRounded = Math.round(l * 100)

  // Return in Tailwind format (space-separated)
  return `${h} ${s}% ${lRounded}%`
}

/**
 * Calculate contrast color (black or white) for accessibility
 * Based on WCAG guidelines for contrast ratio
 *
 * @param hsl - HSL string (e.g., "0 100% 50%")
 * @returns "0 0% 0%" (black) or "0 0% 100%" (white)
 */
export function getContrastColor(hsl: string): string {
  // Parse lightness from HSL string
  const match = hsl.match(/(\d+)%$/)
  if (!match || !match[1]) return '0 0% 100%' // Default to white

  const lightness = parseInt(match[1], 10)

  // If lightness > 50%, use black text, otherwise white
  return lightness > 50 ? '0 0% 0%' : '0 0% 100%'
}

/**
 * Adjust lightness of HSL color
 *
 * @param hsl - HSL string (e.g., "0 100% 50%")
 * @param adjustment - Percentage to adjust (-100 to 100)
 * @returns Adjusted HSL string
 */
export function adjustLightness(hsl: string, adjustment: number): string {
  const parts = hsl.match(/^(\d+)\s+(\d+)%\s+(\d+)%$/)
  if (!parts || !parts[1] || !parts[2] || !parts[3]) return hsl

  const h = parts[1]
  const s = parts[2]
  let l = parseInt(parts[3], 10)

  // Adjust lightness and clamp between 0-100
  l = Math.max(0, Math.min(100, l + adjustment))

  return `${h} ${s}% ${l}%`
}

/**
 * Generate Tailwind v4 CSS variables from theme
 * Used by public profile page to apply custom styling
 *
 * Maps ProfileTheme colors to Tailwind native variables:
 * - primaryColor → --primary
 * - backgroundColor → --background
 * - textColor → --foreground
 * - secondaryColor → --accent (optional)
 *
 * @param theme - The theme object
 * @returns CSS variables object compatible with Tailwind v4
 */
export function generateThemeVars(theme: {
  primaryColor: string
  secondaryColor?: string | null
  backgroundColor: string
  textColor: string
}): Record<string, string> {
  // Convert hex to HSL for Tailwind v4 compatibility
  const primaryHsl = hexToHsl(theme.primaryColor)
  const backgroundHsl = hexToHsl(theme.backgroundColor)
  const foregroundHsl = hexToHsl(theme.textColor)

  // Base Tailwind variables
  const vars: Record<string, string> = {
    // Primary color and its contrast
    '--primary': primaryHsl,
    '--primary-foreground': getContrastColor(primaryHsl),

    // Background and foreground (text)
    '--background': backgroundHsl,
    '--foreground': foregroundHsl,

    // Card colors (match background for consistency)
    '--card': backgroundHsl,
    '--card-foreground': foregroundHsl,

    // Muted colors (slightly adjusted background)
    '--muted': adjustLightness(backgroundHsl, foregroundHsl.startsWith('0 0% 0') ? 5 : -5),
    '--muted-foreground': adjustLightness(foregroundHsl, foregroundHsl.startsWith('0 0% 0') ? 40 : -40),

    // Border color (subtle)
    '--border': adjustLightness(backgroundHsl, foregroundHsl.startsWith('0 0% 0') ? 10 : -10),
  }

  // Add secondary color as accent if provided
  if (theme.secondaryColor && typeof theme.secondaryColor === 'string') {
    const accentHsl = hexToHsl(theme.secondaryColor)
    vars['--accent'] = accentHsl
    vars['--accent-foreground'] = getContrastColor(accentHsl)
  } else {
    // Use primary as accent if no secondary
    vars['--accent'] = primaryHsl
    vars['--accent-foreground'] = getContrastColor(primaryHsl)
  }

  return vars
}
