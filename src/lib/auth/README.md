# auth/ - Better-Auth Configuration

> Documentation de l'authentification avec Better-Auth pour SmartLink

---

## Vue d'ensemble

SmartLink utilise **Better-Auth 1.2.0** comme solution d'authentification. Better-Auth est une alternative moderne à NextAuth.js, offrant une meilleure type-safety et une configuration plus simple.

### Pourquoi Better-Auth ?
- ✅ Type-safe avec TypeScript
- ✅ Support natif Next.js App Router
- ✅ Email/Password + OAuth (Google, GitHub, etc.)
- ✅ Session management flexible (JWT + Database)
- ✅ Hooks React intégrés
- ✅ Framework-agnostic (portabilité)

**Documentation officielle:** https://www.better-auth.com/docs

---

## Structure du Module

```
src/lib/auth/
├── config.ts         # Configuration Better-Auth
├── middleware.ts     # Protection routes Next.js
└── README.md         # Cette documentation
```

---

## Configuration Better-Auth

### **config.ts**

```typescript
// lib/auth/config.ts
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '@/lib/db/prisma'

export const auth = betterAuth({
  // Base de données (Prisma + Supabase PostgreSQL)
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  // URL de l'application
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',

  // Secret pour JWT
  secret: process.env.BETTER_AUTH_SECRET!,

  // Providers d'authentification
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // À activer en production
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Optionnel pour MVP
      enabled: !!process.env.GOOGLE_CLIENT_ID,
    },
  },

  // Session strategy
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24, // Refresh tous les 1 jour
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // Callbacks
  callbacks: {
    async session({ session, user }) {
      // Ajouter des données custom à la session
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          email: user.email,
        },
      }
    },
  },
})

// Export du type Session pour type-safety
export type Session = typeof auth.$Infer.Session
```

---

## Variables d'Environnement

**Fichier:** `.env.local`

```bash
# Better-Auth
BETTER_AUTH_SECRET="générer avec: bunx better-auth secret"
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth (optionnel pour MVP)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

**Générer un secret:**
```bash
bunx better-auth secret
```

---

## API Route Auth

**Fichier:** `src/app/api/auth/[...all]/route.ts`

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from '@/lib/auth/config'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)
```

**Endpoints générés automatiquement:**
- `POST /api/auth/sign-up` - Inscription
- `POST /api/auth/sign-in` - Connexion
- `POST /api/auth/sign-out` - Déconnexion
- `GET /api/auth/session` - Récupérer la session
- `POST /api/auth/callback/google` - OAuth Google

---

## Récupérer la Session

### Côté Serveur (Server Components, Server Actions)

```typescript
// app/dashboard/page.tsx (Server Component)
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect('/login')
  }

  return (
    <div>
      <h1>Bienvenue, {session.user.name}</h1>
    </div>
  )
}
```

### Côté Client (Client Components)

```typescript
// components/UserProfile.tsx
'use client'

import { useSession } from 'better-auth/react'

export function UserProfile() {
  const { data: session, isPending } = useSession()

  if (isPending) return <div>Chargement...</div>

  if (!session) {
    return <a href="/login">Se connecter</a>
  }

  return (
    <div>
      <p>Email: {session.user.email}</p>
      <button onClick={() => signOut()}>
        Se déconnecter
      </button>
    </div>
  )
}
```

---

## Middleware (Protection Routes)

**Fichier:** `src/middleware.ts`

```typescript
// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/lib/auth/config'

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  // Routes protégées
  const protectedRoutes = ['/dashboard', '/profile']
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !session) {
    // Rediriger vers login avec return URL
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Rediriger les utilisateurs connectés loin de /login
  if (request.nextUrl.pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

---

## Pages Auth

### Page Login

**Fichier:** `app/(auth)/login/page.tsx`

```typescript
// app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { signIn } from 'better-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { error } = await signIn.email({
      email,
      password,
      callbackURL: '/dashboard',
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div>
      <h1>Connexion</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-500">{error}</p>}
        <button type="submit">Se connecter</button>
      </form>

      {/* OAuth Google (optionnel) */}
      <button onClick={() => signIn.social({ provider: 'google' })}>
        Connexion avec Google
      </button>
    </div>
  )
}
```

---

### Page Signup

**Fichier:** `app/(auth)/signup/page.tsx`

```typescript
// app/(auth)/signup/page.tsx
'use client'

import { useState } from 'react'
import { signUp } from 'better-auth/react'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { error } = await signUp.email({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      callbackURL: '/dashboard',
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div>
      <h1>Inscription</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nom complet"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe (min 8 caractères)"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          minLength={8}
        />
        {error && <p className="text-red-500">{error}</p>}
        <button type="submit">Créer un compte</button>
      </form>
    </div>
  )
}
```

---

## Helper Functions

**Fichier:** `lib/auth/helpers.ts`

```typescript
// lib/auth/helpers.ts
import { auth } from './config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Récupérer la session côté serveur
 */
export async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  })
}

/**
 * Requiert une session authentifiée (throw si non connecté)
 */
export async function requireAuth() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return session
}

/**
 * Récupérer l'utilisateur courant avec ses profils
 */
export async function getCurrentUser() {
  const session = await requireAuth()

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profiles: true,
      subscription: true,
    },
  })

  if (!user) {
    redirect('/login')
  }

  return user
}
```

**Usage:**
```typescript
// app/dashboard/page.tsx
import { getCurrentUser } from '@/lib/auth/helpers'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.profiles.length} profils</p>
    </div>
  )
}
```

---

## Sécurité

### 1. **Validation Email (Production)**

Activer la vérification email en production:

```typescript
export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // ✅ Activer en production
    sendVerificationEmail: async ({ user, url }) => {
      // Envoyer l'email de vérification
      await sendEmail({
        to: user.email,
        subject: 'Vérifiez votre email',
        html: `<a href="${url}">Cliquez ici pour vérifier</a>`,
      })
    },
  },
})
```

### 2. **Rate Limiting**

Protéger les endpoints auth avec Upstash:

```typescript
// app/api/auth/[...all]/route.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requêtes par minute
})

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return new Response('Too many requests', { status: 429 })
  }

  // ... reste de la logique
}
```

### 3. **HTTPS Obligatoire (Production)**

```typescript
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL!,
  trustedOrigins: [
    'https://smartlink.ci',
    'https://smartlink.vercel.app',
  ],
})
```

---

## Troubleshooting

### Erreur: "Invalid session"
**Solution:**
- Vérifier `BETTER_AUTH_SECRET` dans `.env.local`
- Vérifier que `BETTER_AUTH_URL` correspond à l'URL courante
- Vider les cookies (dev)

### Erreur: "Database error"
**Solution:**
- Vérifier que les tables Better-Auth existent (migrations Prisma)
- Vérifier `DATABASE_URL`

### OAuth Google ne fonctionne pas
**Solution:**
- Vérifier `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`
- Configurer les Authorized redirect URIs dans Google Console: `http://localhost:3000/api/auth/callback/google`

---

## Sources Officielles

- [Better-Auth Documentation](https://www.better-auth.com/docs)
- [Better-Auth Next.js Guide](https://www.better-auth.com/docs/integrations/next-js)
- [Better-Auth Prisma Adapter](https://www.better-auth.com/docs/adapters/prisma)

---

**Dernière mise à jour:** 24 décembre 2024
