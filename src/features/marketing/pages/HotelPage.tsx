import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SEO } from '@/features/marketing/components/SEO';
import { getApiBaseUrl } from '@/shared/lib/api';
import { ArrowRight, MapPin, Clock, Car, ChevronRight, Loader2, Star } from 'lucide-react';

interface HotelData {
  id: string;
  name: string;
  zone: string;
  slug: string;
  oneWayPriceUSD: number | null;
  roundTripPriceUSD: number | null;
  driveMinutes: number;
}

const ZONE_DESCRIPTION: Record<string, string> = {
  'San Jose del Cabo': 'San José del Cabo blends colonial charm with modern luxury, just 20 minutes from SJD Airport. Home to a thriving art district, world-class golf courses, and pristine beaches along the Sea of Cortez.',
  'Port Los Cabos': 'Puerto Los Cabos is a premier marina development north of San José del Cabo, featuring ultra-luxury resorts, championship golf, and a protected harbor frequented by super yachts.',
  'Tourist Corridor': 'The Tourist Corridor stretches 33 km between San José del Cabo and Cabo San Lucas along the Pacific coast, home to the most exclusive resorts in Los Cabos with dramatic cliffside views.',
  'Cabo San Lucas': 'Cabo San Lucas is the vibrant heart of the region — famous for El Arco rock formation, a bustling marina, world-class sportfishing, and an energetic nightlife scene.',
  'Cabo Pacific Area': 'The Pacific side of Cabo offers secluded beachfront resorts, championship golf along dramatic Pacific coastline, and an exclusive residential atmosphere away from the crowds.',
  'Pacific & East Cape': 'East Cape is a natural paradise stretching from Los Barriles to Cabo Pulmo, offering unspoiled beaches, world-class fishing, and access to Todos Santos and La Paz.',
};

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

export default function HotelPage() {
  const { slug } = useParams<{ slug: string }>();
  const [hotel, setHotel] = useState<HotelData | null>(null);
  const [status, setStatus] = useState<'loading' | 'found' | 'notfound' | 'error'>('loading');

  useEffect(() => {
    if (!slug) return;
    const base = getApiBaseUrl();
    fetch(`${base}/api/hotels/${slug}`)
      .then((r) => {
        if (r.status === 404) { setStatus('notfound'); return null; }
        if (!r.ok) throw new Error('Server error');
        return r.json();
      })
      .then((j) => {
        if (!j) return;
        if (!j.success || !j.data) {
          setStatus('notfound');
          return;
        }
        setHotel(j.data);
        setStatus('found');
      })
      .catch(() => setStatus('error'));
  }, [slug]);

  if (status === 'notfound') return <Navigate to="/transfers" replace />;

  if (status === 'loading' || status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!hotel) return null;

  const price = hotel.oneWayPriceUSD ?? 90;
  const roundPrice = hotel.roundTripPriceUSD ?? Math.round(price * 1.8);
  const zoneDesc = ZONE_DESCRIPTION[hotel.zone] ?? `${hotel.zone} is a premier destination in Los Cabos, Baja California Sur.`;

  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Airport Transfer to ${hotel.name}`,
    description: `Premium private transportation from Los Cabos Airport (SJD) to ${hotel.name} in ${hotel.zone}. Professional bilingual drivers, flight tracking, door-to-door service.`,
    provider: {
      '@type': 'Organization',
      name: 'Class VIP Transfers',
      url: 'https://classviptransfers.com',
      telephone: '+526241222174',
    },
    areaServed: `${hotel.zone}, Los Cabos, Baja California Sur`,
    offers: {
      '@type': 'Offer',
      price: price,
      priceCurrency: 'USD',
      description: 'One-way airport transfer per vehicle',
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://classviptransfers.com' },
      { '@type': 'ListItem', position: 2, name: 'Transfers', item: 'https://classviptransfers.com/transfers' },
      { '@type': 'ListItem', position: 3, name: hotel.name, item: `https://classviptransfers.com/hotels/${slug}` },
    ],
  };

  const faqs = [
    {
      q: `How long is the transfer from SJD Airport to ${hotel.name}?`,
      a: `The drive from Los Cabos International Airport (SJD) to ${hotel.name} takes approximately ${hotel.driveMinutes} minutes, depending on traffic. Our driver will monitor your flight and be ready on arrival.`,
    },
    {
      q: `What vehicles are available for transfers to ${hotel.name}?`,
      a: `We operate luxury Mercedes Sprinter Vans, comfortable for groups of 1–14 passengers. All vehicles include AC, leather seats, WiFi, and cold beverages.`,
    },
    {
      q: `Is the transfer price to ${hotel.name} per person or per vehicle?`,
      a: `The price is per vehicle, not per person. A one-way transfer to ${hotel.name} starts from $${price} USD, making it very affordable for families and groups.`,
    },
  ];

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div>
      <SEO
        title={`Airport Transfer to ${hotel.name} | Class VIP Transfers`}
        description={`Premium private transportation from Los Cabos Airport (SJD) to ${hotel.name} in ${hotel.zone}. 30 years experience. Flight tracking included. From $${price} USD per vehicle.`}
        keywords={`transfer to ${hotel.name}, ${hotel.name} airport shuttle, SJD to ${hotel.name}, ${hotel.zone} transportation, Los Cabos airport transfer`}
        canonical={`https://classviptransfers.com/hotels/${slug}`}
        jsonLd={[serviceLd, breadcrumbLd, faqLd]}
      />

      {/* ── Hero ── */}
      <section className="navy-gradient pt-36 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-off-white/40 text-xs mb-8" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-off-white/70 transition-colors">Home</Link>
            <ChevronRight size={12} />
            <Link to="/transfers" className="hover:text-off-white/70 transition-colors">Transfers</Link>
            <ChevronRight size={12} />
            <span className="text-off-white/60 truncate max-w-[200px]">{hotel.name}</span>
          </nav>

          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <span className="font-accent text-gold text-xs tracking-[0.3em] uppercase mb-3 block">
              Private Airport Transfer · Los Cabos
            </span>
            <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-bold text-off-white leading-tight mb-4">
              Airport Transfer to<br />
              <span className="text-gold">{hotel.name}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <div className="flex items-center gap-1.5 text-off-white/60 text-sm">
                <MapPin size={14} className="text-gold" />
                {hotel.zone}, Los Cabos
              </div>
              <div className="flex items-center gap-1.5 text-off-white/60 text-sm">
                <Clock size={14} className="text-gold" />
                ~{hotel.driveMinutes} min from SJD Airport
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Pricing + CTA ── */}
      <section className="py-12 px-4 -mt-6 relative z-10">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="glass-card rounded-2xl p-8 border border-border grid sm:grid-cols-3 gap-6 items-center"
          >
            <div className="sm:col-span-2 space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="bg-gold/10 border border-gold/30 rounded-xl px-5 py-3 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">One Way</p>
                  <p className="font-display text-3xl font-bold text-gold">${price}</p>
                  <p className="text-xs text-muted-foreground">per vehicle · up to 5 pax</p>
                </div>
                <div className="bg-muted/50 rounded-xl px-5 py-3 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Round Trip</p>
                  <p className="font-display text-3xl font-bold text-foreground">${roundPrice}</p>
                  <p className="text-xs text-muted-foreground">per vehicle · up to 5 pax</p>
                </div>
              </div>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                {['Flight tracking included', 'No charge for delays', 'Bilingual driver', 'Door-to-door service', 'Cold beverages', 'Free cancellation 48h'].map((f) => (
                  <li key={f} className="flex items-center gap-1.5">
                    <span className="text-gold font-bold">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                to={`/book?hotel=${encodeURIComponent(hotel.name)}&zone=${encodeURIComponent(hotel.zone)}`}
                className="gold-gradient text-secondary-foreground px-6 py-4 rounded-full font-bold text-sm hover:brightness-110 transition-all gold-glow flex items-center justify-center gap-2 group"
              >
                Book This Transfer <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="https://wa.me/5216241222174"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-[#20bd5a] transition-colors flex items-center justify-center gap-2"
              >
                WhatsApp Us
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── About the transfer ── */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl grid md:grid-cols-2 gap-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              About Your Transfer to {hotel.name}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Class VIP Transfers provides premium private airport transportation from Los Cabos
              International Airport (SJD) to {hotel.name}. With over 30 years of experience serving
              the Los Cabos corridor, we guarantee a smooth, comfortable, and punctual transfer every time.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Your professional bilingual driver will meet you at arrivals holding a sign with your name,
              assist with all luggage, and take you directly to {hotel.name} in a late-model luxury
              Mercedes Sprinter van — fully air-conditioned with cold beverages waiting.
            </p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }}>
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              About {hotel.zone}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">{zoneDesc}</p>
            <div className="flex flex-col gap-3">
              {[
                { icon: <Car size={16} />, label: 'Mercedes Sprinter Van', detail: '1–14 passengers' },
              ].map((v) => (
                <div key={v.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                  <span className="text-gold">{v.icon}</span>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{v.label}</p>
                    <p className="text-xs text-muted-foreground">{v.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="section-divider mx-auto max-w-3xl" />

      {/* ── FAQ ── */}
      <section className="py-16 px-4 section-light">
        <div className="container mx-auto max-w-3xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-10 text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Frequently Asked Questions
            </h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="glass-card rounded-xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-2 text-sm">{faq.q}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TripAdvisor trust ── */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="navy-gradient rounded-2xl p-8 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 shimmer pointer-events-none" />
            <div className="flex justify-center gap-0.5 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={18} className="fill-gold text-gold" />
              ))}
            </div>
            <p className="text-off-white/80 text-sm mb-4 max-w-md mx-auto">
              "Rated #1 Transfer Service in Los Cabos on TripAdvisor — Certificate of Excellence"
            </p>
            <a
              href="https://www.tripadvisor.com.mx/Attraction_Review-g152515-d10486878-Reviews-Class_VIP_Transfers-Cabo_San_Lucas_Los_Cabos_Baja_California.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gold border border-gold/30 px-5 py-2 rounded-full hover:bg-gold/10 transition-all"
            >
              Read our reviews <ArrowRight size={13} />
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
