'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface CVUploadProps {
  profileId: string
  currentCvUrl?: string | null
  onUploadSuccess?: (url: string) => void
  onDeleteSuccess?: () => void
}

export function CVUpload({
  profileId,
  currentCvUrl,
  onUploadSuccess,
  onDeleteSuccess,
}: CVUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(file: File | null) {
    if (!file) return

    setError('')
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('profileId', profileId)

      const response = await fetch('/api/upload/cv', {
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
    } catch (err: any) {
      setError(err.message || 'Erreur lors du téléchargement du CV')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function handleDelete() {
    if (!currentCvUrl) return

    setError('')
    setIsDeleting(true)

    try {
      const response = await fetch(
        `/api/upload/cv?profileId=${profileId}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      if (onDeleteSuccess) {
        onDeleteSuccess()
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression du CV')
    } finally {
      setIsDeleting(false)
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

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {currentCvUrl ? (
        <div className="flex items-center gap-4 rounded-lg border p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">CV téléchargé</p>
            <a
              href={currentCvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:underline"
            >
              Voir le fichier
            </a>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors',
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25',
            isUploading && 'pointer-events-none opacity-50'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            className="hidden"
            disabled={isUploading}
          />

          <div className="mx-auto flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">
                {isUploading
                  ? 'Téléchargement en cours...'
                  : 'Déposez votre CV ici'}
              </p>
              <p className="text-xs text-muted-foreground">
                ou cliquez pour sélectionner
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Sélectionner un fichier
            </Button>

            <p className="text-xs text-muted-foreground">
              PDF, DOC ou DOCX (max 5MB)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
