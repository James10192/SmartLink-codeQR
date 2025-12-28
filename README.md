# SmartLink

> Plateforme SaaS de profils professionnels numériques avec QR Codes dynamiques

**Votre contact enregistré en 1 scan, votre CV accessible partout.**

---

## 🚀 Quick Start

```bash
# 1. Cloner le projet
git clone <repo-url> smartlink
cd smartlink

# 2. Installer les dépendances
bun install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés (Supabase, Better-Auth, etc.)

# 4. Setup base de données
bunx prisma generate
bunx prisma db push

# 5. Lancer le serveur de développement
bun run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## 📚 Stack Technique

| Catégorie | Technologie | Version |
|-----------|-------------|---------|
| **Framework** | Next.js | 16.1.1 |
| **Runtime** | Bun | 1.3.5 |
| **Language** | TypeScript | 5.9.3 |
| **Database** | Supabase PostgreSQL + Prisma | 6.2.0 |
| **Auth** | Better-Auth | 1.2.0 |
| **UI** | Base UI + shadcn/ui (basecn.dev) | Latest |
| **Styling** | Tailwind CSS | 4.1.18 |
| **Server Actions** | next-safe-action | Latest |
| **Analytics** | PostHog | Latest |
| **Tests** | Vitest + Playwright | Latest |
| **Paiements** | CinetPay + Lemon Squeezy | - |

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| **[CLAUDE.md](./CLAUDE.md)** | Guide complet de développement (11+ sections, ~1450 lignes) |
| **[docs/BEST_PRACTICES.md](./docs/BEST_PRACTICES.md)** | Best practices 2025 pour chaque technologie |
| **[docs/TURBOPACK_PRISMA_ISSUE.md](./docs/TURBOPACK_PRISMA_ISSUE.md)** | Issue connue Turbopack + Prisma (Webpack workaround) |
| **[.env.example](./.env.example)** | Template variables d'environnement |

### Documentation Modulaire

- `/prisma/README.md` - Schéma DB, migrations, multi-profils logic
- `/src/lib/README.md` - Architecture générale
- `/src/lib/auth/README.md` - Better-Auth configuration
- `/src/lib/utils/README.md` - Utilitaires (QR, vCard, upload)
- `/src/components/ui/README.md` - Base UI components guide
- `/src/app/api/README.md` - Endpoints documentation

---

## 🛠️ Commandes

```bash
# Développement
bun run dev          # Serveur de développement (Webpack)
bun run dev:turbo    # Serveur avec Turbopack (⚠️ bug Prisma)
bun run build        # Build production
bun run start        # Serveur production
bun run lint         # Linter ESLint
bun run type-check   # Vérification TypeScript

# Base de données (Prisma)
bunx prisma generate # Générer Prisma Client
bunx prisma db push  # Push schema (dev)
bunx prisma migrate dev # Créer migration
bunx prisma studio   # GUI base de données

# Tests
bun run test         # Tests Vitest
bun run test:e2e     # Tests Playwright

# UI Components
bunx shadcn@latest add <component> # Ajouter composant Base UI
```

---

## 🌍 Variables d'Environnement

Créer un fichier `.env.local` à la racine :

```bash
# Database
DATABASE_URL="postgresql://..."

# Better-Auth
BETTER_AUTH_SECRET="<générer avec: bunx better-auth secret>"
BETTER_AUTH_URL="http://localhost:3000"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"

# PostHog (optionnel pour MVP)
NEXT_PUBLIC_POSTHOG_KEY="<posthog-api-key>"
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
```

Voir [.env.example](./.env.example) pour la liste complète.

---

## 📋 Git Workflow

### Conventional Commits (OBLIGATOIRE)

```bash
# Format
<type>(scope): <description>

# Types autorisés
feat, fix, refactor, perf, style, test, docs, chore, ci

# Exemples
feat(profile): add QR code generation
fix(api): correct vCard phone format
docs: update README with setup instructions
```

### Signature Commits

!!Très important Tous les commits ne doivent pas inclure :

```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## 🏗️ Structure du Projet

```
smartlink/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (auth)/          # Routes auth (login, signup)
│   │   ├── (dashboard)/     # Routes protégées
│   │   ├── u/[slug]/        # Profils publics
│   │   ├── api/             # API Routes
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/              # Base UI components
│   │   ├── profile/
│   │   └── dashboard/
│   ├── lib/
│   │   ├── actions/         # Server Actions (next-safe-action)
│   │   ├── auth/            # Better-Auth config
│   │   ├── db/              # Prisma client
│   │   ├── utils/           # Utilitaires (QR, vCard, etc.)
│   │   └── validations/     # Schémas Zod
│   └── middleware.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docs/
│   └── BEST_PRACTICES.md
├── tests/
│   ├── unit/                # Vitest
│   └── e2e/                 # Playwright
├── CLAUDE.md
├── .env.example
└── package.json
```

---

## 🎯 Roadmap

### Version 0.1.0 (✅ Actuelle)
- ✅ Initialisation Next.js 16 + Bun
- ✅ Configuration TypeScript strict
- ✅ Setup Tailwind CSS 4
- ✅ Documentation complète

### Version 0.2.0 (🚧 En cours)
- Setup Prisma + Supabase
- Configuration Better-Auth
- Installation Base UI components
- Dashboard pages (CRUD profils)
- PostHog integration

### Version 0.3.0 (Prévu)
- Génération QR Codes
- vCard download (.vcf)
- Upload CV (Supabase Storage)
- Page profil public (/u/[slug])

### Version 1.0.0 (MVP)
- Landing page SEO
- Système de paiements (CinetPay + Lemon Squeezy)
- Tests E2E complets
- Déploiement Vercel production

---

## 👥 Contributeurs

- **Équipe SmartLink** - Développement & Design

---

## 📄 License

Propriétaire (Private) - © 2024 SmartLink

---

## 📞 Support

- **Documentation** : Voir [CLAUDE.md](./CLAUDE.md)
- **Issues** : <repo-issues-url>
- **Email** : support@smartlink.ci

---

**Dernière mise à jour :** 24 décembre 2024
