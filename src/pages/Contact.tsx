import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
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
                placeholder={t('contact.namePlaceholder')}
                className="w-full bg-accent/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 transition-shadow" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('contact.email')}</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder={t('contact.emailPlaceholder')}
                className="w-full bg-accent/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 transition-shadow" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('contact.message')}</label>
              <textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder={t('contact.messagePlaceholder')}
                className="w-full bg-accent/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none transition-shadow" />
            </div>
            <button type="submit" className="gold-gradient text-navy px-8 py-3 rounded-full font-bold text-sm hover:brightness-110 transition-all w-full gold-glow">
              {t('contact.send')}
            </button>
          </motion.form>

          {/* Info */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }} className="space-y-6">
            <h3 className="font-display text-2xl font-bold">{t('contact.info.title')}</h3>
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <Phone size={18} className="text-gold" />
                </div>
                <div>
                  <p className="font-medium text-sm">{t('contact.phone')}</p>
                  <a href="tel:+526241234567" className="text-muted-foreground text-sm hover:text-foreground transition-colors">+52 624 123 4567</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <Mail size={18} className="text-gold" />
                </div>
                <div>
                  <p className="font-medium text-sm">{t('contact.emailLabel')}</p>
                  <a href="mailto:info@classviptransfers.com" className="text-muted-foreground text-sm hover:text-foreground transition-colors">info@classviptransfers.com</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-gold" />
                </div>
                <div>
                  <p className="font-medium text-sm">{t('contact.addressLabel')}</p>
                  <p className="text-muted-foreground text-sm">{t('contact.address')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <Clock size={18} className="text-gold" />
                </div>
                <div>
                  <p className="font-medium text-sm">{t('contact.hoursLabel')}</p>
                  <p className="text-muted-foreground text-sm">{t('contact.hours')}</p>
                </div>
              </div>
            </div>

            <a href="https://wa.me/526241234567" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-full bg-[#25D366] text-white font-bold text-sm hover:bg-[#20bd5a] transition-colors">
              <MessageCircle size={20} /> {t('contact.whatsapp')}
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
