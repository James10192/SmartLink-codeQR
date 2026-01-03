'use client'

import { useState, useEffect, useRef } from 'react'
import { ThemeCustomizer } from '@/components/profile/theme-customizer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ThemeLayout } from '@prisma/client'

interface CustomizePageClientProps {
  profileId: string
  slug: string
  initialTheme: {
    primaryColor: string
    secondaryColor?: string | null
    backgroundColor: string
    textColor: string
    layout: ThemeLayout
    fontFamily?: string | null
  } | null
}

export function CustomizePageClient({ profileId, slug, initialTheme }: CustomizePageClientProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [currentTheme, setCurrentTheme] = useState(initialTheme)
  const [isIframeReady, setIsIframeReady] = useState(false)
  const messageQueueRef = useRef<Array<{ type: string; theme: unknown }>>([])

  // Listen for iframe ready signal
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: Only accept messages from same origin
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'IFRAME_READY') {
        setIsIframeReady(true)

        // Send all queued messages
        if (iframeRef.current?.contentWindow) {
          messageQueueRef.current.forEach((msg) => {
            iframeRef.current!.contentWindow!.postMessage(msg, window.location.origin)
          })
          messageQueueRef.current = []
        }
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  // Send theme updates to iframe (with queue support)
  useEffect(() => {
    if (!currentTheme) return

    const message = {
      type: 'THEME_UPDATE',
      theme: currentTheme,
    }

    if (isIframeReady && iframeRef.current?.contentWindow) {
      // Send immediately if iframe is ready
      iframeRef.current.contentWindow.postMessage(message, window.location.origin)
    } else {
      // Queue message if iframe not ready yet
      messageQueueRef.current.push(message)
    }
  }, [currentTheme, isIframeReady])

  const handleThemeChange = (theme: typeof currentTheme) => {
    setCurrentTheme(theme)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Customizer (2/3) */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Personnalisation du thème
            </CardTitle>
            <CardDescription>
              Modifiez les couleurs et la mise en page de votre profil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeCustomizer
              profileId={profileId}
              initialTheme={initialTheme}
              onThemeChange={handleThemeChange}
            />
          </CardContent>
        </Card>
      </div>

      {/* Live Preview (1/3) */}
      <div className="lg:col-span-1">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="text-base">Aperçu en direct</CardTitle>
            <CardDescription>
              Les changements s'appliquent en temps réel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-[9/16] rounded-lg border overflow-hidden bg-muted">
              <iframe
                ref={iframeRef}
                src={`/u/${slug}?preview=true`}
                className="w-full h-full"
                title="Profile preview"
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground text-center">
              {isIframeReady ? '✓ Aperçu en temps réel activé' : 'Chargement de l\'aperçu...'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
