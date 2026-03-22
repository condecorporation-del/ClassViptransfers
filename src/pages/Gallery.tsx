import { useState } from 'react';
import { SEO } from '@/components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { X } from 'lucide-react';

import { cloudinaryAssets } from '@/lib/cloudinary-assets';

const images = [
  { src: cloudinaryAssets.hero[0], alt: 'Luxury Transfer Los Cabos' },
  { src: cloudinaryAssets.hero[1], alt: 'VIP Transportation' },
  { src: cloudinaryAssets.hero[2], alt: 'Premium Experience' },
  { src: cloudinaryAssets.activities.camel, alt: 'Camel Ride' },
  { src: cloudinaryAssets.activities.horseback, alt: 'Horseback Riding' },
  { src: cloudinaryAssets.activities.atv, alt: 'ATV Adventure' },
  { src: cloudinaryAssets.activities.moto, alt: 'Moto Adventure' },
  { src: cloudinaryAssets.activities.skybikes, alt: 'Sky Bikes' },
  { src: cloudinaryAssets.activities.utv, alt: 'UTV Experience' },
];

const Gallery = () => {
  const { lang } = useLanguage();
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <>
      <SEO
        title="Gallery"
        description="Photos of our luxury vehicles and experiences in Los Cabos, Mexico."
      />
      <div className="pt-28 pb-20 min-h-screen bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            {lang === 'es' ? 'Galería' : 'Gallery'}
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            {lang === 'es'
              ? 'Momentos inolvidables en Los Cabos'
              : 'Unforgettable moments in Los Cabos'}
          </p>
        </motion.div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {images.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="break-inside-avoid cursor-pointer group"
              onClick={() => setSelected(i)}
            >
              <div className="overflow-hidden rounded-2xl border border-border">
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <button
              className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors"
              onClick={() => setSelected(null)}
            >
              <X size={28} />
            </button>
            <motion.img
              key={selected}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={images[selected].src}
              alt={images[selected].alt}
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
};

export default Gallery;
