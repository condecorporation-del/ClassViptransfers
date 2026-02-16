import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, Check, Shield, Car, Users, MessageCircle } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

const Transfers = () => {
  const { t } = useLanguage();

  const included = [
    { key: 'transfers.included.meetGreet' },
    { key: 'transfers.included.flight' },
    { key: 'transfers.included.water' },
    { key: 'transfers.included.door' },
    { key: 'transfers.included.bilingual' },
    { key: 'transfers.included.wifi' },
  ];

  return (
    <div>
      {/* Hero - dark */}
      <section className="navy-gradient pt-36 pb-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="font-display text-4xl md:text-6xl font-bold mb-4 text-off-white">
            {t('transfers.hero.title')}
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.1 }} className="text-off-white/70 text-lg max-w-2xl mx-auto">
            {t('transfers.hero.subtitle')}
          </motion.p>
        </div>
      </section>

      {/* Comparison - bright */}
      <section className="py-20 px-4 -mt-8">
        <div className="container mx-auto max-w-6xl grid md:grid-cols-2 gap-6">
          {/* Private */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="glass-card rounded-2xl p-8 premium-card border-2 border-gold/20 relative">
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
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between bg-sand-light rounded-xl px-4 py-3.5 border border-border/50">
                <div>
                  <span className="text-sm font-semibold text-foreground">{t('home.transfers.privateSuburban')}</span>
                  <span className="text-muted-foreground text-xs ml-1">{t('home.transfers.privateSuburbanPax')}</span>
                </div>
                <span className="text-gold font-bold text-sm">{t('home.transfers.privateSuburbanPrice')}</span>
              </div>
              <div className="flex items-center justify-between bg-sand-light rounded-xl px-4 py-3.5 border border-border/50">
                <div>
                  <span className="text-sm font-semibold text-foreground">{t('home.transfers.privateSprinter')}</span>
                  <span className="text-muted-foreground text-xs ml-1">{t('home.transfers.privateSprinterPax')}</span>
                </div>
                <span className="text-gold font-bold text-sm">{t('home.transfers.privateSprinterPrice')}</span>
              </div>
            </div>
            <Link to="/book" className="gold-gradient text-secondary-foreground px-6 py-3 rounded-full text-sm font-bold inline-flex items-center gap-2 hover:brightness-110 transition-all gold-glow w-full justify-center">
              {t('transfers.bookThis')} <ArrowRight size={16} />
            </Link>
          </motion.div>

          {/* Shuttle */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-8 premium-card border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-ocean/10 flex items-center justify-center">
                <Users size={20} className="text-ocean" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">{t('transfers.shuttle.title')}</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{t('transfers.shuttle.desc')}</p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between bg-sand-light rounded-xl px-4 py-3.5 border border-border/50">
                <div>
                  <span className="text-sm font-semibold text-foreground">{t('home.transfers.shuttleSprinter')}</span>
                  <span className="text-muted-foreground text-xs ml-1">{t('home.transfers.shuttleSprinterPax')}</span>
                </div>
                <span className="text-gold font-bold text-sm">{t('home.transfers.shuttlePrice')}</span>
              </div>
            </div>
            <Link to="/book" className="border-2 border-gold/40 text-gold px-6 py-3 rounded-full text-sm font-bold inline-flex items-center gap-2 hover:bg-gold/10 transition-all w-full justify-center">
              {t('transfers.bookThis')} <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 px-4 section-light">
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

      {/* Cancellation Policy */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-2xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="glass-card rounded-2xl p-8 text-center border border-border">
            <Shield size={32} className="text-gold mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold mb-3 text-foreground">{t('transfers.cancellation.title')}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{t('transfers.cancellation.desc')}</p>
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
            <a href="https://wa.me/526241234567?text=Hello%2C%20I%27d%20like%20to%20book%20a%20transfer" target="_blank" rel="noopener noreferrer"
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