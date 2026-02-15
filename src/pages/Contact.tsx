import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { useState } from 'react';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

const Contact = () => {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(t('contact.thankYou'));
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div>
      {/* Hero */}
      <section className="navy-gradient pt-36 pb-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="font-display text-4xl md:text-6xl font-bold mb-4 text-off-white">
            {t('contact.title')}
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.1 }} className="text-off-white/60 text-lg">
            {t('contact.subtitle')}
          </motion.p>
        </div>
      </section>

      <section className="py-20 px-4 -mt-8">
        <div className="container mx-auto max-w-4xl grid md:grid-cols-2 gap-10">
          {/* Form */}
          <motion.form initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 border border-border space-y-5">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('contact.name')}</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-accent/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 transition-shadow" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('contact.email')}</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full bg-accent/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 transition-shadow" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('contact.message')}</label>
              <textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                className="w-full bg-accent/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none transition-shadow" />
            </div>
            <button type="submit" className="gold-gradient text-navy px-8 py-3 rounded-full font-bold text-sm hover:brightness-110 transition-all w-full gold-glow">
              {t('contact.send')}
            </button>
          </motion.form>

          {/* Info */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }} className="space-y-5">
            <div className="glass-card rounded-2xl p-6 space-y-4 border border-border">
              <a href="tel:+526241234567" className="flex items-center gap-3 text-foreground/80 hover:text-foreground transition-colors">
                <Phone size={18} className="text-gold" /> +52 624 123 4567
              </a>
              <a href="mailto:info@classviptransfers.com" className="flex items-center gap-3 text-foreground/80 hover:text-foreground transition-colors">
                <Mail size={18} className="text-gold" /> info@classviptransfers.com
              </a>
              <div className="flex items-center gap-3 text-foreground/80">
                <MapPin size={18} className="text-gold" /> {t('contact.address')}
              </div>
              <p className="text-muted-foreground text-xs">{t('contact.hours')}</p>
            </div>

            <a href="https://wa.me/526241234567" target="_blank" rel="noopener noreferrer"
              className="glass-card rounded-2xl p-6 flex items-center gap-4 border border-border premium-card block">
              <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center flex-shrink-0">
                <MessageCircle size={24} className="text-[#25D366]" />
              </div>
              <div>
                <p className="font-semibold text-sm">{t('contact.whatsapp')}</p>
                <p className="text-muted-foreground text-xs">{t('contact.whatsappDesc')}</p>
              </div>
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
