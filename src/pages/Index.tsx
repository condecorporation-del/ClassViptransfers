import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, MapPin, Clock, Headphones, ArrowRight, Star, ChevronDown, Trophy, Car, Users, Quote, Plane, Sparkles, CheckCircle2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import heroImg1 from '@/assets/hero-luxury-1.jpg';
import heroImg2 from '@/assets/hero-luxury-2.jpg';
import heroImg3 from '@/assets/hero-luxury-3.jpg';

const heroImages = [heroImg1, heroImg2, heroImg3];

const heroTexts = [
  { titleKey: 'hero.title', subtitleKey: 'hero.subtitle' },
  { titleKey: 'hero.title2', subtitleKey: 'hero.subtitle2' },
  { titleKey: 'hero.title3', subtitleKey: 'hero.subtitle3' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

const Index = () => {
  const { t } = useLanguage();
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage(prev => (prev + 1) % heroImages.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { value: '30+', label: t('trust.years') },
    { value: '15K+', label: t('stats.trips') },
    { value: '4.9', label: t('stats.rating'), icon: <Star size={16} className="fill-gold text-gold" /> },
    { value: '24/7', label: t('trust.support') },
  ];

  const activities = [
    { key: 'activity.camel', duration: '1h', price: '$120', slug: 'camel-ride' },
    { key: 'activity.horseback', duration: '1h', price: '$120', slug: 'horseback-riding' },
    { key: 'activity.atv', duration: '2h', price: '$120', slug: 'atv' },
    { key: 'activity.rzr', duration: '2h', price: '$205+', slug: 'utv-adventure' },
    { key: 'activity.sunset', duration: '—', price: t('activities.quoteOnRequest'), slug: null },
    { key: 'activity.fishing', duration: '—', price: t('activities.quoteOnRequest'), slug: null },
  ];

  const steps = [
    { num: '01', titleKey: 'howItWorks.step1.title', descKey: 'howItWorks.step1.desc', icon: <Plane size={24} /> },
    { num: '02', titleKey: 'howItWorks.step2.title', descKey: 'howItWorks.step2.desc', icon: <CheckCircle2 size={24} /> },
    { num: '03', titleKey: 'howItWorks.step3.title', descKey: 'howItWorks.step3.desc', icon: <Sparkles size={24} /> },
  ];

  const testimonials = [
    { name: 'Sarah M.', location: t('testimonial.1.location'), key: 'testimonial.1.text', rating: 5 },
    { name: 'James & Lisa R.', location: t('testimonial.2.location'), key: 'testimonial.2.text', rating: 5 },
    { name: 'Carlos G.', location: t('testimonial.3.location'), key: 'testimonial.3.text', rating: 5 },
  ];

  const includes = [
    t('transfers.included.meetGreet'),
    t('transfers.included.flight'),
    t('transfers.included.water'),
    t('transfers.included.bilingual'),
    t('transfers.included.wifi'),
    t('transfers.included.door'),
  ];

  return (
    <div className="overflow-hidden">
      {/* ===== HERO (dark cinematic) ===== */}
      <section className="relative h-screen min-h-[700px] overflow-hidden">
        {/* All images stacked — crossfade via opacity, no unmounting = no gray flash */}
        {heroImages.map((img, i) => (
          <motion.div
            key={i}
            animate={{
              opacity: currentImage === i ? 1 : 0,
              scale: currentImage === i ? 1.05 : 1.12,
            }}
            transition={{ opacity: { duration: 1.2, ease: 'easeInOut' }, scale: { duration: 8, ease: 'linear' } }}
            className="absolute inset-0"
          >
            <img
              src={img}
              alt={`Los Cabos luxury ${i + 1}`}
              className="w-full h-full object-cover"
              {...(i === 0 ? { fetchPriority: 'high' as const } : { loading: 'eager' as const })}
            />
          </motion.div>
        ))}

        <div className="absolute inset-0 hero-overlay" />
        <div className="absolute inset-0 vignette" />

        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-2 mb-6"
          >
            <div className="h-px w-8 bg-gold/60" />
            <span className="font-accent text-gold text-sm tracking-[0.3em] uppercase">{t('hero.eyebrow')}</span>
            <div className="h-px w-8 bg-gold/60" />
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentImage}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 max-w-5xl text-white text-luxury-shadow leading-[1.1]">
                {t(heroTexts[currentImage].titleKey)}
              </h1>
              <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light font-accent">
                {t(heroTexts[currentImage].subtitleKey)}
              </p>
            </motion.div>
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex justify-center"
          >
            <Link
              to="/book"
              className="gold-gradient text-secondary-foreground px-12 py-5 rounded-full font-bold text-lg md:text-xl hover:brightness-110 transition-all gold-glow flex items-center gap-3 group shadow-2xl"
            >
              {t('hero.cta1')} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 flex gap-3">
          {heroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentImage(i)}
              className={`h-1.5 rounded-full transition-all duration-700 ${
                i === currentImage ? 'w-12 bg-gold' : 'w-4 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 z-10"
        >
          <ChevronDown size={28} />
        </motion.div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="relative -mt-16 z-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="container mx-auto max-w-5xl"
        >
          <div className="glass-card rounded-2xl p-8 grid grid-cols-2 md:grid-cols-4 gap-8 gradient-border">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="font-display text-3xl md:text-4xl font-bold text-gold">{stat.value}</span>
                  {stat.icon}
                </div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ===== TRANSFERS (bright) ===== */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <span className="font-accent text-gold text-sm tracking-[0.3em] uppercase mb-3 block">{t('hero.eyebrow')}</span>
            <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold mb-5 text-foreground">{t('home.transfers.title')}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg font-light">{t('home.transfers.subtitle')}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Private */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="glass-card rounded-2xl p-8 premium-card border border-border group relative overflow-hidden">
              <div className="absolute top-0 right-0 gold-gradient text-secondary-foreground text-[10px] font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-wider">
                {t('transfers.private.badge')}
              </div>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center">
                  <Car size={24} className="text-secondary-foreground" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold text-foreground">{t('home.transfers.private')}</h3>
                  <p className="text-muted-foreground text-sm">{t('home.transfers.privateDesc')}</p>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between bg-sand-light rounded-xl px-5 py-4 border border-border/50">
                  <div>
                    <span className="text-sm font-semibold text-foreground">{t('home.transfers.privateSuburban')}</span>
                    <span className="text-muted-foreground text-xs ml-2">{t('home.transfers.privateSuburbanPax')}</span>
                  </div>
                  <span className="text-gold font-bold text-lg">{t('home.transfers.privateSuburbanPrice')}</span>
                </div>
                <div className="flex items-center justify-between bg-sand-light rounded-xl px-5 py-4 border border-border/50">
                  <div>
                    <span className="text-sm font-semibold text-foreground">{t('home.transfers.privateSprinter')}</span>
                    <span className="text-muted-foreground text-xs ml-2">{t('home.transfers.privateSprinterPax')}</span>
                  </div>
                  <span className="text-gold font-bold text-lg">{t('home.transfers.privateSprinterPrice')}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {includes.slice(0, 4).map((inc, i) => (
                  <span key={i} className="text-[11px] text-muted-foreground bg-sand-light px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={10} className="text-gold" /> {inc}
                  </span>
                ))}
              </div>
              <Link to="/book" className="gold-gradient text-secondary-foreground px-8 py-3.5 rounded-full text-sm font-bold inline-flex items-center gap-2 hover:brightness-110 transition-all gold-glow group">
                {t('home.transfers.bookThis')} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* Shuttle */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.15 }}
              className="glass-card rounded-2xl p-8 premium-card border border-border group">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-ocean/10 border border-ocean/20 flex items-center justify-center">
                  <Users size={24} className="text-ocean" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold text-foreground">{t('home.transfers.shuttle')}</h3>
                  <p className="text-muted-foreground text-sm">{t('home.transfers.shuttleDesc')}</p>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between bg-sand-light rounded-xl px-5 py-4 border border-border/50">
                  <div>
                    <span className="text-sm font-semibold text-foreground">{t('home.transfers.shuttleSprinter')}</span>
                    <span className="text-muted-foreground text-xs ml-2">{t('home.transfers.shuttleSprinterPax')}</span>
                  </div>
                  <span className="text-gold font-bold text-lg">{t('home.transfers.shuttlePrice')}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {includes.slice(0, 4).map((inc, i) => (
                  <span key={i} className="text-[11px] text-muted-foreground bg-sand-light px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={10} className="text-gold" /> {inc}
                  </span>
                ))}
              </div>
              <Link to="/book" className="border-2 border-gold/40 text-gold px-8 py-3.5 rounded-full text-sm font-bold inline-flex items-center gap-2 hover:bg-gold/10 transition-all group">
                {t('home.transfers.bookThis')} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="section-divider mx-auto max-w-3xl" />

      {/* ===== ACTIVITIES (warm sand bg) ===== */}
      <section className="py-24 px-4 section-light">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <span className="font-accent text-gold text-sm tracking-[0.3em] uppercase mb-3 block">{t('home.activities.eyebrow')}</span>
            <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold mb-5 text-foreground">{t('home.activities.title')}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg font-light">{t('home.activities.subtitle')}</p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10"
          >
            {activities.map((act, i) => {
              const CardWrapper = act.slug ? Link : 'div';
              const cardProps = act.slug ? { to: `/activities/${act.slug}` } : {};
              return (
                <motion.div key={i} variants={fadeUp}>
                  <CardWrapper {...cardProps as any}
                    className="glass-card rounded-xl p-6 premium-card border border-border text-center group block hover:border-gold/40 transition-all cursor-pointer">
                    <p className="font-display text-lg font-bold mb-2 text-foreground group-hover:text-gold transition-colors">{t(act.key)}</p>
                    <p className="text-muted-foreground text-xs flex items-center justify-center gap-1 mb-2">
                      <Clock size={12} /> {act.duration}
                    </p>
                    <p className="text-gold font-bold text-sm">{act.price}</p>
                    {act.slug && (
                      <p className="text-xs text-gold/70 mt-2 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details <ArrowRight size={10} />
                      </p>
                    )}
                  </CardWrapper>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid sm:grid-cols-2 gap-6 mb-8">
            <motion.div variants={fadeUp} className="glass-card rounded-2xl p-8 premium-card border border-border text-center">
              <p className="text-3xl mb-3">🎯</p>
              <p className="font-display text-2xl font-bold mb-2 text-foreground">{t('home.activities.combo')}</p>
              <p className="text-muted-foreground text-sm mb-3">{t('home.activities.comboActivities')}</p>
              <p className="text-gold text-3xl font-bold mb-4">{t('home.activities.comboPrice')}</p>
              <Link to="/book-activities" className="gold-gradient text-secondary-foreground px-8 py-3 rounded-full text-sm font-bold inline-flex items-center gap-2 hover:brightness-110 transition-all gold-glow">
                {t('home.activities.bookCombo')} <ArrowRight size={14} />
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} className="glass-card rounded-2xl p-8 premium-card border-2 border-gold/30 text-center relative overflow-hidden">
              <div className="absolute inset-0 shimmer pointer-events-none" />
              <span className="absolute -top-0 left-1/2 -translate-x-1/2 gold-gradient text-secondary-foreground text-[10px] font-bold px-4 py-1.5 rounded-b-lg uppercase tracking-wider">
                {t('home.activities.bestValue')}
              </span>
              <p className="text-3xl mb-3 mt-2">🔥</p>
              <p className="font-display text-2xl font-bold mb-2 text-foreground">{t('home.activities.crazyCombo')}</p>
              <p className="text-muted-foreground text-sm mb-3">{t('home.activities.crazyActivities')}</p>
              <p className="text-gold text-3xl font-bold mb-4">{t('home.activities.crazyPrice')}</p>
              <Link to="/book-activities" className="gold-gradient text-secondary-foreground px-8 py-3 rounded-full text-sm font-bold inline-flex items-center gap-2 hover:brightness-110 transition-all gold-glow">
                {t('home.activities.bookCrazyCombo')} <ArrowRight size={14} />
              </Link>
            </motion.div>
          </motion.div>

          <div className="text-center space-y-1 text-sm text-muted-foreground">
            <p>{t('home.activities.includesNote')}</p>
            <p>{t('home.activities.parkFeeNote')}</p>
          </div>
        </div>
      </section>

      <div className="section-divider mx-auto max-w-3xl" />

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <span className="font-accent text-gold text-sm tracking-[0.3em] uppercase mb-3 block">Simple Process</span>
            <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold mb-5 text-foreground">{t('howItWorks.title')}</h2>
            <p className="text-muted-foreground text-lg font-light">{t('howItWorks.subtitle')}</p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-3 gap-12">
            {steps.map((step, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-gold/30 to-transparent" />
                )}
                <div className="w-20 h-20 rounded-2xl gold-gradient flex items-center justify-center mx-auto mb-6 relative">
                  <span className="text-secondary-foreground">{step.icon}</span>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-background border-2 border-gold text-gold text-xs font-bold flex items-center justify-center">
                    {step.num}
                  </span>
                </div>
                <h4 className="font-display text-xl font-bold mb-3 text-foreground">{t(step.titleKey)}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">{t(step.descKey)}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="section-divider mx-auto max-w-3xl" />

      {/* ===== TESTIMONIALS (sand bg) ===== */}
      <section className="py-24 px-4 section-light">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <span className="font-accent text-gold text-sm tracking-[0.3em] uppercase mb-3 block">Guest Reviews</span>
            <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold mb-5 text-foreground">{t('testimonials.title')}</h2>
            <p className="text-muted-foreground text-lg font-light">{t('testimonials.subtitle')}</p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-3 gap-6">
            {testimonials.map((test, i) => (
              <motion.div key={i} variants={fadeUp}
                className="glass-card rounded-2xl p-8 premium-card border border-border relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
                <Quote size={28} className="text-gold/20 mb-4" />
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: test.rating }).map((_, j) => (
                    <Star key={j} size={14} className="fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-foreground/80 mb-6 italic leading-relaxed font-accent text-lg">"{t(test.key)}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center text-secondary-foreground font-bold text-sm">
                    {test.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-gold font-semibold text-sm">{test.name}</p>
                    <p className="text-muted-foreground text-xs">{test.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="section-divider mx-auto max-w-3xl" />

      {/* ===== FAQ ===== */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-5 text-foreground">{t('faq.title')}</h2>
          </motion.div>
          <Accordion type="single" collapsible className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <AccordionItem key={i} value={`faq-${i}`} className="glass-card rounded-xl border border-border px-6 data-[state=open]:border-gold/30 transition-colors">
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-5">
                  {t(`faq.${i}.q`)}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm pb-5 leading-relaxed">
                  {t(`faq.${i}.a`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ===== CTA BANNER (dark) ===== */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="navy-gradient rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 shimmer pointer-events-none" />
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-off-white">{t('cta.title')}</h2>
            <p className="text-off-white/60 text-lg font-light max-w-lg mx-auto mb-8">{t('cta.subtitle')}</p>
            <div className="flex justify-center">
              <Link
                to="/book"
                className="gold-gradient text-secondary-foreground px-12 py-5 rounded-full font-bold text-lg md:text-xl hover:brightness-110 transition-all gold-glow flex items-center gap-3 group shadow-2xl"
              >
                {t('hero.cta1')} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;