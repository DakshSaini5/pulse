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

// Graceful shutdown — important for Render/cloud deployments
const gracefulShutdown = async () => {
  console.log('Disconnecting Prisma client...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default prisma;
export { prisma };
