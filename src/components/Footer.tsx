import { Link } from 'react-router-dom';
import { cloudinaryAssets } from '@/lib/cloudinary-assets';
import { useLanguage } from '@/contexts/LanguageContext';
import { Phone, Mail, MapPin, ArrowRight, Facebook, Instagram, Star } from 'lucide-react';

const Footer = () => {
  const { t, lang } = useLanguage();

  return (
    <footer className="navy-gradient text-off-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <img src={cloudinaryAssets.logo} alt="Class VIP Transfers" className="h-16 mb-4 drop-shadow-[0_4px_16px_rgba(212,175,55,0.45)]" />
            <p className="text-off-white/60 text-sm leading-relaxed">
              {t('footer.brand')}
            </p>
          </div>

          <div>
            <h4 className="text-gold font-semibold text-xs mb-4 uppercase tracking-[0.2em]">{t('footer.quickLinks')}</h4>
            <div className="flex flex-col gap-2.5">
              <Link to="/" className="text-off-white/60 text-sm hover:text-off-white transition-colors">{t('nav.home')}</Link>
              <Link to="/transfers" className="text-off-white/60 text-sm hover:text-off-white transition-colors">{t('nav.transfers')}</Link>
              <Link to="/activities" className="text-off-white/60 text-sm hover:text-off-white transition-colors">{t('nav.activities')}</Link>
              <Link to="/contact" className="text-off-white/60 text-sm hover:text-off-white transition-colors">{t('nav.contact')}</Link>
            </div>
          </div>

          <div>
            <h4 className="text-gold font-semibold text-xs mb-4 uppercase tracking-[0.2em]">{t('footer.contact')}</h4>
            <div className="flex flex-col gap-3">
              <a href="tel:+526241222174" className="flex items-center gap-2 text-off-white/60 text-sm hover:text-off-white transition-colors">
                <Phone size={14} className="text-gold" /> +52 624 122 2174
              </a>
              <a href="mailto:Armando@caboviptransfers.com" className="flex items-center gap-2 text-off-white/60 text-sm hover:text-off-white transition-colors">
                <Mail size={14} className="text-gold" /> Armando@caboviptransfers.com
              </a>
              <span className="flex items-center gap-2 text-off-white/60 text-sm">
                <MapPin size={14} className="text-gold" /> {t('contact.address')}
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-gold font-semibold text-xs mb-4 uppercase tracking-[0.2em]">{t('nav.bookNow')}</h4>
            <p className="text-off-white/60 text-sm mb-4">{t('cta.subtitle')}</p>
            <Link
              to="/book"
              className="gold-gradient text-secondary-foreground px-6 py-3 rounded-full text-sm font-bold inline-flex items-center gap-2 hover:brightness-110 transition-all gold-glow"
            >
              {t('nav.bookNow')} <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="section-divider mt-12 mb-6" />
        <div className="flex flex-col items-center gap-4 mb-6">
          <a
            href="https://www.tripadvisor.com.mx/Attraction_Review-g152515-d10486878-Reviews-Class_VIP_Transfers-Cabo_San_Lucas_Los_Cabos_Baja_California.html"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="See Class VIP Transfers on TripAdvisor"
          >
            <img
              src="https://www.tripadvisor.com/img/cdsi/img2/branding/v2/Tripadvisor_lockup_horizontal_secondary_registered-11900-2.svg"
              alt="See us on TripAdvisor"
              className="h-8 w-auto opacity-70 hover:opacity-100 transition-opacity"
              loading="lazy"
            />
          </a>
          <div className="flex items-center gap-5">
            <a href="https://facebook.com/classviptransfers" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-off-white/40 hover:text-off-white transition-colors">
              <Facebook className="h-6 w-6" />
            </a>
            <a href="https://instagram.com/classviptransfers" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-off-white/40 hover:text-off-white transition-colors">
              <Instagram className="h-6 w-6" />
            </a>
            <a href="https://www.tripadvisor.com.mx/Attraction_Review-g152515-d10486878-Reviews-Class_VIP_Transfers-Cabo_San_Lucas_Los_Cabos_Baja_California.html" target="_blank" rel="noopener noreferrer" aria-label="TripAdvisor" className="text-off-white/40 hover:text-gold transition-colors">
              <Star className="h-6 w-6" />
            </a>
          </div>
        </div>
        <div className="text-center text-off-white/40 text-xs flex flex-col items-center justify-center gap-2">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <span>© {new Date().getFullYear()} Class VIP Transfers. {t('footer.rights')}</span>
            <span className="text-off-white/20">•</span>
            <Link to="/terms" className="text-off-white/40 hover:text-off-white/60 transition-colors">
              {lang === 'es' ? 'Términos y Condiciones' : 'Terms & Conditions'}
            </Link>
            <span className="text-off-white/20">•</span>
            <Link to="/privacy" className="text-off-white/40 hover:text-off-white/60 transition-colors">
              {lang === 'es' ? 'Política de Privacidad' : 'Privacy Policy'}
            </Link>
            <span className="text-off-white/20">•</span>
            <Link
              to="/admin/login"
              className="text-off-white/40 hover:text-off-white/60 transition-colors"
            >
              Admin
            </Link>
          </div>
          {/* Build Badge */}
          <div className="mt-2 text-off-white/30 text-[10px] font-mono">
            Build: {import.meta.env.VITE_COMMIT_REF || import.meta.env.COMMIT_REF || 'local'} | 
            Context: {import.meta.env.VITE_CONTEXT || import.meta.env.CONTEXT || 'local'} | 
            {import.meta.env.VITE_BUILD_TIME || new Date().toISOString()}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;