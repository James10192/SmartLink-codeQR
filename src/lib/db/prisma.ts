// Prisma Client Singleton (Prisma 6)
// Prevents multiple instances in development (hot reload)

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// Auto-reconnect on connection errors
prisma.$connect().catch((err) => {
  console.error('Prisma connection error:', err)
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
