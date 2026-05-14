import { beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    return;
  }

  await prisma.$connect();
});

afterAll(async () => {
  if (!process.env.DATABASE_URL) {
    return;
  }

  await prisma.$disconnect();
});

