import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inscription',
  description: 'Créez votre compte SmartLink gratuitement',
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
