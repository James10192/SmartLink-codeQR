import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SmartLink - Votre Carte de Visite Numérique avec QR Code',
  description:
    'Créez votre profil professionnel en ligne avec QR Code. Partagez vos contacts, CV et réseaux sociaux en 1 scan. Fini les cartes papier perdues. Gratuit pour commencer.',
  keywords: [
    'carte de visite numérique',
    'QR Code',
    'vCard',
    'profil professionnel',
    'CV en ligne',
    'networking',
    'Abidjan',
    'Côte d\'Ivoire',
    'contact digital',
  ],
  authors: [{ name: 'SmartLink' }],
  creator: 'SmartLink',
  publisher: 'SmartLink',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://smartlink.vercel.app',
    title: 'SmartLink - Votre Carte de Visite Numérique',
    description:
      'Créez votre profil professionnel avec QR Code. Partagez vos contacts et CV en 1 scan.',
    siteName: 'SmartLink',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SmartLink - Carte de Visite Numérique',
    description: 'Créez votre profil professionnel avec QR Code en quelques clics.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}
