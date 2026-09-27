import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  rawPrisma: PrismaClient | undefined;
};

// Prioritize DIRECT_URL (port 5432) or fallback to DATABASE_URL to avoid PgBouncer transaction idle drops on Windows
let connectionUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (connectionUrl) {
  if (!connectionUrl.includes('connection_limit')) {
    connectionUrl += (connectionUrl.includes('?') ? '&' : '?') + 'connection_limit=10';
  }
  if (!connectionUrl.includes('pool_timeout')) {
    connectionUrl += '&pool_timeout=30';
  }
}

const rawPrisma =
  globalForPrisma.rawPrisma ??
  new PrismaClient({
    datasources: connectionUrl ? { db: { url: connectionUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.rawPrisma = rawPrisma;
}

// Resilient query wrapper that auto-reconnects and retries on P1017 / 10054 ConnectionReset
export const prisma: PrismaClient = (globalForPrisma.prisma ??
  (rawPrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          try {
            return await query(args);
          } catch (error: any) {
            const isConnReset =
              error?.code === 'P1017' ||
              error?.code === 'P1001' ||
              error?.code === 'P1008' ||
              (error?.message &&
                (error.message.includes('10054') ||
                  error.message.includes('closed the connection') ||
                  error.message.includes('ConnectionReset') ||
                  error.message.includes("Can't reach database server")));

            if (isConnReset) {
              console.warn(
                `[Prisma] Connection drop detected during ${model}.${operation} (${error?.code || '10054'}). Reconnecting in 300ms and retrying...`
              );
              try {
                await rawPrisma.$disconnect();
                await new Promise((resolve) => setTimeout(resolve, 300));
                await rawPrisma.$connect();
              } catch (reconnectErr) {
                console.warn('[Prisma] Reconnect attempt error:', reconnectErr);
              }
              // Retry query once with re-established connection
              return await query(args);
            }
            throw error;
          }
        },
      },
    },
  }) as unknown as PrismaClient));

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

