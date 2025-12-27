'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Camera, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface EditableAvatarProps {
  profileId: string
  currentAvatarUrl: string | null
  fullName: string
  onUpdate?: (newUrl: string) => void
}

export function EditableAvatar({ profileId, currentAvatarUrl, fullName, onUpdate }: EditableAvatarProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image')
      return
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 2MB')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('profileId', profileId)

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors du téléchargement')
      }

      setAvatarUrl(result.url)
      onUpdate?.(result.url)
      toast.success('Photo de profil mise à jour')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors du téléchargement')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!avatarUrl) return

    setIsUploading(true)

    try {
      const response = await fetch('/api/upload/avatar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la suppression')
      }

      setAvatarUrl(null)
      onUpdate?.('')
      toast.success('Photo de profil supprimée')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    } finally {
      setIsUploading(false)
    }
  }

  const displayAvatarUrl = avatarUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`

  return (
    <div className="relative group">
      <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-card bg-card shadow-lg ring-2 ring-primary/10">
        <Image
          src={displayAvatarUrl}
          alt={fullName}
          width={128}
          height={128}
          className="h-full w-full object-cover"
          priority
          unoptimized={displayAvatarUrl.includes('supabase.co')}
        />
      </div>

      {/* Overlay buttons on hover */}
      <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
              <Camera className="h-4 w-4" />
            </Button>
            {avatarUrl && (
              <Button
                size="sm"
                variant="destructive"
                className="cursor-pointer"
                onClick={handleRemoveAvatar}
              >
                <X className="h-4 w-4" />
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
