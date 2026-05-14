import { PrismaClient } from '@prisma/client';
import { getErrorMessage } from '../src/lib/errors';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const ZONE_MAPPING: Record<string, string> = {
  'San José del Cabo': 'San Jose del Cabo',
  'Corredor': 'Tourist Corridor',
  'Cabo San Lucas': 'Cabo San Lucas',
  'East Cape': 'Pacific & East Cape',
  'Puerto Los Cabos': 'Port Los Cabos',
  'Diamante': 'Cabo Pacific Area',
  'Todos Santos': 'Pacific & East Cape',
  'La Paz': 'Pacific & East Cape',
};

const BATCH_SIZE = 50;

interface EnrichedHotel {
  nombre: string;
  zona: string;
}

async function main() {
  const filePath = path.resolve(__dirname, '../data/hotels-enriched.json');
  const raw: EnrichedHotel[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  console.log('='.repeat(60));
  console.log(' Import Hotels → Prisma (table: Hotel)');
  console.log('='.repeat(60));
  console.log(`Source: ${filePath}`);
  console.log(`Total records: ${raw.length}`);

  // Map zones and filter out unmapped
  const hotels: { name: string; zone: string }[] = [];
  const unmapped: string[] = [];

  for (const h of raw) {
    const zone = ZONE_MAPPING[h.zona];
    if (!zone) {
      unmapped.push(`"${h.zona}" (${h.nombre})`);
      continue;
    }
    hotels.push({ name: h.nombre, zone });
  }

  if (unmapped.length > 0) {
    console.warn(`\n[Warning] ${unmapped.length} hotels with unknown zone (skipped):`);
    unmapped.forEach((u) => console.warn(' -', u));
  }

  console.log(`\nReady to import: ${hotels.length} hotels\n`);

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  // Process in batches
  for (let i = 0; i < hotels.length; i += BATCH_SIZE) {
    const batch = hotels.slice(i, i + BATCH_SIZE);

    for (const hotel of batch) {
      try {
        const result = await prisma.hotel.upsert({
          where: { name_zone: { name: hotel.name, zone: hotel.zone } },
          update: { isActive: true },
          create: { name: hotel.name, zone: hotel.zone, isActive: true },
        });
        // Prisma upsert doesn't directly tell us insert vs update,
        // so we check updatedAt vs createdAt to infer
        const isNew =
          Math.abs(result.createdAt.getTime() - result.updatedAt.getTime()) < 500;
        if (isNew) inserted++;
        else updated++;
      } catch (err) {
        errors++;
        console.error(`[Error] ${hotel.name} (${hotel.zone}): ${getErrorMessage(err)}`);
      }
    }

    const processed = Math.min(i + BATCH_SIZE, hotels.length);
    console.log(`Processed: ${processed}/${hotels.length}`);
  }

  console.log('\n--- Import Summary ---');
  console.log(`  Inserted (new): ${inserted}`);
  console.log(`  Updated (existing): ${updated}`);
  if (errors > 0) console.log(`  Errors: ${errors}`);

  // Verification
  console.log('\n--- Database Verification ---');
  const totalHotels = await prisma.hotel.count();
  const totalActive = await prisma.hotel.count({ where: { isActive: true } });

  const byZone = await prisma.hotel.groupBy({
    by: ['zone'],
    _count: { _all: true },
    orderBy: { zone: 'asc' },
  });

  console.log(`Total hotels in DB: ${totalHotels} (${totalActive} active)`);
  console.log('\nBy zone:');
  for (const z of byZone) {
    console.log(`  ${z.zone}: ${z._count._all}`);
  }

  console.log('\n' + '='.repeat(60));
}

main()
  .catch((err) => {
    console.error('[Fatal]', getErrorMessage(err) || err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

