/**
 * URLs de imágenes en Cloudinary - carga rápida, alta calidad
 * Generado por scripts/upload-to-cloudinary.mjs
 */
const CLOUD_BASE = 'https://res.cloudinary.com/dt9iyiorn/image/upload';
const Q = 'q_auto:good,f_auto';

const T = 'q_auto:good,f_auto';
export const cloudinaryAssets = {
  logo: `https://res.cloudinary.com/dt9iyiorn/image/upload/${T}/v1774175170/classvip/logo.png`,
  favicon: `https://res.cloudinary.com/dt9iyiorn/image/upload/${T}/v1774175171/classvip/favicon.png`,
  icon192: `https://res.cloudinary.com/dt9iyiorn/image/upload/${T}/v1774175172/classvip/icon-192.png`,
  icon512: `https://res.cloudinary.com/dt9iyiorn/image/upload/${T}/v1774175173/classvip/icon-512.png`,
  appleTouchIcon: `https://res.cloudinary.com/dt9iyiorn/image/upload/${T}/v1774175173/classvip/apple-touch-icon.png`,
  hero: ['https://res.cloudinary.com/dt9iyiorn/image/upload/v1774175174/classvip/hero-1.jpg', 'https://res.cloudinary.com/dt9iyiorn/image/upload/v1774175175/classvip/hero-2.jpg', 'https://res.cloudinary.com/dt9iyiorn/image/upload/v1774175178/classvip/hero-3.jpg'].filter(Boolean),
  activities: {
    camel: 'https://res.cloudinary.com/dt9iyiorn/image/upload/v1774175179/classvip/activity-camel.jpg' || '',
    horseback: 'https://res.cloudinary.com/dt9iyiorn/image/upload/v1774175181/classvip/activity-horseback.jpg' || '',
    skybikes: 'https://res.cloudinary.com/dt9iyiorn/image/upload/v1774175181/classvip/activity-skybikes.jpg' || '',
    utv: 'https://res.cloudinary.com/dt9iyiorn/image/upload/v1774175182/classvip/activity-utv.jpg' || '',
    atv: 'https://res.cloudinary.com/dt9iyiorn/image/upload/v1774175183/classvip/activity-atv.jpg' || '',
    moto: 'https://res.cloudinary.com/dt9iyiorn/image/upload/v1774175183/classvip/activity-moto.jpg' || '',
  },
} as const;
