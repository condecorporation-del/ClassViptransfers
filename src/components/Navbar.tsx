import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/transfers', label: t('nav.transfers') },
    { to: '/activities', label: t('nav.activities') },
    { to: '/contact', label: t('nav.contact') },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Hero sections are dark → use light text; elsewhere use dark text on bright bg
  const isDarkHero = isHome && !scrolled;

  const navBg = isDarkHero
    ? 'bg-gradient-to-b from-navy/70 to-transparent'
    : 'bg-card/95 backdrop-blur-2xl border-b border-border/60 shadow-sm';

  const textColor = isDarkHero ? 'text-off-white' : 'text-foreground';
  const mutedText = isDarkHero ? 'text-off-white/70' : 'text-foreground/60';
  const activeText = 'text-gold';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navBg}`}>
      <div className="container mx-auto px-4 h-20 md:h-24 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src="/logo.png"
            alt="Class VIP Transfers"
            className="h-14 md:h-20 drop-shadow-[0_2px_8px_rgba(212,175,55,0.3)] transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        <div className="hidden md:flex items-center gap-10">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors gold-underline ${
                isActive(link.to) ? activeText : `${mutedText} hover:${textColor}`
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex rounded-full overflow-hidden border ${isDarkHero ? 'border-off-white/20' : 'border-border'}`}>
            <button
              onClick={() => setLang('en')}
              className={`text-[10px] font-bold px-3 py-1.5 transition-all ${
                lang === 'en' ? 'gold-gradient text-secondary-foreground' : `${mutedText}`
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('es')}
              className={`text-[10px] font-bold px-3 py-1.5 transition-all ${
                lang === 'es' ? 'gold-gradient text-secondary-foreground' : `${mutedText}`
              }`}
            >
              ES
            </button>
          </div>

          <Link
            to="/book"
            className="hidden md:inline-flex gold-gradient text-secondary-foreground px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all gold-glow items-center gap-2"
          >
            {t('nav.bookNow')}
          </Link>

          <button onClick={() => setOpen(!open)} className={`md:hidden ${textColor}`}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/30 bg-card/98 backdrop-blur-2xl"
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              {links.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={`text-sm font-medium uppercase tracking-wider py-2 ${
                    isActive(link.to) ? 'text-gold' : 'text-foreground/60'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/book"
                onClick={() => setOpen(false)}
                className="gold-gradient text-secondary-foreground px-6 py-3 rounded-full text-sm font-bold text-center mt-2 gold-glow"
              >
                {t('nav.bookNow')}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;