import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, Check, Shield, Car, MessageCircle } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { PriceTable } from '@/components/Pricing/PriceTable';
import { TrustBadges } from '@/components/trust/TrustBadges';
import { WhyChooseUs } from '@/components/trust/WhyChooseUs';
import { ContactInfo } from '@/components/trust/ContactInfo';
import { TestimonialsCarousel } from '@/components/trust/TestimonialsCarousel';
import { FAQ } from '@/components/trust/FAQ';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

const Transfers = () => {
  const { t, lang } = useLanguage();

  const included = [
    { key: 'transfers.included.flight' },
    { key: 'transfers.included.water' },
    { key: 'transfers.included.door' },
    { key: 'transfers.included.bilingual' },
    { key: 'transfers.included.wifi' },
  ];

  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Private Airport Transfer Los Cabos',
    provider: { '@type': 'LocalBusiness', name: 'Class VIP Transfers' },
    areaServed: { '@type': 'Place', name: 'Los Cabos, Baja California Sur, Mexico' },
    description: 'Private luxury SUV and Sprinter transfers from SJD airport to hotels in Cabo San Lucas, San Jose del Cabo, Tourist Corridor, and Pacific area.',
    offers: { '@type': 'Offer', priceCurrency: 'USD', price: '90', priceValidUntil: '2027-12-31' },
  };

  return (
    <div>
      <SEO
        title="Private Airport Transfers"
        description="Private luxury SUV & Sprinter transfers from SJD airport to your hotel. Flight tracking, meet & greet, cold beverages included. Book your Los Cabos airport transfer now."
        keywords="SJD airport transfer, cabo san lucas private transfer, los cabos luxury van, cabo airport shuttle, tourist corridor transfer, private driver cabo, san jose del cabo transportation"
        jsonLd={serviceLd}
      />
      {/* Hero - dark */}
      <section className="navy-gradient pt-36 pb-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="font-display text-4xl md:text-6xl font-bold mb-4 text-off-white">
            {t('transfers.hero.title')}
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.1 }} className="text-off-white/70 text-lg max-w-2xl mx-auto">
            {t('transfers.hero.subtitle')}
          </motion.p>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.2 }} className="mt-8">
            <TrustBadges compact dark />
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-4 section-light">
        <div className="container mx-auto max-w-6xl">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="font-display text-3xl font-bold text-center mb-4 text-foreground">
            {t('whyChoose.title')}
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.05 }} className="text-muted-foreground text-center text-sm mb-10 max-w-2xl mx-auto">
            {t('whyChoose.subtitle')}
          </motion.p>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }}>
            <WhyChooseUs />
          </motion.div>
        </div>
      </section>

      {/* Private transfer - single option */}
      <section id="compare" className="py-20 px-4 -mt-8 scroll-mt-24">
        <div className="container mx-auto max-w-xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="glass-card rounded-2xl p-8 premium-card border-2 border-gold/20 relative cursor-default"
          >
            <span className="absolute -top-3 left-6 gold-gradient text-secondary-foreground text-xs font-bold px-3 py-1 rounded-full">
              {t('transfers.private.badge')}
            </span>
            <div className="flex items-center gap-3 mb-4 mt-2">
              <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center">
                <Car size={20} className="text-secondary-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">{t('transfers.private.title')}</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{t('transfers.private.desc')}</p>
            <p className="text-sm text-muted-foreground mb-6">
              {t('transfers.private.pricingNote', { defaultValue: 'Precios por zona y vehículo en el tabulador abajo.' })}
            </p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link to="/book" className="gold-gradient text-secondary-foreground px-6 py-3 rounded-full text-sm font-bold inline-flex items-center gap-2 hover:brightness-110 transition-all gold-glow w-full justify-center">
                {t('transfers.bookThis')} <ArrowRight size={16} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Price Table - Dynamic from BD */}
      <section id="pricing" className="py-16 px-4 section-light scroll-mt-24">
        <div className="container mx-auto max-w-6xl">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="font-display text-3xl font-bold text-center mb-4 text-foreground">
            {t('transfers.pricing.title', { defaultValue: 'Precios por zona' })}
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.05 }} className="text-muted-foreground text-center text-sm mb-10 max-w-2xl mx-auto">
            {t('transfers.pricing.subtitle', { defaultValue: 'Selecciona tu vehículo y consulta los precios. Todos los precios en USD, trayecto sencillo.' })}
          </motion.p>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }}>
            <PriceTable />
          </motion.div>
        </div>
      </section>

      {/* What's Included */}
      <section id="included" className="py-16 px-4 section-light scroll-mt-24">
        <div className="container mx-auto max-w-4xl">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="font-display text-3xl font-bold text-center mb-10 text-foreground">
            {t('transfers.included.title')}
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {included.map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.05 }}
                className="glass-card rounded-xl p-5 premium-card border border-border flex items-center gap-3">
                <Check size={18} className="text-gold flex-shrink-0" />
                <p className="text-sm font-medium text-foreground">{t(item.key)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cancellation Policy - 24h free badge visible */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-2xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="glass-card rounded-2xl p-8 text-center border border-border relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 gold-gradient text-secondary-foreground text-xs font-bold px-4 py-1.5 rounded-full">
              {t('transfers.cancellation.badge')}
            </span>
            <Shield size={32} className="text-gold mx-auto mb-4 mt-2" />
            <h3 className="font-display text-xl font-bold mb-3 text-foreground">{t('transfers.cancellation.title')}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{t('transfers.cancellation.desc')}</p>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 section-light">
        <div className="container mx-auto max-w-3xl">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="font-display text-3xl font-bold text-center mb-4 text-foreground">
            {t('testimonials.title')}
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.05 }} className="text-muted-foreground text-center text-sm mb-10">
            {t('testimonials.subtitle')}
          </motion.p>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }}>
            <TestimonialsCarousel />
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-2xl">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="font-display text-3xl font-bold text-center mb-10 text-foreground">
            {t('faq.title')}
          </motion.h2>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.05 }}>
            <FAQ />
          </motion.div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16 px-4 section-light">
        <div className="container mx-auto max-w-4xl">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="font-display text-3xl font-bold text-center mb-4 text-foreground">
            {t('contact.info.title')}
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.05 }} className="text-muted-foreground text-center text-sm mb-10 max-w-xl mx-auto">
            {lang === 'es' ? 'Estamos aquí para ayudarte. Contáctanos por teléfono, WhatsApp o email.' : 'We\'re here to help. Reach us by phone, WhatsApp, or email.'}
          </motion.p>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }}>
            <ContactInfo />
          </motion.div>
        </div>
      </section>

      {/* CTA - dark */}
      <section className="navy-gradient py-20 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold mb-4 text-off-white">
            {t('transfers.cta.title')}
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }} className="text-off-white/70 mb-8">
            {t('transfers.cta.subtitle')}
          </motion.p>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.2 }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book" className="gold-gradient text-secondary-foreground px-8 py-3.5 rounded-full font-bold text-sm inline-flex items-center gap-2 hover:brightness-110 transition-all gold-glow">
              {t('nav.bookNow')} <ArrowRight size={16} />
            </Link>
            <a href="https://wa.me/5216241222174?text=Hello%2C%20I%27d%20like%20to%20book%20a%20transfer" target="_blank" rel="noopener noreferrer"
              className="border border-off-white/25 text-off-white px-8 py-3.5 rounded-full font-bold text-sm inline-flex items-center gap-2 hover:bg-white/5 transition-all">
              <MessageCircle size={16} /> {t('transfers.cta.chat')}
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Transfers;