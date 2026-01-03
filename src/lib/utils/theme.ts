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
 * Convert hex color to OKLCH format (Tailwind v4)
 * Tailwind v4 uses OKLCH color space by default
 * Conversion: Hex → sRGB → Linear RGB → XYZ → OKLab → OKLCH
 *
 * @param hex - Hex color string (e.g., "#6366f1")
 * @returns OKLCH string (e.g., "oklch(0.623 0.188 259.8)")
 */
export function hexToOklch(hex: string): string {
  // Remove # if present
  const sanitized = hex.replace('#', '')

  // 1. Hex → sRGB (0-1 range)
  const r = parseInt(sanitized.substring(0, 2), 16) / 255
  const g = parseInt(sanitized.substring(2, 4), 16) / 255
  const b = parseInt(sanitized.substring(4, 6), 16) / 255

  // 2. sRGB → Linear RGB (gamma correction inverse)
  const toLinear = (c: number) => {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  const rLinear = toLinear(r)
  const gLinear = toLinear(g)
  const bLinear = toLinear(b)

  // 3. Linear RGB → XYZ (D65 illuminant transformation matrix)
  const x = 0.4124564 * rLinear + 0.3575761 * gLinear + 0.1804375 * bLinear
  const y = 0.2126729 * rLinear + 0.7151522 * gLinear + 0.0721750 * bLinear
  const z = 0.0193339 * rLinear + 0.1191920 * gLinear + 0.9503041 * bLinear

  // 4. XYZ → OKLab (Oklab color space)
  const l_ = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z)
  const m_ = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z)
  const s_ = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z)

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
  const b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_

  // 5. OKLab → OKLCH (cylindrical coordinates)
  const C = Math.sqrt(a * a + b_ * b_)
  let H = Math.atan2(b_, a) * (180 / Math.PI)
  if (H < 0) H += 360

  // 6. Round and format for Tailwind OKLCH
  const LRounded = Math.round(L * 1000) / 1000
  const CRounded = Math.round(C * 1000) / 1000
  const HRounded = Math.round(H * 10) / 10

  // Return in Tailwind OKLCH format (space-separated, no commas)
  return `oklch(${LRounded} ${CRounded} ${HRounded})`
}

/**
 * Convert hex color to HSL format
 * DEPRECATED: Use hexToOklch() instead for Tailwind v4
 * Kept for backward compatibility
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
 * Adjust lightness of OKLCH color
 *
 * @param oklch - OKLCH string (e.g., "oklch(0.623 0.188 259.8)")
 * @param adjustment - Amount to adjust lightness (-1 to 1, typically -0.2 to 0.2)
 * @returns Adjusted OKLCH string
 */
export function adjustOklchLightness(oklch: string, adjustment: number): string {
  const match = oklch.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/)
  if (!match || !match[1] || !match[2] || !match[3]) return oklch

  let L = parseFloat(match[1])
  const C = match[2]
  const H = match[3]

  // Adjust lightness and clamp between 0-1
  L = Math.max(0, Math.min(1, L + adjustment))
  const LRounded = Math.round(L * 1000) / 1000

  return `oklch(${LRounded} ${C} ${H})`
}

/**
 * Adjust lightness of HSL color
 * DEPRECATED: Use adjustOklchLightness() instead for Tailwind v4
 * Kept for backward compatibility
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
  // Convert hex to OKLCH for Tailwind v4 compatibility
  const primaryOklch = hexToOklch(theme.primaryColor)
  const backgroundOklch = hexToOklch(theme.backgroundColor)
  const foregroundOklch = hexToOklch(theme.textColor)

  // Parse lightness values to determine if theme is light or dark
  const bgLightnessMatch = backgroundOklch.match(/oklch\(([\d.]+)/)
  const bgLightness = bgLightnessMatch && bgLightnessMatch[1] ? parseFloat(bgLightnessMatch[1]) : 0.5
  const isDarkTheme = bgLightness < 0.5

  // Base Tailwind variables - use user's colors directly
  const vars: Record<string, string> = {
    // Primary color and its contrast (use textColor for better readability)
    '--primary': primaryOklch,
    '--primary-foreground': foregroundOklch,

    // Background and foreground (text) - exact user colors
    '--background': backgroundOklch,
    '--foreground': foregroundOklch,

    // Card colors - use background with slight variation for depth
    '--card': backgroundOklch,
    '--card-foreground': foregroundOklch,

    // Muted colors - subtle adjustments based on theme type
    '--muted': adjustOklchLightness(backgroundOklch, isDarkTheme ? 0.05 : -0.05),
    '--muted-foreground': adjustOklchLightness(foregroundOklch, isDarkTheme ? -0.15 : 0.15),

    // Border color - very subtle based on background
    '--border': adjustOklchLightness(backgroundOklch, isDarkTheme ? 0.1 : -0.1),
  }

  // Add secondary color as accent if provided
  if (theme.secondaryColor && typeof theme.secondaryColor === 'string') {
    const accentOklch = hexToOklch(theme.secondaryColor)
    vars['--accent'] = accentOklch
    vars['--accent-foreground'] = foregroundOklch // Use text color for consistency
  } else {
    // Use primary as accent if no secondary
    vars['--accent'] = primaryOklch
    vars['--accent-foreground'] = foregroundOklch
  }

  return vars
}
