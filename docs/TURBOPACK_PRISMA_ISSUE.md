# Turbopack + Prisma Client - Known Issue

**Date:** 26 décembre 2024
**Status:** ⚠️ **WORKAROUND APPLIED** - Using Webpack instead of Turbopack
**Next.js Version:** 16.1.1
**Prisma Version:** 6.19.1

---

## Problem Description

When using **Next.js 16 with Turbopack** (default dev bundler) and **Prisma Client**, the application crashes with a module resolution error:

```
Error: Failed to load external module @prisma/client-2c3a283f134fdcb6:
ResolveMessage: Cannot find module '@prisma/client-2c3a283f134fdcb6'
from '/home/levraimd/workspace/smartlink/.next/dev/server/chunks/ssr/[root-of-the-server]__7e27cd18._.js'
```

### Root Cause

Turbopack has a **module resolution bug** with packages that use complex re-exports. Specifically:

1. `@prisma/client/index.d.ts` contains: `export * from '.prisma/client/default'`
2. Turbopack creates a symlinked module with a hash: `.next/dev/node_modules/@prisma/client-2c3a283f134fdcb6`
3. When resolving the relative path `.prisma/client/default` from the symlink, Turbopack fails to find the actual generated client

### Attempted Fixes (Did NOT Work)

❌ **Adding `serverExternalPackages`:**
```typescript
// next.config.ts
export default {
  serverExternalPackages: ['@prisma/client', 'prisma'],
}
```
*Result:* No effect with Turbopack

❌ **Removing Prisma generator output path:**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  // Removed: output = "../node_modules/.prisma/client"
}
```
*Result:* Still fails

❌ **Importing from `.prisma/client` directly:**
```typescript
import { PrismaClient } from '.prisma/client'
```
*Result:* Different error - runtime library not found

❌ **Complete cache cleanup:**
```bash
rm -rf .next node_modules/.prisma node_modules/@prisma
bun install
bunx prisma generate
```
*Result:* Same error persists

---

## ✅ Working Solution

**Use Webpack instead of Turbopack** for development:

```bash
bun run dev  # Now uses --webpack flag
```

### Configuration Changes

**package.json:**
```json
{
  "scripts": {
    "dev": "next dev --webpack",
    "dev:turbo": "next dev --turbo",
  }
}
```

**next.config.ts:**
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 85],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  serverExternalPackages: ['@prisma/client', 'prisma'],
}

export default nextConfig
```

---

## Production Build

✅ **Production builds work fine** with both bundlers:

```bash
bun run build  # Uses Webpack by default in Next.js 16
```

Turbopack for production is opt-in in Next.js 16:
```bash
next build --turbo  # Not recommended with Prisma
```

---

## When Can We Switch Back to Turbopack?

Monitor these GitHub issues for fixes:

- **[Next.js #67195](https://github.com/vercel/next.js/issues/67195)** - Re-exports not processed correctly with Turbopack
- **[Next.js #87737](https://github.com/vercel/next.js/issues/87737)** - External module hash mismatch
- **[Prisma #26961](https://github.com/prisma/prisma/issues/26961)** - Prisma Optimize + Turbopack

### Temporary Testing

To test if the issue is fixed in future Next.js versions:

```bash
bun run dev:turbo
```

If the profile page (`/u/[slug]`) loads without Prisma errors, the bug is fixed.

---

## Performance Impact

**Webpack vs Turbopack (Development):**

| Metric | Webpack | Turbopack |
|--------|---------|-----------|
| Initial compilation | ~13s | ~5s |
| Hot reload | ~1-2s | ~100ms |
| Stability | ✅ Stable | ⚠️ Has bugs |

**Note:** Webpack is slower but **100% stable** with Prisma. For a production SaaS app, stability > speed in development.

---

## Related Documentation

- [Prisma v7 Migration + Turbopack Fix Guide](https://www.buildwithmatija.com/blog/migrate-prisma-v7-nextjs-16-turbopack-fix)
- [Next.js serverExternalPackages Docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages)
- [Next.js 16 Bundler Options](https://nextjs.org/docs/app/api-reference/cli/next-dev)

---

## Summary

**Current state:** SmartLink uses **Webpack for development** (`bun run dev`) as a stable workaround for the Turbopack + Prisma module resolution bug.

**Future plan:** Switch back to Turbopack when Next.js team fixes the re-export module resolution issue (track issues above).

**Impact:** Slightly slower dev server startup (~8s extra), but **zero runtime errors** and full Prisma functionality.
