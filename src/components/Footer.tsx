import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Phone, Mail, MapPin, ArrowRight } from 'lucide-react';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="navy-gradient text-off-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand + Logo */}
          <div>
            <img src="/logo.png" alt="Class VIP Transfers" className="h-16 mb-4 drop-shadow-[0_2px_8px_rgba(212,175,55,0.3)]" />
            <p className="text-off-white/60 text-sm leading-relaxed">
              {t('footer.brand')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-gold font-semibold text-sm mb-4 uppercase tracking-wider">{t('footer.services')}</h4>
            <div className="flex flex-col gap-2.5">
              <Link to="/transfers" className="text-off-white/60 text-sm hover:text-off-white transition-colors">{t('nav.transfers')}</Link>
              <Link to="/activities" className="text-off-white/60 text-sm hover:text-off-white transition-colors">{t('nav.activities')}</Link>
              <Link to="/book" className="text-off-white/60 text-sm hover:text-off-white transition-colors">{t('nav.bookNow')}</Link>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-gold font-semibold text-sm mb-4 uppercase tracking-wider">{t('footer.contact')}</h4>
            <div className="flex flex-col gap-3">
              <a href="tel:+526241234567" className="flex items-center gap-2 text-off-white/60 text-sm hover:text-off-white transition-colors">
                <Phone size={14} className="text-gold" /> +52 624 123 4567
              </a>
              <a href="mailto:info@classviptransfers.com" className="flex items-center gap-2 text-off-white/60 text-sm hover:text-off-white transition-colors">
                <Mail size={14} className="text-gold" /> info@classviptransfers.com
              </a>
              <span className="flex items-center gap-2 text-off-white/60 text-sm">
                <MapPin size={14} className="text-gold" /> {t('contact.address')}
              </span>
            </div>
          </div>

          {/* CTA */}
          <div>
            <h4 className="text-gold font-semibold text-sm mb-4 uppercase tracking-wider">{t('nav.bookNow')}</h4>
            <p className="text-off-white/60 text-sm mb-4">{t('transfers.cta.subtitle')}</p>
            <Link
              to="/book"
              className="gold-gradient text-navy px-6 py-3 rounded-full text-sm font-bold inline-flex items-center gap-2 hover:brightness-110 transition-all gold-glow"
            >
              {t('nav.bookNow')} <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="section-divider mt-12 mb-6" />
        <div className="text-center text-off-white/40 text-xs">
          © {new Date().getFullYear()} Class VIP Transfers. {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
