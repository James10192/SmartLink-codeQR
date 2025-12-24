# BEST PRACTICES 2025 - SmartLink

> Best practices techniques basées sur les dernières recommandations officielles (Décembre 2025)
> Dernière mise à jour : 24 décembre 2024

---

## 1. Next.js 16 (App Router)

### Server Components vs Client Components

**Règle d'or :** Par défaut, tout est Server Component. Utilisez `'use client'` uniquement si nécessaire.

✅ **Server Components (défaut) :**
```typescript
// app/dashboard/page.tsx
import { prisma } from '@/lib/db/prisma'

export default async function DashboardPage() {
  const profiles = await prisma.profile.findMany() // Direct DB access
  return <ProfileList profiles={profiles} />
}
```

✅ **Client Components (interactivité) :**
```typescript
// components/ProfileForm.tsx
'use client'

import { useState } from 'react'

export function ProfileForm() {
  const [name, setName] = useState('')
  // Event handlers, hooks, browser APIs
}
```

### Streaming & Suspense

```typescript
import { Suspense } from 'react'

export default function DashboardPage() {
  return (
    <div>
      <Suspense fallback={<ProfilesSkeleton />}>
        <ProfilesAsync />
      </Suspense>
    </div>
  )
}

async function ProfilesAsync() {
  const profiles = await fetchProfiles()
  return <ProfileList profiles={profiles} />
}
```

### Caching Strategies

- **Static Generation** : Landing page, docs
- **ISR** (revalidate) : Profils publics (`/u/[slug]`)
- **Dynamic** : Dashboard (protected pages)

```typescript
// Page publique avec ISR
export const revalidate = 3600 // 1 heure

export default async function PublicProfile({ params }: { params: { slug: string } }) {
  const profile = await prisma.profile.findUnique({
    where: { slug: params.slug }
  })
  return <ProfileView profile={profile} />
}
```

**Sources :**
- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Server Components Patterns](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

---

## 2. Better-Auth (Authentication)

### Session Management

```typescript
// Middleware protection
import { auth } from '@/lib/auth/config'

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
```

### OAuth Configuration

```typescript
import { betterAuth } from 'better-auth'

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
})
```

⚠️ **IMPORTANT :** Toujours vérifier la session côté serveur, jamais uniquement côté client.

**Sources :**
- [Better-Auth Documentation](https://www.better-auth.com/docs)

---

## 3. Prisma + Supabase PostgreSQL

### Connection Pooling (CRITIQUE pour Vercel)

```typescript
// lib/db/prisma.ts
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

### Transactions

```typescript
// Création profil + subscription en transaction
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData })

  const subscription = await tx.subscription.create({
    data: {
      userId: user.id,
      plan: 'FREE',
    },
  })

  return { user, subscription }
})
```

### Indexes Critiques

```prisma
model Profile {
  slug String @unique

  @@index([userId])        // Pour query "profiles d'un user"
  @@index([slug])          // Pour page publique /u/[slug]
  @@index([createdAt])     // Pour sorting
}
```

**Sources :**
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

---

## 4. basecn (shadcn/ui + Base UI)

### Installation Composants via Registry

**Configuration initiale :** Le projet utilise la registry basecn pour installer les composants shadcn/ui basés sur Base UI au lieu de Radix UI.

```json
// components.json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "registries": {
    "@basecn": "https://basecn.dev/r/{name}.json"
  }
}
```

**Installation des composants :**
```bash
# Installer un composant basecn
npx shadcn@latest add @basecn/button --yes

# Installer plusieurs composants
npx shadcn@latest add @basecn/card @basecn/input @basecn/form --yes
```

### Composants Disponibles (55+)

**Composants d'interface :**
- **Alert** - Messages d'alerte avec variantes (default, destructive)
- **Button** - Boutons avec variantes et états
- **Card** - Conteneurs de contenu avec Header, Title, Description, Content
- **Empty** - État vide avec icône, titre, description
- **Field** - Structure de champ formulaire (Label + Input + Description + Error)
- **Form** - Formulaires react-hook-form
- **Input** - Champs de texte
- **Label** - Labels de formulaire
- **Separator** - Séparateurs visuels

**Composants de navigation :**
- **Breadcrumb**, **Menubar**, **Navigation Menu**, **Sidebar**, **Tabs**

**Composants de feedback :**
- **Dialog**, **Drawer**, **Alert Dialog**, **Hover Card**, **Popover**, **Tooltip**

**Composants de saisie :**
- **Autocomplete**, **Checkbox**, **Combobox**, **Radio Group**, **Select**, **Slider**, **Switch**, **Textarea**

**Composants de données :**
- **Table**, **Badge**, **Avatar**, **Skeleton**, **Progress**, **Spinner**

**Liste complète :** https://github.com/akash3444/basecn/blob/main/registry.json

### ⚠️ RÈGLE CRITIQUE : Toujours utiliser les composants basecn

**❌ NE JAMAIS faire :**
```typescript
// Coder manuellement un message d'erreur
<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
  {error}
</div>

// Coder manuellement un champ de formulaire
<div className="space-y-2">
  <label htmlFor="email">Email</label>
  <input id="email" type="email" />
</div>
```

**✅ TOUJOURS faire :**
```typescript
// Utiliser le composant Alert de basecn
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

<Alert variant="destructive">
  <AlertCircle />
  <AlertDescription>{error}</AlertDescription>
</Alert>

// Utiliser le composant Field de basecn
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

<Field>
  <FieldLabel htmlFor="email">Email</FieldLabel>
  <Input id="email" type="email" />
</Field>
```

### Exemples de Composants Clés

**1. Alert (Messages d'erreur/succès)**
```typescript
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle } from 'lucide-react'

// Message d'erreur
<Alert variant="destructive">
  <AlertCircle />
  <AlertDescription>Email ou mot de passe incorrect</AlertDescription>
</Alert>

// Message de succès
<Alert>
  <CheckCircle />
  <AlertTitle>Profil créé</AlertTitle>
  <AlertDescription>Votre profil a été créé avec succès</AlertDescription>
</Alert>
```

**2. Field (Champs de formulaire)**
```typescript
import { Field, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

<Field>
  <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
  <Input id="password" type="password" />
  <FieldDescription>Minimum 8 caractères</FieldDescription>
  <FieldError>{error?.message}</FieldError>
</Field>
```

**3. Empty (États vides)**
```typescript
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

<Empty>
  <EmptyHeader>
    <EmptyMedia variant="icon">
      <Users />
    </EmptyMedia>
    <EmptyTitle>Aucun profil pour le moment</EmptyTitle>
    <EmptyDescription>
      Créez votre premier profil pour commencer
    </EmptyDescription>
  </EmptyHeader>
  <EmptyContent>
    <Button asChild>
      <Link href="/profile/create">Créer mon premier profil</Link>
    </Button>
  </EmptyContent>
</Empty>
```

**4. Card (Conteneurs de contenu)**
```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Titre</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Contenu de la carte</p>
  </CardContent>
</Card>
```

### Architecture 3-Layers

1. **Primitive (Base UI)** : Accessibilité WAI-ARIA, keyboard navigation, focus management
2. **Component (basecn)** : Styling Tailwind, variants, responsive design
3. **Business Logic** : Votre code applicatif

```typescript
// Layer 1+2 : components/ui/button.tsx (installé via basecn)
import { Button as ButtonPrimitive } from "@base-ui/react/button"

export const Button = ({ children, ...props }: ButtonProps) => (
  <ButtonPrimitive className="px-4 py-2 bg-primary..." {...props}>
    {children}
  </ButtonPrimitive>
)

// Layer 3 : Votre composant business
import { Button } from '@/components/ui/button'

export function CreateProfileButton() {
  const { execute, isExecuting } = useAction(createProfileAction)
  return (
    <Button onClick={execute} disabled={isExecuting}>
      Créer un profil
    </Button>
  )
}
```

### Workflow de Développement

**Avant d'écrire du JSX :**
1. Chercher si un composant basecn existe : https://github.com/akash3444/basecn/blob/main/registry.json
2. Installer le composant : `npx shadcn@latest add @basecn/component-name --yes`
3. Utiliser le composant dans votre code
4. **NE JAMAIS** coder manuellement des divs avec des classes Tailwind pour des patterns UI standards

**Exemples de recherche :**
- "Je veux afficher un message d'erreur" → Utiliser `Alert` variant="destructive"
- "Je veux un champ de formulaire" → Utiliser `Field` + `FieldLabel` + `Input`
- "Je veux afficher un état vide" → Utiliser `Empty` + `EmptyHeader` + `EmptyContent`
- "Je veux une carte de contenu" → Utiliser `Card` + `CardHeader` + `CardContent`

**Sources :**
- [basecn.dev - Registry officielle](https://basecn.dev/)
- [GitHub - akash3444/basecn](https://github.com/akash3444/basecn)
- [Base UI Documentation](https://base-ui.com/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

---

## 5. next-safe-action (Server Actions)

### Type-Safe Actions

```typescript
// lib/actions/profile.ts
'use server'

import { createSafeActionClient } from 'next-safe-action'
import { ProfileSchema } from '@/lib/validations/profile'

const actionClient = createSafeActionClient()

export const createProfileAction = actionClient
  .schema(ProfileSchema)
  .action(async ({ parsedInput }) => {
    const profile = await prisma.profile.create({
      data: parsedInput,
    })
    return { success: true, profile }
  })
```

### Utilisation Client

```typescript
'use client'

import { useAction } from 'next-safe-action/hooks'

export function ProfileForm() {
  const { execute, isExecuting } = useAction(createProfileAction)

  return (
    <form action={(formData) => execute({ ...fromFormData(formData) })}>
      <Button disabled={isExecuting}>Submit</Button>
    </form>
  )
}
```

**Avantages :**
- ✅ Type-safety complète
- ✅ Validation Zod automatique
- ✅ Error handling simplifié
- ✅ Loading states natifs

**Sources :**
- [next-safe-action Documentation](https://next-safe-action.dev/)
- [Server Actions Best Practices 2025](https://makerkit.dev/blog/tutorials/server-actions-vs-route-handlers)

---

## 6. PostHog (Analytics 2025)

### Configuration Moderne

```typescript
// instrumentation-client.ts (Next.js 15.3+)
import posthog from 'posthog-js'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: '/ingest', // Reverse proxy
    person_profiles: 'identified_only',
    capture_pageview: false,
    defaults: '2025-11-30', // ⚠️ Important : derniers defaults
  })
}
```

### Events Tracking

```typescript
// Définir 10-15 events critiques
posthog.capture('profile_created', {
  profile_id: profile.id,
  plan: user.plan,
  has_cv: !!profile.cvUrl,
})
```

### Feature Flags

```typescript
import { useFeatureFlagEnabled } from 'posthog-js/react'

export function LandingPage() {
  const newDesign = useFeatureFlagEnabled('new-landing')

  return newDesign ? <NewDesign /> : <OldDesign />
}
```

**Sources :**
- [PostHog Next.js Integration](https://posthog.com/docs/libraries/next-js)

---

## 7. Performance 2025

### Parallel Data Fetching

✅ **CORRECT :**
```typescript
// Fetch en parallèle
const [user, profiles] = await Promise.all([
  getUser(),
  getProfiles(),
])
```

❌ **ÉVITER :**
```typescript
// Sequential (plus lent)
const user = await getUser()
const profiles = await getProfiles()
```

### Image Optimization

```typescript
import Image from 'next/image'

<Image
  src={profile.avatarUrl}
  alt={profile.fullName}
  width={100}
  height={100}
  priority={aboveFold} // Si visible immédiatement
/>
```

**Sources :**
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)

---

## 8. Security Checklist

### Backend
- ✅ Auth check sur toutes les mutations
- ✅ Validation Zod sur tous les inputs
- ✅ Rate limiting (Upstash Redis)
- ✅ Pas de secrets dans logs
- ✅ CORS strict

### Frontend
- ✅ Pas de secrets client-side
- ✅ Sanitize user inputs (XSS)
- ✅ HTTPS (auto sur Vercel)
- ✅ CSP headers

### Database
- ✅ Prisma (pas de raw SQL)
- ✅ Connection pooling
- ✅ Indexes sur queries fréquentes
- ✅ Backups auto (Supabase)

---

## 9. Sources Officielles

- **Next.js** : https://nextjs.org/docs
- **Better-Auth** : https://www.better-auth.com/docs
- **Prisma** : https://www.prisma.io/docs
- **Base UI** : https://base-ui.com/
- **basecn.dev** : https://basecn.dev/
- **next-safe-action** : https://next-safe-action.dev/
- **PostHog** : https://posthog.com/docs

---

**Dernière révision :** 24 décembre 2024
**Basé sur :** Recherches officielles Décembre 2025
