'use client'

import { useState, useRef } from 'react'
import { Upload, X, Video as VideoIcon, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface VideoUploadProps {
  profileId: string
  currentVideoUrl?: string | null
  onUploadSuccess?: (url: string) => void
  onDeleteSuccess?: () => void
}

export function VideoUpload({
  profileId,
  currentVideoUrl,
  onUploadSuccess,
  onDeleteSuccess,
}: VideoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [validatingDuration, setValidatingDuration] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoPreviewRef = useRef<HTMLVideoElement>(null)

  const MAX_SIZE = 30 * 1024 * 1024 // 30MB
  const MAX_DURATION = 30 // 30 seconds
  const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

  /**
   * Validate file type and size
   */
  function validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Type de fichier non autorisé. Utilisez MP4, WebM ou MOV'
    }

    if (file.size > MAX_SIZE) {
      return `Fichier trop volumineux. Taille maximum : ${MAX_SIZE / 1024 / 1024}MB`
    }

    return null
  }

  /**
   * Validate video duration (must be <= 30 seconds)
   * This is done client-side before upload to save bandwidth
   */
  function validateVideoDuration(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      setValidatingDuration(true)

      const video = document.createElement('video')
      video.preload = 'metadata'

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        setValidatingDuration(false)

        if (video.duration > MAX_DURATION) {
          resolve(
            `La vidéo doit durer maximum ${MAX_DURATION} secondes (durée actuelle : ${Math.round(video.duration)}s)`
          )
        } else {
          resolve(null)
        }
      }

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src)
        setValidatingDuration(false)
        resolve('Fichier vidéo invalide ou corrompu')
      }

      video.src = URL.createObjectURL(file)
    })
  }

  /**
   * Handle file selection and upload
   */
  async function handleFileChange(file: File) {
    // Basic validation (type & size)
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    // Duration validation (async)
    const durationError = await validateVideoDuration(file)
    if (durationError) {
      setError(durationError)
      return
    }

    setError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('profileId', profileId)

      const response = await fetch('/api/upload/video', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle tier enforcement errors
        if (data.upgradeRequired) {
          throw new Error(
            data.error || 'Passez au plan PRO pour débloquer les vidéos'
          )
        }
        throw new Error(data.error || 'Erreur lors du téléchargement')
      }

      if (onUploadSuccess) {
        onUploadSuccess(data.url)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du téléchargement')
    } finally {
      setUploading(false)
    }
  }

  /**
   * Delete current video
   */
  async function handleDelete() {
    if (!currentVideoUrl) return

    setDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/upload/video?profileId=${profileId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      if (onDeleteSuccess) {
        onDeleteSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  /**
   * Drag & drop handlers
   */
  function handleDrag(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  function handleClick() {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4">
        {/* Video Preview */}
        {currentVideoUrl && (
          <div className="relative w-full max-w-md">
            <video
              ref={videoPreviewRef}
              src={currentVideoUrl}
              controls
              className="aspect-video w-full rounded-lg border-2 border-muted object-cover shadow-md"
              poster={currentVideoUrl}
            >
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>

            {!deleting && (
              <button
                onClick={handleDelete}
                className="absolute -right-2 -top-2 rounded-full bg-destructive p-1.5 text-destructive-foreground shadow-md transition-all hover:bg-destructive/90"
                disabled={uploading || validatingDuration}
                aria-label="Supprimer la vidéo"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Empty State when no video */}
        {!currentVideoUrl && (
          <div className="flex aspect-video w-full max-w-md items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/20">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <VideoIcon className="h-16 w-16" />
              <p className="text-sm font-medium">Aucune vidéo</p>
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
          className={cn(
            'flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors',
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary hover:bg-muted/50',
            (uploading || deleting || validatingDuration) && 'pointer-events-none opacity-50'
          )}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">
              {uploading
                ? 'Téléchargement...'
                : deleting
                  ? 'Suppression...'
                  : validatingDuration
                    ? 'Validation de la durée...'
                    : currentVideoUrl
                      ? 'Remplacer la vidéo'
                      : 'Cliquez ou déposez une vidéo'}
            </p>
            <p className="text-xs text-muted-foreground">
              MP4, WebM ou MOV (max. 30MB, 30s)
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileChange(e.target.files[0])
            }
          }}
          className="hidden"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Tips */}
      <div className="rounded-md bg-muted p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground mb-2">Conseils pour une vidéo optimale :</p>
        <ul className="list-inside list-disc space-y-1">
          <li>Durée maximale : 30 secondes</li>
          <li>Format recommandé : MP4 (H.264)</li>
          <li>Résolution recommandée : 1080p (1920x1080)</li>
          <li>Orientation : Paysage (16:9) ou Portrait (9:16)</li>
          <li>Compressez votre vidéo si elle dépasse 30MB</li>
        </ul>
      </div>
    </div>
  )
}
