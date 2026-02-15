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

  const navBg = !isHome
    ? 'bg-navy/97 backdrop-blur-3xl border-b border-gold/10'
    : scrolled
    ? 'bg-navy/97 backdrop-blur-3xl border-b border-gold/10'
    : 'bg-gradient-to-b from-navy/70 to-transparent';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navBg}`}>
      <div className="container mx-auto px-4 h-24 md:h-28 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src="/logo.png"
            alt="Class VIP Transfers"
            className="h-16 md:h-24 drop-shadow-[0_2px_8px_rgba(212,175,55,0.3)] transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-xs font-semibold uppercase tracking-widest transition-colors gold-underline ${
                isActive(link.to) ? 'text-gold' : 'text-off-white/80 hover:text-off-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Language toggle pill */}
          <div className="flex rounded-full overflow-hidden border border-off-white/20">
            <button
              onClick={() => setLang('en')}
              className={`text-xs font-bold px-3 py-1.5 transition-all ${
                lang === 'en'
                  ? 'gold-gradient text-navy'
                  : 'text-off-white/60 hover:text-off-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('es')}
              className={`text-xs font-bold px-3 py-1.5 transition-all ${
                lang === 'es'
                  ? 'gold-gradient text-navy'
                  : 'text-off-white/60 hover:text-off-white'
              }`}
            >
              ES
            </button>
          </div>

          <Link
            to="/book"
            className="hidden md:inline-flex gold-gradient text-navy px-6 py-2.5 rounded-full text-sm font-bold hover:brightness-110 transition-all gold-glow items-center gap-2"
          >
            {t('nav.bookNow')}
          </Link>

          {/* Mobile hamburger */}
          <button onClick={() => setOpen(!open)} className="md:hidden text-off-white">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-off-white/10 bg-navy/98 backdrop-blur-3xl"
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              {links.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={`text-sm font-medium uppercase tracking-wider py-2 ${
                    isActive(link.to) ? 'text-gold' : 'text-off-white/70'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/book"
                onClick={() => setOpen(false)}
                className="gold-gradient text-navy px-6 py-3 rounded-full text-sm font-bold text-center mt-2 gold-glow"
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
