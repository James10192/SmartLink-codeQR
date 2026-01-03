'use client'

import { useCallback } from 'react'
import { ThemeCustomizer } from '@/components/profile/theme-customizer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
// import {
//   BottomSheet,
//   BottomSheetContent,
//   BottomSheetHeader,
//   BottomSheetTitle,
//   BottomSheetDescription,
// } from '@/components/ui/bottom-sheet'
import type { ThemeLayout } from '@prisma/client'
// import { Eye } from 'lucide-react'

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

export function CustomizePageClient({ profileId, initialTheme }: CustomizePageClientProps) {
  // TODO: Réactiver l'aperçu en direct plus tard
  // const iframeRef = useRef<HTMLIFrameElement>(null)
  // const [currentTheme, setCurrentTheme] = useState(initialTheme)
  // const [isIframeReady, setIsIframeReady] = useState(false)
  // const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  // const messageQueueRef = useRef<Array<{ type: string; theme: unknown }>>([])

  const handleThemeChange = useCallback((theme: typeof initialTheme) => {
    // setCurrentTheme(theme)
    console.log('Theme changed:', theme)
  }, [])

  return (
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
  )
}
