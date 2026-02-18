import { useState, useEffect } from 'react';
import { X, Download, Share2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const InstallBanner = () => {
  const { t, lang } = useLanguage();
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Detect if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // Check if banner was dismissed
    const dismissed = localStorage.getItem('pwa-install-banner-dismissed');
    
    // Show banner if: iOS, not standalone, not dismissed
    if (iOS && !standalone && !dismissed) {
      // Small delay to avoid flash
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-banner-dismissed', 'true');
  };

  if (!showBanner || isStandalone) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-md mx-auto bg-card border border-gold/20 rounded-xl shadow-lg backdrop-blur-xl bg-card/95 p-4 flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Download size={16} className="text-gold" />
            <h3 className="font-semibold text-sm text-foreground">
              {lang === 'es' ? 'Instalar App' : 'Install App'}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {lang === 'es' 
              ? 'Agrega esta app a tu pantalla de inicio para acceso rápido'
              : 'Add this app to your home screen for quick access'}
          </p>
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <Share2 size={12} />
            <span>
              {lang === 'es' 
                ? 'Toca el botón Compartir → Agregar a Pantalla de Inicio'
                : 'Tap Share → Add to Home Screen'}
            </span>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 hover:bg-muted rounded-md transition-colors"
          aria-label={lang === 'es' ? 'Cerrar' : 'Close'}
        >
          <X size={16} className="text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

