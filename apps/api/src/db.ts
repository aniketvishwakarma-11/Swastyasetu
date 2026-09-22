import { PrismaClient } from '@prisma/client';

// Ensure PostgreSQL connection pool parameters for Supabase PgBouncer resilience
if (process.env.DATABASE_URL) {
  if (!process.env.DATABASE_URL.includes('connection_limit')) {
    process.env.DATABASE_URL += (process.env.DATABASE_URL.includes('?') ? '&' : '?') + 'connection_limit=20';
  }
  if (!process.env.DATABASE_URL.includes('pool_timeout')) {
    process.env.DATABASE_URL += '&pool_timeout=30';
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

