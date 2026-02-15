import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="font-display text-xl font-bold text-gold-gradient mb-3">Class VIP Transfers</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t(
                'Premium transportation and experiences in Los Cabos, México. 30+ years of excellence.',
                'Transportación premium y experiencias en Los Cabos, México. 30+ años de excelencia.'
              )}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-secondary font-semibold text-sm mb-4 uppercase tracking-wider">{t('Services', 'Servicios')}</h4>
            <div className="flex flex-col gap-2.5">
              <Link to="/transfers" className="text-muted-foreground text-sm hover:text-foreground transition-colors">{t('Transfers', 'Transfers')}</Link>
              <Link to="/activities" className="text-muted-foreground text-sm hover:text-foreground transition-colors">{t('Activities', 'Actividades')}</Link>
              <Link to="/book" className="text-muted-foreground text-sm hover:text-foreground transition-colors">{t('Book Now', 'Reservar')}</Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-secondary font-semibold text-sm mb-4 uppercase tracking-wider">{t('Company', 'Empresa')}</h4>
            <div className="flex flex-col gap-2.5">
              <Link to="/contact" className="text-muted-foreground text-sm hover:text-foreground transition-colors">{t('Contact', 'Contacto')}</Link>
              <Link to="/" className="text-muted-foreground text-sm hover:text-foreground transition-colors">{t('About Us', 'Nosotros')}</Link>
              <Link to="/" className="text-muted-foreground text-sm hover:text-foreground transition-colors">{t('Privacy Policy', 'Privacidad')}</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-secondary font-semibold text-sm mb-4 uppercase tracking-wider">{t('Contact', 'Contacto')}</h4>
            <div className="flex flex-col gap-3">
              <a href="tel:+526241234567" className="flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground transition-colors">
                <Phone size={14} /> +52 624 123 4567
              </a>
              <a href="mailto:info@classviptransfers.com" className="flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground transition-colors">
                <Mail size={14} /> info@classviptransfers.com
              </a>
              <span className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin size={14} /> Los Cabos, B.C.S., México
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 mt-12 pt-6 text-center text-muted-foreground text-xs">
          © {new Date().getFullYear()} Class VIP Transfers. {t('All rights reserved.', 'Todos los derechos reservados.')}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
