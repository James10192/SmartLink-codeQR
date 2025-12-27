'use client'

import { useState } from 'react'
import { Pencil, Plus, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface EditableBioProps {
  profileId: string
  initialBio: string | null
  onUpdate?: (newBio: string) => void
}

export function EditableBio({ profileId, initialBio, onUpdate }: EditableBioProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [bio, setBio] = useState(initialBio || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const response = await fetch('/api/profile/update-bio', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, bio }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la mise à jour')
      }

      onUpdate?.(bio)
      setIsEditing(false)
      toast.success('Bio mise à jour')
    } catch (error) {
      console.error('Update error:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setBio(initialBio || '')
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="space-y-3">
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Présentez votre parcours, vos compétences et vos objectifs professionnels..."
          className="min-h-[150px] resize-none"
          maxLength={1000}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {bio.length}/1000 caractères
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              className="cursor-pointer"
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="cursor-pointer bg-primary hover:bg-primary/90"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (bio) {
    return (
      <div className="group relative">
        <p className="whitespace-pre-line text-foreground/80 leading-relaxed">
          {bio}
        </p>
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 text-center">
      <p className="text-sm text-muted-foreground mb-3">
        Ajoutez une bio pour présenter votre parcours
      </p>
      <Button
        size="sm"
        variant="outline"
        className="cursor-pointer"
        onClick={() => setIsEditing(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Ajouter une bio
      </Button>
    </div>
  )
}
