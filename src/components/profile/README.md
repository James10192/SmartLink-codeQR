# Profile Components

> Composants React pour les profils publics et privés de SmartLink

---

## Vue d'ensemble

Ce dossier contient les composants UI spécifiques aux profils utilisateur :
- **Affichage public** : Profils accessibles via `/u/[slug]`
- **Tracking visiteurs** : Comptage vues uniques + capture contacts
- **Modals** : Capture d'informations visiteurs

---

## Composants

### 1. `ViewTracker`

**Fichier** : `view-tracker.tsx`
**Type** : Client Component
**Usage** : Tracking automatique des vues uniques de profil

#### Description

Composant invisible qui s'exécute au montage de la page publique pour tracker les vues uniques sans compter plusieurs fois le même visiteur.

#### Props

```typescript
interface ViewTrackerProps {
  profileId: string  // ID du profil à tracker
}
```

#### Exemple

```tsx
// src/app/(public)/u/[slug]/page.tsx
import { ViewTracker } from '@/components/profile/view-tracker'

export default async function PublicProfilePage({ params }) {
  const profile = await getPublicProfile(params.slug)

  return (
    <div>
      {/* Auto-tracking des vues */}
      <ViewTracker profileId={profile.id} />

      {/* Contenu du profil */}
      <h1>{profile.fullName}</h1>
    </div>
  )
}
```

#### Fonctionnement

1. Se déclenche une seule fois au montage (`useEffect` avec `useRef`)
2. Appelle `POST /api/profile/track-view` avec le `profileId`
3. L'API vérifie :
   - Cookie `viewed_{profileId}` (24h)
   - IP hash en base de données (24h)
4. Si nouvelle vue → Crée `ProfileVisitor` record + cookie
5. Si vue existante → Ne compte pas

#### Respect Vie Privée

- ✅ **IP hashée** (SHA-256 + salt, pas d'IP brute stockée)
- ✅ **Cookie HTTP-only** (pas accessible via JS malveillant)
- ✅ **Expiration 24h** (durée limitée)
- ✅ **Données minimales** (aucune donnée personnelle par défaut)

---

### 2. `VisitorCaptureModal`

**Fichier** : `visitor-capture-modal.tsx`
**Type** : Client Component
**Usage** : Capture optionnelle des informations de contact des visiteurs

#### Description

Modal qui apparaît après 1 seconde de visite pour capturer le nom et contact (optionnel) du visiteur. Permet au propriétaire du profil de recontacter les personnes intéressées.

#### Props

```typescript
interface VisitorCaptureModalProps {
  profileId: string         // ID du profil visité
  profileOwnerName: string  // Nom affiché dans le modal
}
```

#### Exemple

```tsx
import { VisitorCaptureModal } from '@/components/profile/visitor-capture-modal'

<VisitorCaptureModal
  profileId={profile.id}
  profileOwnerName={profile.fullName}
/>
```

#### Comportement

1. **Vérification localStorage** :
   - Clé : `visitor-captured-${profileId}`
   - Si existe → Ne pas afficher le modal

2. **Affichage** :
   - Délai : 1 seconde après montage
   - Champs :
     - Nom (requis)
     - Email ou Téléphone (optionnel)

3. **Actions** :
   - **Passer** → Marque comme capturé dans `localStorage` (ne redemande plus)
   - **Enregistrer** → Envoie à `/api/profile/capture-visitor` puis marque capturé
   - **Fermer (X)** → Appelle automatiquement "Passer" via `onOpenChange`

4. **Corrections v1.1** :
   - ✅ Suppression du double bouton de fermeture (X redondant dans DialogTitle)
   - ✅ Gestion correcte de `onOpenChange` pour appeler `handleSkip`

#### API Associée

```typescript
// POST /api/profile/capture-visitor
{
  profileId: string
  visitorName: string
  visitorContact?: string
}
```

**Logique serveur** :
- Vérifie si `ipHash` existe dans les 24h
- Si oui → Update `visitorName` et `visitorContact` du record existant
- Si non → Crée nouveau `ProfileVisitor` avec toutes les infos

---

## Système de Tracking Hybride

### Architecture Cookie + IP Hash

```
┌─────────────────────────────────────┐
│  Visiteur charge /u/jean-kouassi    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  ViewTracker → POST /track-view     │
└──────────────┬──────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
┌──────────┐       ┌─────────────┐
│ Cookie ? │       │ IP Hash DB ?│
│ (24h)    │       │ (24h)       │
└────┬─────┘       └──────┬──────┘
     │                    │
     │ Non                │ Non
     ▼                    ▼
┌────────────────────────────────┐
│  Créer ProfileVisitor Record   │
│  + Set Cookie 24h              │
└────────────────────────────────┘
```

### Avantages

| Feature | Bénéfice |
|---------|----------|
| **Cookie HTTP-Only** | Résiste aux refresh, pas accessible via JavaScript |
| **IP Hash + User Agent** | Identifie même appareil sans stocker IP brute |
| **Expiration 24h** | Balance entre précision et respect de la vie privée |
| **Double vérification** | Cookie (client) + DB (serveur) = fiabilité maximale |

---

## Base de Données

### Modèle `ProfileVisitor`

```prisma
model ProfileVisitor {
  id              String    @id @default(cuid())
  profileId       String
  profile         Profile   @relation(fields: [profileId], references: [id], onDelete: Cascade)

  // Tracking anonyme
  ipHash          String
  userAgentHash   String
  referrer        String?

  // Géolocalisation (via GeoIP)
  city            String?
  country         String?
  countryCode     String?
  region          String?

  // Capture contact (optionnel via modal)
  visitorName     String?
  visitorContact  String?

  visitedAt       DateTime  @default(now())
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([profileId, ipHash, visitedAt])
  @@index([profileId, visitedAt])
}
```

### Queries Analytics

#### Nombre total de vues

```typescript
const totalViews = await prisma.profileVisitor.count({
  where: { profileId: 'xxx' }
})
```

#### Vues par période

```typescript
const viewsLast30Days = await prisma.profileVisitor.count({
  where: {
    profileId: 'xxx',
    visitedAt: {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }
  }
})
```

#### Visiteurs avec contact capturé

```typescript
const capturedVisitors = await prisma.profileVisitor.findMany({
  where: {
    profileId: 'xxx',
    visitorName: { not: null }
  },
  orderBy: { visitedAt: 'desc' }
})
```

---

## API Routes Associées

### 1. `POST /api/profile/track-view`

**Fichier** : `src/app/api/profile/capture-visitor/route.ts`

**Body** :
```json
{
  "profileId": "cm5abcdef123"
}
```

**Réponse Success (nouvelle vue)** :
```json
{
  "success": true,
  "counted": true,
  "message": "Vue comptée"
}
```

**Réponse Success (vue existante)** :
```json
{
  "success": true,
  "counted": false,
  "message": "Vue déjà comptée (cookie)"
}
```

### 2. `POST /api/profile/capture-visitor`

**Fichier** : `src/app/api/profile/capture-visitor/route.ts`

**Body** :
```json
{
  "profileId": "cm5abcdef123",
  "visitorName": "Jean Kouassi",
  "visitorContact": "+225 07 08 41 34 84"
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Informations enregistrées"
}
```

---

## Changelog

### Version 1.1.0 (27 décembre 2024)

**Ajouté** :
- ✅ Composant `ViewTracker` pour auto-tracking des vues
- ✅ API `/api/profile/track-view` avec système cookie + IP hash
- ✅ Cookie HTTP-only sécurisé (24h expiration)
- ✅ Documentation complète (ce README)

**Corrigé** :
- ✅ `VisitorCaptureModal` : Suppression du double bouton X (redondant)
- ✅ `VisitorCaptureModal` : Gestion correcte de `onOpenChange` pour appeler `handleSkip`
- ✅ Import inutilisé : Suppression de `X` de lucide-react

**Modifié** :
- 🔄 `VisitorCaptureModal` : Utilise maintenant le `onOpenChange` du Dialog pour gérer la fermeture

---

## Tests

### Test Manuel : Vérifier le tracking

1. Ouvrir un profil public : `http://localhost:3000/u/jean-kouassi`
2. Ouvrir DevTools → Network → Filter `track-view`
3. Vérifier la requête POST avec `{ "counted": true }`
4. Rafraîchir la page
5. Vérifier la requête POST avec `{ "counted": false }` (cookie détecté)

### Test Manuel : Modal de capture

1. Ouvrir un profil public en navigation privée
2. Attendre 1 seconde → Modal apparaît
3. Cliquer sur le X (coin supérieur droit du Dialog)
4. Rafraîchir → Modal ne réapparaît plus (`localStorage` marqué)

---

**Dernière mise à jour** : 27 décembre 2024
**Mainteneurs** : Équipe SmartLink
