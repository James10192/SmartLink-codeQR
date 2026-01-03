'use client'

import { useEffect, useState } from 'react'
import type { ThemeLayout } from '@prisma/client'
import { generateThemeVars } from '@/lib/utils/theme'

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
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!isPreviewMode) return

    // Signal parent that iframe is ready to receive messages
    window.parent.postMessage({ type: 'IFRAME_READY' }, window.location.origin)
    setIsReady(true)

    const handleMessage = (event: MessageEvent) => {
      // Security: Only accept messages from same origin
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'THEME_UPDATE' && event.data.theme) {
        const theme = event.data.theme

        // Generate Tailwind-compatible CSS variables
        const themeVars = generateThemeVars({
          primaryColor: theme.primaryColor,
          secondaryColor: theme.secondaryColor,
          backgroundColor: theme.backgroundColor,
          textColor: theme.textColor,
        })

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
    if (!isPreviewMode || !isReady) return

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
  }, [currentThemeVars, isPreviewMode, isReady])

  return <>{children}</>
}
