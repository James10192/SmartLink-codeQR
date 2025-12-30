import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

// Utilise domaine Resend par défaut (onboarding) pour dev/test
// TODO: Migrer vers domaine custom (smartlink.ci) en production
export const EMAIL_CONFIG = {
  from: 'SmartLink <onboarding@resend.dev>',
  replyTo: 'support@smartlink.ci', // À créer
} as const
