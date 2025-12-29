'use client'

import { useState } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface Skill {
  id: string
  name: string
  level: string
}

interface EditableSkillsProps {
  profileId: string
  skills: Skill[]
  onUpdate?: (skills: Skill[]) => void
}

export function EditableSkills({ profileId, skills: initialSkills, onUpdate }: EditableSkillsProps) {
  const [skills, setSkills] = useState(initialSkills)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    level: 'INTERMEDIATE',
  })

  const handleAdd = () => {
    setFormData({ name: '', level: 'INTERMEDIATE' })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Veuillez entrer le nom de la compétence')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/profile/skill', {
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

      const updatedSkills = [...skills, result.skill]
      setSkills(updatedSkills)
      onUpdate?.(updatedSkills)
      setIsDialogOpen(false)
      toast.success('Compétence ajoutée')
    } catch (error) {
      console.error('Save error:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'ajout')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (skillId: string) => {
    setIsSaving(true)

    try {
      const response = await fetch('/api/profile/skill', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, skillId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la suppression')
      }

      const updatedSkills = skills.filter(s => s.id !== skillId)
      setSkills(updatedSkills)
      onUpdate?.(updatedSkills)
      toast.success('Compétence supprimée')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    } finally {
      setIsSaving(false)
    }
  }

  if (skills.length === 0) {
    return (
      <>
        <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Ajoutez vos compétences techniques et soft skills
          </p>
          <Button size="sm" className="cursor-pointer bg-primary hover:bg-primary/90" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter des compétences
          </Button>
        </div>

        <SkillDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          isSaving={isSaving}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <Badge
            key={skill.id}
            className="group px-3 py-1.5 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer relative"
            style={{
              opacity: skill.level === 'EXPERT' ? 1 : skill.level === 'ADVANCED' ? 0.9 : skill.level === 'INTERMEDIATE' ? 0.75 : 0.6,
            }}
          >
            <span>{skill.name}</span>
            {skill.level !== 'INTERMEDIATE' && (
              <span className="ml-1 text-xs opacity-75">
                ({skill.level.toLowerCase()})
              </span>
            )}
            {/* Desktop: Show on hover */}
            <button
              className="ml-2 hidden md:inline opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleDelete(skill.id)}
            >
              <X className="h-3 w-3" />
            </button>
            {/* Mobile: Always visible */}
            <button
              className="ml-2 md:hidden"
              onClick={() => handleDelete(skill.id)}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Button
          size="sm"
          variant="outline"
          className="cursor-pointer border-dashed"
          onClick={handleAdd}
        >
          <Plus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </div>

      <SkillDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </>
  )
}

function SkillDialog({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSave,
  isSaving,
}: {
  isOpen: boolean
  onClose: () => void
  formData: any
  setFormData: (data: any) => void
  onSave: () => void
  isSaving: boolean
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter une compétence</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nom de la compétence *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: React, Leadership, Photoshop..."
            />
          </div>

          <div>
            <Label htmlFor="level">Niveau *</Label>
            <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BEGINNER">Débutant</SelectItem>
                <SelectItem value="INTERMEDIATE">Intermédiaire</SelectItem>
                <SelectItem value="ADVANCED">Avancé</SelectItem>
                <SelectItem value="EXPERT">Expert</SelectItem>
              </SelectContent>
            </Select>
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
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
