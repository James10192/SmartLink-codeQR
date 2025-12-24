# Configuration Better-Auth

Better-Auth est déjà configuré et prêt à l'emploi. Ce document explique la configuration existante.

## Configuration Actuelle

### Email/Password Authentication ✅

- Activé par défaut
- Pas de vérification email (à activer en production)
- Sessions valables 7 jours

### Google OAuth ✅

- Configuré mais optionnel
- Activé automatiquement si `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont définis

### Database ✅

- Utilise Prisma avec PostgreSQL (Supabase)
- Tables créées automatiquement via Prisma migrations

## Variables d'Environnement Requises

```bash
# OBLIGATOIRE
BETTER_AUTH_SECRET="your-secret-key"  # Générer avec: openssl rand -base64 32
BETTER_AUTH_URL="http://localhost:3000"

# OPTIONNEL (pour Google OAuth)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Utilisation dans le Code

### Server Components / API Routes

```typescript
import { getSession, getUser, requireAuth } from '@/lib/auth/session'

// Récupérer la session (nullable)
const session = await getSession()

// Récupérer l'utilisateur (nullable)
const user = await getUser()

// Forcer l'authentification (throw si non connecté)
const session = await requireAuth()
const user = await requireUser()
```

### Client Components

```typescript
import { signIn, signOut, signUp } from '@/lib/auth/client'

// Inscription
await signUp.email({
  email: 'user@example.com',
  password: 'password123',
  name: 'User Name',
})

// Connexion
await signIn.email({
  email: 'user@example.com',
  password: 'password123',
})

// Déconnexion
await signOut()
```

## Routes Auth Disponibles

Better-Auth génère automatiquement ces routes:

- `POST /api/auth/sign-in/email` - Connexion email/password
- `POST /api/auth/sign-up/email` - Inscription email/password
- `POST /api/auth/sign-out` - Déconnexion
- `GET /api/auth/session` - Récupérer la session
- `GET /api/auth/sign-in/google` - OAuth Google (si configuré)

## Protection des Routes

Le middleware (`src/middleware.ts`) protège automatiquement:

- `/dashboard` et sous-routes
- `/profile` et sous-routes

Les routes publiques:
- `/` (landing page)
- `/login`
- `/signup`
- `/u/[slug]` (profils publics)
- `/api/qr/[slug]`
- `/api/vcard/[slug]`
- `/api/cv/[slug]`

## Production Checklist

### Avant de déployer:

- [ ] Générer un `BETTER_AUTH_SECRET` sécurisé
- [ ] Configurer `BETTER_AUTH_URL` avec votre domaine de production
- [ ] Activer `requireEmailVerification: true` dans `src/lib/auth/config.ts`
- [ ] Configurer un service d'envoi d'email (Resend, SendGrid, etc.)
- [ ] Tester login/signup/logout en production

### Pour activer la vérification email (Production):

1. Choisir un provider email (Resend recommandé)
2. Installer le package:
   ```bash
   pnpm add better-auth-resend resend
   ```
3. Mettre à jour `src/lib/auth/config.ts`:
   ```typescript
   import { Resend } from 'resend'

   export const auth = betterAuth({
     // ... existing config
     emailAndPassword: {
       enabled: true,
       requireEmailVerification: true,
     },
     emailVerification: {
       sendVerificationEmail: async ({ user, verificationToken }) => {
         const resend = new Resend(process.env.RESEND_API_KEY)
         await resend.emails.send({
           from: 'SmartLink <noreply@smartlink.ci>',
           to: user.email,
           subject: 'Vérifiez votre email',
           html: `<p>Cliquez <a href="${process.env.BETTER_AUTH_URL}/verify-email?token=${verificationToken}">ici</a> pour vérifier votre email.</p>`,
         })
       },
     },
   })
   ```

## Troubleshooting

### Erreur: "Unauthorized: Session required"

**Cause**: Utilisateur non connecté tentant d'accéder à une route protégée.

**Solution**: Le middleware devrait rediriger automatiquement vers `/login`. Vérifiez `src/middleware.ts`.

### Sessions qui expirent trop rapidement

**Solution**: Augmenter `expiresIn` dans `src/lib/auth/config.ts`:
```typescript
session: {
  expiresIn: 60 * 60 * 24 * 30, // 30 jours au lieu de 7
}
```

### Google OAuth ne fonctionne pas

**Vérifications**:
1. `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont définis
2. Redirect URI configurée dans Google Console: `https://yourapp.com/api/auth/callback/google`
3. Domaines autorisés dans Google Console

## Ressources

- [Documentation Better-Auth](https://www.better-auth.com/docs)
- [Better-Auth avec Prisma](https://www.better-auth.com/docs/adapters/prisma)
- [Email Providers](https://www.better-auth.com/docs/concepts/email)
