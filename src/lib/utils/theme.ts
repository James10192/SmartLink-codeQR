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
 * Generate CSS variables object from theme
 * Used by public profile page to apply custom styling
 *
 * @param theme - The theme object
 * @returns CSS variables object
 */
export function generateThemeVars(theme: {
  primaryColor: string
  secondaryColor?: string | null
  backgroundColor: string
  textColor: string
}) {
  return {
    '--color-primary': theme.primaryColor,
    '--color-secondary': theme.secondaryColor || theme.primaryColor,
    '--color-background': theme.backgroundColor,
    '--color-text': theme.textColor,
  }
}
