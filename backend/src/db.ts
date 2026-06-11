import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  // Connection pool settings for production performance
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
});

// Note: Graceful shutdown is handled by index.ts to ensure HTTP server
// closes before the database connection is terminated.
// Do NOT add SIGTERM/SIGINT handlers here.

export default prisma;
export { prisma };
