import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, MapPin, Clock, Headphones, ArrowRight, Star, ChevronDown, Trophy, Car, Users, Quote } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const heroImages = [
  'https://res.cloudinary.com/dpmozdkfh/image/upload/v1770770171/ChatGPT_Image_Feb_10_2026_05_35_19_PM_md3ey7.png',
  'https://res.cloudinary.com/dpmozdkfh/image/upload/v1766726559/Vista_1_sz3qkw.jpg',
  'https://res.cloudinary.com/dpmozdkfh/image/upload/v1770770334/ChatGPT_Image_Feb_10_2026_05_38_39_PM_hkunxs.png',
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const Index = () => {
  const { t } = useLanguage();
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage(prev => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const trustChips = [
    { icon: <Trophy size={18} />, label: t('trust.years') },
    { icon: <MapPin size={18} />, label: t('trust.experts') },
    { icon: <Shield size={18} />, label: t('trust.licensed') },
    { icon: <Headphones size={18} />, label: t('trust.support') },
  ];

  const activities = [
    { key: 'activity.camel', duration: '1h' },
    { key: 'activity.camelKids', duration: '1h' },
    { key: 'activity.horseback', duration: '1h' },
    { key: 'activity.atv', duration: '1h' },
    { key: 'activity.doubleMoto', duration: '1h' },
    { key: 'activity.rzr', duration: '1h' },
    { key: 'activity.skyBikes', duration: '1h' },
    { key: 'activity.fishing', duration: '4h' },
    { key: 'activity.sunset', duration: '2h' },
  ];

  const steps = [
    { num: '01', titleKey: 'howItWorks.step1.title', descKey: 'howItWorks.step1.desc' },
    { num: '02', titleKey: 'howItWorks.step2.title', descKey: 'howItWorks.step2.desc' },
    { num: '03', titleKey: 'howItWorks.step3.title', descKey: 'howItWorks.step3.desc' },
  ];

  const testimonials = [
    { name: 'Sarah M.', key: 'testimonial.1.text', rating: 5 },
    { name: 'James R.', key: 'testimonial.2.text', rating: 5 },
    { name: 'María G.', key: 'testimonial.3.text', rating: 5 },
  ];

  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="relative h-screen min-h-[600px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImage}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <img
              src={heroImages[currentImage]}
              alt="Los Cabos luxury"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Cinematic overlay */}
        <div className="absolute inset-0 hero-overlay" />

        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="font-display text-4xl sm:text-5xl md:text-7xl font-bold mb-4 max-w-4xl text-white"
          >
            {t('hero.title1')}
            <br />
            <span className="text-gold-gradient">{t('hero.title2')}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-white/70 text-lg md:text-xl max-w-2xl mb-10"
          >
            {t('hero.subtitle')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              to="/book"
              className="gold-gradient text-navy px-8 py-3.5 rounded-full font-bold text-base hover:brightness-110 transition-all gold-glow flex items-center gap-2"
            >
              {t('hero.cta1')} <ArrowRight size={18} />
            </Link>
            <Link
              to="/activities"
              className="border border-white/30 bg-white/5 backdrop-blur-sm px-8 py-3.5 rounded-full font-semibold text-base text-white hover:bg-white/10 transition-all flex items-center gap-2"
            >
              {t('hero.cta2')}
            </Link>
          </motion.div>
        </div>

        {/* Dots */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {heroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentImage(i)}
              className={`h-2 rounded-full transition-all duration-500 ${
                i === currentImage ? 'w-8 bg-gold' : 'w-2 bg-white/40'
              }`}
            />
          ))}
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 z-10"
        >
          <ChevronDown size={28} />
        </motion.div>
      </section>

      {/* ===== TRUST CHIPS ===== */}
      <section className="py-12 px-4">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="container mx-auto max-w-4xl flex flex-wrap justify-center gap-4"
        >
          {trustChips.map((chip, i) => (
            <motion.span
              key={i}
              variants={fadeUp}
              className="glass-card px-5 py-3 rounded-full text-sm font-medium text-foreground flex items-center gap-2.5 premium-card"
            >
              <span className="text-gold">{chip.icon}</span> {chip.label}
            </motion.span>
          ))}
        </motion.div>
      </section>

      <div className="section-divider mx-auto max-w-2xl" />

      {/* ===== TRANSFERS ===== */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-foreground">{t('home.transfers.title')}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t('home.transfers.subtitle')}</p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Private */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="glass-card rounded-2xl p-8 premium-card border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center">
                  <Car size={20} className="text-navy" />
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground">{t('home.transfers.private')}</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-5">{t('home.transfers.privateDesc')}</p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between bg-accent/50 rounded-lg px-4 py-3">
                  <span className="text-sm font-medium">{t('home.transfers.privateSuburban')}</span>
                  <span className="text-gold font-bold text-sm">{t('home.transfers.privateSuburbanPrice')}</span>
                </div>
                <div className="flex items-center justify-between bg-accent/50 rounded-lg px-4 py-3">
                  <span className="text-sm font-medium">{t('home.transfers.privateSprinter')}</span>
                  <span className="text-gold font-bold text-sm">{t('home.transfers.privateSprinterPrice')}</span>
                </div>
              </div>
              <Link to="/book" className="gold-gradient text-navy px-6 py-3 rounded-full text-sm font-bold inline-flex items-center gap-2 hover:brightness-110 transition-all gold-glow">
                {t('home.transfers.bookThis')} <ArrowRight size={14} />
              </Link>
            </motion.div>

            {/* Shuttle */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }}
              className="glass-card rounded-2xl p-8 premium-card border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users size={20} className="text-primary" />
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground">{t('home.transfers.shuttle')}</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-5">{t('home.transfers.shuttleDesc')}</p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between bg-accent/50 rounded-lg px-4 py-3">
                  <span className="text-sm font-medium">{t('home.transfers.shuttleSprinter')}</span>
                  <span className="text-gold font-bold text-sm">{t('home.transfers.shuttlePrice')}</span>
                </div>
              </div>
              <Link to="/book" className="border border-border text-foreground px-6 py-3 rounded-full text-sm font-bold inline-flex items-center gap-2 hover:bg-accent transition-all">
                {t('home.transfers.bookThis')} <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="section-divider mx-auto max-w-2xl" />

      {/* ===== ACTIVITIES ===== */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-8">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">{t('home.activities.title')}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t('home.activities.subtitle')}</p>
          </motion.div>

          {/* Grid */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 mb-8"
          >
            {activities.map((act, i) => (
              <motion.div key={i} variants={fadeUp}
                className="glass-card rounded-xl p-5 premium-card border border-border text-center">
                <p className="font-display text-base font-bold mb-1">{t(act.key)}</p>
                <p className="text-muted-foreground text-xs flex items-center justify-center gap-1">
                  <Clock size={12} /> {act.duration}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Combo cards */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid sm:grid-cols-2 gap-4 mb-8">
            <motion.div variants={fadeUp} className="glass-card rounded-2xl p-6 premium-card border border-border text-center">
              <p className="font-display text-xl font-bold mb-1">{t('home.activities.combo')}</p>
              <p className="text-gold text-2xl font-bold mb-1">$100 <span className="text-sm text-muted-foreground font-normal">USD</span></p>
              <p className="text-muted-foreground text-sm">{t('home.activities.comboDesc')}</p>
            </motion.div>
            <motion.div variants={fadeUp} className="glass-card rounded-2xl p-6 premium-card border-2 border-gold/30 text-center relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 gold-gradient text-navy text-xs font-bold px-3 py-1 rounded-full">
                {t('home.activities.bestValue')}
              </span>
              <p className="font-display text-xl font-bold mb-1">{t('home.activities.crazyCombo')}</p>
              <p className="text-gold text-2xl font-bold mb-1">$125 <span className="text-sm text-muted-foreground font-normal">USD</span></p>
              <p className="text-muted-foreground text-sm">{t('home.activities.crazyComboDesc')}</p>
            </motion.div>
          </motion.div>

          <div className="text-center">
            <Link to="/book-activities" className="gold-gradient text-navy px-8 py-3.5 rounded-full font-bold text-sm inline-flex items-center gap-2 hover:brightness-110 transition-all gold-glow">
              {t('home.activities.bookActivities')} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <div className="section-divider mx-auto max-w-2xl" />

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">{t('howItWorks.title')}</h2>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-3 gap-10">
            {steps.map((step, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center">
                <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto mb-4">
                  <span className="text-navy font-bold text-lg">{step.num}</span>
                </div>
                <h4 className="font-display text-xl font-bold mb-2">{t(step.titleKey)}</h4>
                <p className="text-muted-foreground text-sm">{t(step.descKey)}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="section-divider mx-auto max-w-2xl" />

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">{t('testimonials.title')}</h2>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-3 gap-6">
            {testimonials.map((test, i) => (
              <motion.div key={i} variants={fadeUp}
                className="glass-card rounded-2xl p-6 premium-card border border-border">
                <Quote size={24} className="text-gold/30 mb-3" />
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: test.rating }).map((_, j) => (
                    <Star key={j} size={14} className="fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-foreground/80 text-sm mb-4 italic leading-relaxed">"{t(test.key)}"</p>
                <p className="text-gold font-semibold text-sm">{test.name}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="section-divider mx-auto max-w-2xl" />

      {/* ===== FAQ ===== */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">{t('faq.title')}</h2>
          </motion.div>
          <Accordion type="single" collapsible className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <AccordionItem key={i} value={`faq-${i}`} className="glass-card rounded-xl border border-border px-6 data-[state=open]:border-gold/30 transition-colors">
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-5">
                  {t(`faq.${i}.q`)}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm pb-5">
                  {t(`faq.${i}.a`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
};

export default Index;
