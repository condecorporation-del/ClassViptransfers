import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from './Navbar';
import Footer from './Footer';
import { InstallBanner } from './InstallBanner';
import { ChatWidget } from './ChatWidget';
import { ErrorBoundary } from './ErrorBoundary';

const Layout = () => {
  const { lang } = useLanguage();
  const [opacity, setOpacity] = useState(1);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setOpacity(0.92);
    const t = setTimeout(() => setOpacity(1), 180);
    return () => clearTimeout(t);
  }, [lang]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <motion.div
          animate={{ opacity }}
          transition={{ duration: 0.18, ease: 'easeInOut' }}
        >
          <Outlet />
        </motion.div>
      </main>
      <Footer />
      <InstallBanner />
      <ErrorBoundary fallback={null}>
        <ChatWidget />
      </ErrorBoundary>
    </div>
  );
};

export default Layout;
