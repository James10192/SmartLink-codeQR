'use client'

import { useState } from 'react'
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
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Switch } from '@/components/ui/switch'
import { Plus, FileText, Trash2, Edit, AlertCircle, Eye, EyeOff, Upload, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import type { Post } from '@prisma/client'

interface EditablePostsProps {
  profileId: string
  initialPosts: Post[]
  isOwner: boolean
  isPro: boolean
}

export function EditablePosts({ profileId, initialPosts, isOwner, isPro }: EditablePostsProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    tags: [] as string[],
    isPublished: false,
  })

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      coverImage: '',
      tags: [],
      isPublished: false,
    })
    setEditingId(null)
    setError(null)
  }

  const handleAdd = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEdit = (post: Post) => {
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      coverImage: post.coverImage || '',
      tags: post.tags,
      isPublished: post.isPublished,
    })
    setEditingId(post.id)
    setIsDialogOpen(true)
  }

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Remove consecutive hyphens
  }

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title), // Auto-generate slug
    })
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

      const response = await fetch('/api/upload/post-cover', {
        method: 'POST',
        body: formDataUpload,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors du téléchargement')
      }

      setFormData((prev) => ({
        ...prev,
        coverImage: result.url,
      }))

      toast.success('Image de couverture ajoutée')
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
      coverImage: '',
    }))
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Le titre et le contenu sont obligatoires')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const url = '/api/profile/post'
      const method = editingId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          postId: editingId,
          ...formData,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la sauvegarde')
      }

      if (editingId) {
        setPosts((prev) => prev.map((p) => (p.id === editingId ? result.post : p)))
        toast.success('Article modifié')
      } else {
        setPosts((prev) => [...prev, result.post])
        toast.success('Article créé')
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
    if (!confirm('Supprimer cet article ?')) return

    try {
      const response = await fetch('/api/profile/post', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: id }),
      })

      if (!response.ok) throw new Error('Erreur lors de la suppression')

      setPosts((prev) => prev.filter((p) => p.id !== id))
      toast.success('Article supprimé')
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
            <FileText className="h-5 w-5" />
            Articles
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

  const visiblePosts = isOwner ? posts : posts.filter((p) => p.isPublished)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Articles
        </CardTitle>
        {isOwner && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAdd} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Modifier l'article" : 'Créer un article'}
                </DialogTitle>
                <DialogDescription>
                  Partagez vos réflexions et expertise professionnelle
                </DialogDescription>
              </DialogHeader>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                {/* Title */}
                <Field>
                  <FieldLabel htmlFor="title">Titre *</FieldLabel>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Le titre de votre article"
                  />
                </Field>

                {/* Auto-generated slug */}
                <Field>
                  <FieldLabel htmlFor="slug">URL (slug)</FieldLabel>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="url-de-larticle"
                  />
                  <FieldDescription>Généré automatiquement depuis le titre</FieldDescription>
                </Field>

                {/* Excerpt */}
                <Field>
                  <FieldLabel htmlFor="excerpt">Résumé</FieldLabel>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Court résumé de l'article..."
                    rows={3}
                  />
                </Field>

                {/* Content */}
                <Field>
                  <FieldLabel htmlFor="content">Contenu *</FieldLabel>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Le contenu de votre article..."
                    rows={12}
                  />
                  <FieldDescription>Vous pouvez utiliser du Markdown</FieldDescription>
                </Field>

                {/* Cover Image Upload */}
                <Field>
                  <FieldLabel>Image de couverture</FieldLabel>
                  {formData.coverImage ? (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                      <Image
                        src={formData.coverImage}
                        alt="Cover image"
                        fill
                        className="object-cover"
                        unoptimized={formData.coverImage.includes('supabase.co')}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="w-full h-48 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Cliquez pour télécharger une image</span>
                      <span className="text-xs text-muted-foreground">JPG, PNG ou WebP (max 5MB)</span>
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

                {/* Tags */}
                <Field>
                  <FieldLabel htmlFor="tags">Tags (séparés par des virgules)</FieldLabel>
                  <Input
                    id="tags"
                    value={formData.tags.join(', ')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                      })
                    }
                    placeholder="tech, productivité, développement"
                  />
                </Field>

                {/* Publish toggle */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FieldLabel>Publier l'article</FieldLabel>
                    <FieldDescription>
                      Les articles non publiés sont visibles uniquement par vous
                    </FieldDescription>
                  </div>
                  <Switch
                    checked={formData.isPublished}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isPublished: checked })
                    }
                  />
                </div>

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
                    {isSaving ? 'Enregistrement...' : editingId ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {visiblePosts.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>Aucun article</EmptyTitle>
              <EmptyDescription>
                {isOwner ? 'Créez votre premier article' : 'Aucun article publié pour le moment'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visiblePosts.map((post) => (
              <Card key={post.id}>
                <CardContent className="pt-6">
                  {post.coverImage && (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                  )}

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-base line-clamp-2">{post.title}</h4>
                    <div className="flex items-center gap-1 shrink-0">
                      {post.isPublished ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}

                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {isOwner && (
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleEdit(post)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(post.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
