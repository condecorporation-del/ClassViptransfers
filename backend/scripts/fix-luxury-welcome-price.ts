/**
 * Set LUXURY_WELCOME (Premium Welcome Kit) price to $100 USD
 * Run: npx tsx scripts/fix-luxury-welcome-price.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.pricingExtra.updateMany({
    where: { code: 'LUXURY_WELCOME' },
    data: { priceCents: 10000 },
  });
  console.log(updated.count > 0
    ? '✅ LUXURY_WELCOME price updated to $100'
    : '⚠️ No LUXURY_WELCOME record found (run seed first)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
