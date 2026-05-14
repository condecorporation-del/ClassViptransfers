import { Router, Request, Response } from 'express';
import { prisma } from '../../../shared/lib/prisma';
import { asyncHandler } from '../../../shared/middleware/validation';

const router = Router();

// Deterministic slug from hotel name — same algorithm used in the import script
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const ZONE_DRIVE_MINUTES: Record<string, number> = {
  'San Jose del Cabo': 20,
  'Port Los Cabos': 25,
  'Tourist Corridor': 30,
  'Cabo San Lucas': 45,
  'Cabo Pacific Area': 50,
  'Pacific & East Cape': 90,
};

/**
 * GET /api/hotels
 * List all active hotels with slugs (used to build sitemap / hotel index)
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const hotels = await prisma.hotel.findMany({
      where: { isActive: true },
      orderBy: [{ zone: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, zone: true },
    });

    const data = hotels.map((h) => ({ ...h, slug: slugify(h.name) }));
    res.json({ success: true, data, total: data.length });
  })
);

/**
 * GET /api/hotels/:slug
 * Return a single hotel + area pricing by slug
 */
router.get(
  '/:slug',
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;

    const hotels = await prisma.hotel.findMany({
      where: { isActive: true },
      select: { id: true, name: true, zone: true },
    });

    const hotel = hotels.find((h) => slugify(h.name) === slug);

    if (!hotel) {
      return res.status(404).json({ success: false, error: 'Hotel not found' });
    }

    const area = await prisma.area.findFirst({
      where: { name: hotel.zone, isActive: true },
      select: { oneWayPriceCents: true, roundTripPriceCents: true },
    });

    return res.json({
      success: true,
      data: {
        id: hotel.id,
        name: hotel.name,
        zone: hotel.zone,
        slug,
        oneWayPriceUSD: area ? Math.round(area.oneWayPriceCents / 100) : null,
        roundTripPriceUSD: area ? Math.round(area.roundTripPriceCents / 100) : null,
        driveMinutes: ZONE_DRIVE_MINUTES[hotel.zone] ?? 35,
      },
    });
  })
);

export default router;
