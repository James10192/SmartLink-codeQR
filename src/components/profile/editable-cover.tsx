'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface EditableCoverProps {
  profileId: string
  currentCoverUrl: string | null
  onUpdate?: (newUrl: string) => void
}

export function EditableCover({ profileId, currentCoverUrl, onUpdate }: EditableCoverProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [coverUrl, setCoverUrl] = useState(currentCoverUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image')
      return
    }

    // Validate file size (5MB max for cover)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('profileId', profileId)

      const response = await fetch('/api/upload/cover', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors du téléchargement')
      }

      setCoverUrl(result.url)
      onUpdate?.(result.url)
      toast.success('Photo de couverture mise à jour')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors du téléchargement')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveCover = async () => {
    if (!coverUrl) return

    setIsUploading(true)

    try {
      const response = await fetch('/api/upload/cover', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la suppression')
      }

      setCoverUrl(null)
      onUpdate?.('')
      toast.success('Photo de couverture supprimée')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-transparent group">
      {coverUrl && (
        <Image
          src={coverUrl}
          alt="Photo de couverture"
          fill
          className="object-cover"
          unoptimized={coverUrl.includes('supabase.co')}
        />
      )}

      {/* Overlay buttons */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {isUploading ? (
          <Loader2 className="h-6 w-6 text-white animate-spin" />
        ) : (
          <>
            <Button
              size="sm"
              variant="secondary"
              className="cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              {coverUrl ? 'Changer' : 'Ajouter une couverture'}
            </Button>
            {coverUrl && (
              <Button
                size="sm"
                variant="destructive"
                className="cursor-pointer"
                onClick={handleRemoveCover}
              >
                <X className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            )}
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  )
}
