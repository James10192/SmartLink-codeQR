/**
 * Theme utilities for generating CSS variables and validating colors
 */

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
