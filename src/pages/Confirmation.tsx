import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle, Phone, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Confirmation = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-32">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-2xl p-10 max-w-lg text-center w-full border border-border"
      >
        <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} className="text-navy" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">{t('confirm.title')}</h1>
        <p className="text-muted-foreground mb-6">{t('confirm.subtitle')}</p>

        <div className="glass-card rounded-xl p-5 mb-6 text-left space-y-3 border border-border">
          <h3 className="font-semibold text-sm text-gold">{t('confirm.summary')}</h3>
          <div className="text-sm text-foreground/80 space-y-1">
            <p>{t('confirm.service')}: <span className="font-medium">{t('confirm.serviceValue')}</span></p>
            <p>{t('confirm.date')}: <span className="font-medium">March 15, 2026</span></p>
            <p>{t('confirm.reference')}: <span className="font-medium text-gold">#CVT-2026-0042</span></p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <h4 className="text-sm font-semibold">{t('confirm.needHelp')}</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <a href="tel:+526241234567" className="flex items-center gap-2 justify-center hover:text-foreground transition-colors"><Phone size={14} /> +52 624 123 4567</a>
            <a href="https://wa.me/526241234567" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 justify-center hover:text-foreground transition-colors"><MessageCircle size={14} /> WhatsApp</a>
          </div>
        </div>

        <Link to="/" className="gold-gradient text-navy px-6 py-3 rounded-full text-sm font-bold inline-flex hover:brightness-110 transition-all gold-glow">
          {t('confirm.backHome')}
        </Link>
      </motion.div>
    </div>
  );
};

export default Confirmation;
