'use client'

import { useEffect, useState } from 'react'
import type { ThemeLayout } from '@prisma/client'

interface ThemePreviewWrapperProps {
  children: React.ReactNode
  isPreviewMode?: boolean
  defaultThemeVars?: Record<string, string>
}

export function ThemePreviewWrapper({
  children,
  isPreviewMode = false,
  defaultThemeVars = {},
}: ThemePreviewWrapperProps) {
  const [currentThemeVars, setCurrentThemeVars] = useState(defaultThemeVars)

  useEffect(() => {
    if (!isPreviewMode) return

    const handleMessage = (event: MessageEvent) => {
      // Security: Only accept messages from same origin
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'THEME_UPDATE' && event.data.theme) {
        const theme = event.data.theme
        const themeVars = {
          '--theme-primary': theme.primaryColor,
          '--theme-secondary': theme.secondaryColor || theme.primaryColor,
          '--theme-background': theme.backgroundColor,
          '--theme-text': theme.textColor,
        }
        setCurrentThemeVars(themeVars)
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [isPreviewMode])

  // Apply theme vars to document root
  useEffect(() => {
    if (!isPreviewMode) return

    const root = document.documentElement
    Object.entries(currentThemeVars).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })

    return () => {
      // Cleanup: restore original values
      Object.keys(currentThemeVars).forEach((key) => {
        root.style.removeProperty(key)
      })
    }
  }, [currentThemeVars, isPreviewMode])

  return <>{children}</>
}
