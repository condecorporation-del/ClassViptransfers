import sharp from 'sharp';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const logoSrc = join(root, 'src', 'assets', 'logo class nuevo.png');
const iconoSrc = join(root, 'src', 'assets', 'Icono Class.png');
const publicDir = join(root, 'public');
const iconsDir = join(publicDir, 'icons');

async function main() {
  // Ensure public/icons exists
  if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });

  // 1. Copy Logo Class to public/logo.png
  copyFileSync(logoSrc, join(publicDir, 'logo.png'));
  console.log('✓ Logo Class copiado a public/logo.png');

  // 2. Resize Icono Class for app icons - trim márgenes y cover para llenar todo
  const iconOpts = { fit: 'cover', position: 'center' };
  const trimOpts = { background: '#ffffff', threshold: 20 };

  await sharp(iconoSrc)
    .trim(trimOpts)
    .resize(180, 180, iconOpts)
    .png()
    .toFile(join(iconsDir, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png (180x180)');

  await sharp(iconoSrc)
    .trim(trimOpts)
    .resize(192, 192, iconOpts)
    .png()
    .toFile(join(iconsDir, 'icon-192x192.png'));
  console.log('✓ icon-192x192.png');

  await sharp(iconoSrc)
    .trim(trimOpts)
    .resize(512, 512, iconOpts)
    .png()
    .toFile(join(iconsDir, 'icon-512x512.png'));
  console.log('✓ icon-512x512.png');

  await sharp(iconoSrc)
    .trim(trimOpts)
    .resize(48, 48, iconOpts)
    .png()
    .toFile(join(publicDir, 'favicon.png'));
  console.log('✓ favicon.png (48x48)');

  console.log('\nIconos preparados correctamente.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
