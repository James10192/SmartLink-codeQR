'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Plus, MessageSquare, Trash2, Edit, Star, AlertCircle, Upload, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import type { Testimonial } from '@prisma/client'

interface EditableTestimonialsProps {
  profileId: string
  initialTestimonials: Testimonial[]
  isOwner: boolean
  isPro: boolean
}

export function EditableTestimonials({
  profileId,
  initialTestimonials,
  isOwner,
  isPro,
}: EditableTestimonialsProps) {
  const [testimonials, setTestimonials] = useState(initialTestimonials)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    authorName: '',
    authorTitle: '',
    authorCompany: '',
    authorPhoto: '',
    content: '',
    rating: 5,
    relationship: '',
  })

  const resetForm = () => {
    setFormData({
      authorName: '',
      authorTitle: '',
      authorCompany: '',
      authorPhoto: '',
      content: '',
      rating: 5,
      relationship: '',
    })
    setEditingId(null)
    setError(null)
  }

  const handleAdd = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEdit = (testimonial: Testimonial) => {
    setFormData({
      authorName: testimonial.authorName,
      authorTitle: testimonial.authorTitle || '',
      authorCompany: testimonial.authorCompany || '',
      authorPhoto: testimonial.authorPhoto || '',
      content: testimonial.content,
      rating: testimonial.rating || 5,
      relationship: testimonial.relationship || '',
    })
    setEditingId(testimonial.id)
    setIsDialogOpen(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file) return

    setIsUploading(true)

    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('profileId', profileId)

      const response = await fetch('/api/upload/testimonial-photo', {
        method: 'POST',
        body: formDataUpload,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors du téléchargement')
      }

      setFormData((prev) => ({
        ...prev,
        authorPhoto: result.url,
      }))

      toast.success('Photo ajoutée')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors du téléchargement')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      authorPhoto: '',
    }))
  }

  const handleSave = async () => {
    if (!formData.authorName.trim() || !formData.content.trim()) {
      setError('Le nom et le contenu sont obligatoires')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const url = '/api/profile/testimonial'
      const method = editingId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          testimonialId: editingId,
          ...formData,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la sauvegarde')
      }

      if (editingId) {
        setTestimonials((prev) =>
          prev.map((t) => (t.id === editingId ? result.testimonial : t))
        )
        toast.success('Témoignage modifié')
      } else {
        setTestimonials((prev) => [...prev, result.testimonial])
        toast.success('Témoignage ajouté')
      }

      setIsDialogOpen(false)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce témoignage ?')) return

    try {
      const response = await fetch('/api/profile/testimonial', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testimonialId: id }),
      })

      if (!response.ok) throw new Error('Erreur lors de la suppression')

      setTestimonials((prev) => prev.filter((t) => t.id !== id))
      toast.success('Témoignage supprimé')
    } catch (err) {
      toast.error('Erreur lors de la suppression')
    }
  }

  // PRO tier gate
  if (!isPro && isOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Témoignages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle />
            <AlertDescription>
              Cette fonctionnalité nécessite le plan PRO.{' '}
              <a href="/dashboard/upgrade" className="underline">
                Passer au PRO
              </a>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Témoignages
        </CardTitle>
        {isOwner && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAdd} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Modifier le témoignage' : 'Ajouter un témoignage'}
                </DialogTitle>
                <DialogDescription>
                  Les témoignages renforcent votre crédibilité professionnelle
                </DialogDescription>
              </DialogHeader>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                {/* Author Name */}
                <Field>
                  <FieldLabel htmlFor="authorName">Nom de l'auteur *</FieldLabel>
                  <Input
                    id="authorName"
                    value={formData.authorName}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    placeholder="Jean Dupont"
                  />
                </Field>

                {/* Author Title */}
                <Field>
                  <FieldLabel htmlFor="authorTitle">Titre</FieldLabel>
                  <Input
                    id="authorTitle"
                    value={formData.authorTitle}
                    onChange={(e) => setFormData({ ...formData, authorTitle: e.target.value })}
                    placeholder="CEO"
                  />
                </Field>

                {/* Author Company */}
                <Field>
                  <FieldLabel htmlFor="authorCompany">Entreprise</FieldLabel>
                  <Input
                    id="authorCompany"
                    value={formData.authorCompany}
                    onChange={(e) => setFormData({ ...formData, authorCompany: e.target.value })}
                    placeholder="Tech Corp"
                  />
                </Field>

                {/* Relationship */}
                <Field>
                  <FieldLabel htmlFor="relationship">Relation professionnelle</FieldLabel>
                  <Input
                    id="relationship"
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    placeholder="Client, Collègue, Manager, etc."
                  />
                </Field>

                {/* Content */}
                <Field>
                  <FieldLabel htmlFor="content">Témoignage *</FieldLabel>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Décrivez votre expérience de travail..."
                    rows={6}
                  />
                </Field>

                {/* Rating */}
                <Field>
                  <FieldLabel htmlFor="rating">Note</FieldLabel>
                  <Input
                    id="rating"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) =>
                      setFormData({ ...formData, rating: parseInt(e.target.value) || 5 })
                    }
                  />
                  <FieldDescription>De 1 à 5 étoiles</FieldDescription>
                </Field>

                {/* Author Photo Upload */}
                <Field>
                  <FieldLabel>Photo de l'auteur</FieldLabel>
                  {formData.authorPhoto ? (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                      <Image
                        src={formData.authorPhoto}
                        alt="Author photo"
                        fill
                        className="object-cover"
                        unoptimized={formData.authorPhoto.includes('supabase.co')}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <label className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                    </label>
                  )}
                  {isUploading && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Téléchargement en cours...
                    </p>
                  )}
                  <FieldDescription>Optionnel</FieldDescription>
                </Field>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false)
                      resetForm()
                    }}
                    disabled={isSaving || isUploading}
                  >
                    Annuler
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving || isUploading}>
                    {isSaving ? 'Enregistrement...' : editingId ? 'Modifier' : 'Ajouter'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {testimonials.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageSquare />
              </EmptyMedia>
              <EmptyTitle>Aucun témoignage</EmptyTitle>
              <EmptyDescription>
                {isOwner
                  ? 'Ajoutez des témoignages de clients ou collègues'
                  : 'Aucun témoignage pour le moment'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-4">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="relative">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Rating */}
                      {testimonial.rating && (
                        <div className="flex gap-1 mb-2">
                          {Array.from({ length: testimonial.rating }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      )}

                      {/* Content */}
                      <p className="text-sm italic mb-4">&ldquo;{testimonial.content}&rdquo;</p>

                      {/* Author info */}
                      <div className="flex items-center gap-3">
                        {testimonial.authorPhoto && (
                          <img
                            src={testimonial.authorPhoto}
                            alt={testimonial.authorName}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-sm">{testimonial.authorName}</p>
                          <p className="text-xs text-muted-foreground">
                            {[testimonial.authorTitle, testimonial.authorCompany]
                              .filter(Boolean)
                              .join(' • ')}
                          </p>
                          {testimonial.relationship && (
                            <p className="text-xs text-muted-foreground">
                              {testimonial.relationship}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions (Owner only) */}
                    {isOwner && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(testimonial)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(testimonial.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
