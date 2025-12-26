# SmartLink - Roadmap des Prochaines Fonctionnalités

> Plan d'implémentation post-premium features
> Dernière mise à jour : 26 décembre 2024

---

## ✅ Fonctionnalités Complétées (Phase 1-6)

- [x] Video Business Card (30s, autoplay)
- [x] Theme Customization (couleurs, layouts, fonts)
- [x] Visitor Tracking (RGPD-compliant)
- [x] Analytics Dashboard avec blur pour FREE
- [x] Upgrade/Pricing Page
- [x] Upgrade CTAs partout dans l'app

---

## 🚀 Phase 7: Gestion Manuelle des Abonnements (Admin Dashboard)

**Priorité:** HAUTE
**Durée estimée:** 3-4 jours
**Objectif:** Interface admin pour gérer les abonnements manuellement avant l'automatisation avec paiements

### 7.1 Page Admin Subscription Management

**Nouveau fichier:** `src/app/(dashboard)/admin/subscriptions/page.tsx`

**Fonctionnalités:**
- Table de tous les utilisateurs avec leur plan actuel
- Filtres: plan, statut (ACTIVE, EXPIRED, CANCELLED)
- Actions rapides:
  - Upgrade/Downgrade plan
  - Activer/Désactiver abonnement
  - Voir historique utilisateur
- Statistiques:
  - Nombre d'utilisateurs par plan
  - Revenus mensuels (calculés manuellement)
  - Taux de conversion FREE → PRO

**Composants shadcn/ui à utiliser:**
- `Table` (data table avec sorting, filtering)
- `Select` (filtres de plan/statut)
- `Dialog` (modal pour éditer abonnement)
- `Badge` (afficher le plan actuel)
- `DropdownMenu` (actions rapides par utilisateur)

**Exemple UI:**
```tsx
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu'

const columns = [
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'plan',
    header: 'Plan',
    cell: ({ row }) => <Badge variant={getPlanVariant(row.plan)}>{row.plan}</Badge>
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuItem onClick={() => upgradeToPro(row.id)}>
          Upgrade to PRO
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => cancelSubscription(row.id)}>
          Cancel
        </DropdownMenuItem>
      </DropdownMenu>
    )
  }
]
```

### 7.2 Server Actions pour Admin

**Nouveau fichier:** `src/lib/actions/admin/subscriptions.ts`

**Actions à créer:**
```typescript
// Créer/Mettre à jour abonnement manuellement
export const updateUserSubscriptionAction = actionClient
  .schema(z.object({
    userId: z.string(),
    plan: z.enum(['FREE', 'PRO_DIGITAL', 'PACK_STARTER', 'CORPORATE']),
    status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED']),
    expiresAt: z.date().optional(),
  }))
  .action(async ({ parsedInput }) => {
    // Vérifier que l'utilisateur courant est ADMIN
    const session = await requireAuth()
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (admin?.role !== 'ADMIN') {
      throw new Error('Unauthorized')
    }

    // Mettre à jour l'abonnement
    await prisma.subscription.upsert({
      where: { userId: parsedInput.userId },
      create: { ...parsedInput },
      update: { ...parsedInput }
    })
  })

// Annuler un abonnement
export const cancelSubscriptionAction = ...

// Activer un abonnement
export const activateSubscriptionAction = ...

// Voir historique des changements
export const getSubscriptionHistoryAction = ...
```

### 7.3 Ajout du rôle ADMIN dans Prisma

**Modifier:** `prisma/schema.prisma`

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified Boolean   @default(false)
  name          String?
  image         String?
  role          UserRole  @default(USER) // NOUVEAU
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations existantes...
}

enum UserRole {
  USER
  ADMIN
}
```

**Migration:**
```bash
bunx prisma migrate dev --name add-user-role
```

### 7.4 Route de navigation Admin

**Modifier:** `src/config/navigation.ts`

```typescript
export const NAV_ITEMS: NavItem[] = [
  // Items existants...
  {
    title: 'Admin',
    href: '/admin/subscriptions',
    icon: Shield, // import Shield from 'lucide-react'
    adminOnly: true, // Nouveau flag
  },
]
```

**Modifier:** `src/components/layout/Sidebar.tsx`

```tsx
{NAV_ITEMS.filter(item => {
  // Cacher les items admin pour les non-admins
  if (item.adminOnly && userRole !== 'ADMIN') return false
  return true
}).map(item => (
  // Render item...
))}
```

---

## 🚀 Phase 8: Intégration Paiements (CinetPay + Lemon Squeezy)

**Priorité:** HAUTE
**Durée estimée:** 5-7 jours
**Dépendance:** Phase 7 complétée

### 8.1 CinetPay Integration (Mobile Money)

**Documentation:** https://docs.cinetpay.com/

**Installation:**
```bash
bun add cinetpay-nodejs
```

**Nouveau fichier:** `src/lib/payments/cinetpay.ts`

**Features:**
- Initier paiement Mobile Money (Orange, MTN, Moov)
- Gérer webhook de confirmation
- Mettre à jour abonnement automatiquement après paiement

**Exemple implémentation:**
```typescript
import CinetPay from 'cinetpay-nodejs'

const cinetpay = new CinetPay({
  apiKey: env.CINETPAY_API_KEY,
  siteId: env.CINETPAY_SITE_ID,
})

export async function createCinetPayPayment(params: {
  userId: string
  plan: SubscriptionPlan
  amount: number
}) {
  const payment = await cinetpay.init({
    transaction_id: generateTransactionId(),
    amount: params.amount,
    currency: 'XOF', // Franc CFA
    description: `SmartLink ${params.plan} Subscription`,
    return_url: `${env.NEXT_PUBLIC_APP_URL}/payment/success`,
    notify_url: `${env.NEXT_PUBLIC_APP_URL}/api/webhooks/cinetpay`,
    metadata: {
      userId: params.userId,
      plan: params.plan,
    }
  })

  return payment
}
```

**Nouveau fichier:** `src/app/api/webhooks/cinetpay/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-cinetpay-signature')
  const body = await request.json()

  // Vérifier signature
  if (!verifyCinetPaySignature(body, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Paiement réussi
  if (body.status === 'ACCEPTED') {
    await prisma.subscription.upsert({
      where: { userId: body.metadata.userId },
      create: {
        userId: body.metadata.userId,
        plan: body.metadata.plan,
        status: 'ACTIVE',
        expiresAt: addMonths(new Date(), 1),
        paymentProvider: 'CINETPAY',
      },
      update: {
        plan: body.metadata.plan,
        status: 'ACTIVE',
        expiresAt: addMonths(new Date(), 1),
      }
    })

    // Envoyer email de confirmation
    await sendSubscriptionConfirmationEmail(body.metadata.userId)
  }

  return Response.json({ received: true })
}
```

### 8.2 Lemon Squeezy Integration (Cartes Bancaires)

**Documentation:** https://docs.lemonsqueezy.com/

**Installation:**
```bash
bun add @lemonsqueezy/lemonsqueezy.js
```

**Nouveau fichier:** `src/lib/payments/lemonsqueezy.ts`

**Features similaires à CinetPay:**
- Checkout session pour cartes bancaires
- Webhook pour confirmations
- Gestion auto-renouvellement

### 8.3 Page de Checkout Unifiée

**Nouveau fichier:** `src/app/(dashboard)/checkout/page.tsx`

**Composants shadcn/ui:**
- `Tabs` (onglets Mobile Money / Carte Bancaire)
- `RadioGroup` (choix opérateur Mobile Money)
- `Form` (formulaire numéro téléphone)
- `Dialog` (confirmation avant paiement)

**Exemple:**
```tsx
<Tabs defaultValue="mobile-money">
  <TabsList>
    <TabsTrigger value="mobile-money">Mobile Money</TabsTrigger>
    <TabsTrigger value="card">Carte Bancaire</TabsTrigger>
  </TabsList>

  <TabsContent value="mobile-money">
    <RadioGroup value={operator} onValueChange={setOperator}>
      <RadioGroupItem value="orange">Orange Money</RadioGroupItem>
      <RadioGroupItem value="mtn">MTN Money</RadioGroupItem>
      <RadioGroupItem value="moov">Moov Money</RadioGroupItem>
    </RadioGroup>
    <Input placeholder="07 XX XX XX XX" />
    <Button onClick={handleCinetPayCheckout}>
      Payer 9 900 FCFA
    </Button>
  </TabsContent>

  <TabsContent value="card">
    <Button onClick={handleLemonSqueezyCheckout}>
      Payer par Carte
    </Button>
  </TabsContent>
</Tabs>
```

---

## 🚀 Phase 9: Système de Notifications Email

**Priorité:** MOYENNE
**Durée estimée:** 2-3 jours
**Dépendance:** Phase 8 complétée

### 9.1 Integration Resend (Email Service)

**Documentation:** https://resend.com/docs

**Installation:**
```bash
bun add resend react-email @react-email/components
```

**Templates Email à créer:**

1. **Welcome Email** (inscription)
2. **Subscription Confirmation** (après paiement)
3. **Subscription Renewal Reminder** (7 jours avant expiration)
4. **Subscription Expired** (abonnement expiré)
5. **Profile Viewed** (notification quand quelqu'un visite ton profil - PRO+)

**Nouveau dossier:** `emails/` (à la racine)

**Exemple:** `emails/subscription-confirmation.tsx`

```tsx
import { Html, Head, Body, Container, Button } from '@react-email/components'

export default function SubscriptionConfirmation({
  userName,
  plan,
  expiresAt
}: {
  userName: string
  plan: string
  expiresAt: Date
}) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <h1>Bienvenue sur SmartLink {plan} !</h1>
          <p>Bonjour {userName},</p>
          <p>Votre abonnement {plan} est maintenant actif jusqu'au {expiresAt.toLocaleDateString('fr-FR')}.</p>

          <h2>Vos nouvelles fonctionnalités :</h2>
          <ul>
            <li>✅ Carte de visite vidéo (30s)</li>
            <li>✅ Personnalisation complète du thème</li>
            <li>✅ Statistiques détaillées</li>
            <li>✅ Visiteurs illimités</li>
          </ul>

          <Button href="https://smartlink.ci/dashboard">
            Accéder à mon Dashboard
          </Button>
        </Container>
      </Body>
    </Html>
  )
}
```

**Nouveau fichier:** `src/lib/email/send.ts`

```typescript
import { Resend } from 'resend'
import SubscriptionConfirmation from '@/emails/subscription-confirmation'

const resend = new Resend(env.RESEND_API_KEY)

export async function sendSubscriptionConfirmationEmail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true }
  })

  if (!user) return

  await resend.emails.send({
    from: 'SmartLink <no-reply@smartlink.ci>',
    to: user.email,
    subject: `Bienvenue sur SmartLink ${user.subscription?.plan} !`,
    react: SubscriptionConfirmation({
      userName: user.name || user.email,
      plan: user.subscription?.plan || 'FREE',
      expiresAt: user.subscription?.expiresAt || new Date(),
    }),
  })
}
```

---

## 🚀 Phase 10: Features Avancées

**Priorité:** MOYENNE/BASSE
**Durée estimée:** Variable

### 10.1 Profile Sharing (Boutons de Partage Social)

**Nouveau composant:** `src/components/profile/share-buttons.tsx`

**Composants shadcn/ui:**
- `Popover` (menu de partage)
- `Button` (boutons sociaux)
- `Separator`

**Plateformes:**
- WhatsApp
- Twitter
- LinkedIn
- Facebook
- Copier le lien

```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">
      <Share2 className="mr-2 h-4 w-4" />
      Partager
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-80">
    <div className="space-y-2">
      <Button variant="ghost" className="w-full justify-start" onClick={shareOnWhatsApp}>
        <MessageCircle className="mr-2 h-4 w-4" />
        Partager sur WhatsApp
      </Button>
      <Button variant="ghost" className="w-full justify-start" onClick={shareOnLinkedIn}>
        <Linkedin className="mr-2 h-4 w-4" />
        Partager sur LinkedIn
      </Button>
      <Separator />
      <Button variant="outline" className="w-full" onClick={copyLink}>
        <Copy className="mr-2 h-4 w-4" />
        Copier le lien
      </Button>
    </div>
  </PopoverContent>
</Popover>
```

### 10.2 QR Code Download Variations

**Améliorer:** `src/components/profile/qr-code-display.tsx`

**Nouveaux formats:**
- PNG (haute résolution)
- SVG (vectoriel, scalable)
- PDF (avec carte de visite complète)

**Composants shadcn/ui:**
- `DropdownMenu` (choix de format)
- `Dialog` (aperçu avant téléchargement)
- `RadioGroup` (choix résolution pour PNG)

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>
      <Download className="mr-2 h-4 w-4" />
      Télécharger QR
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => downloadQR('png', '1024')}>
      PNG (1024x1024)
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => downloadQR('png', '2048')}>
      PNG (2048x2048 - Impression)
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => downloadQR('svg')}>
      SVG (Vectoriel)
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={() => downloadQR('pdf')}>
      PDF (Carte complète)
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 10.3 Performance Insights Dashboard

**Nouveau fichier:** `src/app/(dashboard)/dashboard/insights/page.tsx`

**Métriques avancées:**
- Taux de conversion (vues → contacts sauvegardés)
- Meilleur jour/heure pour les vues
- Top sources de trafic (referrers)
- Évolution dans le temps (chart avec tendances)

**Composants shadcn/ui:**
- `Card` (cards de métriques)
- `Tabs` (onglets par période: 7j, 30j, 90j)
- `Select` (choix de profil si plusieurs)
- Utiliser **Recharts** pour les graphiques (déjà compatible shadcn/ui)

**Installation Recharts:**
```bash
bun add recharts
```

**Exemple:**
```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

<Card>
  <CardHeader>
    <CardTitle>Évolution des vues</CardTitle>
  </CardHeader>
  <CardContent>
    <LineChart width={600} height={300} data={viewsData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="views" stroke="#8884d8" />
    </LineChart>
  </CardContent>
</Card>
```

### 10.4 Team Management (CORPORATE Plan)

**Nouveau fichier:** `src/app/(dashboard)/team/page.tsx`

**Fonctionnalités:**
- Inviter des membres (email)
- Gérer les profils de l'équipe
- Assigner des rôles (Admin, Member, Viewer)
- Dashboard centralisé pour stats de toute l'équipe

**Composants shadcn/ui:**
- `Table` (liste des membres)
- `Dialog` (modal invitation)
- `Form` (formulaire invitation)
- `Badge` (rôles)
- `Switch` (activer/désactiver membre)

**Nouveau modèle Prisma:**
```prisma
model TeamMember {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  teamId    String
  role      TeamRole @default(MEMBER)
  createdAt DateTime @default(now())

  @@unique([userId, teamId])
}

enum TeamRole {
  ADMIN
  MEMBER
  VIEWER
}
```

### 10.5 Bulk Operations (CORPORATE)

**Fonctionnalités:**
- Import CSV d'employés (création massive de profils)
- Export CSV de toutes les stats
- Génération QR en masse (ZIP avec tous les QR codes)

**Composants shadcn/ui:**
- `Input` (type="file" pour CSV upload)
- `Progress` (barre de progression import)
- `Alert` (messages d'erreur validation CSV)
- `Table` (prévisualisation avant import)

---

## 📋 Priorisation Recommandée

### Court Terme (1-2 semaines)
1. ✅ **Phase 7:** Gestion manuelle abonnements (CRITIQUE - permet de tester le business model)
2. ✅ **Phase 8:** Intégration CinetPay (CRITIQUE - génération revenus)
3. ✅ **Phase 9:** Emails de confirmation (IMPORTANT - UX)

### Moyen Terme (3-4 semaines)
4. **Phase 10.1:** Boutons de partage social (IMPORTANT - acquisition)
5. **Phase 10.2:** QR Code variations (IMPORTANT - qualité produit)
6. **Phase 8:** Intégration Lemon Squeezy (MOYEN - international)

### Long Terme (1-2 mois)
7. **Phase 10.3:** Performance insights (NICE TO HAVE)
8. **Phase 10.4:** Team management (CORPORATE only)
9. **Phase 10.5:** Bulk operations (CORPORATE only)

---

## 🎨 Principes de Design (shadcn/ui Only)

**RÈGLE ABSOLUE:** Toujours utiliser les composants shadcn/ui existants, JAMAIS coder manuellement.

**Composants shadcn/ui à installer si manquants:**
```bash
bunx shadcn@latest add data-table
bunx shadcn@latest add tabs
bunx shadcn@latest add popover
bunx shadcn@latest add radio-group
bunx shadcn@latest add switch
bunx shadcn@latest add progress
bunx shadcn@latest add alert
```

**Palette de couleurs:**
- Utiliser les CSS variables de Tailwind (primary, secondary, muted, etc.)
- Pas de couleurs hardcodées (jamais `bg-blue-500`, toujours `bg-primary`)

**Responsive:**
- Mobile-first (toujours tester sur mobile)
- Utiliser `md:`, `lg:` breakpoints de Tailwind

---

## 🚀 Quick Start Next Implementation

Pour commencer la **Phase 7 (Admin Subscription Management)**, voici le premier fichier à créer :

**Fichier:** `src/app/(dashboard)/admin/subscriptions/page.tsx`

**Commande pour installer les composants nécessaires:**
```bash
bunx shadcn@latest add data-table select dialog badge dropdown-menu
```

**Structure de base:**
```tsx
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { redirect } from 'next/navigation'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'

export default async function AdminSubscriptionsPage() {
  const session = await requireAuth()

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })

  // Vérifier si admin
  if (user?.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const subscriptions = await prisma.subscription.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des Abonnements</h1>
        <p className="text-muted-foreground">
          Gérez manuellement les abonnements des utilisateurs
        </p>
      </div>

      <DataTable columns={columns} data={subscriptions} />
    </div>
  )
}
```

Prêt pour l'implémentation ! 🚀
