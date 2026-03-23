import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const BASE_URL = 'https://classviptransfers.com';
const TODAY = new Date().toISOString().split('T')[0];
const OUTPUT = path.resolve(__dirname, '../../public/sitemap.xml');

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function url(loc: string, opts: { lastmod?: string; changefreq: string; priority: string }) {
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    opts.lastmod ? `    <lastmod>${opts.lastmod}</lastmod>` : '',
    `    <changefreq>${opts.changefreq}</changefreq>`,
    `    <priority>${opts.priority}</priority>`,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

async function main() {
  console.log('='.repeat(60));
  console.log(' Sitemap Generator — Class VIP Transfers');
  console.log('='.repeat(60));

  // Static pages
  const staticUrls = [
    url(`${BASE_URL}/`, { lastmod: TODAY, changefreq: 'weekly', priority: '1.0' }),
    url(`${BASE_URL}/transfers`, { lastmod: TODAY, changefreq: 'weekly', priority: '0.9' }),
    url(`${BASE_URL}/activities`, { lastmod: TODAY, changefreq: 'weekly', priority: '0.9' }),
    url(`${BASE_URL}/book`, { changefreq: 'monthly', priority: '0.8' }),
    url(`${BASE_URL}/book-activities`, { changefreq: 'monthly', priority: '0.8' }),
    url(`${BASE_URL}/contact`, { changefreq: 'monthly', priority: '0.7' }),
    url(`${BASE_URL}/portfolio`, { changefreq: 'monthly', priority: '0.6' }),
    url(`${BASE_URL}/terms`, { changefreq: 'yearly', priority: '0.3' }),
    url(`${BASE_URL}/privacy`, { changefreq: 'yearly', priority: '0.3' }),
  ];

  // Hotel pages from DB
  const hotels = await prisma.hotel.findMany({
    where: { isActive: true },
    orderBy: [{ zone: 'asc' }, { name: 'asc' }],
    select: { name: true },
  });

  const hotelUrls = hotels.map((h) =>
    url(`${BASE_URL}/hotels/${slugify(h.name)}`, {
      lastmod: TODAY,
      changefreq: 'monthly',
      priority: '0.7',
    })
  );

  // Build XML
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    '',
    '  <!-- Static pages -->',
    staticUrls.join('\n\n'),
    '',
    `  <!-- Hotel landing pages (${hotelUrls.length} hotels) -->`,
    hotelUrls.join('\n\n'),
    '',
    '</urlset>',
  ].join('\n');

  // Validate basic structure
  if (!xml.includes('<urlset') || !xml.includes('</urlset>')) {
    throw new Error('Generated XML is malformed — aborting write');
  }

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, xml, 'utf-8');

  const totalUrls = staticUrls.length + hotelUrls.length;
  console.log(`\nTotal URLs generated: ${totalUrls}`);
  console.log(`  Static pages: ${staticUrls.length}`);
  console.log(`  Hotel pages:  ${hotelUrls.length}`);

  console.log('\nFirst 10 hotel URLs:');
  hotelUrls.slice(0, 10).forEach((u) => {
    const loc = u.match(/<loc>(.*?)<\/loc>/)?.[1] ?? '';
    console.log(' ', loc);
  });

  console.log(`\n✅ Saved to: ${OUTPUT}`);
  console.log('='.repeat(60));
}

main()
  .catch((err) => {
    console.error('[Fatal]', err.message || err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
