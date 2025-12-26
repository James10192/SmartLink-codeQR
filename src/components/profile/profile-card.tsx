'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { QRCodeDialog } from '@/components/profile/qr-code-dialog'
import { deleteProfileAction } from '@/lib/actions/profile'
import { useRouter } from 'next/navigation'
import { Eye, Download, UserPlus, ExternalLink, Pencil, Trash2 } from 'lucide-react'

interface ProfileCardProps {
  profile: {
    id: string
    slug: string
    fullName: string
    jobTitle: string | null
    company: string | null
    email: string
    phoneNumber: string
    avatarUrl: string | null
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

  // Get initials for avatar fallback
  const initials = profile.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={profile.avatarUrl || undefined} alt={profile.fullName} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg">{profile.fullName}</CardTitle>
            <CardDescription>
              {profile.jobTitle && <div>{profile.jobTitle}</div>}
              {profile.company && <div className="text-xs">{profile.company}</div>}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Eye className="h-3 w-3" />
            </div>
            <div className="text-2xl font-bold">{profile.viewsCount}</div>
            <div className="text-xs text-muted-foreground">Vues</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <UserPlus className="h-3 w-3" />
            </div>
            <div className="text-2xl font-bold">{profile.contactSaves}</div>
            <div className="text-xs text-muted-foreground">Contacts</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Download className="h-3 w-3" />
            </div>
            <div className="text-2xl font-bold">{profile.cvDownloads}</div>
            <div className="text-xs text-muted-foreground">CV</div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/u/${profile.slug}`} target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                Voir
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/profile/${profile.id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Modifier
              </Link>
            </Button>
          </div>

          <QRCodeDialog slug={profile.slug} fullName={profile.fullName} />
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        {showDeleteConfirm ? (
          <div className="w-full space-y-2 rounded-md border border-destructive bg-destructive/10 p-3">
            <p className="text-sm text-destructive font-medium">Confirmer la suppression ?</p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1"
              >
                {isDeleting ? 'Suppression...' : 'Oui, supprimer'}
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
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
