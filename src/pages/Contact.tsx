import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { useState } from 'react';

const Contact = () => {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder - no backend
    alert(t('Thank you! We will contact you shortly.', '¡Gracias! Te contactaremos pronto.'));
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="py-24 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">{t('Contact Us', 'Contáctanos')}</h1>
          <p className="text-muted-foreground text-lg">{t("We'd love to hear from you!", '¡Nos encantaría saber de ti!')}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Form */}
          <motion.form initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('Name', 'Nombre')}</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('Email', 'Correo')}</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('Message', 'Mensaje')}</label>
              <textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 resize-none" />
            </div>
            <button type="submit" className="bg-secondary text-secondary-foreground px-8 py-3 rounded-full font-semibold text-sm hover:brightness-110 transition-all w-full">
              {t('Send Message', 'Enviar Mensaje')}
            </button>
          </motion.form>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-6">
            <div className="glass-card rounded-xl p-6 space-y-4">
              <a href="tel:+526241234567" className="flex items-center gap-3 text-foreground/80 hover:text-foreground transition-colors">
                <Phone size={18} className="text-secondary" /> +52 624 123 4567
              </a>
              <a href="mailto:info@classviptransfers.com" className="flex items-center gap-3 text-foreground/80 hover:text-foreground transition-colors">
                <Mail size={18} className="text-secondary" /> info@classviptransfers.com
              </a>
              <div className="flex items-center gap-3 text-foreground/80">
                <MapPin size={18} className="text-secondary" /> Los Cabos, B.C.S., México
              </div>
            </div>
            <a href="https://wa.me/526241234567" target="_blank" rel="noopener noreferrer"
              className="glass-card rounded-xl p-6 flex items-center gap-4 hover:border-secondary/30 transition-all group">
              <MessageCircle size={28} className="text-[#25D366]" />
              <div>
                <p className="font-semibold text-sm">{t('Chat on WhatsApp', 'Chat por WhatsApp')}</p>
                <p className="text-muted-foreground text-xs">{t('Quick response, usually within minutes', 'Respuesta rápida, usualmente en minutos')}</p>
              </div>
            </a>
            {/* Map placeholder */}
            <div className="glass-card rounded-xl h-48 flex items-center justify-center text-muted-foreground text-sm">
              {t('Map placeholder', 'Mapa placeholder')}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
