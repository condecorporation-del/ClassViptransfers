import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { getErrorMessage } from '../src/shared/lib/errors';

const prisma = new PrismaClient();

const ZONE_MAPPING: Record<string, string> = {
  'San José del Cabo': 'San Jose del Cabo',
  Corredor: 'Tourist Corridor',
  'Cabo San Lucas': 'Cabo San Lucas',
  'East Cape': 'Pacific & East Cape',
  'Puerto Los Cabos': 'Port Los Cabos',
  Diamante: 'Cabo Pacific Area',
  'Todos Santos': 'Pacific & East Cape',
  'La Paz': 'Pacific & East Cape',
};

const BATCH_SIZE = 50;

interface EnrichedHotel {
  nombre: string;
  zona: string;
}

interface ImportHotelRecord {
  name: string;
  zone: string;
}

function normalizeKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

async function main() {
  const filePath = path.resolve(__dirname, '../data/hotels-enriched.json');
  const raw: EnrichedHotel[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  console.log('='.repeat(60));
  console.log('Import Hotels -> Prisma (table: Hotel)');
  console.log('='.repeat(60));
  console.log(`Source: ${filePath}`);
  console.log(`Total source records: ${raw.length}`);

  const unmapped: string[] = [];
  const dedupeMap = new Map<string, ImportHotelRecord>();

  for (const sourceHotel of raw) {
    const zone = ZONE_MAPPING[sourceHotel.zona.trim()];

    if (!zone) {
      unmapped.push(`"${sourceHotel.zona}" (${sourceHotel.nombre})`);
      continue;
    }

    const hotel = {
      name: sourceHotel.nombre.trim(),
      zone,
    };

    dedupeMap.set(`${normalizeKey(hotel.name)}||${normalizeKey(hotel.zone)}`, hotel);
  }

  const hotels = [...dedupeMap.values()];

  if (unmapped.length > 0) {
    console.warn(`\n[Warning] ${unmapped.length} hotels with unknown zone were skipped:`);
    unmapped.forEach((entry) => console.warn(` - ${entry}`));
  }

  console.log(`Unique mapped hotels ready to import: ${hotels.length}\n`);

  const existingHotels = await prisma.hotel.findMany({
    select: { name: true, zone: true },
  });

  const existingKeys = new Set(
    existingHotels.map((hotel) => `${normalizeKey(hotel.name)}||${normalizeKey(hotel.zone)}`)
  );

  let inserted = 0;
  let existing = 0;
  let errors = 0;

  for (let index = 0; index < hotels.length; index += BATCH_SIZE) {
    const batch = hotels.slice(index, index + BATCH_SIZE);

    for (const hotel of batch) {
      try {
        const hotelKey = `${normalizeKey(hotel.name)}||${normalizeKey(hotel.zone)}`;
        const wasExisting = existingKeys.has(hotelKey);

        await prisma.hotel.upsert({
          where: { name_zone: { name: hotel.name, zone: hotel.zone } },
          update: { isActive: true },
          create: { name: hotel.name, zone: hotel.zone, isActive: true },
        });

        if (wasExisting) {
          existing++;
        } else {
          inserted++;
          existingKeys.add(hotelKey);
        }
      } catch (error) {
        errors++;
        console.error(`[Error] ${hotel.name} (${hotel.zone}): ${getErrorMessage(error)}`);
      }
    }

    const processed = Math.min(index + BATCH_SIZE, hotels.length);
    console.log(`Processed: ${processed}/${hotels.length}`);
  }

  console.log('\n--- Import Summary ---');
  console.log(`  Inserted (new): ${inserted}`);
  console.log(`  Already present / reactivated: ${existing}`);
  if (errors > 0) {
    console.log(`  Errors: ${errors}`);
  }

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
  for (const zone of byZone) {
    console.log(`  ${zone.zone}: ${zone._count._all}`);
  }

  console.log('\n' + '='.repeat(60));
}

main()
  .catch((error) => {
    console.error('[Fatal]', getErrorMessage(error) || error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
