# utils/ - Utilitaires SmartLink

> Documentation des fonctions utilitaires pour la génération de QR Code, vCard et upload de fichiers

---

## Vue d'ensemble

Le dossier `/src/lib/utils/` contient les fonctions utilitaires partagées à travers l'application SmartLink. Ces utilitaires implémentent la logique métier pour :
- Génération de QR Codes (PNG/SVG)
- Génération de fichiers vCard (.vcf)
- Upload de fichiers (CV PDF) vers Supabase Storage
- Utilitaires CSS (className merging avec Tailwind)

---

## Structure

```
src/lib/utils/
├── README.md              # Ce fichier
├── generate-qr.ts         # Génération QR Codes
├── generate-vcard.ts      # Génération vCard (.vcf)
├── upload.ts              # Upload fichiers (Supabase Storage)
└── cn.ts                  # className utility (shadcn/ui)
```

---

## 1. generate-qr.ts

### Description

Génère des QR Codes au format PNG ou SVG à partir d'une URL de profil SmartLink.

### Dépendance

- **qrcode** (v1.5.4) : Bibliothèque de génération QR Code

### Fonctions

#### `generateQRCode()`

Génère un QR Code encodant l'URL du profil public.

**Signature :**
```typescript
interface QRCodeOptions {
  url: string                    // URL du profil (ex: https://smartlink.app/u/jean-kouassi)
  format: 'png' | 'svg'          // Format de sortie
  size?: number                  // Taille en pixels (défaut: 512)
  color?: {
    dark?: string                // Couleur foreground (défaut: #000000)
    light?: string               // Couleur background (défaut: #FFFFFF)
  }
}

async function generateQRCode(options: QRCodeOptions): Promise<string | Buffer>
```

**Retour :**
- `string` (data URL base64) si `format: 'png'`
- `string` (SVG markup) si `format: 'svg'`

**Exemple d'utilisation :**
```typescript
import { generateQRCode } from '@/lib/utils/generate-qr'

// Génération PNG (base64)
const qrPNG = await generateQRCode({
  url: 'https://smartlink.app/u/jean-kouassi',
  format: 'png',
  size: 1024,
})

// Génération SVG (personnalisé Pro)
const qrSVG = await generateQRCode({
  url: 'https://smartlink.app/u/jean-kouassi',
  format: 'svg',
  color: {
    dark: '#1F2937',   // Tailwind gray-800
    light: '#F3F4F6',  // Tailwind gray-100
  },
})
```

**Validation :**
```typescript
import { z } from 'zod'

const QRCodeSchema = z.object({
  url: z.string().url(),
  format: z.enum(['png', 'svg']),
  size: z.number().min(128).max(2048).optional(),
  color: z.object({
    dark: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    light: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  }).optional(),
})
```

**Error Handling :**
```typescript
try {
  const qrCode = await generateQRCode({ url, format: 'png' })
} catch (error) {
  if (error instanceof z.ZodError) {
    // Validation error
    console.error('Invalid QR options:', error.errors)
  } else {
    // QR generation error
    console.error('QR generation failed:', error)
  }
}
```

---

## 2. generate-vcard.ts

### Description

Génère des fichiers vCard (.vcf) conformes au standard vCard 3.0 (RFC 2426) à partir des données de profil SmartLink.

### Dépendance

- **vcards-js** (v2.10.0) : Bibliothèque de génération vCard

### Fonctions

#### `generateVCard()`

Génère un fichier vCard téléchargeable.

**Signature :**
```typescript
interface VCardData {
  fullName: string
  email: string
  phoneNumber: string
  jobTitle?: string
  company?: string
  website?: string
  address?: string
  avatarUrl?: string
}

function generateVCard(data: VCardData): string
```

**Retour :**
- `string` : Contenu vCard formaté (à retourner comme `text/vcard`)

**Exemple d'utilisation :**
```typescript
import { generateVCard } from '@/lib/utils/generate-vcard'

const vcardString = generateVCard({
  fullName: 'Jean Kouassi',
  email: 'jean.kouassi@example.com',
  phoneNumber: '+2250708413484',
  jobTitle: 'Développeur Full-Stack',
  company: 'SmartLink CI',
  website: 'https://smartlink.app/u/jean-kouassi',
})

// Dans une API Route (Next.js)
export async function GET(request: Request) {
  const vcard = generateVCard(profileData)

  return new Response(vcard, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${profileData.fullName}.vcf"`,
    },
  })
}
```

**Format vCard généré (exemple) :**
```
BEGIN:VCARD
VERSION:3.0
FN:Jean Kouassi
N:Kouassi;Jean;;;
EMAIL;TYPE=INTERNET:jean.kouassi@example.com
TEL;TYPE=CELL:+2250708413484
TITLE:Développeur Full-Stack
ORG:SmartLink CI
URL:https://smartlink.app/u/jean-kouassi
ADR;TYPE=WORK:;;Cocody;Abidjan;;225;Côte d'Ivoire
PHOTO;TYPE=JPEG;VALUE=URI:https://supabase.co/storage/avatars/jean.jpg
END:VCARD
```

**Validation :**
```typescript
import { z } from 'zod'

export const VCardSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/), // E.164 format
  jobTitle: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  website: z.string().url().optional(),
  address: z.string().max(200).optional(),
  avatarUrl: z.string().url().optional(),
})
```

**Standards de compatibilité :**
- ✅ iOS Contacts (iPhone, iPad)
- ✅ Android Contacts (Google Contacts)
- ✅ Outlook, Gmail
- ✅ WhatsApp Business

---

## 3. upload.ts

### Description

Gère l'upload de fichiers (CV PDF, avatars) vers Supabase Storage avec validation, redimensionnement d'images et gestion d'erreurs.

### Dépendances

- **@supabase/supabase-js** (v2.48.1) : Client Supabase
- **Zod** (v3.24.1) : Validation runtime

### Fonctions

#### `uploadCV()`

Upload un CV PDF vers Supabase Storage.

**Signature :**
```typescript
interface UploadCVOptions {
  file: File | Buffer
  userId: string
  profileId: string
}

interface UploadCVResult {
  url: string          // URL publique du fichier
  path: string         // Chemin dans le bucket
  size: number         // Taille en bytes
}

async function uploadCV(options: UploadCVOptions): Promise<UploadCVResult>
```

**Validation fichier :**
```typescript
const CVFileSchema = z.object({
  file: z.custom<File>((file) => file instanceof File),
  userId: z.string().cuid(),
  profileId: z.string().cuid(),
}).refine((data) => {
  const file = data.file as File
  return file.type === 'application/pdf'
}, {
  message: 'Le fichier doit être au format PDF',
}).refine((data) => {
  const file = data.file as File
  return file.size <= 5 * 1024 * 1024 // 5MB max
}, {
  message: 'Le fichier ne doit pas dépasser 5MB',
})
```

**Exemple d'utilisation :**
```typescript
'use client'

import { uploadCV } from '@/lib/utils/upload'

async function handleCVUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  if (!file) return

  try {
    const result = await uploadCV({
      file,
      userId: session.user.id,
      profileId: currentProfile.id,
    })

    console.log('CV uploaded:', result.url)

    // Mettre à jour le profil avec la nouvelle URL
    await updateProfile({
      id: currentProfile.id,
      cvFileUrl: result.url,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      toast.error(error.errors[0].message)
    } else {
      toast.error('Erreur lors de l\'upload du CV')
    }
  }
}
```

**Structure Supabase Storage :**
```
smartlink-cvs/
└── {userId}/
    └── {profileId}/
        └── cv-{timestamp}.pdf
```

**Permissions Supabase Storage (RLS Policies) :**
```sql
-- Policy: Users can upload CVs to their own folders
CREATE POLICY "Users upload own CVs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'smartlink-cvs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Public can view CVs (pour pages publiques)
CREATE POLICY "Public can view CVs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'smartlink-cvs');
```

#### `uploadAvatar()`

Upload et redimensionne un avatar utilisateur.

**Signature :**
```typescript
interface UploadAvatarOptions {
  file: File | Buffer
  userId: string
}

async function uploadAvatar(options: UploadAvatarOptions): Promise<UploadCVResult>
```

**Traitement image :**
- Redimensionnement : 512x512px
- Formats acceptés : JPEG, PNG, WebP
- Taille max : 2MB
- Compression : Quality 85%

---

## 4. cn.ts

### Description

Utilitaire pour fusionner les classes CSS (className) avec Tailwind CSS. Basé sur `clsx` + `tailwind-merge`.

**Source :** shadcn/ui (standard)

**Signature :**
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

**Exemple d'utilisation :**
```typescript
import { cn } from '@/lib/utils/cn'

// Merge de classes statiques
<div className={cn('px-4 py-2', 'bg-blue-500', 'hover:bg-blue-600')}>
  Button
</div>

// Merge conditionnel
<button
  className={cn(
    'px-4 py-2 rounded',
    isActive && 'bg-blue-500 text-white',
    isDisabled && 'opacity-50 cursor-not-allowed'
  )}
>
  Submit
</button>

// Merge avec props (composant réutilisable)
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  className?: string
}

function Button({ variant = 'primary', className }: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded',
        variant === 'primary' && 'bg-blue-500',
        variant === 'secondary' && 'bg-gray-500',
        className // Permet override externe
      )}
    >
      Click me
    </button>
  )
}

// Utilisation
<Button variant="primary" className="w-full" />
// Résultat: "px-4 py-2 rounded bg-blue-500 w-full"
```

**Pourquoi `tailwind-merge` ?**

Résout les conflits de classes Tailwind :
```typescript
// Sans tailwind-merge (classes en conflit)
clsx('px-4', 'px-8') // "px-4 px-8" ❌ (ambiguë)

// Avec tailwind-merge
cn('px-4', 'px-8') // "px-8" ✅ (dernière gagne)
```

---

## Testing

### Tests Unitaires (Vitest)

```typescript
// __tests__/utils/generate-qr.test.ts
import { describe, it, expect } from 'vitest'
import { generateQRCode } from '@/lib/utils/generate-qr'

describe('generateQRCode', () => {
  it('should generate PNG QR code', async () => {
    const qr = await generateQRCode({
      url: 'https://smartlink.app/u/test',
      format: 'png',
    })

    expect(typeof qr).toBe('string')
    expect(qr).toMatch(/^data:image\/png;base64,/)
  })

  it('should generate SVG QR code', async () => {
    const qr = await generateQRCode({
      url: 'https://smartlink.app/u/test',
      format: 'svg',
    })

    expect(typeof qr).toBe('string')
    expect(qr).toContain('<svg')
  })

  it('should reject invalid URL', async () => {
    await expect(
      generateQRCode({ url: 'not-a-url', format: 'png' })
    ).rejects.toThrow()
  })
})
```

```typescript
// __tests__/utils/generate-vcard.test.ts
import { describe, it, expect } from 'vitest'
import { generateVCard } from '@/lib/utils/generate-vcard'

describe('generateVCard', () => {
  it('should generate valid vCard format', () => {
    const vcard = generateVCard({
      fullName: 'Jean Kouassi',
      email: 'jean@example.com',
      phoneNumber: '+2250708413484',
    })

    expect(vcard).toContain('BEGIN:VCARD')
    expect(vcard).toContain('VERSION:3.0')
    expect(vcard).toContain('FN:Jean Kouassi')
    expect(vcard).toContain('EMAIL;TYPE=INTERNET:jean@example.com')
    expect(vcard).toContain('TEL;TYPE=CELL:+2250708413484')
    expect(vcard).toContain('END:VCARD')
  })

  it('should include optional fields', () => {
    const vcard = generateVCard({
      fullName: 'Jean Kouassi',
      email: 'jean@example.com',
      phoneNumber: '+2250708413484',
      jobTitle: 'Developer',
      company: 'SmartLink',
    })

    expect(vcard).toContain('TITLE:Developer')
    expect(vcard).toContain('ORG:SmartLink')
  })
})
```

---

## Best Practices

### 1. Validation Stricte

Toujours valider les inputs avec Zod avant traitement :
```typescript
const result = QRCodeSchema.parse(options) // ❌ Throws if invalid
// ou
const result = QRCodeSchema.safeParse(options) // ✅ Returns { success, data, error }
```

### 2. Error Handling

Propager les erreurs avec contexte :
```typescript
try {
  return await generateQRCode(options)
} catch (error) {
  throw new Error(`QR generation failed: ${error.message}`)
}
```

### 3. Type Safety

Typer tous les retours de fonctions :
```typescript
// ❌ Mauvais
async function uploadCV(file: File) {
  // ...
}

// ✅ Bon
async function uploadCV(file: File): Promise<UploadCVResult> {
  // ...
}
```

### 4. Performance

Mettre en cache les QR Codes générés (Redis) :
```typescript
const cacheKey = `qr:${profileSlug}`
const cached = await redis.get(cacheKey)

if (cached) return cached

const qr = await generateQRCode(options)
await redis.set(cacheKey, qr, { ex: 3600 }) // 1 heure
return qr
```

---

## Ressources

### Documentation Officielle

- **qrcode** : https://github.com/soldair/node-qrcode
- **vcards-js** : https://github.com/enesser/vCards-js
- **Supabase Storage** : https://supabase.com/docs/guides/storage
- **vCard RFC 2426** : https://www.rfc-editor.org/rfc/rfc2426

### Standards

- **E.164 Phone Numbers** : https://en.wikipedia.org/wiki/E.164
- **MIME Types** : `text/vcard; charset=utf-8`

---

**Dernière mise à jour :** 24 décembre 2024
**Mainteneurs :** Équipe SmartLink
