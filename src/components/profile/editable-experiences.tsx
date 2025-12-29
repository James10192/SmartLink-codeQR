'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Calendar, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Experience {
  id: string
  position: string
  company: string
  location: string | null
  startDate: Date
  endDate: Date | null
  isCurrent: boolean
  employmentType: string
  description: string | null
}

interface EditableExperiencesProps {
  profileId: string
  experiences: Experience[]
  onUpdate?: (experiences: Experience[]) => void
}

export function EditableExperiences({ profileId, experiences: initialExperiences, onUpdate }: EditableExperiencesProps) {
  const [experiences, setExperiences] = useState(initialExperiences)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExp, setEditingExp] = useState<Experience | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    position: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    employmentType: 'FULL_TIME',
    description: '',
  })

  const handleAdd = () => {
    setEditingExp(null)
    setFormData({
      position: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      employmentType: 'FULL_TIME',
      description: '',
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (exp: Experience) => {
    setEditingExp(exp)
    setFormData({
      position: exp.position,
      company: exp.company,
      location: exp.location || '',
      startDate: format(new Date(exp.startDate), 'yyyy-MM'),
      endDate: exp.endDate ? format(new Date(exp.endDate), 'yyyy-MM') : '',
      isCurrent: exp.isCurrent,
      employmentType: exp.employmentType,
      description: exp.description || '',
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.position || !formData.company || !formData.startDate) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/profile/experience', {
        method: editingExp ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          experienceId: editingExp?.id,
          ...formData,
          startDate: new Date(formData.startDate + '-01'),
          endDate: formData.endDate && !formData.isCurrent ? new Date(formData.endDate + '-01') : null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la sauvegarde')
      }

      const updatedExperiences = editingExp
        ? experiences.map(e => e.id === editingExp.id ? result.experience : e)
        : [...experiences, result.experience]

      setExperiences(updatedExperiences)
      onUpdate?.(updatedExperiences)
      setIsDialogOpen(false)
      toast.success(editingExp ? 'Expérience mise à jour' : 'Expérience ajoutée')
    } catch (error) {
      console.error('Save error:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (expId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette expérience ?')) return

    setIsSaving(true)

    try {
      const response = await fetch('/api/profile/experience', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, experienceId: expId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la suppression')
      }

      const updatedExperiences = experiences.filter(e => e.id !== expId)
      setExperiences(updatedExperiences)
      onUpdate?.(updatedExperiences)
      toast.success('Expérience supprimée')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    } finally {
      setIsSaving(false)
    }
  }

  if (experiences.length === 0) {
    return (
      <>
        <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Ajoutez vos expériences professionnelles pour enrichir votre profil
          </p>
          <Button size="sm" className="cursor-pointer bg-primary hover:bg-primary/90" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une expérience
          </Button>
        </div>

        <ExperienceDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          isSaving={isSaving}
          isEditing={!!editingExp}
        />
      </>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {experiences.map((exp) => (
          <div key={exp.id} className="relative pl-8 pb-6 border-l-2 border-border last:pb-0 group">
            <div className="absolute left-0 top-0 -ml-[9px] h-4 w-4 rounded-full border-2 border-card bg-primary" />
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {exp.position}
                </h3>
                {/* Desktop: Show on hover */}
                <div className="hidden md:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="cursor-pointer h-8 w-8 p-0"
                    onClick={() => handleEdit(exp)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="cursor-pointer h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(exp.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {/* Mobile: Always visible */}
                <div className="flex md:hidden gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer h-8 w-8 p-0"
                    onClick={() => handleEdit(exp)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(exp.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="font-medium text-foreground/80">
                {exp.company}
                {exp.location && ` · ${exp.location}`}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(exp.startDate), 'MMM yyyy', { locale: fr })}
                  {' - '}
                  {exp.isCurrent
                    ? "Aujourd'hui"
                    : exp.endDate
                    ? format(new Date(exp.endDate), 'MMM yyyy', { locale: fr })
                    : 'Présent'}
                </span>
                <Badge variant="outline" className="text-xs">
                  {exp.employmentType.replace('_', ' ')}
                </Badge>
              </div>
              {exp.description && (
                <p className="mt-2 text-foreground/70 leading-relaxed">
                  {exp.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bouton pour ajouter une nouvelle expérience */}
      <div className="pt-4">
        <Button
          size="sm"
          variant="outline"
          className="cursor-pointer w-full border-dashed"
          onClick={handleAdd}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une expérience
        </Button>
      </div>

      <ExperienceDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        isSaving={isSaving}
        isEditing={!!editingExp}
      />
    </>
  )
}

function ExperienceDialog({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSave,
  isSaving,
  isEditing,
}: {
  isOpen: boolean
  onClose: () => void
  formData: any
  setFormData: (data: any) => void
  onSave: () => void
  isSaving: boolean
  isEditing: boolean
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifier' : 'Ajouter'} une expérience</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto px-1 max-h-[60vh] sm:max-h-[70vh]">
          <div>
            <Label htmlFor="position">Poste *</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="Ex: Développeur Full-Stack"
            />
          </div>

          <div>
            <Label htmlFor="company">Entreprise *</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Ex: Tech Corp"
            />
          </div>

          <div>
            <Label htmlFor="location">Localisation</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ex: Paris, France"
            />
          </div>

          <div>
            <Label htmlFor="employmentType">Type de contrat *</Label>
            <Select value={formData.employmentType} onValueChange={(value) => setFormData({ ...formData, employmentType: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FULL_TIME">Temps plein</SelectItem>
                <SelectItem value="PART_TIME">Temps partiel</SelectItem>
                <SelectItem value="FREELANCE">Freelance</SelectItem>
                <SelectItem value="INTERNSHIP">Stage</SelectItem>
                <SelectItem value="CONTRACT">Contrat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Date de début *</Label>
              <Input
                id="startDate"
                type="month"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                type="month"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                disabled={formData.isCurrent}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isCurrent"
              checked={formData.isCurrent}
              onCheckedChange={(checked) => setFormData({ ...formData, isCurrent: checked, endDate: checked ? '' : formData.endDate })}
            />
            <Label htmlFor="isCurrent" className="cursor-pointer">
              Je travaille actuellement à ce poste
            </Label>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez vos responsabilités et réalisations..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isSaving} className="cursor-pointer w-full sm:w-auto">
            Annuler
          </Button>
          <Button onClick={onSave} disabled={isSaving} className="cursor-pointer bg-primary hover:bg-primary/90 w-full sm:w-auto">
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {isEditing ? 'Mettre à jour' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
