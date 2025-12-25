'use client'

import { Mail, Phone } from 'lucide-react'
import { GlowingEffect } from '@/components/ui/glowing-effect'

interface ContactCardProps {
  email: string
  phone: string
}

export function ContactCard({ email, phone }: ContactCardProps) {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Email Card */}
        <div className="min-h-[10rem]">
          <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-white/10 p-2 md:rounded-[1.5rem] md:p-3">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
              borderWidth={3}
            />
            <div className="relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-xl border-[0.75px] bg-black/40 backdrop-blur-sm p-6 shadow-sm border-white/10">
              <div className="w-fit rounded-lg border-[0.75px] border-white/10 bg-white/5 p-3">
                <Mail className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Email</h3>
                <a
                  href={`mailto:${email}`}
                  className="text-sm text-white/70 hover:text-cyan-400 transition-colors block break-all"
                >
                  {email}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Phone Card */}
        <div className="min-h-[10rem]">
          <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-white/10 p-2 md:rounded-[1.5rem] md:p-3">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
              borderWidth={3}
            />
            <div className="relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-xl border-[0.75px] bg-black/40 backdrop-blur-sm p-6 shadow-sm border-white/10">
              <div className="w-fit rounded-lg border-[0.75px] border-white/10 bg-white/5 p-3">
                <Phone className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Téléphone</h3>
                <a
                  href={`tel:${phone}`}
                  className="text-sm text-white/70 hover:text-emerald-400 transition-colors block"
                >
                  {phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
