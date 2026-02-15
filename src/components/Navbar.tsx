import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { lang, toggleLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: '/', label: t('Home', 'Inicio') },
    { to: '/transfers', label: t('Transfers', 'Transfers') },
    { to: '/activities', label: t('Activities', 'Actividades') },
    { to: '/contact', label: t('Contact', 'Contacto') },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold text-gold-gradient">Class VIP</span>
          <span className="text-foreground/80 text-sm font-light hidden sm:inline">Transfers</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors hover:text-secondary ${
                isActive(link.to) ? 'text-secondary' : 'text-foreground/70'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLang}
            className="text-xs font-semibold px-2.5 py-1 rounded-full border border-border/50 text-foreground/70 hover:text-foreground hover:border-secondary/50 transition-all"
          >
            {lang === 'en' ? 'ES' : 'EN'}
          </button>

          <Link
            to="/book"
            className="hidden md:inline-flex bg-secondary text-secondary-foreground px-5 py-2 rounded-full text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-secondary/20"
          >
            {t('Book Now', 'Reservar')}
          </Link>

          {/* Mobile hamburger */}
          <button onClick={() => setOpen(!open)} className="md:hidden text-foreground">
            {open ? <X size={22} /> : <Menu size={22} />}
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
            className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 flex flex-col gap-3">
              {links.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={`text-sm py-2 ${isActive(link.to) ? 'text-secondary' : 'text-foreground/70'}`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/book"
                onClick={() => setOpen(false)}
                className="bg-secondary text-secondary-foreground px-5 py-2.5 rounded-full text-sm font-semibold text-center mt-2"
              >
                {t('Book Now', 'Reservar')}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
