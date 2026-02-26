import { PrismaClient, ServiceType, TripType, VehicleClass, ExtraCode, PricingMode } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'condecorporation@gmail.com';
const ADMIN_PASSWORD = '1234';
const ADMIN_ROLE = 'admin';

// Zones from classviptransfers.com structure
const ZONES = ['SJD', 'Port Los Cabos', 'San Jose del Cabo', 'Tourist Corridor', 'Cabo San Lucas', 'Cabo Pacific Area', 'Pacific & East Cape'] as const;
type Zone = (typeof ZONES)[number];

// Hotels per zone - representative list from Los Cabos
const HOTELS_BY_ZONE: Record<Exclude<Zone, 'SJD'>, string[]> = {
  'San Jose del Cabo': [
    'Hyatt Ziva Los Cabos',
    'Hilton Los Cabos Beach & Golf Resort',
    'Barceló Grand Faro Los Cabos',
    'Crown Paradise Club',
    'Royal Solaris Los Cabos',
    'Casa del Mar Golf Resort & Spa',
    'Secrets Puerto Los Cabos',
    'El Encanto Inn',
    'Sandos Finest Playa Los Cabos',
    'Sandos Caracol',
  ],
  'Port Los Cabos': [
    'Marriott Puerto Los Cabos',
    'Grand Velas Los Cabos',
    'Marina Fiesta Resort',
  ],
  'Tourist Corridor': [
    'Grand Fiesta Americana Los Cabos',
    'Secrets Marquis Los Cabos',
    'Le Blanc Spa Resort Los Cabos',
    'Breathless Cabo San Lucas',
    'Marquis Los Cabos',
    'Chileno Bay Resort & Residences',
    'Villa del Palmar',
    'Cabo Vista Hotel',
    'Sandos Palm Bay',
  ],
  'Cabo San Lucas': [
    'Riu Palace Baja California',
    'Riu Palace Cabo San Lucas',
    'Riu Santa Fe',
    'Hard Rock Hotel Los Cabos',
    'Marina Fiesta Resort & Spa',
    'Pueblo Bonito Sunset Beach',
    'Grand Solmar Land\'s End',
    'Esperanza Resort',
  ],
  'Cabo Pacific Area': [
    'Pueblo Bonito Pacifica',
    'Grand Solmar Pacific',
    'Villa La Estancia',
  ],
  'Pacific & East Cape': [
    'Baja Camp',
    'Rancho Leonero',
    'Hotel Palmas de Cortez',
  ],
};

// ONE_WAY base prices (cents) by zone - market rates aligned with classviptransfers
// SUV 1-5 pax, Sprinter 6-14 pax
const PRICES_ONE_WAY: Record<Exclude<Zone, 'SJD'>, { SUV: number; SPRINTER: number }> = {
  'San Jose del Cabo': { SUV: 9000, SPRINTER: 13000 },
  'Port Los Cabos': { SUV: 9500, SPRINTER: 13500 },
  'Tourist Corridor': { SUV: 10000, SPRINTER: 14500 },
  'Cabo San Lucas': { SUV: 11000, SPRINTER: 15500 },
  'Cabo Pacific Area': { SUV: 13000, SPRINTER: 17500 },
  'Pacific & East Cape': { SUV: 15000, SPRINTER: 20500 },
};

async function main() {
  console.log('🌱 Seeding AdminUser...');
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await prisma.adminUser.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash, role: ADMIN_ROLE },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      role: ADMIN_ROLE,
    },
  });
  console.log(`✅ Admin user: ${admin.email} (role: ${admin.role})`);

  console.log('🌱 Seeding Areas (must match hotel zones exactly for pricing)...');
  const hotelZonesForAreas = ZONES.filter((z) => z !== 'SJD');
  const DEFAULT_AREAS = hotelZonesForAreas.map((zone) => {
    const prices = PRICES_ONE_WAY[zone as Exclude<Zone, 'SJD'>];
    const base = prices.SUV;
    return { name: zone, oneWayPriceCents: base, roundTripPriceCents: Math.round(base * 1.8) };
  });
  for (const a of DEFAULT_AREAS) {
    await prisma.area.upsert({
      where: { name: a.name },
      update: { oneWayPriceCents: a.oneWayPriceCents, roundTripPriceCents: a.roundTripPriceCents, isActive: true },
      create: { name: a.name, oneWayPriceCents: a.oneWayPriceCents, roundTripPriceCents: a.roundTripPriceCents, isActive: true },
    });
  }
  console.log(`✅ ${DEFAULT_AREAS.length} areas seeded`);

  console.log('🌱 Clearing existing seed data...');
  await prisma.pricingRule.deleteMany({});
  await prisma.pricingExtra.deleteMany({});
  await prisma.hotel.deleteMany({});

  console.log('🌱 Seeding Hotels...');
  const hotelZones = ZONES.filter((z) => z !== 'SJD');
  for (const zone of hotelZones) {
    const hotels = HOTELS_BY_ZONE[zone as Exclude<Zone, 'SJD'>] || [];
    for (const name of hotels) {
      try {
        await prisma.hotel.upsert({
          where: { name_zone: { name, zone } },
          create: { name, zone, isActive: true },
          update: { isActive: true },
        });
      } catch {
        await prisma.hotel.create({ data: { name, zone, isActive: true } }).catch(() => {});
      }
    }
  }
  console.log(`✅ Hotels seeded`);

  console.log('🌱 Seeding PricingRules...');
  const pricingRules: Parameters<typeof prisma.pricingRule.create>[0]['data'][] = [];

  for (const zone of hotelZones) {
    const prices = PRICES_ONE_WAY[zone as Exclude<Zone, 'SJD'>];
    for (const vc of ['SUV', 'SPRINTER'] as const) {
      const baseCents = prices[vc];
      const paxMin = vc === 'SUV' ? 1 : 8;
      const paxMax = vc === 'SUV' ? 7 : 14;
      // SJD → zone (ONE_WAY)
      pricingRules.push({
        active: true,
        serviceType: ServiceType.TRANSFER,
        tripType: TripType.ONE_WAY,
        zoneFrom: 'SJD',
        zoneTo: zone,
        vehicleClass: vc as VehicleClass,
        basePriceCents: baseCents,
        currency: 'USD',
        passengersMin: paxMin,
        passengersMax: paxMax,
        notes: `SJD → ${zone} (${vc})`,
      });
      // SJD → zone (ROUND_TRIP base - service multiplies by 2)
      pricingRules.push({
        active: true,
        serviceType: ServiceType.TRANSFER,
        tripType: TripType.ROUND_TRIP,
        zoneFrom: 'SJD',
        zoneTo: zone,
        vehicleClass: vc as VehicleClass,
        basePriceCents: baseCents,
        currency: 'USD',
        passengersMin: paxMin,
        passengersMax: paxMax,
        notes: `SJD ↔ ${zone} Round Trip (${vc})`,
      });
      // zone → SJD (ONE_WAY)
      pricingRules.push({
        active: true,
        serviceType: ServiceType.TRANSFER,
        tripType: TripType.ONE_WAY,
        zoneFrom: zone,
        zoneTo: 'SJD',
        vehicleClass: vc as VehicleClass,
        basePriceCents: baseCents,
        currency: 'USD',
        passengersMin: paxMin,
        passengersMax: paxMax,
        notes: `${zone} → SJD (${vc})`,
      });
    }
  }

  await prisma.pricingRule.createMany({ data: pricingRules });
  console.log(`✅ ${pricingRules.length} pricing rules seeded`);

  console.log('🌱 Seeding PricingExtras...');
  const pricingExtras = [
    // INCLUDED (no charge) - always shown, never added to total
    { code: ExtraCode.INCLUDED_BASIC_KIT, label: 'Basic Kit (Beers + Water)', labelEs: 'Kit Básico (Cervezas + Agua)', priceCents: 0, pricingMode: PricingMode.PER_BOOKING, maxQty: 1, included: true, description: 'Included with every transfer' },
    // Paid extras
    { code: ExtraCode.GROCERY_STOP, label: 'Grocery Stop', labelEs: 'Parada en Supermercado', priceCents: 5000, pricingMode: PricingMode.PER_BOOKING, maxQty: 1, included: false, description: 'Stop at grocery store' },
    { code: ExtraCode.EXTRA_STOP, label: 'Extra Stop', labelEs: 'Parada Extra', priceCents: 2000, pricingMode: PricingMode.PER_STOP, maxQty: 3, included: false, description: 'Additional stop' },
    { code: ExtraCode.BABY_SEAT, label: 'Baby Seat', labelEs: 'Silla para Bebé', priceCents: 1500, pricingMode: PricingMode.PER_SEAT, maxQty: 2, included: false, description: 'Baby seat' },
    { code: ExtraCode.BOOSTER, label: 'Booster Seat', labelEs: 'Silla Elevadora', priceCents: 1000, pricingMode: PricingMode.PER_SEAT, maxQty: 2, included: false, description: 'Booster seat' },
    { code: ExtraCode.SPECIAL_ASSISTANCE, label: 'Special Assistance', labelEs: 'Asistencia Especial', priceCents: 2500, pricingMode: PricingMode.PER_BOOKING, maxQty: 1, included: false, description: 'Wheelchair, mobility assistance' },
    { code: ExtraCode.OVERSIZE_LUGGAGE, label: 'Oversize / Large Luggage', labelEs: 'Equipaje Grande / Sobredimensionado', priceCents: 2000, pricingMode: PricingMode.PER_BOOKING, maxQty: 2, included: false, description: 'Golf bags, surfboards, etc.' },
    { code: ExtraCode.WAIT_TIME, label: 'Wait Time (per hour)', labelEs: 'Tiempo de Espera (por hora)', priceCents: 3000, pricingMode: PricingMode.PER_HOUR, maxQty: 4, included: false, description: 'Additional wait time' },
    { code: ExtraCode.LATE_NIGHT, label: 'Late Night (10 PM - 6 AM)', labelEs: 'Horario Nocturno (10 PM - 6 AM)', priceCents: 2000, pricingMode: PricingMode.PER_BOOKING, maxQty: 1, included: false, description: 'Late night surcharge' },
    { code: ExtraCode.EARLY_MORNING, label: 'Early Morning (before 6 AM)', labelEs: 'Madrugada (antes de 6 AM)', priceCents: 2000, pricingMode: PricingMode.PER_BOOKING, maxQty: 1, included: false, description: 'Early morning surcharge' },
    // Upsell kits
    { code: ExtraCode.CHAMPAGNE_UPGRADE, label: 'Champagne (Moët & Chandon)', labelEs: 'Champagne (Moët & Chandon)', priceCents: 4500, pricingMode: PricingMode.PER_BOOKING, maxQty: 1, included: false, description: 'Bottle of Moët & Chandon on arrival' },
    { code: ExtraCode.ROMANTIC_KIT, label: 'Romantic Kit', labelEs: 'Kit Romántico', priceCents: 6500, pricingMode: PricingMode.PER_BOOKING, maxQty: 1, included: false, description: 'Roses, chocolate, champagne' },
    { code: ExtraCode.BIRTHDAY_KIT, label: 'Birthday Kit', labelEs: 'Kit Cumpleaños', priceCents: 5500, pricingMode: PricingMode.PER_BOOKING, maxQty: 1, included: false, description: 'Balloons, cupcake, celebration' },
    { code: ExtraCode.DELUXE_ARRIVAL_KIT, label: 'Deluxe Arrival Kit', labelEs: 'Kit de Llegada Deluxe', priceCents: 9500, pricingMode: PricingMode.PER_BOOKING, maxQty: 1, included: false, description: 'Decoration + champagne + cold towels' },
    // Legacy (keep for backward compat, can deprecate)
    { code: ExtraCode.CHAMPAGNE, label: 'Champagne', labelEs: 'Champagne', priceCents: 3500, pricingMode: PricingMode.PER_BOOKING, maxQty: 1, included: false, description: 'Bottle of champagne on arrival' },
    { code: ExtraCode.LUXURY_WELCOME, label: 'Luxury Welcome Package', labelEs: 'Paquete Bienvenida de Lujo', priceCents: 7500, pricingMode: PricingMode.PER_BOOKING, maxQty: 1, included: false, description: 'Cold towels, water, snacks' },
  ];
  await prisma.pricingExtra.createMany({
    data: pricingExtras.map((e) => ({ ...e, active: true })),
  });
  console.log('✅ PricingExtras seeded');
  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
