import { PrismaClient } from '@prisma/client';

// Prevent multiple instances in development
const globalForPrisma = global;

// Use existing Prisma instance if available
const prisma = globalForPrisma.prisma || new PrismaClient();

// Save instance in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;