'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Phone, X } from 'lucide-react'
import { toast } from 'sonner'

interface VisitorCaptureModalProps {
  profileId: string
  profileOwnerName: string
}

export function VisitorCaptureModal({ profileId, profileOwnerName }: VisitorCaptureModalProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Check if visitor info was already captured (localStorage)
    const capturedKey = `visitor-captured-${profileId}`
    const alreadyCaptured = localStorage.getItem(capturedKey)

    if (!alreadyCaptured) {
      // Show modal after 1 second delay
      const timer = setTimeout(() => {
        setOpen(true)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [profileId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Veuillez entrer votre nom')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/profile/capture-visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          visitorName: name.trim(),
          visitorContact: contact.trim(),
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'enregistrement')
      }

      // Save to localStorage to prevent showing again
      localStorage.setItem(`visitor-captured-${profileId}`, 'true')

      toast.success('Merci ! Vos informations ont été enregistrées')
      setOpen(false)
    } catch (error) {
      console.error('Visitor capture error:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur réseau')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    // Save to localStorage to prevent showing again
    localStorage.setItem(`visitor-captured-${profileId}`, 'true')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Connectez-vous avec {profileOwnerName}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Laissez vos coordonnées pour que {profileOwnerName} puisse vous recontacter facilement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="visitor-name">
              Votre nom <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="visitor-name"
                type="text"
                placeholder="Jean Kouassi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visitor-contact">
              Email ou Téléphone <span className="text-xs text-muted-foreground">(optionnel)</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="visitor-contact"
                type="text"
                placeholder="+225 07 XX XX XX XX ou email@exemple.com"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              className="flex-1"
            >
              Passer
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          Vos informations sont privées et uniquement visibles par {profileOwnerName}.
        </p>
      </DialogContent>
    </Dialog>
  )
}
