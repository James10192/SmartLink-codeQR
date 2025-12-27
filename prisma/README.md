# Prisma - Base de Données SmartLink

> Documentation du schéma de base de données, migrations et logique multi-profils

---

## Vue d'ensemble

SmartLink utilise **PostgreSQL** via **Supabase** comme base de données principale, avec **Prisma 6+** comme ORM pour la gestion des données et migrations.

### Stack Database
- **Provider**: Supabase PostgreSQL
- **ORM**: Prisma 6.2.0
- **Connection Pooling**: Activé (critique pour Vercel serverless)
- **Migrations**: Mode development (`prisma migrate dev`)

---

## Schéma de Base de Données

### Modèles Principaux

#### 1. **User** (Authentification Better-Auth)
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  profiles      Profile[]
  subscription  Subscription?
  sessions      Session[]
  accounts      Account[]
}
```

**Relations:**
- Un utilisateur peut avoir **plusieurs profils** (limité par tier)
- Un utilisateur a **une seule subscription** active
- Un utilisateur peut avoir **plusieurs sessions** (Better-Auth)

---

#### 2. **Profile** (Multi-profils limités)
```prisma
model Profile {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Slug pour URL publique (ex: /u/jean-kouassi)
  slug          String    @unique

  // Données vCard
  fullName      String
  jobTitle      String?
  company       String?
  phoneNumber   String
  email         String
  website       String?
  address       String?

  // Médias
  avatarUrl     String?
  cvFileUrl     String?   // URL du PDF sur Supabase Storage

  // Réseaux sociaux
  linkedinUrl   String?
  twitterUrl    String?
  facebookUrl   String?
  whatsappNumber String?

  // Paramètres
  isPublic      Boolean   @default(true)
  showCV        Boolean   @default(true)

  // Analytics (compteurs en DB)
  viewsCount    Int       @default(0)
  cvDownloads   Int       @default(0)
  contactSaves  Int       @default(0)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([userId])
  @@index([slug])
}
```

**Indexes critiques:**
- `@@index([userId])`: Pour récupérer tous les profils d'un utilisateur
- `@@index([slug])`: Pour la page publique `/u/[slug]` (performance)

---

#### 3. **Subscription** (Abonnements)
```prisma
model Subscription {
  id            String    @id @default(cuid())
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  plan          SubscriptionPlan @default(FREE)
  status        SubscriptionStatus @default(ACTIVE)

  paymentMethod PaymentMethod?
  paymentId     String?

  startDate     DateTime  @default(now())
  endDate       DateTime?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum SubscriptionPlan {
  FREE             // 1 profil
  PRO_DIGITAL      // 3 profils, stats, personnalisation
  PACK_STARTER     // 3 profils + 50 cartes papier
  CORPORATE        // Profils illimités
}

enum SubscriptionStatus {
  ACTIVE
  EXPIRED
  CANCELLED
  PENDING
}

enum PaymentMethod {
  CINETPAY_WAVE
  CINETPAY_ORANGE_MONEY
  CINETPAY_MTN
  LEMON_SQUEEZY_CARD
}
```

---

## Logique Multi-Profils

### Limites par Tier

| Plan | Profils Max | Stats | Personnalisation |
|------|-------------|-------|------------------|
| **FREE** | 1 | ❌ | ❌ |
| **PRO_DIGITAL** | 3 | ✅ | ✅ |
| **PACK_STARTER** | 3 | ✅ | ✅ |
| **CORPORATE** | ∞ | ✅ | ✅ |

### Validation Côté Backend

**Fichier**: `lib/actions/profile.ts`

```typescript
import { prisma } from '@/lib/db/prisma'

const PROFILE_LIMITS = {
  FREE: 1,
  PRO_DIGITAL: 3,
  PACK_STARTER: 3,
  CORPORATE: Infinity,
} as const

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

  return profileCount < PROFILE_LIMITS[plan]
}
```

**Usage dans Server Action:**
```typescript
export const createProfileAction = actionClient
  .schema(ProfileSchema)
  .action(async ({ parsedInput }) => {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    // Vérifier la limite
    const canCreate = await canCreateProfile(session.user.id)
    if (!canCreate) {
      throw new Error('Profile limit reached for your subscription tier')
    }

    const profile = await prisma.profile.create({
      data: {
        ...parsedInput,
        userId: session.user.id,
      },
    })

    return { success: true, profile }
  })
```

---

## Configuration Prisma

### Client Prisma (Singleton pour Vercel)

**Fichier**: `lib/db/prisma.ts`

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

**Pourquoi un singleton ?**
- Évite les connexions multiples en mode development (Next.js hot reload)
- Critique pour Vercel serverless (connection pooling)

---

## Commandes Prisma

```bash
# Générer Prisma Client (après modification du schéma)
bunx prisma generate

# Pousser le schéma en DB (dev mode, sans migrations)
bunx prisma db push

# Créer une migration (production mode)
bunx prisma migrate dev --name nom_de_la_migration

# Appliquer les migrations en production
bunx prisma migrate deploy

# Ouvrir Prisma Studio (GUI)
bunx prisma studio

# Reset la DB (⚠️ DANGER - perte de données)
bunx prisma migrate reset
```

---

## Migrations

### Workflow Development

1. **Modifier le schéma** dans `prisma/schema.prisma`
2. **Générer la migration:**
   ```bash
   bunx prisma migrate dev --name add_new_field
   ```
3. **Vérifier la migration** dans `prisma/migrations/`
4. **Commit la migration** avec le schéma

**Alternative rapide (prototypage):**
```bash
# Push directement sans créer de migration
bunx prisma db push

# Régénérer le client Prisma après changements
bunx prisma generate
```

### Workflow Production

```bash
# Sur Vercel (automatique via build command)
bunx prisma migrate deploy
```

### Migrations Récentes

#### Ajout de `coverImageUrl` (Décembre 2024)
**Changement:** Ajout du champ `coverImageUrl` au modèle `Profile` pour supporter les photos de couverture.

```prisma
model Profile {
  // ...
  coverImageUrl String? // Photo de couverture sur Supabase Storage
  // ...
}
```

**Appliquer:**
```bash
bunx prisma db push
bunx prisma generate
```

**Note:** Nécessite également la création du bucket `covers` dans Supabase Storage.

---

## Seed Data (Development)

**Fichier**: `prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Créer un utilisateur test
  const user = await prisma.user.upsert({
    where: { email: 'test@smartlink.ci' },
    update: {},
    create: {
      email: 'test@smartlink.ci',
      name: 'Jean Kouassi',
      subscription: {
        create: {
          plan: 'PRO_DIGITAL',
          status: 'ACTIVE',
        },
      },
      profiles: {
        create: {
          slug: 'jean-kouassi',
          fullName: 'Jean Kouassi',
          jobTitle: 'Développeur Full-Stack',
          company: 'SmartLink',
          phoneNumber: '+225 07 12 34 56 78',
          email: 'test@smartlink.ci',
          linkedinUrl: 'https://linkedin.com/in/jean-kouassi',
        },
      },
    },
  })

  console.log('✅ Seed data créé:', user)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

**Lancer le seed:**
```bash
bunx prisma db seed
```

---

## Transactions

Pour les opérations complexes (ex: créer un user + subscription en même temps):

```typescript
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email, name },
  })

  const subscription = await tx.subscription.create({
    data: {
      userId: user.id,
      plan: 'FREE',
      status: 'ACTIVE',
    },
  })

  return { user, subscription }
})
```

---

## Troubleshooting

### Erreur: "Can't reach database server"
**Solution:**
- Vérifier `DATABASE_URL` dans `.env.local`
- Vérifier que Supabase project est actif
- Tester la connexion: `bunx prisma db pull`

### Erreur: "Too many connections"
**Solution:**
- Vérifier que le singleton Prisma est bien configuré
- Utiliser Supabase connection pooling URL (port 6543)

### Migrations en conflit
**Solution:**
```bash
# Reset DB (dev uniquement)
bunx prisma migrate reset

# Ou marquer les migrations comme appliquées
bunx prisma migrate resolve --applied "migration_name"
```

---

## Sources Officielles

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma + Supabase Guide](https://www.prisma.io/docs/guides/database/supabase)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

---

**Dernière mise à jour:** 24 décembre 2024
