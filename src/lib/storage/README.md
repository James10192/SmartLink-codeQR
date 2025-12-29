# storage/ - Système de Storage Supabase

> Documentation des buckets Supabase et fonctions de storage pour SmartLink

---

## Vue d'ensemble

Le dossier `/src/lib/storage/` gère tous les uploads de fichiers vers Supabase Storage. SmartLink utilise 4 buckets principaux pour stocker les fichiers utilisateurs :

- **`covers`** : Photos de couverture de profils (5MB max)
- **`avatars`** : Photos de profil (2MB max)
- **`cvs`** : CV et documents (5MB max)
- **`videos`** : Cartes de visite vidéo (30MB max, Pro+ uniquement)

---

## Structure

```
src/lib/storage/
├── README.md       # Ce fichier
└── supabase.ts     # Fonctions upload/delete pour tous les buckets
```

---

## 1. Bucket `covers` (Photos de Couverture)

### Configuration

- **Nom** : `covers`
- **Public** : ✅ Oui (profils publics doivent afficher les covers)
- **Taille max** : 5 MB
- **Types MIME** : `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- **Path structure** : `{userId}/{profileId}-cover-{timestamp}.{ext}`

### RLS Policies

#### Policy 1: INSERT - Users upload to their own folder
```sql
CREATE POLICY "Users can upload covers to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Ce que ça fait** : Les utilisateurs authentifiés peuvent uniquement uploader dans un dossier nommé avec leur `userId`. Empêche d'uploader dans le dossier d'un autre utilisateur.

#### Policy 2: SELECT - Public read access
```sql
CREATE POLICY "Anyone can view covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'covers');
```

**Ce que ça fait** : Permet l'accès public à toutes les covers (requis pour afficher les profils publics sans authentification).

#### Policy 3: DELETE - Users delete their own covers
```sql
CREATE POLICY "Users can delete their own covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Ce que ça fait** : Les utilisateurs peuvent uniquement supprimer leurs propres covers, pas celles des autres.

### Fonctions (dans `supabase.ts`)

#### `uploadCoverImage(file: File, userId: string, profileId: string)`

Upload une photo de couverture.

**Paramètres :**
- `file` : Fichier image (JPEG, PNG, WebP)
- `userId` : ID de l'utilisateur propriétaire
- `profileId` : ID du profil concerné

**Retour :**
```typescript
{
  url: string,    // URL publique de l'image
  path: string    // Chemin dans le bucket
}
```

**Exemple d'utilisation :**
```typescript
import { uploadCoverImage } from '@/lib/storage/supabase'

const result = await uploadCoverImage(imageFile, user.id, profile.id)
// result.url: https://xxx.supabase.co/storage/v1/object/public/covers/userId/profileId-cover-123456.jpg
```

#### `deleteCoverImage(filePath: string)`

Supprime une photo de couverture.

**Paramètres :**
- `filePath` : Chemin du fichier dans le bucket (ex: `userId/profileId-cover-123456.jpg`)

**Exemple :**
```typescript
import { deleteCoverImage } from '@/lib/storage/supabase'

await deleteCoverImage('userId/profileId-cover-123456.jpg')
```

#### `getCoverImagePathFromUrl(url: string)`

Extrait le chemin du fichier depuis une URL Supabase.

**Paramètres :**
- `url` : URL complète Supabase

**Retour :** `string | null` - Chemin du fichier ou null si invalide

**Exemple :**
```typescript
import { getCoverImagePathFromUrl } from '@/lib/storage/supabase'

const path = getCoverImagePathFromUrl(
  'https://xxx.supabase.co/storage/v1/object/public/covers/userId/file.jpg'
)
// path: 'userId/file.jpg'
```

---

## 2. Bucket `avatars` (Photos de Profil)

### Configuration

- **Nom** : `avatars`
- **Public** : ✅ Oui
- **Taille max** : 2 MB
- **Types MIME** : `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- **Path structure** : `{userId}/{profileId}-avatar-{timestamp}.{ext}`
- **Image processing** : Redimensionné à 512x512px, qualité 85%

### RLS Policies

Identiques au bucket `covers` (INSERT authenticated, SELECT public, DELETE authenticated).

### Fonctions

- `uploadAvatar(file, userId, profileId)` - Upload + resize automatique
- `deleteAvatar(filePath)` - Suppression
- `getAvatarPathFromUrl(url)` - Extraction du path

---

## 3. Bucket `cvs` (CV et Documents)

### Configuration

- **Nom** : `cvs`
- **Public** : ✅ Oui
- **Taille max** : 5 MB
- **Types MIME** : `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Path structure** : `{userId}/{profileId}-cv-{timestamp}.pdf`

### RLS Policies

Identiques aux autres buckets.

### Fonctions

- `uploadCV(file, userId, profileId)` - Upload de CV (PDF/DOCX)
- `deleteCV(filePath)` - Suppression

**Exemple :**
```typescript
import { uploadCV } from '@/lib/storage/supabase'

const result = await uploadCV(pdfFile, user.id, profile.id)
// result.url: https://xxx.supabase.co/storage/v1/object/public/cvs/userId/profileId-cv-123456.pdf
```

---

## 4. Bucket `videos` (Cartes de Visite Vidéo)

### Configuration

- **Nom** : `videos`
- **Public** : ✅ Oui
- **Taille max** : 30 MB
- **Types MIME** : `video/mp4`, `video/webm`, `video/quicktime`
- **Path structure** : `{userId}/{profileId}-video-{timestamp}.{ext}`
- **Limitation** : **Pro+ uniquement** (vérifié côté backend)

### RLS Policies

Identiques aux autres buckets.

### Fonctions

- `uploadVideo(file, userId, profileId)` - Upload vidéo (vérifie tier Pro+)
- `deleteVideo(filePath)` - Suppression

**Note :** La fonction `uploadVideo` vérifie automatiquement que l'utilisateur a un tier Pro ou supérieur avant d'autoriser l'upload.

---

## Helpers Globaux

### `supabaseAdmin` Client

Client Supabase avec service_role_key pour bypasser les RLS côté serveur.

```typescript
import { supabaseAdmin } from '@/lib/storage/supabase'

const { data, error } = await supabaseAdmin.storage
  .from('covers')
  .upload('path/file.jpg', file)
```

⚠️ **Important** : Utiliser uniquement côté serveur (API routes, Server Actions). Jamais côté client.

### Storage URL Patterns

**Format public URL :**
```
https://{project-ref}.supabase.co/storage/v1/object/public/{bucket}/{path}
```

**Exemple :**
```
https://izxxoqabpvjytmhpvqzi.supabase.co/storage/v1/object/public/covers/user-id/profile-id-cover-123456.jpg
```

---

## Constantes

Définies dans `supabase.ts` :

```typescript
export const AVATAR_BUCKET_NAME = 'avatars'
export const CV_BUCKET_NAME = 'cvs'
export const VIDEO_BUCKET_NAME = 'videos'
export const COVER_BUCKET_NAME = 'covers'

export const MAX_AVATAR_SIZE = 2 * 1024 * 1024  // 2MB
export const MAX_CV_SIZE = 5 * 1024 * 1024      // 5MB
export const MAX_VIDEO_SIZE = 30 * 1024 * 1024  // 30MB
export const MAX_COVER_SIZE = 5 * 1024 * 1024   // 5MB
```

---

## Création Manuelle du Bucket (Si Nécessaire)

Si le bucket `covers` n'existe pas encore dans votre projet Supabase :

1. **Aller dans Supabase Dashboard** → Votre Projet → **Storage**
2. **Cliquer "New bucket"**
3. **Configurer** :
   - Nom : `covers`
   - Public bucket : ✅ Oui
   - File size limit : `5 MB`
   - Allowed MIME types : `image/jpeg, image/jpg, image/png, image/webp`
4. **Créer le bucket**

Les RLS policies ont déjà été appliquées automatiquement via migration.

---

## Vérification

Pour vérifier que tout fonctionne :

### Test Upload (authenticated user)
```typescript
const { url } = await uploadCoverImage(file, userId, profileId)
console.log('Cover uploaded:', url)
```

### Test Public Access
Visiter l'URL retournée dans un navigateur en mode navigation privée → L'image doit s'afficher.

### Test Delete (owner only)
```typescript
await deleteCoverImage(filePath)
```

Tenter de supprimer le cover d'un autre utilisateur → Doit échouer avec erreur RLS.

---

## Troubleshooting

### Erreur: "new row violates row-level security policy"
**Cause** : Les RLS policies ne sont pas configurées correctement.
**Solution** : Vérifier que les 3 policies (INSERT, SELECT, DELETE) existent dans le dashboard Supabase.

### Erreur: "413 Payload Too Large"
**Cause** : Fichier dépasse 5MB.
**Solution** : Valider la taille côté client avant upload.

### Erreur: "Bucket not found"
**Cause** : Le bucket `covers` n'a pas été créé.
**Solution** : Créer manuellement le bucket dans le dashboard (voir section ci-dessus).

### Cover images ne chargent pas sur profils publics
**Cause** : Bucket n'est pas public ou policy SELECT manquante.
**Solution** :
1. Vérifier que "Public bucket" est activé
2. Vérifier la policy SELECT (doit permettre `TO public`)

---

## Sécurité

### RGPD/GDPR Compliance
- Photos uploadées avec consentement utilisateur (action volontaire)
- Utilisateurs peuvent supprimer leurs photos à tout moment
- Aucune métadata sensible collectée

### Storage Costs (Supabase Free Tier)
- **Storage** : 1 GB gratuit
- **Bandwidth** : 2 GB/mois gratuit
- **Upgrade to Pro** : $25/mois pour 100 GB storage + 200 GB bandwidth

### Best Practices
1. **Validation client-side** : Vérifier type + taille avant upload
2. **Nettoyage** : Supprimer l'ancienne cover avant d'uploader une nouvelle
3. **Monitoring** : Vérifier Supabase Dashboard → Settings → Usage régulièrement

---

**Dernière mise à jour** : 29 décembre 2025
**Fichiers liés** :
- `src/lib/storage/supabase.ts` (fonctions upload/delete)
- `src/components/profile/editable-cover.tsx` (UI component)
- `src/app/api/upload/cover/route.ts` (API endpoint)
