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
    { key: 'camel', emoji: '🐫', desc: 'Ride through the desert on a gentle camel with stunning mountain views.', duration: '1h', price: '$120 USD', combo: true, slug: 'camel-ride', whatsapp: "Hi! I'd like to book the Camel Ride individually." },
    { key: 'horseback', emoji: '🐎', desc: 'Gallop along scenic trails and enjoy the beauty of Baja California.', duration: '1h', price: '$120 USD', combo: true, slug: 'horseback-riding', whatsapp: "Hi! I'd like to book the Horseback Riding individually." },
    { key: 'atv', emoji: '🏍️', desc: 'Navigate rugged terrain on an ATV for an adrenaline-filled experience.', duration: '2h', price: '$120 USD', combo: true, insurance: true, slug: 'atv', whatsapp: "Hi! I'd like to book the ATV Tour individually." },
    { key: 'doubleMoto', emoji: '🏍️', desc: 'Share the thrill — ride together on a powerful double-seat motorcycle.', duration: '2h', price: '$200 USD', combo: true, insurance: true, slug: 'double-motorcycle', whatsapp: "Hi! I'd like to book the Double Motorcycle individually." },
    { key: 'rzr', emoji: '🏎️', desc: 'Off-road through canyons and desert trails in a powerful RZR.', duration: '2h', price: null, combo: true, insurance: true, rzrPricing: true, slug: 'utv-adventure', whatsapp: "Hi! I'd like to book the RZR individually." },
    { key: 'skyBikes', emoji: '🚲', desc: 'Pedal through the sky on elevated bike trails with ocean panoramas.', duration: '2h', price: '$96 USD', combo: true, slug: 'sky-bikes', whatsapp: "Hi! I'd like to book the Sky Bikes individually." },
    { key: 'fishing', emoji: '🎣', desc: "Deep-sea fishing on a private yacht in the Sea of Cortez. Price varies by group size.", duration: '—', price: null, combo: false, whatsapp: "Hi! I'm interested in the Fishing Yacht. Can you send me a quote?" },
    { key: 'sunset', emoji: '🌅', desc: 'Sail into the sunset with drinks and breathtaking views of the Arch. Price varies by group size.', duration: '—', price: null, combo: false, whatsapp: "Hi! I'm interested in the Sunset Cruise. Can you send me a quote?" },
  ];

  return (
    <div>
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

      <div className="section-divider mx-auto max-w-2xl" />

      {/* Individual Activities */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold mb-2 text-foreground">Or Book Individually</h2>
            <p className="text-muted-foreground">Want just one activity? No problem — book any experience on its own</p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activities.map((act, i) => (
              <motion.div key={i} variants={fadeUp}
                className="glass-card rounded-xl p-6 premium-card border border-border">
                <p className="text-2xl mb-2">{act.emoji}</p>
                <h3 className="font-display text-lg font-bold mb-1 text-foreground">{t(`activity.${act.key}`)}</h3>
                <p className="text-muted-foreground text-sm mb-3 leading-relaxed">{act.desc}</p>

                {act.insurance && (
                  <p className="text-xs text-muted-foreground mb-3 bg-sand-light rounded-lg p-2.5 border border-border/50">
                    Optional vehicle protection available. If declined, $500 USD credit card hold per vehicle required (released within 48 hrs).
                  </p>
                )}

                {act.rzrPricing && (
                  <p className="text-xs text-gold mb-3 font-medium">1 pax $205 · 2 pax $290 · 3 pax $350 · 4 pax $405</p>
                )}

                <Accordion type="single" collapsible>
                  <AccordionItem value="restrictions" className="border-none">
                    <AccordionTrigger className="text-xs text-muted-foreground py-2 hover:no-underline">
                      Restrictions & Safety
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                      {act.insurance
                        ? 'Minimum age varies by activity. Closed-toe shoes required. Follow guide instructions at all times.'
                        : act.key === 'fishing' || act.key === 'sunset'
                        ? 'Subject to weather conditions. Cancellation policy applies.'
                        : 'Minimum age varies by activity. Follow guide instructions at all times.'}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock size={13} /> {act.duration}
                  </div>
                  {act.price ? (
                    <span className="text-gold font-bold text-sm">{act.price}</span>
                  ) : act.rzrPricing ? (
                    <span className="text-gold font-bold text-sm">See pricing</span>
                  ) : (
                    <span className="text-ocean font-medium text-sm italic">Quote on request</span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <a href={`https://wa.me/5216241222174?text=${encodeURIComponent(act.whatsapp)}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#25D366] hover:underline">
                    <MessageCircle size={12} /> {act.price || act.rzrPricing ? 'Book This Activity' : 'Request Quote via WhatsApp'}
                  </a>
                  {(act as any).slug && (
                    <Link to={`/activities/${(act as any).slug}`} className="flex items-center gap-1 text-xs font-semibold text-gold hover:underline ml-auto">
                      View Details <ArrowRight size={12} />
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

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