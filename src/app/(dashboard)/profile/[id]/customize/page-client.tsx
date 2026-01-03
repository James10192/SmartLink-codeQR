'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ThemeCustomizer } from '@/components/profile/theme-customizer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
} from '@/components/ui/bottom-sheet'
import type { ThemeLayout } from '@prisma/client'
import { Eye } from 'lucide-react'

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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
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

  // Send initial theme when iframe becomes ready
  useEffect(() => {
    if (!isIframeReady || !initialTheme) return

    const message = {
      type: 'THEME_UPDATE',
      theme: initialTheme,
    }

    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(message, window.location.origin)
    }
  }, [isIframeReady, initialTheme])

  // Send theme updates to iframe when theme changes
  useEffect(() => {
    if (!currentTheme || !isIframeReady) return

    const message = {
      type: 'THEME_UPDATE',
      theme: currentTheme,
    }

    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(message, window.location.origin)
    }
  }, [currentTheme, isIframeReady])

  const handleThemeChange = useCallback((theme: typeof currentTheme) => {
    setCurrentTheme(theme)
  }, [])

  return (
    <>
      {/* Desktop Layout: 2-column grid (unchanged) */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
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

        {/* Live Preview (1/3) - Desktop only */}
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

      {/* Mobile Layout: Stacked with bottom sheet preview */}
      <div className="lg:hidden space-y-6">
        {/* Customizer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Personnalisation
            </CardTitle>
            <CardDescription>Modifiez les couleurs et la mise en page</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeCustomizer
              profileId={profileId}
              initialTheme={initialTheme}
              onThemeChange={handleThemeChange}
            />
          </CardContent>
        </Card>

        {/* Floating Preview Button */}
        <Button
          onClick={() => setIsPreviewOpen(true)}
          size="lg"
          className="w-full sticky bottom-4 shadow-lg"
        >
          <Eye className="mr-2 h-5 w-5" />
          Voir l'aperçu en direct
        </Button>
      </div>

      {/* Bottom Sheet Preview (Mobile only) */}
      <BottomSheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <BottomSheetContent className="h-[80vh]">
          <BottomSheetHeader>
            <BottomSheetTitle>Aperçu en direct</BottomSheetTitle>
            <BottomSheetDescription>
              Les changements s'appliquent en temps réel
            </BottomSheetDescription>
          </BottomSheetHeader>
          <div className="flex-1 mt-4 rounded-lg border overflow-hidden bg-muted">
            <iframe
              ref={iframeRef}
              src={`/u/${slug}?preview=true`}
              className="w-full h-full"
              title="Profile preview"
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground text-center">
            {isIframeReady ? '✓ Aperçu activé' : 'Chargement...'}
          </p>
        </BottomSheetContent>
      </BottomSheet>
    </>
  )
}
