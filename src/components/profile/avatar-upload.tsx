'use client'

import { useState, useRef } from 'react'
import { Upload, X, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface AvatarUploadProps {
  profileId: string
  currentAvatarUrl?: string | null
  onUploadSuccess?: (url: string) => void
  onDeleteSuccess?: () => void
}

export function AvatarUpload({
  profileId,
  currentAvatarUrl,
  onUploadSuccess,
  onDeleteSuccess,
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_SIZE = 2 * 1024 * 1024 // 2MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  function validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Type de fichier non autorisé. Utilisez JPG, PNG ou WebP'
    }

    if (file.size > MAX_SIZE) {
      return `Fichier trop volumineux. Taille maximum : ${MAX_SIZE / 1024 / 1024}MB`
    }

    return null
  }

  async function handleFileChange(file: File) {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('profileId', profileId)

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
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

  async function handleDelete() {
    if (!currentAvatarUrl) return

    setDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/upload/avatar?profileId=${profileId}`, {
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
        {/* Avatar Preview */}
        <div className="relative">
          <Avatar className="h-32 w-32 ring-2 ring-offset-2 ring-muted">
            {currentAvatarUrl ? (
              <img
                src={currentAvatarUrl}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <User className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </Avatar>

          {currentAvatarUrl && !deleting && (
            <button
              onClick={handleDelete}
              className="absolute -right-2 -top-2 rounded-full bg-destructive p-1.5 text-destructive-foreground shadow-md transition-all hover:bg-destructive/90"
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

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
            (uploading || deleting) && 'pointer-events-none opacity-50'
          )}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">
              {uploading ? 'Téléchargement...' : deleting ? 'Suppression...' : 'Cliquez ou déposez une image'}
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG ou WebP (max. 2MB)
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

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  )
}
