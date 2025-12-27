import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | SmartLink',
    default: 'Authentification',
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
