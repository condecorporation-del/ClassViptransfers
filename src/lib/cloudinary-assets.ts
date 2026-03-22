/**
 * URLs de imágenes en Cloudinary - carga rápida, CDN global
 * q_auto:good = calidad alta sin pérdida visible
 * Para subir: node scripts/upload-to-cloudinary.mjs (requiere API_SECRET en backend/.env)
 */
const CLOUD_BASE = 'https://res.cloudinary.com/dt9iyiorn/image/upload';
const Q = 'q_auto:good,f_auto';

export const cloudinaryAssets = {
  logo: `${CLOUD_BASE}/${Q}/classvip/logo`,
  favicon: `${CLOUD_BASE}/${Q}/classvip/favicon`,
  icon192: `${CLOUD_BASE}/${Q}/classvip/icon-192`,
  icon512: `${CLOUD_BASE}/${Q}/classvip/icon-512`,
  appleTouchIcon: `${CLOUD_BASE}/${Q}/classvip/apple-touch-icon`,
  hero: [
    `${CLOUD_BASE}/${Q}/classvip/hero-1`,
    `${CLOUD_BASE}/${Q}/classvip/hero-2`,
    `${CLOUD_BASE}/${Q}/classvip/hero-3`,
  ],
  activities: {
    camel: `${CLOUD_BASE}/${Q}/classvip/activity-camel`,
    horseback: `${CLOUD_BASE}/${Q}/classvip/activity-horseback`,
    skybikes: `${CLOUD_BASE}/${Q}/classvip/activity-skybikes`,
    utv: `${CLOUD_BASE}/${Q}/classvip/activity-utv`,
    atv: `${CLOUD_BASE}/${Q}/classvip/activity-atv`,
    moto: `${CLOUD_BASE}/${Q}/classvip/activity-moto`,
  },
} as const;
