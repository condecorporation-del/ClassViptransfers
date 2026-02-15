import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, Check, Shield, Users, Plane, Clock, Wifi, Droplets, User, MapPin } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

const Transfers = () => {
  const { t } = useLanguage();

  const privateFeatures = [
    'transfers.private.f1', 'transfers.private.f2', 'transfers.private.f3', 'transfers.private.f4',
    'transfers.private.f5', 'transfers.private.f6', 'transfers.private.f7', 'transfers.private.f8',
  ];

  const shuttleFeatures = [
    'transfers.shuttle.f1', 'transfers.shuttle.f2', 'transfers.shuttle.f3', 'transfers.shuttle.f4', 'transfers.shuttle.f5',
  ];

  const included = [
    { icon: <User size={20} />, key: 'transfers.included.meetGreet' },
    { icon: <Plane size={20} />, key: 'transfers.included.flight' },
    { icon: <Droplets size={20} />, key: 'transfers.included.water' },
    { icon: <MapPin size={20} />, key: 'transfers.included.door' },
    { icon: <Users size={20} />, key: 'transfers.included.bilingual' },
    { icon: <Wifi size={20} />, key: 'transfers.included.wifi' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="navy-gradient pt-36 pb-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="font-display text-4xl md:text-6xl font-bold mb-4 text-off-white">
            {t('transfers.hero.title')}
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.1 }} className="text-off-white/60 text-lg max-w-2xl mx-auto">
            {t('transfers.hero.subtitle')}
          </motion.p>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 px-4 -mt-8">
        <div className="container mx-auto max-w-6xl grid md:grid-cols-2 gap-6">
          {/* Private */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="glass-card rounded-2xl p-8 premium-card border-2 border-gold/20 relative">
            <span className="absolute -top-3 left-6 gold-gradient text-navy text-xs font-bold px-3 py-1 rounded-full">
              {t('transfers.private.badge')}
            </span>
            <h2 className="font-display text-2xl font-bold mt-2 mb-2">{t('transfers.private.title')}</h2>
            <p className="text-muted-foreground text-sm mb-6">{t('transfers.private.desc')}</p>
            <ul className="space-y-3 mb-8">
              {privateFeatures.map((key, i) => (
                <li key={i} className="text-sm text-foreground/80 flex items-center gap-2.5">
                  <Check size={14} className="text-gold flex-shrink-0" /> {t(key)}
                </li>
              ))}
            </ul>
            <Link to="/book" className="gold-gradient text-navy px-6 py-3 rounded-full text-sm font-bold inline-flex items-center gap-2 hover:brightness-110 transition-all gold-glow">
              {t('transfers.bookPrivate')} <ArrowRight size={16} />
            </Link>
          </motion.div>

          {/* Shuttle */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-8 premium-card border border-border">
            <h2 className="font-display text-2xl font-bold mt-2 mb-2">{t('transfers.shuttle.title')}</h2>
            <p className="text-muted-foreground text-sm mb-6">{t('transfers.shuttle.desc')}</p>
            <ul className="space-y-3 mb-8">
              {shuttleFeatures.map((key, i) => (
                <li key={i} className="text-sm text-foreground/80 flex items-center gap-2.5">
                  <Check size={14} className="text-primary flex-shrink-0" /> {t(key)}
                </li>
              ))}
            </ul>
            <Link to="/book" className="border border-border text-foreground px-6 py-3 rounded-full text-sm font-bold inline-flex items-center gap-2 hover:bg-accent transition-all">
              {t('transfers.bookShuttle')} <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="font-display text-3xl font-bold text-center mb-10">
            {t('transfers.included.title')}
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {included.map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.05 }}
                className="glass-card rounded-xl p-5 text-center premium-card border border-border">
                <div className="text-gold mb-2 flex justify-center">{item.icon}</div>
                <p className="text-sm font-medium">{t(item.key)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cancellation Policy */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-2xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="glass-card rounded-2xl p-8 text-center border border-border">
            <Shield size={32} className="text-gold mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold mb-3">{t('transfers.cancellation.title')}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{t('transfers.cancellation.desc')}</p>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="navy-gradient py-20 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold mb-4 text-off-white">
            {t('transfers.cta.title')}
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }} className="text-off-white/60 mb-8">
            {t('transfers.cta.subtitle')}
          </motion.p>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.2 }}>
            <Link to="/book" className="gold-gradient text-navy px-8 py-3.5 rounded-full font-bold text-sm inline-flex items-center gap-2 hover:brightness-110 transition-all gold-glow">
              {t('nav.bookNow')} <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Transfers;
