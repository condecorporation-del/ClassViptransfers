import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SEO } from '@/features/marketing/components/SEO';
import { useLanguage } from '@/shared/providers/LanguageContext';
import { activityData } from '@/features/marketing/data/activityData';
import {
  Clock, Car, Languages, Shield, Heart, Mountain, Zap, Leaf, UtensilsCrossed,
  Check, DollarSign, AlertTriangle, Info, ArrowRight, MessageCircle, ChevronLeft,
  Shirt, Footprints, Sun, CreditCard,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Clock, Car, Languages, Shield, Heart, Mountain, Zap, Leaf, UtensilsCrossed,
};

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

const Section = ({ children, className = '', dark = false }: { children: React.ReactNode; className?: string; dark?: boolean }) => (
  <section className={`py-14 px-4 ${dark ? 'section-light' : ''} ${className}`}>
    <div className="container mx-auto max-w-4xl">{children}</div>
  </section>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
    className="font-display text-2xl font-bold text-foreground mb-6">
    {children}
  </motion.h2>
);

const BulletItem = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
  <motion.div variants={fadeUp} className="flex items-start gap-3 text-sm text-foreground/85 leading-relaxed">
    <Icon size={16} className="text-gold mt-0.5 flex-shrink-0" />
    <span>{children}</span>
  </motion.div>
);

const ActivityDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();

  const activity = activityData.find(a => a.slug === slug);
  if (!activity) return <Navigate to="/activities" replace />;

  const t = (obj: { en: string; es: string }) => obj[lang];

  return (
    <div>
      <SEO
        title={t(activity.title)}
        description={t(activity.hook)}
        image={activity.heroImage}
        canonical={`https://classviptransfers.com/activities/${activity.slug}`}
        url={`https://classviptransfers.com/activities/${activity.slug}`}
        keywords={`Los Cabos activities, ${activity.title.en}, ${activity.title.es}, luxury tours Cabo`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'TouristTrip',
          name: t(activity.title),
          description: t(activity.hook),
          image: activity.heroImage,
          url: `https://classviptransfers.com/activities/${activity.slug}`,
          touristType: activity.experienceType[lang],
          offers: activity.price
            ? {
                '@type': 'Offer',
                priceCurrency: 'USD',
                price: activity.price.replace(/[^0-9.]/g, ''),
                availability: 'https://schema.org/InStock',
              }
            : undefined,
        }}
      />

      {/* Hero */}
      <section className="relative h-[70vh] min-h-[480px] flex items-end">
        <img src={activity.heroImage} alt={t(activity.title)} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="relative z-10 container mx-auto max-w-4xl px-4 pb-12">
          <Link to="/activities" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ChevronLeft size={16} /> {lang === 'en' ? 'All Activities' : 'Todas las Actividades'}
          </Link>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3">
            {t(activity.title)}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
            className="text-white/85 text-lg md:text-xl max-w-2xl mb-4 leading-relaxed">
            {t(activity.hook)}
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex items-center gap-4">
            {activity.price ? (
              <span className="text-gold text-2xl font-bold">{activity.price}<span className="text-white/60 text-sm font-normal ml-1.5">/person</span></span>
            ) : activity.pricingTable ? (
              <span className="text-gold text-lg font-bold">{lang === 'en' ? 'From' : 'Desde'} {activity.pricingTable[0].price}</span>
            ) : null}
            <span className="text-white/50 text-sm">+ $25 USD {lang === 'en' ? 'park fee' : 'entrada parque'}</span>
          </motion.div>
        </div>
      </section>

      {/* Quick Highlights */}
      <section className="py-8 px-4 border-b border-border">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="flex flex-wrap justify-center gap-6 md:gap-10">
            {activity.highlights.map((h, i) => {
              const IconComp = iconMap[h.icon] || Shield;
              return (
                <motion.div key={i} variants={fadeUp} className="flex flex-col items-center gap-2 text-center min-w-[100px]">
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                    <IconComp size={20} className="text-gold" />
                  </div>
                  <span className="text-xs font-medium text-foreground/80">{t(h.label)}</span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Experience Description */}
      <Section>
        <SectionTitle>{lang === 'en' ? 'The Experience' : 'La Experiencia'}</SectionTitle>
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-foreground/80 text-base md:text-lg leading-relaxed">
          {t(activity.description)}
        </motion.p>
      </Section>

      {/* Pricing Table (UTV) */}
      {activity.pricingTable && (
        <Section dark>
          <SectionTitle>{lang === 'en' ? 'Pricing' : 'Precios'}</SectionTitle>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {activity.pricingTable.map((row, i) => (
              <motion.div key={i} variants={fadeUp}
                className="glass-card rounded-xl p-5 text-center border border-border premium-card">
                <p className="text-gold text-xl font-bold mb-1">{row.price}</p>
                <p className="text-xs text-muted-foreground">{row.label}</p>
              </motion.div>
            ))}
          </motion.div>
          <p className="text-xs text-muted-foreground mt-4 text-center">+ $25 USD {lang === 'en' ? 'park entrance fee per person' : 'entrada al parque por persona'}</p>
        </Section>
      )}

      {/* What's Included */}
      <Section dark={!activity.pricingTable}>
        <SectionTitle>{lang === 'en' ? "What's Included" : 'Qué Incluye'}</SectionTitle>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="grid sm:grid-cols-2 gap-3">
          {activity.includes.map((item, i) => (
            <BulletItem key={i} icon={Check}>{t(item)}</BulletItem>
          ))}
        </motion.div>
      </Section>

      {/* Extra Costs */}
      <Section dark={!!activity.pricingTable}>
        <SectionTitle>{lang === 'en' ? 'Additional Costs' : 'Costos Adicionales'}</SectionTitle>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="space-y-3">
          {activity.extraCosts.map((item, i) => (
            <BulletItem key={i} icon={DollarSign}>{t(item)}</BulletItem>
          ))}
        </motion.div>
      </Section>

      {/* Before Booking */}
      <Section dark={!activity.pricingTable}>
        <SectionTitle>{lang === 'en' ? 'Before You Book' : 'Antes de Reservar'}</SectionTitle>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="glass-card rounded-2xl p-6 border border-ocean/20 bg-ocean/5">
          <div className="flex items-center gap-2 mb-4">
            <Info size={18} className="text-ocean" />
            <span className="text-sm font-semibold text-foreground">{lang === 'en' ? 'Important Information' : 'Información Importante'}</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {activity.beforeBooking.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                <Check size={14} className="text-ocean mt-0.5 flex-shrink-0" />
                <span>{t(item)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </Section>

      {/* Restrictions & Safety */}
      <Section dark={!!activity.pricingTable}>
        <SectionTitle>{lang === 'en' ? 'Restrictions & Safety' : 'Restricciones y Seguridad'}</SectionTitle>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="glass-card rounded-2xl p-6 border border-destructive/20 bg-destructive/5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-destructive" />
            <span className="text-sm font-semibold text-foreground">{lang === 'en' ? 'Please Read Carefully' : 'Lea Atentamente'}</span>
          </div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="space-y-2.5">
            {activity.restrictions.map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="flex items-start gap-2 text-sm text-foreground/80">
                <AlertTriangle size={13} className="text-destructive/60 mt-0.5 flex-shrink-0" />
                <span>{t(item)}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </Section>

      {/* Recommendations */}
      <Section dark={!activity.pricingTable}>
        <SectionTitle>{lang === 'en' ? 'What to Bring' : 'Qué Llevar'}</SectionTitle>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="flex flex-wrap gap-3">
          {activity.recommendations.map((item, i) => {
            const icons = [Shirt, Footprints, Sun, CreditCard];
            const Icon = icons[i] || Check;
            return (
              <motion.span key={i} variants={fadeUp}
                className="inline-flex items-center gap-2 bg-sand-light text-foreground text-sm px-4 py-2.5 rounded-full border border-border/50">
                <Icon size={14} className="text-gold" /> {t(item)}
              </motion.span>
            );
          })}
        </motion.div>
      </Section>

      {/* CTA */}
      <section className="py-20 px-4 navy-gradient">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-off-white mb-4">
              {lang === 'en' ? 'Ready to Experience This?' : '¿Listo para Vivir Esta Experiencia?'}
            </h2>
            <p className="text-off-white/70 mb-8 text-lg">
              {lang === 'en' ? 'Book now and secure your spot for an unforgettable adventure in Los Cabos.' : 'Reserva ahora y asegura tu lugar para una aventura inolvidable en Los Cabos.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/book-activities"
                className="gold-gradient text-secondary-foreground px-8 py-3.5 rounded-full text-base font-bold inline-flex items-center gap-2 hover:brightness-110 transition-all gold-glow">
                {lang === 'en' ? 'Reserve Experience' : 'Reservar Experiencia'} <ArrowRight size={18} />
              </Link>
              <a href={`https://wa.me/5216241222174?text=${encodeURIComponent(activity.whatsappMessage)}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-off-white/80 hover:text-white border border-off-white/30 px-6 py-3 rounded-full text-sm font-medium transition-colors">
                <MessageCircle size={16} /> {lang === 'en' ? 'Ask via WhatsApp' : 'Preguntar por WhatsApp'}
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ActivityDetail;
