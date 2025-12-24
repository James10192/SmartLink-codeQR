'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { deleteProfileAction } from '@/lib/actions/profile'
import { useRouter } from 'next/navigation'

interface ProfileCardProps {
  profile: {
    id: string
    slug: string
    fullName: string
    jobTitle: string | null
    company: string | null
    email: string
    phoneNumber: string
    viewsCount: number
    cvDownloads: number
    contactSaves: number
  }
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)

    try {
      await deleteProfileAction({ profileId: profile.id })
      router.refresh()
    } catch (error) {
      console.error('Error deleting profile:', error)
      alert('Erreur lors de la suppression du profil')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{profile.fullName}</CardTitle>
        <CardDescription>
          {profile.jobTitle && <span>{profile.jobTitle}</span>}
          {profile.company && <span className="block text-xs">{profile.company}</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>{profile.email}</p>
          <p>{profile.phoneNumber}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-md bg-muted p-3">
          <div className="text-center">
            <p className="text-2xl font-bold">{profile.viewsCount}</p>
            <p className="text-xs text-muted-foreground">Vues</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{profile.contactSaves}</p>
            <p className="text-xs text-muted-foreground">Contacts</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{profile.cvDownloads}</p>
            <p className="text-xs text-muted-foreground">CV</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild className="flex-1">
              <Link href={`/u/${profile.slug}`} target="_blank">
                Voir
              </Link>
            </Button>

            <Button variant="outline" size="sm" asChild className="flex-1">
              <Link href={`/profile/${profile.id}/edit`}>Modifier</Link>
            </Button>
          </div>

          {showDeleteConfirm ? (
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1"
              >
                {isDeleting ? '...' : 'Confirmer'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1"
              >
                Annuler
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full"
            >
              Supprimer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
