'use client'

import { useState } from 'react'
import { Plus, X, Loader2, Upload, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import Image from 'next/image'

interface Project {
  id: string
  title: string
  description: string | null
  images: string[]
}

interface EditableProjectsProps {
  profileId: string
  projects: Project[]
  onUpdate?: (projects: Project[]) => void
}

export function EditableProjects({ profileId, projects: initialProjects, onUpdate }: EditableProjectsProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    images: [] as string[],
  })

  const handleAdd = () => {
    setFormData({ title: '', description: '', images: [] })
    setIsDialogOpen(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Limit to 3 images
    if (formData.images.length + files.length > 3) {
      toast.error('Maximum 3 images par projet')
      return
    }

    setIsUploading(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('profileId', profileId)

        const response = await fetch('/api/upload/project-image', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Erreur lors du téléchargement')
        }

        return result.url
      })

      const newImageUrls = await Promise.all(uploadPromises)

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newImageUrls],
      }))

      toast.success(`${newImageUrls.length} image(s) ajoutée(s)`)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors du téléchargement')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Veuillez entrer le titre du projet')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/profile/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          ...formData,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'ajout')
      }

      const updatedProjects = [...projects, result.project]
      setProjects(updatedProjects)
      onUpdate?.(updatedProjects)
      setIsDialogOpen(false)
      toast.success('Projet ajouté')
    } catch (error) {
      console.error('Save error:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'ajout')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (projectId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return

    setIsSaving(true)

    try {
      const response = await fetch('/api/profile/project', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, projectId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la suppression')
      }

      const updatedProjects = projects.filter((p) => p.id !== projectId)
      setProjects(updatedProjects)
      onUpdate?.(updatedProjects)
      toast.success('Projet supprimé')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    } finally {
      setIsSaving(false)
    }
  }

  if (projects.length === 0) {
    return (
      <>
        <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Ajoutez vos projets pour mettre en valeur vos réalisations
          </p>
          <Button size="sm" className="cursor-pointer bg-primary hover:bg-primary/90" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un projet
          </Button>
        </div>

        <ProjectDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          isSaving={isSaving}
          isUploading={isUploading}
          onImageUpload={handleImageUpload}
          onRemoveImage={handleRemoveImage}
        />
      </>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-lg border overflow-hidden group hover:shadow-lg transition-shadow relative"
            >
              {project.images[0] && (
                <div className="relative h-40 bg-muted">
                  <Image
                    src={project.images[0]}
                    alt={project.title}
                    fill
                    className="object-cover"
                    unoptimized={project.images[0].includes('supabase.co')}
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-foreground">{project.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {project.description}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(project.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button size="sm" className="cursor-pointer bg-primary hover:bg-primary/90" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un projet
        </Button>
      </div>

      <ProjectDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        isSaving={isSaving}
        isUploading={isUploading}
        onImageUpload={handleImageUpload}
        onRemoveImage={handleRemoveImage}
      />
    </>
  )
}

interface ProjectDialogProps {
  isOpen: boolean
  onClose: () => void
  formData: { title: string; description: string; images: string[] }
  setFormData: React.Dispatch<
    React.SetStateAction<{ title: string; description: string; images: string[] }>
  >
  onSave: () => void
  isSaving: boolean
  isUploading: boolean
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: (index: number) => void
}

function ProjectDialog({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSave,
  isSaving,
  isUploading,
  onImageUpload,
  onRemoveImage,
}: ProjectDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Ajouter un projet</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre du projet *</Label>
            <Input
              id="title"
              placeholder="Ex: Application mobile e-commerce"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Décrivez votre projet..."
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Images (max 3)</Label>
            <div className="grid grid-cols-3 gap-2">
              {formData.images.map((imageUrl, index) => (
                <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                  <Image src={imageUrl} alt={`Project ${index + 1}`} fill className="object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => onRemoveImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {formData.images.length < 3 && (
                <label className="aspect-square rounded-md border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onImageUpload}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
            {isUploading && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Téléchargement en cours...
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving || isUploading}>
            Annuler
          </Button>
          <Button onClick={onSave} disabled={isSaving || isUploading}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
