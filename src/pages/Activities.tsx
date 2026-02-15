import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock, ArrowRight, Check, AlertTriangle, MessageCircle, Info } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const Activities = () => {
  const { t } = useLanguage();

  const includes = [
    'activities.include.transport', 'activities.include.safety', 'activities.include.guide',
    'activities.include.water', 'activities.include.kidsClub', 'activities.include.tequila', 'activities.include.lockers',
  ];

  const bringItems = [
    'activities.bring.clothes', 'activities.bring.shoes', 'activities.bring.sunscreen', 'activities.bring.payment',
  ];

  const activities = [
    { key: 'camel', duration: '1h', price: '$85', combo: true },
    { key: 'camelKids', duration: '1h', price: '$85', combo: true },
    { key: 'horseback', duration: '1h', price: '$80', combo: true },
    { key: 'atv', duration: '1h', price: '$95', combo: true, insurance: true },
    { key: 'doubleMoto', duration: '1h', price: '$95', combo: true, insurance: true },
    { key: 'rzr', duration: '1h', price: '$205+', combo: true, insurance: true, rzrPricing: true },
    { key: 'skyBikes', duration: '1h', price: '$70', combo: true },
    { key: 'fishing', duration: '4h', price: null, combo: false },
    { key: 'sunset', duration: '2h', price: null, combo: false },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="navy-gradient pt-36 pb-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="font-display text-4xl md:text-6xl font-bold mb-4 text-off-white">
            {t('activities.hero.title')}
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.1 }} className="text-off-white/60 text-lg max-w-2xl mx-auto">
            {t('activities.hero.subtitle')}
          </motion.p>
        </div>
      </section>

      {/* All Include + What to Bring */}
      <section className="py-16 px-4 -mt-8">
        <div className="container mx-auto max-w-4xl grid md:grid-cols-2 gap-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="glass-card rounded-2xl p-6 border border-border">
            <h3 className="font-display text-lg font-bold mb-4">{t('activities.allInclude.title')}</h3>
            <ul className="space-y-2.5">
              {includes.map((key, i) => (
                <li key={i} className="text-sm flex items-center gap-2">
                  <Check size={14} className="text-gold flex-shrink-0" /> {t(key)}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6 border border-border">
            <h3 className="font-display text-lg font-bold mb-4">{t('activities.whatToBring')}</h3>
            <ul className="space-y-2.5">
              {bringItems.map((key, i) => (
                <li key={i} className="text-sm flex items-center gap-2">
                  <Check size={14} className="text-primary flex-shrink-0" /> {t(key)}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Combos */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-8">
            <h2 className="font-display text-3xl font-bold mb-2">{t('activities.combos.title')}</h2>
            <p className="text-muted-foreground">{t('activities.combos.save')}</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="glass-card rounded-2xl p-6 text-center premium-card border border-border">
              <p className="text-gold text-3xl font-bold mb-1">$100 <span className="text-sm text-muted-foreground font-normal">USD</span></p>
              <p className="text-foreground/70 text-sm">{t('activities.combo.2')}</p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }}
              className="glass-card rounded-2xl p-6 text-center premium-card border-2 border-gold/30 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 gold-gradient text-navy text-xs font-bold px-3 py-1 rounded-full">
                {t('home.activities.bestValue')}
              </span>
              <p className="text-gold text-3xl font-bold mb-1">$125 <span className="text-sm text-muted-foreground font-normal">USD</span></p>
              <p className="text-foreground/70 text-sm">{t('activities.combo.3')}</p>
            </motion.div>
          </div>
          <div className="text-center">
            <Link to="/book-activities" className="gold-gradient text-navy px-8 py-3.5 rounded-full font-bold text-sm inline-flex items-center gap-2 hover:brightness-110 transition-all gold-glow">
              {t('activities.bookCombo')} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <div className="section-divider mx-auto max-w-2xl my-8" />

      {/* Activities Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activities.map((act, i) => (
              <motion.div key={i} variants={fadeUp}
                className="glass-card rounded-xl p-6 premium-card border border-border">
                <h3 className="font-display text-lg font-bold mb-1">{t(`activity.${act.key}`)}</h3>
                <p className="text-muted-foreground text-sm mb-3">{t(`activity.${act.key}.desc`)}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><Clock size={13} /> {act.duration}</span>
                  {act.price ? (
                    <span className="text-gold font-bold">{act.price} USD</span>
                  ) : (
                    <span className="text-primary font-medium italic">{t('activities.quoteOnRequest')}</span>
                  )}
                </div>

                {/* Accordion for details */}
                <Accordion type="single" collapsible>
                  {act.rzrPricing && (
                    <AccordionItem value="rzr" className="border-none">
                      <AccordionTrigger className="text-xs text-gold py-2 hover:no-underline">RZR Pricing</AccordionTrigger>
                      <AccordionContent className="text-xs text-muted-foreground space-y-1">
                        <p>{t('activity.rzr.1pax')}</p>
                        <p>{t('activity.rzr.2pax')}</p>
                        <p>{t('activity.rzr.3pax')}</p>
                        <p>{t('activity.rzr.4pax')}</p>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  {act.insurance && (
                    <AccordionItem value="insurance" className="border-none">
                      <AccordionTrigger className="text-xs text-muted-foreground py-2 hover:no-underline">
                        <span className="flex items-center gap-1"><AlertTriangle size={12} /> {t('activities.vehicleInsurance').split(':')[0]}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-xs text-muted-foreground">
                        {t('activities.vehicleInsurance')}
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>

                {/* CTA */}
                {act.price ? (
                  <Link to="/book-activities" className="text-gold text-xs font-semibold flex items-center gap-1 mt-2 hover:gap-2 transition-all">
                    {t('common.bookNow')} <ArrowRight size={12} />
                  </Link>
                ) : (
                  <a href="https://wa.me/526241234567" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#25D366] mt-2">
                    <MessageCircle size={12} /> {t('activities.contactWhatsApp')}
                  </a>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Park Fee Note */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-start gap-3 bg-accent/60 rounded-xl p-4 border border-border">
            <Info size={18} className="text-gold flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">{t('activities.parkFee')}</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="navy-gradient py-20 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold mb-4 text-off-white">
            {t('activities.cta.title')}
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }} className="text-off-white/60 mb-8">
            {t('activities.cta.subtitle')}
          </motion.p>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.2 }}>
            <Link to="/book-activities" className="gold-gradient text-navy px-8 py-3.5 rounded-full font-bold text-sm inline-flex items-center gap-2 hover:brightness-110 transition-all gold-glow">
              {t('home.activities.bookActivities')} <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Activities;
