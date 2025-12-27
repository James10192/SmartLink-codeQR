# lib/ - Architecture Générale

> Documentation de l'architecture du dossier `/src/lib/` et de ses sous-modules

---

## Vue d'ensemble

Le dossier `/src/lib/` contient toute la logique métier, les utilitaires et les configurations partagées du projet SmartLink. Il est structuré en modules logiques pour faciliter la maintenance et la réutilisabilité.

---

## Structure du Dossier

```
src/lib/
├── actions/              # Server Actions (next-safe-action)
│   ├── profile.ts        # CRUD profils
│   ├── subscription.ts   # Gestion abonnements
│   └── analytics.ts      # Tracking événements
├── auth/                 # Better-Auth configuration
│   ├── config.ts         # Configuration Better-Auth
│   ├── middleware.ts     # Protection routes
│   └── README.md         # Documentation auth
├── db/                   # Base de données
│   └── prisma.ts         # Singleton Prisma Client
├── utils/                # Utilitaires
│   ├── generate-qr.ts    # Génération QR Codes
│   ├── generate-vcard.ts # Génération vCard (.vcf)
│   ├── upload.ts         # Upload Supabase Storage
│   ├── cn.ts             # className utility (shadcn)
│   └── README.md         # Documentation utils
├── validations/          # Schémas Zod
│   ├── profile.ts        # Validation profils
│   ├── auth.ts           # Validation auth
│   └── subscription.ts   # Validation paiements
├── constants.ts          # Constantes globales
└── types.ts              # Types TypeScript partagés
```

---

## Modules Principaux

### 1. **actions/** - Server Actions

**Quand utiliser ?**
- Mutations de données (CREATE, UPDATE, DELETE)
- Opérations nécessitant l'authentification
- Logique métier complexe

**Pattern avec next-safe-action:**
```typescript
// lib/actions/profile.ts
'use server'

import { createSafeActionClient } from 'next-safe-action'
import { ProfileSchema } from '@/lib/validations/profile'
import { prisma } from '@/lib/db/prisma'

const actionClient = createSafeActionClient()

export const createProfileAction = actionClient
  .schema(ProfileSchema)
  .action(async ({ parsedInput }) => {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    const profile = await prisma.profile.create({
      data: {
        ...parsedInput,
        userId: session.user.id,
      },
    })

    return { success: true, profile }
  })
```

**Documentation complète:** Voir [CLAUDE.md Section 6](/CLAUDE.md#6-server-actions-next-safe-action)

---

### 2. **auth/** - Authentification Better-Auth

**Configuration:**
- `config.ts`: Configuration Better-Auth (providers, session strategy)
- `middleware.ts`: Protection des routes Next.js
- Helpers: `getSession()`, `requireAuth()`

**Documentation complète:** Voir [auth/README.md](./auth/README.md)

---

### 3. **db/** - Base de Données

**Fichier principal:** `prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Usage:**
```typescript
import { prisma } from '@/lib/db/prisma'

const profiles = await prisma.profile.findMany({
  where: { userId: session.user.id },
})
```

**Documentation schéma:** Voir [prisma/README.md](/prisma/README.md)

---

### 4. **utils/** - Utilitaires

Fonctions réutilisables pour des tâches spécifiques:

- **generate-qr.ts**: Génération de QR Codes (PNG/SVG)
- **generate-vcard.ts**: Génération de fichiers vCard (.vcf)
- **upload.ts**: Upload fichiers vers Supabase Storage
- **cn.ts**: Utilitaire pour fusionner les classNames (shadcn/ui)

**Documentation complète:** Voir [utils/README.md](./utils/README.md)

---

### 5. **validations/** - Schémas Zod

**Pattern de validation:**
```typescript
// lib/validations/profile.ts
import { z } from 'zod'

export const ProfileSchema = z.object({
  fullName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  phoneNumber: z.string().regex(/^\+225\s?\d{10}$/, 'Format invalide: +225 XXXXXXXXXX'),
  email: z.string().email('Email invalide'),
  slug: z.string()
    .min(3, 'Le slug doit contenir au moins 3 caractères')
    .regex(/^[a-z0-9-]+$/, 'Slug invalide (a-z, 0-9, -)'),
  linkedinUrl: z.string().url().optional(),
  twitterUrl: z.string().url().optional(),
  facebookUrl: z.string().url().optional(),
  whatsappNumber: z.string().optional(),
})

export type ProfileInput = z.infer<typeof ProfileSchema>
```

**Réutilisation:**
- Frontend (validation formulaire)
- Backend (validation Server Actions)
- Type inference automatique avec `z.infer<>`

---

## Fichiers Globaux

### **constants.ts**

Constantes partagées dans toute l'application:

```typescript
// lib/constants.ts

// Limites multi-profils
export const PROFILE_LIMITS = {
  FREE: 1,
  PRO_DIGITAL: 3,
  PACK_STARTER: 3,
  CORPORATE: Infinity,
} as const

// Pricing (FCFA)
export const PRICING = {
  PRO_DIGITAL_MONTHLY: 1000,
  PRO_DIGITAL_ANNUAL: 10000,
  PACK_STARTER_ANNUAL: 25000,
  CORPORATE_ANNUAL: 150000,
} as const

// Upload limits
export const UPLOAD_LIMITS = {
  MAX_CV_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_CV_TYPES: ['application/pdf'] as const,
  MAX_AVATAR_SIZE: 2 * 1024 * 1024, // 2MB
  ALLOWED_AVATAR_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
} as const

// URLs
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
export const SUPABASE_STORAGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`

// Analytics events (PostHog)
export const ANALYTICS_EVENTS = {
  PROFILE_CREATED: 'profile_created',
  PROFILE_VIEWED: 'profile_viewed',
  CV_DOWNLOADED: 'cv_downloaded',
  CONTACT_SAVED: 'contact_saved',
  QR_GENERATED: 'qr_generated',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
} as const
```

---

### **types.ts**

Types TypeScript globaux:

```typescript
// lib/types.ts
import { User, Profile, Subscription } from '@prisma/client'

// Type combiné User + Profiles
export type UserWithProfiles = User & {
  profiles: Profile[]
  subscription: Subscription | null
}

// Type pour les statistiques de profil
export type ProfileStats = {
  viewsCount: number
  cvDownloads: number
  contactSaves: number
  lastViewed: Date | null
}

// Type pour les données vCard
export type VCardData = {
  fullName: string
  jobTitle?: string
  company?: string
  phoneNumber: string
  email: string
  website?: string
  address?: string
}

// Type pour les options QR Code
export type QRCodeOptions = {
  size: number
  format: 'png' | 'svg'
  color?: string
  backgroundColor?: string
}
```

---

## Bonnes Pratiques

### 1. **Imports Absolus**

✅ **CORRECT:**
```typescript
import { prisma } from '@/lib/db/prisma'
import { ProfileSchema } from '@/lib/validations/profile'
```

❌ **ÉVITER:**
```typescript
import { prisma } from '../../lib/db/prisma'
```

---

### 2. **Server Actions vs API Routes**

**Utiliser Server Actions pour:**
- CRUD données (profils, subscriptions)
- Opérations authentifiées
- Mutations avec validation Zod

**Utiliser API Routes pour:**
- Webhooks (CinetPay, Lemon Squeezy)
- Endpoints publics (génération vCard, analytics)
- Intégrations tierces

---

### 3. **Validation Stricte**

Toujours valider les données avec Zod:

```typescript
// ✅ CORRECT
export const updateProfileAction = actionClient
  .schema(ProfileSchema.partial()) // Allow partial updates
  .action(async ({ parsedInput }) => {
    // parsedInput est type-safe et validé
  })

// ❌ ÉVITER
export async function updateProfile(data: any) {
  // Pas de validation, pas de type-safety
}
```

---

### 4. **Gestion d'Erreurs**

**Pattern recommandé:**
```typescript
import { createSafeActionClient } from 'next-safe-action'

const actionClient = createSafeActionClient({
  handleReturnedServerError(e) {
    // Logger l'erreur (ex: Sentry)
    console.error('Server Action Error:', e)

    // Retourner un message user-friendly
    if (e instanceof PrismaClientKnownRequestError) {
      return 'Erreur de base de données'
    }

    return 'Une erreur est survenue'
  },
})
```

---

### 5. **TypeScript Strict Mode**

**Règles strictes (tsconfig.json):**
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noImplicitOverride: true`

**Bannir `any`:**
```typescript
// ❌ INTERDIT
function processData(data: any) { ... }

// ✅ CORRECT
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null) {
    // Type narrowing
  }
}
```

---

## Sources Officielles

- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [next-safe-action Documentation](https://next-safe-action.dev/)
- [Zod Documentation](https://zod.dev/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

---

**Dernière mise à jour:** 24 décembre 2024
