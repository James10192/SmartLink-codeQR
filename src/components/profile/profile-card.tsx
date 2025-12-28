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
import { canDownloadQr, getDaysUntilExpiration } from '@/lib/utils/tier-enforcement'
import { useRouter } from 'next/navigation'
import { Eye, Download, UserPlus, ExternalLink, Pencil, Trash2, QrCode } from 'lucide-react'
import type { Profile, User, Subscription } from '@prisma/client'

interface ProfileCardProps {
  profile: {
    id: string
    slug: string
    label: string
    fullName: string
    jobTitle: string | null
    company: string | null
    email: string
    phoneNumber: string
    avatarUrl: string | null
    viewsCount: number
    cvDownloads: number
    contactSaves: number
    userId: string
    user: {
      id: string
      email: string
      name: string | null
      subscription: {
        id: string
        plan: string
        status: string
        expiresAt: Date | null
      } | null
    }
  }
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Calculate subscription-based permissions
  const subscription = profile.user.subscription
  const canDownload = canDownloadQr(subscription as any)
  const daysLeft = getDaysUntilExpiration(subscription as any)

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
    <Card className="group overflow-hidden border-border bg-card transition-all hover:shadow-lg hover:border-primary/20">
      {/* Header with Avatar */}
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-primary/10 ring-offset-2 ring-offset-background">
            <AvatarImage src={profile.avatarUrl || undefined} alt={profile.fullName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1">
            <CardTitle className="text-xl font-bold text-foreground break-words hyphens-auto">
              {profile.label}
            </CardTitle>
            <CardDescription className="space-y-0.5">
              <div className="text-sm font-medium text-foreground/80 break-words">
                {profile.fullName}
              </div>
              {profile.jobTitle && (
                <div className="text-xs text-muted-foreground break-words">
                  {profile.jobTitle}
                  {profile.company && ` · ${profile.company}`}
                </div>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      {/* Statistics */}
      <CardContent className="space-y-4 pb-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/50 p-3 text-center transition-colors hover:bg-muted">
            <div className="flex items-center justify-center mb-1.5">
              <Eye className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{profile.viewsCount}</div>
            <div className="text-xs font-medium text-muted-foreground">Vues</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center transition-colors hover:bg-muted">
            <div className="flex items-center justify-center mb-1.5">
              <UserPlus className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{profile.contactSaves}</div>
            <div className="text-xs font-medium text-muted-foreground">Contacts</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center transition-colors hover:bg-muted">
            <div className="flex items-center justify-center mb-1.5">
              <Download className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{profile.cvDownloads}</div>
            <div className="text-xs font-medium text-muted-foreground">CV</div>
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Action Buttons */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="default"
              size="sm"
              className="cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              asChild
            >
              <Link href={`/profile/${profile.id}/preview`}>
                <Eye className="h-4 w-4 mr-2" />
                Voir
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer border-primary/20 text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary font-medium"
              asChild
            >
              <Link href={`/profile/${profile.id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Modifier
              </Link>
            </Button>
          </div>

          <QRCodeDialog
            profile={profile as any}
            canDownload={canDownload}
            daysUntilExpiration={daysLeft}
          />
        </div>
      </CardContent>

      {/* Delete Section */}
      <CardFooter className="pt-0 pb-4">
        {showDeleteConfirm ? (
          <div className="w-full space-y-2.5 rounded-lg border border-destructive/50 bg-destructive/5 p-3">
            <p className="text-sm text-destructive font-semibold">
              Confirmer la suppression ?
            </p>
            <p className="text-xs text-muted-foreground">
              Cette action est irréversible.
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 cursor-pointer font-medium"
              >
                {isDeleting ? 'Suppression...' : 'Oui, supprimer'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 cursor-pointer font-medium"
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
            className="w-full cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10 font-medium"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer le profil
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
