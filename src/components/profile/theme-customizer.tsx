'use client'

import { useState, useEffect } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { saveThemeAction } from '@/lib/actions/theme'
import { THEME_PRESETS, DEFAULT_THEME } from '@/lib/utils/theme'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  LayoutTemplate,
  Palette,
  AlignCenter,
  AlignLeft,
  Grid3x3,
  Minus,
  Loader2,
  ChevronDown,
  Sparkles,
} from 'lucide-react'
import { ThemeLayout } from '@prisma/client'

interface ThemeCustomizerProps {
  profileId: string
  initialTheme?: {
    primaryColor: string
    secondaryColor?: string | null
    backgroundColor: string
    textColor: string
    layout: ThemeLayout
    fontFamily?: string | null
  } | null
  onThemeChange?: (theme: {
    primaryColor: string
    secondaryColor?: string | null
    backgroundColor: string
    textColor: string
    layout: ThemeLayout
    fontFamily?: string | null
  }) => void
}

export function ThemeCustomizer({ profileId, initialTheme, onThemeChange }: ThemeCustomizerProps) {
  const [primaryColor, setPrimaryColor] = useState(
    initialTheme?.primaryColor || DEFAULT_THEME.primaryColor
  )
  const [secondaryColor, setSecondaryColor] = useState(
    initialTheme?.secondaryColor || ''
  )
  const [backgroundColor, setBackgroundColor] = useState(
    initialTheme?.backgroundColor || DEFAULT_THEME.backgroundColor
  )
  const [textColor, setTextColor] = useState(initialTheme?.textColor || DEFAULT_THEME.textColor)
  const [layout, setLayout] = useState<ThemeLayout>(initialTheme?.layout || DEFAULT_THEME.layout)

  // Collapsible sections state (mobile-first)
  const [openSections, setOpenSections] = useState({
    presets: true,
    colors: false,
    layout: false,
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  // On desktop, open all sections by default
  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024
    if (isDesktop) {
      setOpenSections({
        presets: true,
        colors: true,
        layout: true,
      })
    }
  }, [])

  // Notify parent of theme changes for live preview
  useEffect(() => {
    if (onThemeChange) {
      onThemeChange({
        primaryColor,
        secondaryColor: secondaryColor || null,
        backgroundColor,
        textColor,
        layout,
        fontFamily: null,
      })
    }
  }, [primaryColor, secondaryColor, backgroundColor, textColor, layout, onThemeChange])

  const { execute, isExecuting } = useAction(saveThemeAction, {
    onSuccess: () => {
      toast.success('Thème sauvegardé avec succès')
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Erreur lors de la sauvegarde du thème')
    },
  })

  const handleSave = () => {
    execute({
      profileId,
      primaryColor,
      secondaryColor: secondaryColor || null,
      backgroundColor,
      textColor,
      layout,
    })
  }

  const applyPreset = (presetId: string) => {
    const preset = THEME_PRESETS.find((p) => p.id === presetId)
    if (preset) {
      setPrimaryColor(preset.primaryColor)
      setBackgroundColor(preset.backgroundColor)
      setTextColor(preset.textColor)
      setLayout(preset.layout)
      toast.success(`Thème "${preset.name}" appliqué`)
    }
  }

  const resetToDefaults = () => {
    setPrimaryColor(DEFAULT_THEME.primaryColor)
    setSecondaryColor('')
    setBackgroundColor(DEFAULT_THEME.backgroundColor)
    setTextColor(DEFAULT_THEME.textColor)
    setLayout(DEFAULT_THEME.layout)
    toast.info('Thème réinitialisé aux valeurs par défaut')
  }

  const layoutOptions = [
    {
      value: 'CENTERED' as ThemeLayout,
      label: 'Centré',
      icon: AlignCenter,
      description: 'Contenu centré, mise en page minimaliste',
    },
    {
      value: 'LEFT_ALIGNED' as ThemeLayout,
      label: 'Aligné à gauche',
      icon: AlignLeft,
      description: 'Contenu à gauche, visuel à droite',
    },
    {
      value: 'CARD_GRID' as ThemeLayout,
      label: 'Grille de cartes',
      icon: Grid3x3,
      description: 'Disposition en grille avec cartes',
    },
    {
      value: 'MINIMAL' as ThemeLayout,
      label: 'Minimaliste',
      icon: Minus,
      description: 'Design ultra épuré et simple',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Presets Section - Collapsible on mobile */}
      <Collapsible open={openSections.presets} onOpenChange={() => toggleSection('presets')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors lg:cursor-default">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Thèmes prédéfinis</CardTitle>
                </div>
                <ChevronDown
                  className={cn(
                    'h-5 w-5 transition-transform lg:hidden',
                    openSections.presets && 'rotate-180'
                  )}
                />
              </div>
              <CardDescription>Choisissez un thème pour commencer rapidement</CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                    className="group relative overflow-hidden rounded-lg border-2 border-muted p-4 text-left transition-all hover:border-primary hover:shadow-md"
                  >
                    {/* Color preview */}
                    <div className="mb-2 flex gap-1">
                      <div
                        className="h-6 w-6 rounded-full border"
                        style={{ backgroundColor: preset.primaryColor }}
                      />
                      <div
                        className="h-6 w-6 rounded-full border"
                        style={{ backgroundColor: preset.backgroundColor }}
                      />
                      <div
                        className="h-6 w-6 rounded-full border"
                        style={{ backgroundColor: preset.textColor }}
                      />
                    </div>
                    <h4 className="font-medium text-sm">{preset.name}</h4>
                    <p className="text-xs text-muted-foreground">{preset.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Colors Section - Collapsible on mobile */}
      <Collapsible open={openSections.colors} onOpenChange={() => toggleSection('colors')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors lg:cursor-default">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Couleurs personnalisées</CardTitle>
                </div>
                <ChevronDown
                  className={cn(
                    'h-5 w-5 transition-transform lg:hidden',
                    openSections.colors && 'rotate-180'
                  )}
                />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* Primary Color */}
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Couleur principale</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="primaryColor"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-12 w-20 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => {
                      const value = e.target.value
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                        setPrimaryColor(value)
                      }
                    }}
                    placeholder="#000000"
                    className="flex-1 font-mono"
                    maxLength={7}
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">
                  Couleur secondaire <span className="text-muted-foreground">(optionnel)</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="secondaryColor"
                    value={secondaryColor || primaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-12 w-20 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => {
                      const value = e.target.value
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
                        setSecondaryColor(value)
                      }
                    }}
                    placeholder="#000000"
                    className="flex-1 font-mono"
                    maxLength={7}
                  />
                </div>
              </div>

              {/* Background Color */}
              <div className="space-y-2">
                <Label htmlFor="backgroundColor">Couleur de fond</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="backgroundColor"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="h-12 w-20 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => {
                      const value = e.target.value
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                        setBackgroundColor(value)
                      }
                    }}
                    placeholder="#ffffff"
                    className="flex-1 font-mono"
                    maxLength={7}
                  />
                </div>
              </div>

              {/* Text Color */}
              <div className="space-y-2">
                <Label htmlFor="textColor">Couleur du texte</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    id="textColor"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="h-12 w-20 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={textColor}
                    onChange={(e) => {
                      const value = e.target.value
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                        setTextColor(value)
                      }
                    }}
                    placeholder="#000000"
                    className="flex-1 font-mono"
                    maxLength={7}
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Layout Section - Collapsible on mobile */}
      <Collapsible open={openSections.layout} onOpenChange={() => toggleSection('layout')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors lg:cursor-default">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LayoutTemplate className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Mise en page</CardTitle>
                </div>
                <ChevronDown
                  className={cn(
                    'h-5 w-5 transition-transform lg:hidden',
                    openSections.layout && 'rotate-180'
                  )}
                />
              </div>
              <CardDescription>Choisissez la disposition de votre profil</CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <RadioGroup value={layout} onValueChange={(val) => setLayout(val as ThemeLayout)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {layoutOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <div key={option.value} className="relative">
                        <RadioGroupItem
                          value={option.value}
                          id={option.value}
                          className="sr-only"
                        />
                        <Label
                          htmlFor={option.value}
                          className={cn(
                            'flex flex-col cursor-pointer rounded-lg border-2 p-4 transition-all hover:bg-muted/50',
                            layout === option.value
                              ? 'border-primary bg-primary/5'
                              : 'border-muted'
                          )}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className={cn(
                                'rounded-md p-2',
                                layout === option.value ? 'bg-primary text-primary-foreground' : 'bg-muted'
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className="font-medium">{option.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </Label>
                      </div>
                    )
                  })}
                </div>
              </RadioGroup>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Preview Card - Always visible on desktop, hidden on mobile (moved to bottom sheet) */}
      <Card className="hidden lg:block">
        <CardHeader>
          <CardTitle className="text-base">Aperçu</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-lg border p-6 text-center"
            style={{
              backgroundColor: backgroundColor,
              color: textColor,
            }}
          >
            <div
              className="inline-block rounded-full px-4 py-2 font-medium"
              style={{ backgroundColor: primaryColor, color: '#ffffff' }}
            >
              Couleur principale
            </div>
            <p className="mt-4">Texte d'exemple</p>
          </div>
        </CardContent>
      </Card>

      {/* Actions - Sticky on mobile */}
      <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4 -mx-4 -mb-4 flex gap-3 lg:static lg:bg-transparent lg:border-0 lg:p-0 lg:m-0">
        <Button onClick={resetToDefaults} variant="outline" className="flex-1">
          Réinitialiser
        </Button>
        <Button onClick={handleSave} disabled={isExecuting} className="flex-1">
          {isExecuting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            'Sauvegarder'
          )}
        </Button>
      </div>
    </div>
  )
}
