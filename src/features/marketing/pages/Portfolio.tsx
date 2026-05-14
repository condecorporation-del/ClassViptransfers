import { useState } from 'react';
import { SEO } from '@/features/marketing/components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/shared/providers/LanguageContext';
import {
  X, Car, Users, Home, TrendingUp, ImageOff,
  Bed, Bath, Maximize2, MapPin, ArrowRight, ExternalLink,
} from 'lucide-react';

import { cloudinaryAssets } from '@/shared/lib/cloudinary-assets';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GalleryImage {
  src: string;
  alt: string;
  label?: string;
}

interface Property {
  title: string;
  titleEs: string;
  location: string;
  description: string;
  descriptionEs: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  priceLabel?: string;
  priceLabelEs?: string;
  photos: string[];
  link?: string;
  badge?: string;
  badgeEs?: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const fleetImages: GalleryImage[] = [
  { src: cloudinaryAssets.hero[0], alt: 'Class VIP SUV Premium', label: 'SUV Premium' },
  { src: cloudinaryAssets.hero[1], alt: 'Class VIP Luxury Transfer', label: 'Luxury Sedan' },
  { src: cloudinaryAssets.hero[2], alt: 'Class VIP VIP Experience', label: 'Sprinter Van' },
];

const clientImages: GalleryImage[] = [
  { src: cloudinaryAssets.activities.camel, alt: 'Camel Ride Los Cabos' },
  { src: cloudinaryAssets.activities.horseback, alt: 'Horseback Riding Los Cabos' },
  { src: cloudinaryAssets.activities.atv, alt: 'ATV Adventure Los Cabos' },
  { src: cloudinaryAssets.activities.moto, alt: 'Moto Experience Los Cabos' },
  { src: cloudinaryAssets.activities.skybikes, alt: 'Sky Bikes Los Cabos' },
  { src: cloudinaryAssets.activities.utv, alt: 'UTV Adventure Los Cabos' },
];

const rentalProperties: Property[] = [
  {
    title: 'Villa Serena — Luxury Retreat',
    titleEs: 'Villa Serena — Retiro de Lujo',
    location: 'Cabo San Lucas, BCS',
    description:
      'Exclusive private villa with ocean views, private pool, fully equipped kitchen, and VIP concierge service. Perfect for families, romantic getaways, or corporate retreats.',
    descriptionEs:
      'Villa privada exclusiva con vistas al mar, alberca privada, cocina completamente equipada y servicio de concierge VIP. Ideal para familias, escapadas románticas o retiros corporativos.',
    beds: 4,
    baths: 4,
    sqft: 4500,
    priceLabel: 'From $850 / night',
    priceLabelEs: 'Desde $850 / noche',
    photos: [],
    badge: 'Featured',
    badgeEs: 'Destacada',
    // Add Cloudinary photos array:
    // photos: ['https://res.cloudinary.com/...', ...],
  },
  {
    title: 'Ocean View Suite',
    titleEs: 'Suite con Vista al Mar',
    location: 'Corridor, Los Cabos',
    description:
      'Modern luxury suite inside a boutique resort. Access to beach club, restaurant, and spa. Ideal for couples and small groups.',
    descriptionEs:
      'Suite de lujo moderna dentro de un resort boutique. Acceso a club de playa, restaurante y spa. Ideal para parejas y grupos pequeños.',
    beds: 2,
    baths: 2,
    sqft: 1800,
    priceLabel: 'From $350 / night',
    priceLabelEs: 'Desde $350 / noche',
    photos: [],
  },
];

const investmentProperties: Property[] = [
  {
    title: 'Beachfront Development Lot',
    titleEs: 'Lote Frente al Mar — Desarrollo',
    location: 'Pacific Side, Los Cabos',
    description:
      'Prime beachfront lot with permits for boutique hotel or luxury residences. Ideal for investors seeking high-yield returns in one of Mexico\'s top luxury destinations.',
    descriptionEs:
      'Lote frente al mar con permisos para hotel boutique o residencias de lujo. Ideal para inversionistas que buscan alto rendimiento en uno de los destinos de lujo más importantes de México.',
    sqft: 8000,
    priceLabel: '$2,200,000 USD',
    priceLabelEs: '$2,200,000 USD',
    photos: [],
    badge: 'High ROI',
    badgeEs: 'Alto Rendimiento',
  },
  {
    title: 'Corridor Condo — Rental Investment',
    titleEs: 'Condo Corredor — Inversión en Renta',
    location: 'Tourist Corridor, Los Cabos',
    description:
      'Pre-construction luxury condo in the Tourist Corridor. Proven rental yields of 8–12% annually. Managed by the developer.',
    descriptionEs:
      'Condo de lujo en preventa en el Corredor Turístico. Rendimientos de renta comprobados del 8–12% anual. Administrado por la desarrolladora.',
    beds: 2,
    baths: 2,
    sqft: 1400,
    priceLabel: '$480,000 USD',
    priceLabelEs: '$480,000 USD',
    photos: [],
  },
];

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'fleet' | 'client' | 'rental' | 'investment';

const TABS: { id: Tab; icon: React.ElementType; labelEn: string; labelEs: string }[] = [
  { id: 'fleet', icon: Car, labelEn: 'Fleet', labelEs: 'Flota' },
  { id: 'client', icon: Users, labelEn: 'Experiences', labelEs: 'Experiencias' },
  { id: 'rental', icon: Home, labelEn: 'Rental Properties', labelEs: 'Propiedades en Renta' },
  { id: 'investment', icon: TrendingUp, labelEn: 'Investment', labelEs: 'Inversión' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const PhotoPlaceholder = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center justify-center h-48 bg-muted/50 rounded-xl border border-dashed border-border/60 text-muted-foreground gap-2">
    <ImageOff size={24} className="opacity-40" />
    <span className="text-xs opacity-50">{label}</span>
  </div>
);

const ImageGrid = ({
  images,
  onSelect,
}: {
  images: GalleryImage[];
  onSelect: (i: number) => void;
}) => (
  <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
    {images.map((img, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.06 }}
        className="break-inside-avoid cursor-pointer group relative"
        onClick={() => onSelect(i)}
      >
        <div className="overflow-hidden rounded-2xl border border-border bg-muted">
          <img
            src={img.src}
            alt={img.alt}
            loading="lazy"
            className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {img.label && (
            <div className="absolute bottom-3 left-3 bg-navy/80 text-gold text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
              {img.label}
            </div>
          )}
        </div>
      </motion.div>
    ))}
  </div>
);

const PropertyCard = ({ p, lang }: { p: Property; lang: string }) => {
  const isEs = lang === 'es';
  const title = isEs ? p.titleEs : p.title;
  const description = isEs ? p.descriptionEs : p.description;
  const priceLabel = isEs ? p.priceLabelEs : p.priceLabel;
  const badge = isEs ? p.badgeEs : p.badge;
  const hasPhotos = p.photos.length > 0;
  const [photoIdx, setPhotoIdx] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border overflow-hidden bg-card hover:shadow-lg transition-shadow"
    >
      {/* Photo area */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {hasPhotos ? (
          <img
            src={p.photos[photoIdx]}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <ImageOff size={28} className="opacity-30" />
            <span className="text-xs opacity-40">{isEs ? 'Fotos próximamente' : 'Photos coming soon'}</span>
          </div>
        )}
        {badge && (
          <span className="absolute top-3 left-3 bg-gold text-navy text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
            {badge}
          </span>
        )}
        {hasPhotos && p.photos.length > 1 && (
          <div className="absolute bottom-3 right-3 flex gap-1">
            {p.photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setPhotoIdx(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === photoIdx ? 'bg-gold' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <h3 className="font-bold text-foreground text-base leading-tight">{title}</h3>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-3">
          <MapPin size={11} className="text-gold flex-shrink-0" />
          {p.location}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{description}</p>

        {/* Specs */}
        {(p.beds || p.baths || p.sqft) && (
          <div className="flex flex-wrap gap-3 mb-4 text-xs text-muted-foreground">
            {p.beds && (
              <span className="flex items-center gap-1">
                <Bed size={12} className="text-gold" /> {p.beds} {isEs ? 'Recámaras' : 'Beds'}
              </span>
            )}
            {p.baths && (
              <span className="flex items-center gap-1">
                <Bath size={12} className="text-gold" /> {p.baths} {isEs ? 'Baños' : 'Baths'}
              </span>
            )}
            {p.sqft && (
              <span className="flex items-center gap-1">
                <Maximize2 size={12} className="text-gold" /> {p.sqft.toLocaleString()} ft²
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          {priceLabel && (
            <span className="text-gold font-bold text-base">{priceLabel}</span>
          )}
          {p.link ? (
            <a
              href={p.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline"
            >
              {isEs ? 'Ver más' : 'Learn more'} <ExternalLink size={12} />
            </a>
          ) : (
            <a
              href="https://wa.me/5216241222174"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 transition-colors"
            >
              {isEs ? 'Consultar' : 'Inquire'} <ArrowRight size={12} />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Lightbox ─────────────────────────────────────────────────────────────────

const Lightbox = ({
  images,
  selected,
  onClose,
}: {
  images: GalleryImage[];
  selected: number | null;
  onClose: () => void;
}) => (
  <AnimatePresence>
    {selected !== null && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <button
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          onClick={onClose}
        >
          <X size={22} />
        </button>
        <motion.img
          key={selected}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          src={images[selected].src}
          alt={images[selected].alt}
          className="max-w-full max-h-[88vh] object-contain rounded-xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const Portfolio = () => {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const [activeTab, setActiveTab] = useState<Tab>('fleet');
  const [lightboxImages, setLightboxImages] = useState<GalleryImage[]>([]);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const openLightbox = (images: GalleryImage[], idx: number) => {
    setLightboxImages(images);
    setLightboxIdx(idx);
  };

  return (
    <>
      <SEO
        title={isEs ? 'Portafolio — Flota, Propiedades y Experiencias' : 'Portfolio — Fleet, Properties & Experiences'}
        description={
          isEs
            ? 'Conoce nuestra flota de lujo, propiedades en renta e inversión, y galería de experiencias en Los Cabos.'
            : 'Explore our luxury fleet, rental & investment properties, and experience gallery in Los Cabos.'
        }
        canonical="https://classviptransfers.com/portfolio"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Class VIP Transfers — Fleet & Properties Portfolio',
          description: 'Luxury vehicle fleet, rental properties, and investment properties in Los Cabos by Class VIP Transfers.',
          url: 'https://classviptransfers.com/portfolio',
        }}
      />

      <div className="pt-28 pb-20 min-h-screen bg-background">
        <div className="container mx-auto px-4">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold">
              {isEs ? 'Portafolio' : 'Portfolio'}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-sm leading-relaxed">
              {isEs
                ? 'Nuestra flota, propiedades y experiencias en Los Cabos.'
                : 'Our fleet, properties, and experiences across Los Cabos.'}
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="flex overflow-x-auto gap-2 pb-1 mb-10 scrollbar-hide justify-center flex-wrap">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-gold text-navy shadow-[0_4px_16px_rgba(212,175,55,0.35)]'
                      : 'bg-muted text-foreground/60 hover:text-foreground hover:bg-muted/80'
                  }`}
                >
                  <Icon size={15} />
                  {isEs ? tab.labelEs : tab.labelEn}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >

              {/* ── Fleet ── */}
              {activeTab === 'fleet' && (
                <div>
                  <div className="mb-6 text-center">
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      {isEs
                        ? 'SUVs de lujo, Suburbans, Sprinters y más. Todos nuestros vehículos cuentan con WiFi, bebidas y choferes bilingües.'
                        : 'Luxury SUVs, Suburbans, Sprinters and more. All vehicles include WiFi, drinks, and bilingual drivers.'}
                    </p>
                  </div>
                  {fleetImages.length > 0 ? (
                    <ImageGrid images={fleetImages} onSelect={(i) => openLightbox(fleetImages, i)} />
                  ) : (
                    <PhotoPlaceholder label={isEs ? 'Fotos de flota próximamente' : 'Fleet photos coming soon'} />
                  )}
                </div>
              )}

              {/* ── Client / Experiences ── */}
              {activeTab === 'client' && (
                <div>
                  <div className="mb-6 text-center">
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      {isEs
                        ? 'Momentos reales con nuestros clientes. Actividades, aventuras y transfers en Los Cabos.'
                        : 'Real moments with our clients. Activities, adventures, and transfers in Los Cabos.'}
                    </p>
                  </div>
                  <ImageGrid images={clientImages} onSelect={(i) => openLightbox(clientImages, i)} />
                </div>
              )}

              {/* ── Rental Properties ── */}
              {activeTab === 'rental' && (
                <div>
                  <div className="mb-6 text-center">
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      {isEs
                        ? 'Propiedades exclusivas disponibles para renta vacacional en Los Cabos. Reserva con tu traslado VIP incluido.'
                        : 'Exclusive vacation rental properties in Los Cabos. Book with your VIP transfer included.'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rentalProperties.map((p, i) => (
                      <PropertyCard key={i} p={p} lang={lang} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Investment Properties ── */}
              {activeTab === 'investment' && (
                <div>
                  <div className="mb-6 text-center">
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      {isEs
                        ? 'Oportunidades de inversión en bienes raíces en Los Cabos. Contacta para más información.'
                        : 'Real estate investment opportunities in Los Cabos. Contact us for more details.'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {investmentProperties.map((p, i) => (
                      <PropertyCard key={i} p={p} lang={lang} />
                    ))}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox
        images={lightboxImages}
        selected={lightboxIdx}
        onClose={() => setLightboxIdx(null)}
      />
    </>
  );
};

export default Portfolio;
