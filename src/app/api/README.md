# api/ - API Routes Documentation

> Documentation des endpoints API pour SmartLink (Next.js 16 App Router)

---

## Vue d'ensemble

SmartLink utilise **Next.js API Routes** (App Router) pour gérer toutes les opérations backend. Les API Routes sont des fonctions serverless déployées sur **Vercel Edge Functions** pour une latence minimale.

**Architecture :**
- **Authentification** : Better-Auth (sessions, OAuth)
- **Base de données** : Prisma + Supabase PostgreSQL
- **Validation** : Zod (runtime validation)
- **Rate Limiting** : Upstash Redis
- **Paiements** : CinetPay (webhooks) + Lemon Squeezy (webhooks)

---

## Structure

```
src/app/api/
├── README.md                      # Ce fichier
├── auth/
│   └── [...all]/route.ts          # Better-Auth API (auto-generated)
├── profile/
│   ├── route.ts                   # POST /api/profile (Create)
│   └── [id]/
│       ├── route.ts               # GET, PATCH, DELETE /api/profile/:id
│       └── analytics/route.ts     # GET /api/profile/:id/analytics
├── vcard/
│   └── [id]/route.ts              # GET /api/vcard/:id (Generate .vcf)
├── qr/
│   └── generate/route.ts          # POST /api/qr/generate
├── upload/
│   └── cv/route.ts                # POST /api/upload/cv
└── webhooks/
    ├── cinetpay/route.ts          # POST /api/webhooks/cinetpay
    └── lemonsqueezy/route.ts      # POST /api/webhooks/lemonsqueezy
```

---

## Endpoints

### 1. Authentication

#### `POST /api/auth/[...all]`

**Provider :** Better-Auth (auto-generated)

**Actions disponibles :**
- `/api/auth/sign-up` (Email/Password)
- `/api/auth/sign-in` (Email/Password)
- `/api/auth/sign-out`
- `/api/auth/session` (Get current session)
- `/api/auth/oauth/google` (Google OAuth)

**Documentation Better-Auth :** https://www.better-auth.com/docs

**Configuration :**
```typescript
// src/lib/auth/config.ts
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
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
})
```

---

### 2. Profile Management

#### `POST /api/profile`

Créer un nouveau profil utilisateur.

**Auth :** Requise (session Better-Auth)

**Request Body :**
```typescript
{
  fullName: string           // Requis, min 2 chars
  email: string              // Requis, format email
  phoneNumber: string        // Requis, E.164 format (+2250708413484)
  jobTitle?: string
  company?: string
  website?: string
  address?: string
  linkedinUrl?: string
  twitterUrl?: string
  facebookUrl?: string
  whatsappNumber?: string
}
```

**Response :**
```typescript
{
  success: true,
  data: {
    id: string
    slug: string             // Auto-generated from fullName
    userId: string
    // ... autres champs
    createdAt: string
  }
}
```

**Validation (Zod) :**
```typescript
import { z } from 'zod'

const ProfileSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/),
  jobTitle: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  website: z.string().url().optional(),
  linkedinUrl: z.string().url().optional(),
  twitterUrl: z.string().url().optional(),
  facebookUrl: z.string().url().optional(),
  whatsappNumber: z.string().regex(/^\+[1-9]\d{1,14}$/).optional(),
})
```

**Business Logic - Limite Multi-Profils :**
```typescript
// Vérifier limite selon plan
const user = await prisma.user.findUnique({
  where: { id: session.user.id },
  include: { profiles: true, subscription: true },
})

const limits = {
  FREE: 1,
  PRO_DIGITAL: 3,
  PACK_STARTER: 3,
  CORPORATE: Infinity,
}

const plan = user.subscription?.plan || 'FREE'
const canCreate = user.profiles.length < limits[plan]

if (!canCreate) {
  return Response.json(
    { error: 'Profile limit reached for your plan' },
    { status: 403 }
  )
}
```

**Implémentation complète :**
```typescript
// app/api/profile/route.ts
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { ProfileSchema } from '@/lib/validations/profile'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Vérifier authentification
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parser et valider body
    const body = await request.json()
    const validatedData = ProfileSchema.parse(body)

    // 3. Vérifier limite profils
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { profiles: true, subscription: true },
    })

    const limits = { FREE: 1, PRO_DIGITAL: 3, PACK_STARTER: 3, CORPORATE: Infinity }
    const plan = user?.subscription?.plan || 'FREE'
    const canCreate = (user?.profiles.length || 0) < limits[plan]

    if (!canCreate) {
      return Response.json(
        { error: 'Profile limit reached' },
        { status: 403 }
      )
    }

    // 4. Générer slug unique
    const slug = await generateUniqueSlug(validatedData.fullName)

    // 5. Créer profil
    const profile = await prisma.profile.create({
      data: {
        ...validatedData,
        slug,
        userId: session.user.id,
      },
    })

    // 6. Tracking analytics (PostHog)
    posthog.capture({
      distinctId: session.user.id,
      event: 'profile_created',
      properties: {
        profileId: profile.id,
        plan,
      },
    })

    return Response.json({ success: true, data: profile })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Validation failed', issues: error.errors },
        { status: 400 }
      )
    }

    console.error('[API Profile Create]', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

#### `GET /api/profile/[id]`

Récupérer un profil par ID.

**Auth :** Requise (propriétaire uniquement)

**Response :**
```typescript
{
  success: true,
  data: {
    id: string
    slug: string
    fullName: string
    email: string
    phoneNumber: string
    // ... autres champs
  }
}
```

---

#### `PATCH /api/profile/[id]`

Mettre à jour un profil.

**Auth :** Requise (propriétaire uniquement)

**Request Body :** Mêmes champs que POST (tous optionnels)

**Response :**
```typescript
{
  success: true,
  data: Profile
}
```

---

#### `DELETE /api/profile/[id]`

Supprimer un profil.

**Auth :** Requise (propriétaire uniquement)

**Response :**
```typescript
{
  success: true,
  message: 'Profile deleted'
}
```

**Cascade Delete :**
```typescript
// Supprimer aussi CV et avatar de Supabase Storage
await supabase.storage
  .from('smartlink-cvs')
  .remove([profile.cvFileUrl])
```

---

### 3. vCard Generation

#### `GET /api/vcard/[id]`

Générer et télécharger un fichier vCard (.vcf).

**Auth :** Publique (pas d'authentification requise)

**Response Headers :**
```
Content-Type: text/vcard; charset=utf-8
Content-Disposition: attachment; filename="Jean-Kouassi.vcf"
```

**Response Body :**
```
BEGIN:VCARD
VERSION:3.0
FN:Jean Kouassi
N:Kouassi;Jean;;;
EMAIL;TYPE=INTERNET:jean@example.com
TEL;TYPE=CELL:+2250708413484
TITLE:Développeur Full-Stack
ORG:SmartLink CI
URL:https://smartlink.app/u/jean-kouassi
END:VCARD
```

**Implémentation :**
```typescript
// app/api/vcard/[id]/route.ts
import { prisma } from '@/lib/db/prisma'
import { generateVCard } from '@/lib/utils/generate-vcard'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: params.id, isPublic: true },
    })

    if (!profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Générer vCard
    const vcard = generateVCard(profile)

    // Incrémenter compteur
    await prisma.profile.update({
      where: { id: params.id },
      data: { contactSaves: { increment: 1 } },
    })

    return new Response(vcard, {
      headers: {
        'Content-Type': 'text/vcard; charset=utf-8',
        'Content-Disposition': `attachment; filename="${profile.fullName.replace(/\s+/g, '-')}.vcf"`,
      },
    })
  } catch (error) {
    console.error('[API vCard]', error)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

---

### 4. QR Code Generation

#### `POST /api/qr/generate`

Générer un QR Code pour un profil.

**Auth :** Requise (propriétaire uniquement)

**Request Body :**
```typescript
{
  profileId: string
  format: 'png' | 'svg'       // Default: png
  size?: number               // Default: 512, max: 2048
  color?: {
    dark?: string             // Hex color (ex: #000000)
    light?: string            // Hex color (ex: #FFFFFF)
  }
}
```

**Response :**
```typescript
{
  success: true,
  data: {
    qrCode: string            // Base64 data URL (PNG) ou SVG markup
    url: string               // URL du profil public
  }
}
```

**Exemple :**
```typescript
// Client-side
const response = await fetch('/api/qr/generate', {
  method: 'POST',
  body: JSON.stringify({
    profileId: 'clx123456',
    format: 'png',
    size: 1024,
  }),
})

const { data } = await response.json()

// Télécharger
const link = document.createElement('a')
link.href = data.qrCode
link.download = 'qr-code.png'
link.click()
```

---

### 5. File Upload

#### `POST /api/upload/cv`

Upload un CV PDF vers Supabase Storage.

**Auth :** Requise

**Request :** `multipart/form-data`

**Form Fields :**
```typescript
{
  file: File                  // PDF, max 5MB
  profileId: string
}
```

**Response :**
```typescript
{
  success: true,
  data: {
    url: string               // URL publique du CV
    path: string              // Chemin dans le bucket
    size: number              // Taille en bytes
  }
}
```

**Validation :**
```typescript
const CVUploadSchema = z.object({
  file: z.custom<File>((file) => {
    if (!(file instanceof File)) return false
    if (file.type !== 'application/pdf') return false
    if (file.size > 5 * 1024 * 1024) return false // 5MB max
    return true
  }),
  profileId: z.string().cuid(),
})
```

**Implémentation :**
```typescript
// app/api/upload/cv/route.ts
import { auth } from '@/lib/auth/config'
import { supabase } from '@/lib/db/supabase'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File
    const profileId = formData.get('profileId') as string

    // Validation
    if (!file || file.type !== 'application/pdf') {
      return Response.json({ error: 'Invalid file' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    // Vérifier ownership
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId: session.user.id },
    })

    if (!profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Upload vers Supabase Storage
    const fileName = `${session.user.id}/${profileId}/cv-${Date.now()}.pdf`
    const { data, error } = await supabase.storage
      .from('smartlink-cvs')
      .upload(fileName, file)

    if (error) throw error

    // Obtenir URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('smartlink-cvs')
      .getPublicUrl(fileName)

    // Mettre à jour profil
    await prisma.profile.update({
      where: { id: profileId },
      data: { cvFileUrl: publicUrl },
    })

    return Response.json({
      success: true,
      data: {
        url: publicUrl,
        path: fileName,
        size: file.size,
      },
    })
  } catch (error) {
    console.error('[API Upload CV]', error)
    return Response.json({ error: 'Upload failed' }, { status: 500 })
  }
}
```

---

### 6. Webhooks

#### `POST /api/webhooks/cinetpay`

Webhook de confirmation de paiement CinetPay (Mobile Money).

**Auth :** Signature vérifiée (CinetPay secret)

**Request Body :**
```typescript
{
  cpm_trans_id: string        // Transaction ID CinetPay
  cpm_custom: string          // userId (passé lors de l'init paiement)
  cpm_amount: number
  cpm_currency: string        // XOF
  cpm_payment_date: string
  cpm_payment_time: string
  signature: string           // HMAC-SHA256
}
```

**Vérification signature :**
```typescript
import crypto from 'crypto'

function verifySignature(payload: any, signature: string): boolean {
  const data = `${payload.cpm_trans_id}${payload.cpm_amount}${payload.cpm_custom}`
  const expectedSignature = crypto
    .createHmac('sha256', process.env.CINETPAY_SECRET_KEY!)
    .update(data)
    .digest('hex')

  return expectedSignature === signature
}
```

**Implémentation :**
```typescript
// app/api/webhooks/cinetpay/route.ts
import { prisma } from '@/lib/db/prisma'

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    // Vérifier signature
    if (!verifySignature(payload, payload.signature)) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Mettre à jour subscription
    const userId = payload.cpm_custom
    const plan = 'PRO_DIGITAL' // Dépend du montant

    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        status: 'ACTIVE',
        paymentMethod: 'CINETPAY_WAVE',
        paymentId: payload.cpm_trans_id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
      },
      update: {
        status: 'ACTIVE',
        paymentId: payload.cpm_trans_id,
      },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('[Webhook CinetPay]', error)
    return Response.json({ error: 'Webhook failed' }, { status: 500 })
  }
}
```

---

#### `POST /api/webhooks/lemonsqueezy`

Webhook Lemon Squeezy (paiements par carte).

**Documentation :** https://docs.lemonsqueezy.com/guides/developer-guide/webhooks

**Events :**
- `order_created` : Nouvel abonnement
- `subscription_updated` : Renouvellement
- `subscription_cancelled` : Annulation

---

## Rate Limiting

**Utiliser Upstash Redis pour limiter les requêtes abusives.**

**Installation :**
```bash
bun add @upstash/redis @upstash/ratelimit
```

**Configuration :**
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const rateLimitPublic = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 req/min
})

export const rateLimitAuth = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 req/min (login)
})
```

**Usage dans API Route :**
```typescript
import { rateLimitPublic } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous'
  const { success } = await rateLimitPublic.limit(ip)

  if (!success) {
    return Response.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  // ... route logic
}
```

---

## Error Handling Pattern

**Standard pour toutes les API Routes :**

```typescript
export async function POST(request: Request) {
  try {
    // 1. Auth check
    // 2. Rate limiting
    // 3. Validation (Zod)
    // 4. Business logic
    // 5. Database operations
    // 6. Success response

    return Response.json({ success: true, data })

  } catch (error) {
    // Zod validation errors
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          success: false,
          error: 'Validation failed',
          issues: error.errors,
        },
        { status: 400 }
      )
    }

    // Prisma errors
    if (error.code === 'P2002') {
      return Response.json(
        { success: false, error: 'Duplicate entry' },
        { status: 409 }
      )
    }

    // Generic error
    console.error('[API Error]', error)
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## Testing

### Tests E2E (Playwright)

```typescript
// tests/api/profile.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Profile API', () => {
  test('should create profile', async ({ request }) => {
    const response = await request.post('/api/profile', {
      data: {
        fullName: 'Test User',
        email: 'test@example.com',
        phoneNumber: '+2250708413484',
      },
      headers: {
        Cookie: 'session=...', // Session authentifiée
      },
    })

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.fullName).toBe('Test User')
  })

  test('should enforce profile limits', async ({ request }) => {
    // User FREE avec déjà 1 profil
    const response = await request.post('/api/profile', {
      data: { /* ... */ },
      headers: { Cookie: 'session=...' },
    })

    expect(response.status()).toBe(403)
    const data = await response.json()
    expect(data.error).toContain('limit')
  })
})
```

---

## Sécurité

### Checklist

- ✅ **Auth sur toutes les routes protégées** (Better-Auth session)
- ✅ **Validation Zod sur tous les inputs**
- ✅ **Rate limiting** (Upstash Redis)
- ✅ **CORS** configuré strictement
- ✅ **Secrets** stockés dans variables d'environnement
- ✅ **Logs** sans données sensibles
- ✅ **HTTPS** (automatique sur Vercel)

### CORS Configuration

```typescript
// middleware.ts
export function middleware(request: Request) {
  const response = NextResponse.next()

  // Autoriser uniquement le domaine de production
  const origin = request.headers.get('origin')
  if (origin === process.env.NEXT_PUBLIC_APP_URL) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  return response
}
```

---

## Ressources

### Documentation

- **Next.js API Routes** : https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **Better-Auth** : https://www.better-auth.com/docs
- **Upstash Rate Limiting** : https://upstash.com/docs/redis/features/ratelimit
- **CinetPay Webhooks** : https://docs.cinetpay.com/
- **Lemon Squeezy Webhooks** : https://docs.lemonsqueezy.com/

---

**Dernière mise à jour :** 24 décembre 2024
**Mainteneurs :** Équipe SmartLink
