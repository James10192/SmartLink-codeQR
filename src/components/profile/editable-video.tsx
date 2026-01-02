'use client'

import { useState, useRef } from 'react'
import { Video, Loader2, X, Upload, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'

interface EditableVideoProps {
  profileId: string
  currentVideoUrl: string | null
  userPlan: string
  onUpdate?: (newUrl: string | null) => void
}

export function EditableVideo({ profileId, currentVideoUrl, userPlan, onUpdate }: EditableVideoProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [videoUrl, setVideoUrl] = useState(currentVideoUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isPro = ['PRO_DIGITAL', 'PACK_STARTER', 'CORPORATE'].includes(userPlan)

  const validateVideoDuration = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.preload = 'metadata'

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        const duration = video.duration

        if (duration > 30) {
          toast.error('La vidéo ne doit pas dépasser 30 secondes')
          resolve(false)
        } else {
          resolve(true)
        }
      }

      video.onerror = () => {
        toast.error('Impossible de lire la vidéo')
        resolve(false)
      }

      video.src = URL.createObjectURL(file)
    })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!isPro) {
      toast.error('La vidéo de présentation est disponible avec le plan PRO')
      return
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format non supporté. Utilisez MP4, WebM ou MOV')
      return
    }

    // Validate file size (30MB max)
    if (file.size > 30 * 1024 * 1024) {
      toast.error('La vidéo ne doit pas dépasser 30MB')
      return
    }

    setIsValidating(true)

    // Validate duration
    const isValid = await validateVideoDuration(file)
    setIsValidating(false)

    if (!isValid) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('profileId', profileId)

      const response = await fetch('/api/upload/video', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors du téléchargement')
      }

      setVideoUrl(result.url)
      onUpdate?.(result.url)
      toast.success('Vidéo de présentation ajoutée')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors du téléchargement')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveVideo = async () => {
    if (!videoUrl) return

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ?')) return

    setIsUploading(true)

    try {
      const response = await fetch('/api/upload/video', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la suppression')
      }

      setVideoUrl(null)
      onUpdate?.(null)
      toast.success('Vidéo supprimée')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    } finally {
      setIsUploading(false)
    }
  }

  if (!isPro) {
    return (
      <Card className="border-2 border-dashed border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-6 text-center">
          <Lock className="mx-auto h-12 w-12 text-amber-600 mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Vidéo de présentation
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Ajoutez une vidéo de 30 secondes pour vous présenter de manière dynamique.
            Disponible avec le plan PRO.
          </p>
          <Button
            className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-white"
            size="sm"
            asChild
          >
            <a href="/dashboard/upgrade">
              Passer au PRO
            </a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Vidéo de présentation</h3>
          </div>
          <p className="text-xs text-muted-foreground">Max 30s, 30MB</p>
        </div>

        {videoUrl ? (
          <div className="space-y-4">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
              <video
                src={videoUrl}
                controls
                className="w-full h-full"
                preload="metadata"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isValidating}
              >
                {isValidating || isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isValidating ? 'Validation...' : 'Upload...'}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Remplacer
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemoveVideo}
                disabled={isUploading}
              >
                <X className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isValidating}
            className="w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating || isUploading ? (
              <>
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                <span className="text-sm text-muted-foreground">
                  {isValidating ? 'Validation de la vidéo...' : 'Upload en cours...'}
                </span>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Cliquez pour ajouter une vidéo
                </span>
                <span className="text-xs text-muted-foreground">
                  MP4, WebM ou MOV • Max 30s, 30MB
                </span>
              </>
            )}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={handleFileSelect}
        />
      </CardContent>
    </Card>
  )
}
