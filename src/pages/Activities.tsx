import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, Check, MessageCircle } from 'lucide-react';
import { SEO } from '@/components/SEO';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

const Activities = () => {
  const { t } = useLanguage();

  const includes = [
    'activities.include.transport', 'activities.include.safety', 'activities.include.guide',
    'activities.include.water', 'activities.include.kidsClub', 'activities.include.tequila', 'activities.include.lockers',
  ];

  const bringItems = [
    'activities.bring.clothes', 'activities.bring.shoes', 'activities.bring.sunscreen', 'activities.bring.payment',
  ];

  return (
    <div>
      <SEO
        title="Adventure Activities & Tours"
        description="Book ATV, UTV, horseback riding, camel safari and more in Los Cabos. Transportation included. Perfect for families, couples and groups. Book your adventure today."
        keywords="ATV tour los cabos, cabo activities, UTV cabo san lucas, horseback riding cabo, camel safari los cabos, cabo adventure tours, things to do cabo san lucas"
      />
      {/* Hero - dark */}
      <section className="navy-gradient pt-36 pb-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="font-display text-4xl md:text-6xl font-bold mb-4 text-off-white">
            {t('activities.hero.title')}
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.1 }} className="text-off-white/70 text-lg max-w-2xl mx-auto">
            {t('activities.hero.subtitle')}
          </motion.p>
        </div>
      </section>

      {/* All Include - bright */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="font-display text-2xl font-bold text-center mb-8 text-foreground">
            All Activities Include
          </motion.h2>
          <div className="grid grid-cols-2 gap-x-10 gap-y-3 mb-8">
            {includes.map((key, i) => (
              <div key={i} className="text-sm flex items-center gap-2 text-foreground">
                <Check size={14} className="text-gold flex-shrink-0" /> {t(key)}
              </div>
            ))}
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="glass-card rounded-2xl p-6 border border-border">
            <h3 className="font-display text-sm font-bold mb-3 uppercase tracking-wider text-muted-foreground">What to Bring</h3>
            <div className="flex flex-wrap gap-2">
              {bringItems.map((key, i) => (
                <span key={i} className="bg-sand-light text-foreground text-xs px-3 py-1.5 rounded-full border border-border/50">{t(key)}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="section-divider mx-auto max-w-2xl" />

      {/* Combos - warm bg */}
      <section className="py-16 px-4 section-light">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-3">
            <h2 className="font-display text-3xl font-bold mb-2 text-foreground">Save with a Combo</h2>
            <p className="text-muted-foreground text-sm">All combo activities are 1 hour each at a preferential rate. ATV & RZR use basic models.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-4 mb-6 mt-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="glass-card rounded-2xl p-6 text-center premium-card border border-border">
              <p className="text-3xl mb-2">🎯</p>
              <p className="font-display text-xl font-bold mb-1 text-foreground">Combo</p>
              <p className="text-muted-foreground text-sm mb-3">Pick any 2 activities (1 hr each) + park fee</p>
              <p className="text-gold text-2xl font-bold mb-4">$100 <span className="text-sm text-muted-foreground font-normal">USD/person</span></p>
              <Link to="/book-activities" className="gold-gradient text-secondary-foreground px-6 py-2.5 rounded-full text-sm font-bold inline-flex items-center gap-2 hover:brightness-110 transition-all gold-glow">
                Book Combo <ArrowRight size={14} />
              </Link>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }}
              className="glass-card rounded-2xl p-6 text-center premium-card border-2 border-gold/30 relative">
              <span className="absolute -top-3 right-4 gold-gradient text-secondary-foreground text-xs font-bold px-3 py-1 rounded-full">
                BEST VALUE
              </span>
              <p className="text-3xl mb-2">🔥</p>
              <p className="font-display text-xl font-bold mb-1 text-foreground">Crazy Combo</p>
              <p className="text-muted-foreground text-sm mb-3">Pick any 3 activities (1 hr each) + park fee</p>
              <p className="text-gold text-2xl font-bold mb-4">$125 <span className="text-sm text-muted-foreground font-normal">USD/person</span></p>
              <Link to="/book-activities" className="gold-gradient text-secondary-foreground px-6 py-2.5 rounded-full text-sm font-bold inline-flex items-center gap-2 hover:brightness-110 transition-all gold-glow">
                Book Crazy Combo <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Yates & Masajes por WhatsApp */}
      <section className="py-10 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="glass-card rounded-2xl p-6 border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-foreground/90 text-sm sm:text-base text-center sm:text-left">
              {t('activities.yatesMasajes')}
            </p>
            <a
              href="https://wa.me/5216241222174?text=Hola%2C%20me%20interesan%20yates%20privados%20o%20masajes%20a%20domicilio%20en%20villas"
              target="_blank"
              rel="noopener noreferrer"
              className="gold-gradient text-secondary-foreground px-5 py-2.5 rounded-full text-sm font-bold inline-flex items-center gap-2 hover:brightness-110 transition-all gold-glow shrink-0"
            >
              <MessageCircle size={18} /> {t('activities.contactWhatsApp')}
            </a>
          </motion.div>
        </div>
      </section>

      <div className="section-divider mx-auto max-w-2xl" />

      {/* Park Fee + Safety */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-3xl text-center text-sm text-muted-foreground">
          Park fee ($25/person, paid at park)
        </div>
      </section>

      <section className="py-12 px-4 section-light">
        <div className="container mx-auto max-w-3xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="glass-card rounded-2xl p-8 border border-border">
            <h3 className="font-display text-xl font-bold mb-4 text-foreground">Safety Policy</h3>
            <p className="text-foreground/80 text-sm leading-relaxed mb-4">
              For safety reasons, cameras, phones and any electronic device with a camera are prohibited during public tour activities. HANDS-FREE CAMERAS (GoPro-type) ARE PERMITTED.
            </p>
            <p className="text-foreground/70 text-sm leading-relaxed mb-4">
              We also offer private tours where cameras and phones are allowed, since they don't put other participants' safety or quality time at risk.
            </p>
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="bg-sand-light px-3 py-1.5 rounded-full text-foreground border border-border/50">Photo packages available</span>
              <span className="bg-sand-light px-3 py-1.5 rounded-full text-foreground border border-border/50">Private tours optional</span>
              <span className="bg-sand-light px-3 py-1.5 rounded-full text-foreground border border-border/50">$25 USD park entry per person</span>
            </div>
            <p className="text-xs text-muted-foreground mt-4 italic">Cactus Tours reserves the right of admission for safety reasons.</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Activities;