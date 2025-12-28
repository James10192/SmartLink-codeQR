import { z } from 'zod'

export const ProfileSchema = z.object({
  label: z
    .string()
    .min(2, 'Le nom du profil doit contenir au moins 2 caractères')
    .max(50, 'Le nom du profil ne peut pas dépasser 50 caractères')
    .default('Mon Profil'),

  fullName: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),

  email: z.string().email('Email invalide'),

  phoneNumber: z
    .string()
    .regex(
      /^\+[1-9]\d{1,14}$/,
      'Format E.164 requis (ex: +2250708413484)'
    ),

  jobTitle: z
    .string()
    .max(100, 'Le titre ne peut pas dépasser 100 caractères')
    .optional()
    .or(z.literal('')),

  company: z
    .string()
    .max(100, "Le nom de l'entreprise ne peut pas dépasser 100 caractères")
    .optional()
    .or(z.literal('')),

  website: z
    .string()
    .url('URL invalide')
    .optional()
    .or(z.literal('')),

  address: z
    .string()
    .max(200, "L'adresse ne peut pas dépasser 200 caractères")
    .optional()
    .or(z.literal('')),

  linkedinUrl: z
    .string()
    .url('URL LinkedIn invalide')
    .optional()
    .or(z.literal('')),

  twitterUrl: z
    .string()
    .url('URL Twitter invalide')
    .optional()
    .or(z.literal('')),

  facebookUrl: z
    .string()
    .url('URL Facebook invalide')
    .optional()
    .or(z.literal('')),

  whatsappNumber: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Format E.164 requis')
    .optional()
    .or(z.literal('')),

  isPublic: z.boolean().default(true),
  showCV: z.boolean().default(true),
})

export const ProfileUpdateSchema = ProfileSchema.partial()

export type ProfileInput = z.infer<typeof ProfileSchema>
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>
