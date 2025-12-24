# Configuration Supabase pour SmartLink

Ce guide explique comment configurer Supabase Storage pour SmartLink.

## Prérequis

- Un compte Supabase ([supabase.com](https://supabase.com))
- Un projet Supabase créé

## 1. Configuration des Variables d'Environnement

Créez un fichier `.env.local` à la racine du projet avec les variables suivantes:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Database (Prisma)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# Better-Auth
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Obtenir les clés Supabase

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **API**
4. Copiez:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Pour `DATABASE_URL`:
   - Allez dans **Settings** → **Database**
   - Section **Connection string** → **URI**
   - Copiez et remplacez `[YOUR-PASSWORD]` par votre mot de passe

## 2. Créer les Storage Buckets

### Bucket pour les CV (`cvs`)

1. Dans le dashboard Supabase, allez sur **Storage**
2. Cliquez sur **New bucket**
3. Configurez:
   - **Name**: `cvs`
   - **Public bucket**: ✅ (coché)
   - **File size limit**: 5 MB
   - **Allowed MIME types**: `application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### Bucket pour les Avatars (`avatars`)

1. Dans le dashboard Supabase, allez sur **Storage**
2. Cliquez sur **New bucket**
3. Configurez:
   - **Name**: `avatars`
   - **Public bucket**: ✅ (coché)
   - **File size limit**: 2 MB
   - **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/webp`

## 3. Configuration des Policies de Sécurité (RLS)

### Policies pour `cvs`

**Policy 1: Allow public read access**
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cvs');
```

**Policy 2: Allow authenticated users to upload**
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cvs');
```

**Policy 3: Allow users to delete their own files**
```sql
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### Policies pour `avatars`

**Policy 1: Allow public read access**
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

**Policy 2: Allow authenticated users to upload**
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');
```

**Policy 3: Allow users to delete their own files**
```sql
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
```

## 4. Initialiser la Base de Données (Prisma)

```bash
# Générer le client Prisma
pnpm prisma generate

# Créer les tables
pnpm prisma migrate dev --name init

# (Optionnel) Seed la base de données
pnpm prisma db seed
```

## 5. Tester la Configuration

1. **Démarrer le serveur de développement**:
   ```bash
   pnpm dev
   ```

2. **Tester l'upload de CV**:
   - Créez un compte
   - Créez un profil
   - Allez sur "Modifier le profil"
   - Uploadez un CV (PDF, max 5MB)
   - Vérifiez que le fichier apparaît dans Supabase Storage → `cvs`

3. **Tester l'upload d'avatar**:
   - Sur la même page d'édition
   - Uploadez une image (JPG/PNG/WebP, max 2MB)
   - Vérifiez que le fichier apparaît dans Supabase Storage → `avatars`

## 6. Vérifications Finales

- [ ] Les deux buckets `cvs` et `avatars` sont créés
- [ ] Les policies RLS sont configurées pour chaque bucket
- [ ] Les variables d'environnement sont configurées
- [ ] Prisma est initialisé et les migrations sont appliquées
- [ ] L'upload de CV fonctionne
- [ ] L'upload d'avatar fonctionne
- [ ] Les fichiers sont accessibles publiquement via leur URL

## Troubleshooting

### Erreur: "new row violates row-level security policy"

**Solution**: Vérifiez que les policies RLS sont bien configurées pour les buckets.

### Erreur: "Invalid file type"

**Solution**: Vérifiez que les MIME types autorisés dans le code (`src/lib/storage/supabase.ts`) correspondent à ceux du bucket.

### Les fichiers ne s'affichent pas

**Solution**: Vérifiez que les buckets sont bien configurés en **Public** (case cochée lors de la création).

### Erreur: "File size exceeds maximum"

**Solution**:
- Pour CV: Réduisez la taille du PDF (max 5MB)
- Pour Avatar: Réduisez la résolution de l'image (max 2MB)

## Notes de Production

### Pour déployer sur Vercel

1. Ajoutez les variables d'environnement dans **Vercel Dashboard** → **Settings** → **Environment Variables**
2. Mettez à jour `NEXT_PUBLIC_APP_URL` et `BETTER_AUTH_URL` avec votre domaine de production
3. Redéployez l'application

### Sécurité

- ⚠️ Ne commitez JAMAIS le fichier `.env.local`
- ⚠️ Gardez vos clés API secrètes
- ✅ Utilisez des clés différentes pour développement et production
- ✅ Configurez les policies RLS pour limiter l'accès selon vos besoins

## Ressources

- [Documentation Supabase Storage](https://supabase.com/docs/guides/storage)
- [Documentation Prisma](https://www.prisma.io/docs)
- [Documentation Better-Auth](https://www.better-auth.com)
