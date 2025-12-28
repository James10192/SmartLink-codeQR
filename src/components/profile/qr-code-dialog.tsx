'use client'

import { useState } from 'react'
import { Download, QrCode, Share2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Image from 'next/image'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Profile, User, Subscription } from '@prisma/client'

interface QRCodeDialogProps {
  profile: Profile & {
    user: User & {
      subscription: Subscription | null
    }
  }
  canDownload: boolean // Derived from canDownloadQr(subscription)
  daysUntilExpiration: number | null // Derived from getDaysUntilExpiration(subscription)
}

export function QRCodeDialog({
  profile,
  canDownload,
  daysUntilExpiration,
}: QRCodeDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // Show expiration warning if subscription expires soon (< 7 days)
  const showExpirationWarning =
    daysUntilExpiration !== null && daysUntilExpiration > 0 && daysUntilExpiration <= 7

  async function handleDownload(format: 'png' | 'svg') {
    if (!canDownload) {
      toast.error('Passez au plan PRO pour télécharger votre QR code')
      return
    }

    setIsDownloading(true)

    try {
      // 1. Créer/récupérer le QR link en DB
      const qrLinkResponse = await fetch(`/api/qr-link/${profile.id}`, {
        method: 'POST',
      })

      if (!qrLinkResponse.ok) {
        const errorData = await qrLinkResponse.json()
        toast.error(errorData.error || 'Erreur lors de la génération du QR link')
        return
      }

      const { shortCode } = await qrLinkResponse.json()

      // 2. Télécharger le QR code qui pointe vers /q/[shortCode]
      const qrUrl = `/api/qr/${profile.slug}?format=${format}&shortCode=${shortCode}`
      const qrResponse = await fetch(qrUrl)

      if (!qrResponse.ok) {
        const errorData = await qrResponse.json()

        if (qrResponse.status === 403) {
          toast.error(errorData.error || 'Accès refusé')
          return
        }

        throw new Error(errorData.error || 'Erreur lors du téléchargement')
      }

      const blob = await qrResponse.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `smartlink-${profile.slug}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      toast.success(`QR code téléchargé (${format.toUpperCase()})`)
    } catch (error) {
      console.error('Error downloading QR code:', error)
      toast.error('Erreur lors du téléchargement du QR code')
    } finally {
      setIsDownloading(false)
    }
  }

  async function handleShare() {
    const profileUrl = `${window.location.origin}/u/${profile.slug}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Profil de ${profile.fullName}`,
          text: `Découvrez le profil de ${profile.fullName} sur SmartLink`,
          url: profileUrl,
        })
      } catch (error) {
        // User cancelled share or share failed
        console.log('Share cancelled or failed')
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(profileUrl)
        toast.success('Lien copié dans le presse-papier !')
      } catch (error) {
        console.error('Error copying to clipboard:', error)
        toast.error('Impossible de copier le lien')
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="outline"
        size="sm"
        className="flex-1 gap-2 cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <QrCode className="h-4 w-4" />
        QR Code
      </Button>

      <DialogContent className="sm:max-w-md max-h-[95vh]">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Code QR du profil</DialogTitle>
          <DialogDescription className="text-sm">
            {canDownload
              ? 'Téléchargez et partagez votre code QR dynamique'
              : 'Passez au plan PRO pour débloquer le téléchargement'}
          </DialogDescription>
        </DialogHeader>

        {/* Expiration Warning */}
        {showExpirationWarning && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  Votre abonnement expire dans {daysUntilExpiration}{' '}
                  {daysUntilExpiration === 1 ? 'jour' : 'jours'}
                </p>
                <p className="mt-1 text-xs text-orange-700 dark:text-orange-300">
                  Les QR codes téléchargés cesseront de fonctionner après expiration.
                </p>
                <Link
                  href="/pricing"
                  className="mt-2 inline-block text-xs font-medium text-orange-600 underline hover:text-orange-700 dark:text-orange-400"
                >
                  Renouveler maintenant
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-4 sm:gap-6 py-2 sm:py-4">
          {/* QR Code Preview - Visible pour tous (FREE et PRO) */}
          <div className="relative rounded-lg border bg-white p-3 sm:p-4">
            <Image
              src={`/api/qr/${profile.slug}`}
              alt={`QR Code pour ${profile.fullName}`}
              width={256}
              height={256}
              className="w-48 h-48 sm:w-64 sm:h-64"
              unoptimized
            />
          </div>

          {/* Actions */}
          {canDownload ? (
            <>
              <div className="flex flex-col sm:flex-row w-full gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleDownload('png')}
                  className="flex-1 gap-2"
                  disabled={isDownloading}
                >
                  <Download className="h-4 w-4" />
                  {isDownloading ? 'Téléchargement...' : 'PNG'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownload('svg')}
                  className="flex-1 gap-2"
                  disabled={isDownloading}
                >
                  <Download className="h-4 w-4" />
                  {isDownloading ? 'Téléchargement...' : 'SVG'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="flex-1 gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Partager
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                QR code dynamique : le QR téléchargé restera valide même si vous changez votre profil
              </p>
            </>
          ) : (
            <div className="w-full space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Vous pouvez voir votre QR code mais pas le télécharger avec le plan FREE
              </p>

              <Link href="/pricing" className="block w-full">
                <Button className="w-full gap-2" size="lg">
                  Passer au plan PRO pour télécharger
                </Button>
              </Link>

              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                <p className="text-center text-xs text-gray-600 dark:text-gray-400">
                  Avec le plan PRO, obtenez :
                </p>
                <ul className="mt-2 space-y-1 text-xs text-gray-700 dark:text-gray-300">
                  <li>✓ QR codes dynamiques téléchargeables (PNG & SVG)</li>
                  <li>✓ QR permanent même si vous changez votre profil</li>
                  <li>✓ Statistiques de scans détaillées</li>
                  <li>✓ 3 profils au lieu de 1</li>
                </ul>
              </div>

              <Button
                variant="ghost"
                onClick={handleShare}
                className="w-full gap-2"
                size="sm"
              >
                <Share2 className="h-4 w-4" />
                Partager le lien du profil
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
