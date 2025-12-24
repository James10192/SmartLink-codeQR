# ui/ - Composants UI shadcn/ui + Base UI

> Guide d'installation et d'utilisation de shadcn/ui avec Base UI pour SmartLink

---

## Vue d'ensemble

SmartLink utilise **shadcn/ui** (basecn.dev) comme bibliothèque de composants UI. **basecn.dev** est une variante de shadcn/ui qui utilise **Base UI** (primitives headless de MUI) au lieu de Radix UI.

**Pourquoi Base UI ?**
- ✅ Meilleure accessibilité (A11y)
- ✅ Performance optimisée
- ✅ Support Material Design patterns
- ✅ Compatibilité totale avec shadcn/ui API

---

## Installation

### 1. Initialiser shadcn/ui avec Base UI

```bash
# Initialiser avec Base UI backend
bunx shadcn@latest init --base-ui
```

**Configuration interactive :**
```
✔ Which style would you like to use? › New York
✔ Which color would you like to use as base color? › Slate
✔ Would you like to use CSS variables for colors? › yes
✔ Where is your global CSS file? › src/app/globals.css
✔ Would you like to use CSS variables for colors? › yes
✔ Are you using a custom tailwind prefix? › no
✔ Where is your tailwind.config.js located? › tailwind.config.ts
✔ Configure the import alias for components: › @/components
✔ Configure the import alias for utils: › @/lib/utils
✔ Are you using React Server Components? › yes
```

### 2. Installer les composants nécessaires

```bash
# Core UI Components
bunx shadcn@latest add button
bunx shadcn@latest add card
bunx shadcn@latest add form
bunx shadcn@latest add input
bunx shadcn@latest add label
bunx shadcn@latest add select
bunx shadcn@latest add textarea
bunx shadcn@latest add dialog
bunx shadcn@latest add dropdown-menu
bunx shadcn@latest add tabs
bunx shadcn@latest add toast
bunx shadcn@latest add avatar
bunx shadcn@latest add badge
bunx shadcn@latest add separator
bunx shadcn@latest add skeleton

# Data Display
bunx shadcn@latest add table
bunx shadcn@latest add tooltip

# Feedback
bunx shadcn@latest add alert
bunx shadcn@latest add progress
```

---

## Structure des Composants

Après installation, la structure sera :

```
src/components/ui/
├── README.md              # Ce fichier
├── button.tsx             # Boutons (primary, secondary, outline, ghost)
├── card.tsx               # Cartes (container principal SmartLink)
├── form.tsx               # Formulaires (react-hook-form + zod)
├── input.tsx              # Champs texte
├── label.tsx              # Labels de formulaire
├── select.tsx             # Menus déroulants
├── textarea.tsx           # Champs texte multi-lignes
├── dialog.tsx             # Modales/Dialogs
├── dropdown-menu.tsx      # Menus contextuels
├── tabs.tsx               # Onglets (sections profil)
├── toast.tsx              # Notifications (sonner)
├── avatar.tsx             # Avatars utilisateur
├── badge.tsx              # Badges (Pro, Free)
├── separator.tsx          # Séparateurs visuels
├── skeleton.tsx           # Loading states
├── table.tsx              # Tableaux (analytics)
├── tooltip.tsx            # Info-bulles
├── alert.tsx              # Alertes (erreurs, succès)
└── progress.tsx           # Barres de progression
```

---

## Composants Critiques pour SmartLink

### 1. Button

**Usage principal :** CTA, actions, navigation

**Variants disponibles :**
```typescript
import { Button } from '@/components/ui/button'

// Primary (défaut)
<Button>Créer mon profil</Button>

// Secondary
<Button variant="secondary">Annuler</Button>

// Outline
<Button variant="outline">Voir plus</Button>

// Ghost (icônes, actions subtiles)
<Button variant="ghost" size="icon">
  <DownloadIcon className="h-4 w-4" />
</Button>

// Destructive (actions dangereuses)
<Button variant="destructive">Supprimer</Button>

// Link (apparence de lien)
<Button variant="link">Conditions d'utilisation</Button>
```

**Sizes :**
```typescript
<Button size="sm">Petit</Button>
<Button size="default">Normal</Button>
<Button size="lg">Grand</Button>
<Button size="icon">🔍</Button>
```

**Avec icône :**
```typescript
import { Download } from 'lucide-react'

<Button>
  <Download className="mr-2 h-4 w-4" />
  Télécharger QR
</Button>
```

---

### 2. Card

**Usage principal :** Conteneur de profil, dashboard widgets

**Exemple profil public :**
```typescript
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function ProfileCard({ profile }) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{profile.fullName}</CardTitle>
        <CardDescription>{profile.jobTitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{profile.company}</p>
        <div className="flex gap-2 mt-4">
          <Badge>{profile.phoneNumber}</Badge>
          <Badge variant="outline">{profile.email}</Badge>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="default">
          Enregistrer Contact
        </Button>
        {profile.cvFileUrl && (
          <Button variant="outline">
            Voir CV
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
```

---

### 3. Form (react-hook-form + Zod)

**Usage principal :** Création/édition de profil

**Installation dépendances :**
```bash
bun add react-hook-form @hookform/resolvers zod
```

**Exemple complet (Create Profile) :**
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const ProfileSchema = z.object({
  fullName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Format E.164 requis (ex: +2250708413484)'),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
})

type ProfileFormData = z.infer<typeof ProfileSchema>

export function CreateProfileForm() {
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '+225',
      jobTitle: '',
      company: '',
    },
  })

  async function onSubmit(data: ProfileFormData) {
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed')

      toast.success('Profil créé avec succès !')
    } catch (error) {
      toast.error('Erreur lors de la création du profil')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom complet</FormLabel>
              <FormControl>
                <Input placeholder="Jean Kouassi" {...field} />
              </FormControl>
              <FormDescription>
                Votre nom tel qu'il apparaîtra sur votre profil public.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="jean@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numéro de téléphone</FormLabel>
              <FormControl>
                <Input placeholder="+2250708413484" {...field} />
              </FormControl>
              <FormDescription>
                Format international (ex: +225 pour la Côte d'Ivoire)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Création...' : 'Créer le profil'}
        </Button>
      </form>
    </Form>
  )
}
```

---

### 4. Dialog

**Usage principal :** Confirmation actions, preview QR Code

**Exemple confirmation suppression :**
```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function DeleteProfileDialog({ profileId }: { profileId: string }) {
  const [open, setOpen] = useState(false)

  async function handleDelete() {
    await deleteProfile(profileId)
    setOpen(false)
    toast.success('Profil supprimé')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Supprimer</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer ce profil ?</DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Toutes les données seront perdues.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Supprimer définitivement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

### 5. Toast (Notifications)

**Installation :**
```bash
bunx shadcn@latest add toast
bun add sonner  # shadcn/ui utilise sonner
```

**Configuration (Layout) :**
```typescript
// app/layout.tsx
import { Toaster } from '@/components/ui/toaster'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

**Usage :**
```typescript
import { useToast } from '@/components/ui/use-toast'

export function MyComponent() {
  const { toast } = useToast()

  return (
    <Button
      onClick={() => {
        toast({
          title: 'Profil créé !',
          description: 'Votre profil est maintenant accessible.',
        })
      }}
    >
      Créer
    </Button>
  )
}

// Variants
toast({ title: 'Succès !' }) // Default
toast({ variant: 'destructive', title: 'Erreur !' }) // Error
```

---

### 6. Tabs

**Usage principal :** Sections du dashboard (Mes Profils, Analytics, Paramètres)

**Exemple :**
```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function DashboardTabs() {
  return (
    <Tabs defaultValue="profiles" className="w-full">
      <TabsList>
        <TabsTrigger value="profiles">Mes Profils</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="settings">Paramètres</TabsTrigger>
      </TabsList>

      <TabsContent value="profiles">
        <ProfilesList />
      </TabsContent>

      <TabsContent value="analytics">
        <AnalyticsDashboard />
      </TabsContent>

      <TabsContent value="settings">
        <SettingsForm />
      </TabsContent>
    </Tabs>
  )
}
```

---

## Customisation Thème

### 1. Couleurs (CSS Variables)

**Fichier :** `src/app/globals.css`

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;

    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... autres dark mode colors */
  }
}
```

**Générer une palette :** https://ui.shadcn.com/themes

### 2. Fonts

**Fichier :** `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
}
```

**Import Google Fonts :**
```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  return (
    <html className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

---

## Best Practices

### 1. Composition over Props

✅ **Bon :**
```typescript
<Card>
  <CardHeader>
    <CardTitle>Titre</CardTitle>
  </CardHeader>
  <CardContent>Contenu</CardContent>
</Card>
```

❌ **Éviter :**
```typescript
<Card title="Titre" content="Contenu" />
```

### 2. Server vs Client Components

- ✅ **Server Components** (par défaut) : Card, Button (sans onClick)
- ✅ **Client Components** (`'use client'`) : Form, Dialog, Toast

### 3. Accessibilité

Toujours inclure les labels :
```typescript
<FormLabel htmlFor="email">Email</FormLabel>
<Input id="email" type="email" />
```

### 4. Type Safety

Typer les props des composants :
```typescript
interface ProfileCardProps {
  profile: {
    fullName: string
    jobTitle: string
    email: string
  }
}

export function ProfileCard({ profile }: ProfileCardProps) {
  // ...
}
```

---

## Ressources

### Documentation Officielle

- **Base UI (MUI)** : https://base-ui.com/
- **basecn.dev (shadcn + Base UI)** : https://basecn.dev/
- **shadcn/ui** : https://ui.shadcn.com/
- **React Hook Form** : https://react-hook-form.com/
- **Zod** : https://zod.dev/

### Composants Supplémentaires

- **lucide-react** (icônes) : https://lucide.dev/
- **Sonner** (toasts) : https://sonner.emilkowal.ski/

---

**Dernière mise à jour :** 24 décembre 2024
**Mainteneurs :** Équipe SmartLink
