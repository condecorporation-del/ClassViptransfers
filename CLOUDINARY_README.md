# Imágenes en Cloudinary

Las imágenes del sitio se sirven desde Cloudinary (CDN global, carga rápida, alta calidad).

## Subir imágenes (primera vez o actualizaciones)

1. **Regenerar** iconos locales (si cambiaste logo/icono): `node scripts/prepare-icons.js`
2. **Obtener API Secret** en [Cloudinary Dashboard](https://console.cloudinary.com/) → Account Details
3. **Configurar** `backend/.env`:
   ```
   CLOUDINARY_CLOUD_NAME=dt9iyiorn
   CLOUDINARY_API_KEY=tu_api_key
   CLOUDINARY_API_SECRET=tu_api_secret   # ← No es lo mismo que API Key
   ```
4. **Ejecutar** el script de subida:
   ```bash
   node scripts/upload-to-cloudinary.mjs
   ```
   Esto sube logo, favicon, icons, hero y activity images a la carpeta `classvip/`.

## Public IDs esperados

- `classvip/logo` - Logo navbar
- `classvip/favicon` - Favicon
- `classvip/icon-192`, `classvip/icon-512`, `classvip/apple-touch-icon` - PWA
- `classvip/hero-1`, `hero-2`, `hero-3` - Hero carousel
- `classvip/activity-camel`, `activity-horseback`, etc. - Actividades

Si subes manualmente en Media Library, usa estos nombres en la carpeta `classvip/`.
