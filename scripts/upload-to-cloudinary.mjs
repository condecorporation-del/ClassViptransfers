/**
 * Sube imágenes locales a Cloudinary y genera src/lib/cloudinary-assets.ts
 * Ejecutar: node scripts/upload-to-cloudinary.mjs
 * Requiere: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET en backend/.env
 */
import { v2 as cloudinary } from 'cloudinary';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Cargar .env del backend
function loadEnv() {
  const envPath = join(root, 'backend', '.env');
  if (!existsSync(envPath)) {
    console.error('❌ backend/.env no encontrado');
    process.exit(1);
  }
  const content = readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = (m[2] || '').trim();
  }
  return env;
}

const env = loadEnv();
const cloudName = env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = env.CLOUDINARY_API_KEY?.trim();
const apiSecret = env.CLOUDINARY_API_SECRET?.trim();

if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ Configura CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en backend/.env');
  process.exit(1);
}

cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

const BASE = `https://res.cloudinary.com/${cloudName}/image/upload`;
// Calidad alta sin pérdida visible
const Q_OPT = 'q_auto:good,f_auto';

function url(publicId, opts = '') {
  return opts ? `${BASE}/${opts}/${publicId}` : `${BASE}/${publicId}`;
}

async function upload(filePath, publicId) {
  const res = await cloudinary.uploader.upload(filePath, {
    public_id: publicId,
    overwrite: true,
  });
  return res.secure_url;
}

async function main() {
  const uploads = [
    { path: join(root, 'public', 'logo.png'), id: 'classvip/logo' },
    { path: join(root, 'public', 'favicon.png'), id: 'classvip/favicon' },
    { path: join(root, 'public', 'icons', 'icon-192x192.png'), id: 'classvip/icon-192' },
    { path: join(root, 'public', 'icons', 'icon-512x512.png'), id: 'classvip/icon-512' },
    { path: join(root, 'public', 'icons', 'apple-touch-icon.png'), id: 'classvip/apple-touch-icon' },
  ];

  // Hero y activity - solo si existen
  const maybe = [
    { path: join(root, 'src', 'assets', 'hero-luxury-1.jpg'), id: 'classvip/hero-1' },
    { path: join(root, 'src', 'assets', 'hero-luxury-2.jpg'), id: 'classvip/hero-2' },
    { path: join(root, 'src', 'assets', 'hero-luxury-3.jpg'), id: 'classvip/hero-3' },
    { path: join(root, 'src', 'assets', 'activity-camel.jpg'), id: 'classvip/activity-camel' },
    { path: join(root, 'src', 'assets', 'activity-horseback.jpg'), id: 'classvip/activity-horseback' },
    { path: join(root, 'src', 'assets', 'activity-skybikes.jpg'), id: 'classvip/activity-skybikes' },
    { path: join(root, 'src', 'assets', 'activity-utv.jpg'), id: 'classvip/activity-utv' },
    { path: join(root, 'src', 'assets', 'activity-atv.jpg'), id: 'classvip/activity-atv' },
    { path: join(root, 'src', 'assets', 'activity-moto.jpg'), id: 'classvip/activity-moto' },
  ];

  for (const u of maybe) {
    if (existsSync(u.path)) uploads.push(u);
  }

  const urls = {};
  for (const u of uploads) {
    if (!existsSync(u.path)) {
      console.warn('⚠️ No existe:', u.path);
      continue;
    }
    try {
      urls[u.id] = await upload(u.path, u.id);
      console.log('✓', u.id, '→', urls[u.id]);
    } catch (err) {
      console.error('✗', u.id, err.message);
    }
  }

  const logoUrl = urls['classvip/logo'] || `${BASE}/classvip/logo`;
  const faviconUrl = urls['classvip/favicon'] || `${BASE}/classvip/favicon`;
  const icon192 = urls['classvip/icon-192'] || `${BASE}/classvip/icon-192`;
  const icon512 = urls['classvip/icon-512'] || `${BASE}/classvip/icon-512`;
  const appleTouch = urls['classvip/apple-touch-icon'] || `${BASE}/classvip/apple-touch-icon`;
  const hero1 = urls['classvip/hero-1'] || '';
  const hero2 = urls['classvip/hero-2'] || '';
  const hero3 = urls['classvip/hero-3'] || '';
  const actCamel = urls['classvip/activity-camel'] || '';
  const actHorse = urls['classvip/activity-horseback'] || '';
  const actSky = urls['classvip/activity-skybikes'] || '';
  const actUtv = urls['classvip/activity-utv'] || '';
  const actAtv = urls['classvip/activity-atv'] || '';
  const actMoto = urls['classvip/activity-moto'] || '';

  const ts = `/**
 * URLs de imágenes en Cloudinary - carga rápida, alta calidad
 * Generado por scripts/upload-to-cloudinary.mjs
 */
const CLOUD_BASE = 'https://res.cloudinary.com/${cloudName}/image/upload';
const Q = 'q_auto:good,f_auto';

export const cloudinaryAssets = {
  logo: '${logoUrl}',
  favicon: '${faviconUrl}',
  icon192: '${icon192}',
  icon512: '${icon512}',
  appleTouchIcon: '${appleTouch}',
  hero: ['${hero1}', '${hero2}', '${hero3}'].filter(Boolean),
  activities: {
    camel: '${actCamel}' || '',
    horseback: '${actHorse}' || '',
    skybikes: '${actSky}' || '',
    utv: '${actUtv}' || '',
    atv: '${actAtv}' || '',
    moto: '${actMoto}' || '',
  },
} as const;
`;

  const outPath = join(root, 'src', 'lib', 'cloudinary-assets.ts');
  writeFileSync(outPath, ts);
  console.log('\n✅ Escrito:', outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
