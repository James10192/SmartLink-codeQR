# CLAUDE.md - SmartLink

> Documentation complète pour le développement de SmartLink
> Dernière mise à jour : 24 décembre 2024 | Version 0.1.0

---

## 1. Contexte Projet

### 1.1 Vision & Value Proposition

**SmartLink** est une plateforme SaaS permettant aux professionnels de créer des **profils numériques dynamiques** (vCard + CV) accessibles via **QR Code**.

**Promesse :** "Votre contact enregistré en 1 scan, votre CV accessible partout."

**Problèmes résolus :**
1. **Friction d'enregistrement** : Les cartes papier obligent à saisir manuellement les contacts → Personne ne le fait
2. **Obsolescence** : Changement de numéro/poste rend 500 cartes imprimées inutiles
3. **CV perdu** : Lors d'événements, les CV papier sont encombrants et souvent égarés
4. **Impact écologique** : 88% des cartes papier finissent à la poubelle en <1 semaine

**Marché cible :**
- **Géographie :** Abidjan (Côte d'Ivoire) avec scalabilité internationale
- **Secteurs :** Freelances, Commerciaux, Cadres, Startups, PME

---

### 1.2 Architecture Globale

```
SmartLink Architecture (Monorepo Next.js 16)
┌──────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js App Router)            │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ Landing Page   │  │  Dashboard     │  │  Public Profile│ │
│  │   (SEO)        │  │  (Protected)   │  │  (/u/[slug])   │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                     BACKEND (API Routes)                      │
│  ┌────────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐ │
│  │ Auth API   │  │ Profile  │  │  QR/vCard  │  │ Webhooks │ │
│  │(Better-Auth│  │   CRUD   │  │  Generation│  │(CinetPay)│ │
│  └────────────┘  └──────────┘  └────────────┘  └──────────┘ │
└──────────────────────────────────────────────────────────────┘
        │                      │                       │
        ▼                      ▼                       ▼
┌─────────────┐       ┌────────────────┐     ┌────────────────┐
│ Better-Auth │       │ Prisma (ORM)   │     │ Supabase       │
│  (Session)  │       │                │     │   Storage      │
└─────────────┘       │                │     │  (CV/Photos)   │
                      ▼                      └────────────────┘
              ┌────────────────┐
              │ Supabase       │
              │  PostgreSQL    │
              └────────────────┘
                      │
              ┌───────────────────┐
              │ Analytics:        │
              │ - PostHog (events)│
              │ - Vercel Analytics│
              └───────────────────┘
```

---

### 1.3 Personas (4 profils cibles)

#### Persona 1 : Le Chercheur d'Emploi Tech
- **Nom :** Kouadio (23 ans)
- **Rôle :** Développeur Junior
- **Besoin :** Se démarquer lors de forums emploi
- **Pain Point :** CV papier perdu par les recruteurs
- **Tier SmartLink :** Freemium (1 profil) → Pro Digital (stats + personnalisation)

#### Persona 2 : Le Commercial Terrain
- **Nom :** Fatou (32 ans)
- **Rôle :** Conseillère en assurance
- **Besoin :** Échanger rapidement contacts lors de démarchage
- **Pain Point :** Cartes papier coûteuses, doivent être réimprimées
- **Tier SmartLink :** Pack Starter (profil + 50 cartes papier QR)

#### Persona 3 : Le Freelance/Entrepreneur
- **Nom :** Yann (28 ans)
- **Rôle :** Consultant Marketing Digital
- **Besoin :** Profil moderne avec statistiques de vues
- **Pain Point :** Linktree ne supporte pas Wave/Orange Money
- **Tier SmartLink :** Pro (3 profils : "Agence", "Personnel", "Side Project")

#### Persona 4 : Le DRH d'Entreprise (B2B)
- **Nom :** Mariam (40 ans)
- **Rôle :** Directrice RH PME (50-200 employés)
- **Besoin :** Équiper tous les commerciaux avec outil moderne
- **Pain Point :** Impossible de désactiver contact d'un employé qui quitte
- **Tier SmartLink :** Corporate (gestion centralisée, profils illimités)

---

## 2. Règles Strictes de Développement

### 2.1 TypeScript Strict Mode

✅ **OBLIGATOIRE :**
- `strict: true` activé dans `tsconfig.json`
- ❌ **BANNIR `any`** : Utiliser `unknown` si vraiment nécessaire
- Typer toutes les fonctions (paramètres + return type)
- Typer tous les composants React (Props interfaces)

❌ **INTERDIT :**
```typescript
// ❌ JAMAIS
function fetchData(data: any): any {
  return data
}

// ❌ JAMAIS
const handleClick = (e: any) => { }
```

✅ **CORRECT :**
```typescript
// ✅ TOUJOURS
interface FetchDataResponse {
  id: string
  name: string
}

async function fetchData(userId: string): Promise<FetchDataResponse> {
  // Implementation
}

// ✅ TOUJOURS
function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
  // Implementation
}
```

---

### 2.2 Naming Conventions

#### Fichiers
- **Routes (App Router)** : `kebab-case` → `app/dashboard/page.tsx`
- **Composants React** : `PascalCase` → `UserProfile.tsx`
- **Utils/Lib** : `kebab-case` → `generate-qr.ts`

#### Code
- **Composants** : `PascalCase` → `ProfileCard`, `UserDashboard`
- **Fonctions/Variables** : `camelCase` → `generateVCard`, `userData`
- **Constantes** : `SCREAMING_SNAKE_CASE` → `MAX_FILE_SIZE`, `API_BASE_URL`
- **Types/Interfaces** : `PascalCase` → `UserProfile`, `ApiResponse`
- **Enums** : `PascalCase` → `SubscriptionPlan`, `PaymentMethod`

**Exemples :**
```typescript
// ✅ Correct
const MAX_CV_SIZE = 5 * 1024 * 1024 // 5MB

interface UserProfile {
  fullName: string
  email: string
}

function generateQRCode(data: string): Promise<Buffer> {
  // ...
}

export default function ProfileCard({ user }: { user: UserProfile }) {
  // ...
}
```

---

### 2.3 Structure de Fichiers Next.js App Router

```
src/
├── app/
│   ├── (auth)/                    # Route group (no URL segment)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (dashboard)/               # Protected routes
│   │   ├── layout.tsx             # Dashboard layout (sidebar, nav)
│   │   ├── dashboard/
│   │   │   └── page.tsx           # /dashboard
│   │   └── profile/
│   │       ├── create/page.tsx    # /profile/create
│   │       └── [id]/edit/page.tsx # /profile/:id/edit
│   ├── u/
│   │   └── [slug]/page.tsx        # Public profile /u/jean-kouassi
│   ├── api/                       # API Routes
│   │   ├── auth/
│   │   │   └── [...all]/route.ts  # Better-Auth API
│   │   ├── profile/
│   │   │   └── route.ts           # CRUD profiles
│   │   ├── vcard/
│   │   │   └── [id]/route.ts      # Generate .vcf
│   │   └── webhooks/
│   │       ├── cinetpay/route.ts
│   │       └── lemonsqueezy/route.ts
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Landing page
│   └── globals.css
├── components/
│   ├── ui/                        # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── form.tsx
│   ├── profile/
│   │   ├── ProfileCard.tsx
│   │   ├── ProfileForm.tsx
│   │   └── QRCodeDisplay.tsx
│   └── dashboard/
│       ├── Sidebar.tsx
│       └── StatsCard.tsx
├── lib/
│   ├── auth/
│   │   ├── config.ts              # Better-Auth config
│   │   └── middleware.ts
│   ├── db/
│   │   └── prisma.ts              # Prisma singleton
│   ├── utils/
│   │   ├── generate-qr.ts
│   │   ├── generate-vcard.ts
│   │   ├── upload.ts
│   │   └── cn.ts                  # className utility
│   └── validations/
│       ├── profile.ts             # Zod schemas
│       └── auth.ts
└── middleware.ts                  # Next.js middleware (auth)
```

---

### 2.4 Error Handling

#### Server Components & API Routes

✅ **TOUJOURS gérer les erreurs :**
```typescript
// API Route
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validation Zod
    const validatedData = ProfileSchema.parse(body)

    // Business logic
    const profile = await prisma.profile.create({
      data: validatedData
    })

    return Response.json({ success: true, data: profile })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, error: 'Validation failed', issues: error.errors },
        { status: 400 }
      )
    }

    console.error('[API Profile Create]', error)
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

#### Client Components

```typescript
'use client'

import { useTransition } from 'react'

export function CreateProfileForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/profile', {
          method: 'POST',
          body: JSON.stringify(Object.fromEntries(formData))
        })

        const result = await response.json()

        if (!result.success) {
          setError(result.error)
          return
        }

        // Success handling
        router.push('/dashboard')

      } catch (err) {
        setError('Une erreur est survenue')
      }
    })
  }

  return (
    <form action={handleSubmit}>
      {error && <ErrorAlert message={error} />}
      {/* Form fields */}
    </form>
  )
}
```

---

### 2.5 Environment Variables

**Utiliser t3-env pour validation au build :**

```typescript
// src/env.ts
import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    SUPABASE_SERVICE_ROLE_KEY: z.string(),
    CINETPAY_SECRET_KEY: z.string(),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    // ... autres variables
  },
})
```

❌ **JAMAIS utiliser directement `process.env` dans le code :**
```typescript
// ❌ INTERDIT
const apiKey = process.env.CINETPAY_API_KEY
```

✅ **TOUJOURS utiliser `env` :**
```typescript
// ✅ CORRECT
import { env } from '@/env'
const apiKey = env.CINETPAY_API_KEY
```

---

### 2.6 Database (Prisma + Supabase PostgreSQL)

#### Singleton Prisma Client

```typescript
// lib/db/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

#### Connection Pooling (Important pour Vercel)

Dans `.env` :
```bash
# Direct connection (pour migrations)
DATABASE_URL="postgresql://user:password@host:5432/smartlink"

# Pooled connection (pour app en production sur Vercel)
DATABASE_URL="postgresql://user:password@host:5432/smartlink?pgbouncer=true"
```

---

### 2.7 Better-Auth Configuration

```typescript
// lib/auth/config.ts
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/db/prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
})
```

#### Middleware (Route Protection)

```typescript
// middleware.ts
import { auth } from "@/lib/auth/config"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
                     request.nextUrl.pathname.startsWith('/signup')
  const isProtectedPage = request.nextUrl.pathname.startsWith('/dashboard')

  if (isProtectedPage && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/login', '/signup'],
}
```

---

### 2.8 Multi-Profils Logic

**Règle business :**
- `FREE` : 1 profil maximum
- `PRO_DIGITAL` : 3 profils maximum
- `PACK_STARTER` : 3 profils maximum
- `CORPORATE` : Illimité

**Validation avant création :**
```typescript
// lib/validations/profile.ts
export async function canCreateProfile(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profiles: true,
      subscription: true,
    },
  })

  if (!user) return false

  const profileCount = user.profiles.length
  const plan = user.subscription?.plan || 'FREE'

  const limits: Record<string, number> = {
    FREE: 1,
    PRO_DIGITAL: 3,
    PACK_STARTER: 3,
    CORPORATE: Infinity,
  }

  return profileCount < limits[plan]
}
```

---

### 2.9 Client/Server Components

#### Quand utiliser Server Components (RSC) ?
✅ **Par défaut** :
- Fetching data depuis DB
- Pages publiques (SEO)
- Layouts
- Pages sans interactivité

#### Quand utiliser Client Components ?
✅ **Uniquement si nécessaire** :
- Event handlers (`onClick`, `onChange`)
- Hooks React (`useState`, `useEffect`, etc.)
- Browser APIs (window, localStorage)
- Bibliothèques tierces qui utilisent browser APIs

**Directive `'use client'` :**
```typescript
// components/profile/ProfileForm.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function ProfileForm() {
  const [name, setName] = useState('')

  return (
    <form>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <Button type="submit">Sauvegarder</Button>
    </form>
  )
}
```

---

### 2.10 Components UI (Base UI + shadcn/ui via basecn.dev)

**SmartLink utilise [basecn.dev](https://basecn.dev/) : shadcn/ui components powered by Base UI (primitives headless MUI).**

Base UI offre une meilleure accessibilité et performance que Radix UI, avec la même API shadcn/ui.

**Installation :**
```bash
# Initialiser avec Base UI backend
bunx shadcn@latest init --base-ui

# Ou configurer manuellement dans components.json :
# "style": "new-york",
# "rsc": true,
# "tsx": true,
# "tailwind": {
#   "config": "tailwind.config.ts",
#   "css": "src/app/globals.css",
#   "baseColor": "slate",
#   "cssVariables": true,
#   "prefix": ""
# },
# "aliases": {
#   "components": "@/components",
#   "utils": "@/lib/utils",
#   "ui": "@/components/ui"
# }

# Ajouter les composants
bunx shadcn@latest add button card form input dialog tabs
```

**Utilisation (identique à shadcn/ui classique) :**
```typescript
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{profile.fullName}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{profile.jobTitle}</p>
        <Button>Voir le profil</Button>
      </CardContent>
    </Card>
  )
}
```

**Avantages Base UI vs Radix UI :**
- ✅ Meilleure accessibilité (ARIA, keyboard navigation)
- ✅ Performance optimisée
- ✅ Support Material Design patterns
- ✅ Compatibilité totale avec shadcn/ui API

---

### 2.11 Server Actions (next-safe-action)

**SmartLink utilise [next-safe-action](https://next-safe-action.dev/) pour des Server Actions type-safe.**

#### Pourquoi Server Actions ? (Best Practice 2025)

✅ **Utilisez Server Actions pour :**
- Mutations internes (create, update, delete)
- Form submissions
- Actions protégées par auth
- Type-safety automatique client ↔ server

❌ **N'utilisez PAS Server Actions pour :**
- Webhooks externes (CinetPay, Lemon Squeezy)
- APIs publiques
- GET requests complexes

**Installation :**
```bash
bun add next-safe-action zod
```

#### Exemple : Action "Create Profile"

```typescript
// lib/actions/profile.ts
'use server'

import { createSafeActionClient } from 'next-safe-action'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { ProfileSchema } from '@/lib/validations/profile'
import { canCreateProfile } from '@/lib/validations/profile'

// Client d'action sécurisé avec auth
const actionClient = createSafeActionClient({
  handleServerError(e) {
    console.error('Action error:', e.message)
    return 'Une erreur est survenue'
  },
})

// Action type-safe pour créer un profil
export const createProfileAction = actionClient
  .schema(ProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    // 1. Vérifier auth (dans middleware ou ici)
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      throw new Error('Non autorisé')
    }

    // 2. Vérifier limite profils
    const canCreate = await canCreateProfile(session.user.id)
    if (!canCreate) {
      throw new Error('Limite de profils atteinte')
    }

    // 3. Créer le profil
    const profile = await prisma.profile.create({
      data: {
        ...parsedInput,
        userId: session.user.id,
      },
    })

    return { success: true, profile }
  })
```

#### Utilisation dans un Client Component

```typescript
'use client'

import { useAction } from 'next-safe-action/hooks'
import { createProfileAction } from '@/lib/actions/profile'
import { toast } from 'sonner'

export function CreateProfileForm() {
  const { execute, result, isExecuting } = useAction(createProfileAction, {
    onSuccess: ({ data }) => {
      toast.success('Profil créé !')
      router.push(`/profile/${data.profile.id}`)
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Erreur')
    },
  })

  const handleSubmit = (formData: FormData) => {
    execute({
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      // ... autres champs
    })
  }

  return (
    <form action={handleSubmit}>
      {/* Form fields */}
      <Button type="submit" disabled={isExecuting}>
        {isExecuting ? 'Création...' : 'Créer le profil'}
      </Button>
    </form>
  )
}
```

#### Avantages next-safe-action

✅ **Type-safety complète** : Input et output typés automatiquement
✅ **Validation Zod intégrée** : Schémas réutilisés entre client et serveur
✅ **Error handling simplifié** : onSuccess / onError
✅ **Loading states** : `isExecuting` automatique
✅ **Optimistic updates** : Support natif

**Sources :**
- [next-safe-action Documentation](https://next-safe-action.dev/)
- [Server Actions vs API Routes Best Practices](https://makerkit.dev/blog/tutorials/server-actions-vs-route-handlers)

---

### 2.12 API Routes Pattern (Pour Webhooks & APIs Publiques)

```typescript
// app/api/profile/route.ts
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { ProfileSchema } from '@/lib/validations/profile'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse & validate body
    const body = await request.json()
    const validatedData = ProfileSchema.parse(body)

    // 3. Business logic validation
    const canCreate = await canCreateProfile(session.user.id)
    if (!canCreate) {
      return Response.json(
        { error: 'Profile limit reached' },
        { status: 403 }
      )
    }

    // 4. Database operation
    const profile = await prisma.profile.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
    })

    // 5. Success response
    return Response.json({ success: true, data: profile })

  } catch (error) {
    // Error handling (voir section 2.4)
  }
}
```

---

### 2.13 PostHog Analytics & Feature Flags

**SmartLink utilise [PostHog](https://posthog.com/) pour analytics, session replay, et feature flags.**

#### Installation Next.js 15+

```bash
bun add posthog-js
```

#### Configuration (Instrumentation)

```typescript
// instrumentation-client.ts (Next.js 15.3+)
import posthog from 'posthog-js'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: false, // Géré manuellement
    capture_pageleave: true,
    defaults: '2025-11-30', // Latest default behaviors
  })
}
```

#### Provider PostHog (Client Component)

```typescript
// app/providers.tsx
'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
```

```typescript
// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

#### Tracking Pageviews

```typescript
// app/posthog-pageview.tsx
'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'

export function PostHogPageview() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      posthog.capture('$pageview', {
        $current_url: url,
      })
    }
  }, [pathname, searchParams, posthog])

  return null
}
```

#### Custom Events (Business Metrics)

```typescript
// Exemple : Tracking création de profil
import { usePostHog } from 'posthog-js/react'

export function CreateProfileForm() {
  const posthog = usePostHog()

  const handleSubmit = async (data: ProfileData) => {
    const profile = await createProfile(data)

    // Track event
    posthog.capture('profile_created', {
      profile_id: profile.id,
      plan: user.subscription?.plan,
      has_cv: !!data.cvFile,
    })
  }
}
```

**Events critiques SmartLink :**
- `signup_completed` (inscription)
- `profile_created` (création profil)
- `qr_generated` (génération QR)
- `qr_downloaded` (téléchargement QR)
- `cv_uploaded` (upload CV)
- `subscription_upgraded` (upgrade vers Pro)
- `vcard_downloaded` (téléchargement contact)
- `profile_viewed` (vue profil public)

#### Session Replay

Session Replay est **automatique** avec PostHog. Pas besoin de configuration supplémentaire.

**Lier une session à un user :**
```typescript
// Après login
posthog.identify(user.id, {
  email: user.email,
  name: user.name,
  plan: user.subscription?.plan,
})
```

#### Feature Flags

```typescript
'use client'

import { useFeatureFlagEnabled } from 'posthog-js/react'

export function LandingPage() {
  const showNewDesign = useFeatureFlagEnabled('new-landing-design')

  if (showNewDesign) {
    return <NewLandingDesign />
  }

  return <OldLandingDesign />
}
```

**Use cases SmartLink :**
- A/B testing landing page designs
- Rollout progressif de nouvelles features (cartes NFC)
- Beta testing (nouveaux tiers d'abonnement)

#### Reverse Proxy (Recommandé)

Pour éviter les ad-blockers qui bloquent PostHog :

```typescript
// next.config.ts
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/ingest/:path*',
        destination: 'https://app.posthog.com/:path*',
      },
    ]
  },
}
```

Puis utiliser `api_host: '/ingest'` dans PostHog init.

**Sources :**
- [PostHog Next.js Documentation](https://posthog.com/docs/libraries/next-js)
- [PostHog Feature Flags](https://posthog.com/docs/feature-flags)

---

### 2.14 Tests (Vitest + Playwright)

**SmartLink utilise Vitest (unit tests) et Playwright (E2E tests).**

#### Installation

```bash
bun add -d vitest @vitest/ui
bun add -d playwright @playwright/test
bunx playwright install
```

#### Configuration Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

#### Exemples Unit Tests

```typescript
// lib/utils/generate-vcard.test.ts
import { describe, it, expect } from 'vitest'
import { generateVCard } from './generate-vcard'

describe('generateVCard', () => {
  it('should generate valid vCard format', () => {
    const vcard = generateVCard({
      fullName: 'Jean Kouassi',
      phoneNumber: '+2250708413484',
      email: 'jean@example.com',
    })

    expect(vcard).toContain('BEGIN:VCARD')
    expect(vcard).toContain('VERSION:3.0')
    expect(vcard).toContain('FN:Jean Kouassi')
    expect(vcard).toContain('TEL;TYPE=CELL:+2250708413484')
    expect(vcard).toContain('EMAIL:jean@example.com')
    expect(vcard).toContain('END:VCARD')
  })

  it('should validate profile limits', async () => {
    const canCreate = await canCreateProfile('user-id-with-3-profiles')
    expect(canCreate).toBe(false) // FREE plan limit reached
  })
})
```

#### Configuration Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

#### Exemples E2E Tests

```typescript
// tests/e2e/profile-creation.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Profile Creation Flow', () => {
  test('should create a new profile successfully', async ({ page }) => {
    // 1. Login
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // 2. Navigate to create profile
    await page.goto('/profile/create')
    await expect(page).toHaveURL('/profile/create')

    // 3. Fill form
    await page.fill('[name="fullName"]', 'Jean Kouassi')
    await page.fill('[name="email"]', 'jean@example.com')
    await page.fill('[name="phoneNumber"]', '+2250708413484')
    await page.fill('[name="jobTitle"]', 'Developer')

    // 4. Submit
    await page.click('button[type="submit"]')

    // 5. Verify success
    await expect(page).toHaveURL(/\/profile\/.*/)
    await expect(page.locator('text=Profil créé')).toBeVisible()
  })

  test('should enforce profile limits for FREE plan', async ({ page }) => {
    // User with FREE plan already has 1 profile
    await page.goto('/profile/create')

    await page.fill('[name="fullName"]', 'Second Profile')
    await page.click('button[type="submit"]')

    // Verify error message
    await expect(page.locator('text=Limite de profils atteinte')).toBeVisible()
  })
})
```

**Tests critiques SmartLink :**
- ✅ Signup → Login flow
- ✅ Create profile (FREE: 1 max, PRO: 3 max)
- ✅ Generate QR code
- ✅ Download QR (PNG/SVG)
- ✅ Upload CV (5MB max, PDF only)
- ✅ Public profile page (/u/[slug])
- ✅ vCard download (.vcf)
- ✅ Upgrade subscription flow

---

### 2.15 Performance & Optimization

#### Parallel Data Fetching (Server Components)
✅ **CORRECT :**
```typescript
// Fetch en parallèle
export default async function DashboardPage() {
  const [user, profiles, stats] = await Promise.all([
    getUser(),
    getProfiles(),
    getStats(),
  ])

  return <Dashboard user={user} profiles={profiles} stats={stats} />
}
```

❌ **ÉVITER :**
```typescript
// ❌ Sequential fetching (plus lent)
export default async function DashboardPage() {
  const user = await getUser()
  const profiles = await getProfiles()
  const stats = await getStats()

  return <Dashboard user={user} profiles={profiles} stats={stats} />
}
```

#### Image Optimization
```typescript
import Image from 'next/image'

<Image
  src={profile.avatarUrl}
  alt={profile.fullName}
  width={100}
  height={100}
  className="rounded-full"
  priority // Si visible au-dessus de la ligne de flottaison
/>
```

---

## 3. Git Commit Rules

### 3.1 Conventional Commits (OBLIGATOIRE)

**Format :** `<type>(scope): <description>`

**Types autorisés :**
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `refactor`: Refactoring (pas de changement fonctionnel)
- `perf`: Optimisation performance
- `style`: Formatage (espaces, virgules, etc.)
- `test`: Ajout/modification tests
- `docs`: Documentation
- `chore`: Tâches (config, dépendances, scripts)
- `ci`: CI/CD

**Exemples :**
```bash
✅ CORRECT
feat(profile): add QR code generation
fix(api): correct vCard phone number format
refactor(auth): simplify session handling
docs: update README with setup instructions

❌ INTERDIT
update stuff
fix bug
WIP
commit
```

### 3.2 Signature Commits

**Tous les commits doivent inclure :**
```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Exemple complet :**
```bash
git commit -m "$(cat <<'EOF'
feat(dashboard): add profile stats card

- Display views count
- Display CV downloads count
- Add chart visualization

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## 4. Development Commands

```bash
# Development
bun run dev              # Start dev server (http://localhost:3000)
bun run build            # Build for production
bun run start            # Start production server
bun run lint             # Run ESLint
bun run type-check       # TypeScript type checking

# Database (Prisma)
bunx prisma generate     # Generate Prisma Client
bunx prisma db push      # Push schema changes (dev)
bunx prisma migrate dev  # Create migration (dev)
bunx prisma migrate deploy # Run migrations (prod)
bunx prisma studio       # Open Prisma Studio (GUI)

# Utilities
bunx shadcn@latest add <component>  # Add shadcn/ui component
```

---

## 5. Environment Variables

Voir `.env.example` pour la liste complète.

**Variables critiques :**
```bash
# Database
DATABASE_URL="postgresql://..."

# Better-Auth
BETTER_AUTH_SECRET="<generated-secret>"
BETTER_AUTH_URL="http://localhost:3000"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

**Comment générer BETTER_AUTH_SECRET :**
```bash
bunx better-auth secret
```

---

## 6. Module Documentation

Les README modulaires documentent chaque section du projet :

- [`/prisma/README.md`](./prisma/README.md) - Schéma DB, migrations, multi-profils logic
- [`/src/lib/README.md`](./src/lib/README.md) - Architecture générale lib/
- [`/src/lib/auth/README.md`](./src/lib/auth/README.md) - Better-Auth setup
- [`/src/lib/utils/README.md`](./src/lib/utils/README.md) - Utilitaires (QR, vCard, upload)
- [`/src/components/ui/README.md`](./src/components/ui/README.md) - shadcn/ui guide
- [`/src/app/api/README.md`](./src/app/api/README.md) - Documentation endpoints

---

## 7. Pre-PR Checklist

Avant de créer une Pull Request, vérifier :

- [ ] ✅ Code compile sans erreurs TypeScript (`bun run type-check`)
- [ ] ✅ Aucune erreur ESLint (`bun run lint`)
- [ ] ✅ Tests passent (quand implémentés)
- [ ] ✅ Commits suivent Conventional Commits
- [ ] ✅ Pas de `console.log` ou code de debug
- [ ] ✅ Variables d'environnement documentées dans `.env.example`
- [ ] ✅ README modulaire mis à jour si nouvelle fonctionnalité
- [ ] ✅ Pas de secrets commitées (.env dans .gitignore)
- [ ] ✅ Images optimisées avec Next.js `<Image>`
- [ ] ✅ Accessible (labels, aria-*, semantic HTML)
- [ ] ✅ Mobile responsive testé
- [ ] ✅ Error handling implémenté
- [ ] ✅ Validation Zod côté server ET client

---

## 8. Security Checklist

### Backend
- [ ] ✅ Toutes les API routes vérifient l'authentification
- [ ] ✅ Validation Zod sur tous les inputs utilisateur
- [ ] ✅ Rate limiting sur endpoints sensibles (login, upload)
- [ ] ✅ Pas de données sensibles dans les logs
- [ ] ✅ CORS configuré strictement
- [ ] ✅ Secrets stockés dans variables d'environnement

### Frontend
- [ ] ✅ Pas de secrets dans le code client
- [ ] ✅ Sanitize user inputs (éviter XSS)
- [ ] ✅ HTTPS en production (automatique avec Vercel)
- [ ] ✅ Content Security Policy configurée

### Database
- [ ] ✅ Utiliser Prisma (pas de raw SQL pour éviter injections)
- [ ] ✅ Connection pooling activé
- [ ] ✅ Indexes sur colonnes fréquemment queryées
- [ ] ✅ Backups automatiques configurés (Supabase)

---

## 9. Troubleshooting

### Erreur : "Module not found: Can't resolve '@/...'"

**Cause :** Import alias `@/*` non configuré.

**Solution :**
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Erreur : "Prisma Client not generated"

**Solution :**
```bash
bunx prisma generate
```

### Erreur Better-Auth : "Invalid session"

**Cause :** Secret invalide ou cookie corrompu.

**Solution :**
1. Vérifier `BETTER_AUTH_SECRET` dans `.env.local`
2. Clear cookies du navigateur
3. Regénérer secret : `bunx better-auth secret`

### Upload CV échoue (Supabase Storage)

**Cause :** Permissions bucket ou taille fichier.

**Solution :**
1. Vérifier policies Supabase Storage :
   ```sql
   -- Policy exemple pour bucket 'cvs'
   CREATE POLICY "Users can upload their own CVs"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'cvs' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```
2. Vérifier limite taille (max 5MB dans validation Zod)

---

## 10. Official Documentation & Resources

### Core Stack
- **Next.js 16** : https://nextjs.org/docs
- **React 19** : https://react.dev/
- **TypeScript** : https://www.typescriptlang.org/docs/
- **Tailwind CSS 4** : https://tailwindcss.com/docs

### Backend & Database
- **Better-Auth** : https://www.better-auth.com/docs
- **Prisma** : https://www.prisma.io/docs
- **Supabase** : https://supabase.com/docs

### UI & Components
- **Base UI (MUI Headless)** : https://base-ui.com/
- **basecn.dev (shadcn/ui + Base UI)** : https://basecn.dev/
- **shadcn/ui** : https://ui.shadcn.com/

### Validation & State
- **Zod** : https://zod.dev/
- **TanStack Query** : https://tanstack.com/query/latest
- **next-safe-action** : https://next-safe-action.dev/

### Analytics & Monitoring
- **PostHog** : https://posthog.com/docs
- **PostHog Next.js Integration** : https://posthog.com/docs/libraries/next-js
- **Vercel Analytics** : https://vercel.com/docs/analytics

### Testing
- **Vitest** : https://vitest.dev/
- **Playwright** : https://playwright.dev/

### Paiements
- **CinetPay** : https://docs.cinetpay.com/
- **Lemon Squeezy** : https://docs.lemonsqueezy.com/

---

## 11. Changelog

### Version 0.1.0 (24 décembre 2024)

**Initialisation du projet :**
- ✅ Setup Next.js 16.1.1 avec Bun (runtime rapide)
- ✅ Configuration TypeScript strict mode
- ✅ Setup Tailwind CSS 4
- ✅ Structure de dossiers App Router
- ✅ Configuration .env.example (toutes variables documentées)
- ✅ Documentation complète (CLAUDE.md ~1200 lignes)

**Stack Technique Validée :**
- ✅ **Auth** : Better-Auth (session management type-safe)
- ✅ **Database** : Prisma + Supabase PostgreSQL (multi-profils)
- ✅ **UI** : Base UI + shadcn/ui via basecn.dev
- ✅ **Server Actions** : next-safe-action (type-safe mutations)
- ✅ **Analytics** : PostHog (events, session replay, feature flags)
- ✅ **Tests** : Vitest (unit) + Playwright (E2E)
- ✅ **Paiements** : CinetPay (Mobile Money) + Lemon Squeezy (cartes)

**Documentation Créée :**
- ✅ `/CLAUDE.md` : Guide complet de développement (11+ sections)
- ✅ `.env.example` : Template variables d'environnement
- ✅ `tsconfig.json` : TypeScript strict mode
- ✅ `tailwind.config.ts` : Tailwind CSS 4 configuration

**À venir (Version 0.2.0) :**
- Setup Prisma + Supabase (schéma multi-profils)
- Configuration Better-Auth (Email/Password + Google OAuth)
- Installation Base UI components (basecn.dev)
- Dashboard pages (login, signup, profile CRUD)
- PostHog integration (analytics & feature flags)
- Tests setup (Vitest + Playwright)

---

**Dernière mise à jour :** 24 décembre 2024
**Mainteneurs :** Équipe SmartLink
**License :** Propriétaire (Private)
