import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle, Phone, Mail, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Confirmation = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-2xl p-10 max-w-lg text-center w-full">
        <CheckCircle size={48} className="text-secondary mx-auto mb-4" />
        <h1 className="font-display text-3xl font-bold mb-2">{t('Booking Confirmed!', '¡Reservación Confirmada!')}</h1>
        <p className="text-muted-foreground mb-6">
          {t(
            "Thank you for choosing Class VIP Transfers. You'll receive a confirmation email shortly.",
            'Gracias por elegir Class VIP Transfers. Recibirás un correo de confirmación en breve.'
          )}
        </p>

        <div className="glass-card rounded-xl p-5 mb-6 text-left space-y-3">
          <h3 className="font-semibold text-sm text-secondary">{t('Booking Summary', 'Resumen de Reservación')}</h3>
          <div className="text-sm text-foreground/80 space-y-1">
            <p>{t('Service', 'Servicio')}: <span className="font-medium">{t('Private SUV Transfer', 'Transfer Privado SUV')}</span></p>
            <p>{t('Date', 'Fecha')}: <span className="font-medium">March 15, 2026</span></p>
            <p>{t('Reference', 'Referencia')}: <span className="font-medium text-secondary">#CVT-2026-0042</span></p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <h4 className="text-sm font-semibold">{t('Need help?', '¿Necesitas ayuda?')}</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <a href="tel:+526241234567" className="flex items-center gap-2 justify-center hover:text-foreground"><Phone size={14} /> +52 624 123 4567</a>
            <a href="https://wa.me/526241234567" className="flex items-center gap-2 justify-center hover:text-foreground"><MessageCircle size={14} /> WhatsApp</a>
          </div>
        </div>

        <Link to="/" className="bg-secondary text-secondary-foreground px-6 py-3 rounded-full text-sm font-semibold inline-flex hover:brightness-110 transition-all">
          {t('Back to Home', 'Volver al Inicio')}
        </Link>
      </motion.div>
    </div>
  );
};

export default Confirmation;
