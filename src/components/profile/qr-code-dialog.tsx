'use client'

import { useState } from 'react'
import { Download, QrCode, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import Image from 'next/image'

interface QRCodeDialogProps {
  slug: string
  fullName: string
}

export function QRCodeDialog({ slug, fullName }: QRCodeDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const qrCodeUrl = `/api/qr/${slug}`

  async function handleDownload() {
    try {
      const response = await fetch(qrCodeUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `qrcode-${slug}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading QR code:', error)
    }
  }

  async function handleShare() {
    const profileUrl = `${window.location.origin}/u/${slug}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Profil de ${fullName}`,
          text: `Découvrez le profil de ${fullName} sur SmartLink`,
          url: profileUrl,
        })
      } catch (error) {
        // User cancelled share
        console.log('Share cancelled')
      }
    } else {
      // Fallback: copier dans le presse-papier
      try {
        await navigator.clipboard.writeText(profileUrl)
        alert('Lien copié dans le presse-papier !')
      } catch (error) {
        console.error('Error copying to clipboard:', error)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="outline"
        size="sm"
        className="flex-1 gap-2"
        onClick={() => setIsOpen(true)}
      >
        <QrCode className="h-4 w-4" />
        QR Code
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Code QR du profil</DialogTitle>
          <DialogDescription>
            Partagez votre profil en scannant ce code QR
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <div className="rounded-lg border bg-white p-4">
            <Image
              src={qrCodeUrl}
              alt={`QR Code pour ${fullName}`}
              width={256}
              height={256}
              className="h-64 w-64"
            />
          </div>

          <div className="flex w-full gap-2">
            <Button
              variant="outline"
              onClick={handleDownload}
              className="flex-1 gap-2"
            >
              <Download className="h-4 w-4" />
              Télécharger
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
            Scannez ce code avec votre téléphone pour accéder au profil
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
