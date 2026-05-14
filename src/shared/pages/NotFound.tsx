import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowRight, MapPin, Phone } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error:", location.pathname);
  }, [location.pathname]);

  const isEs = typeof navigator !== 'undefined' && /^es\b/i.test(navigator.language);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4">
      <div className="text-center max-w-md">
        <p className="text-gold text-7xl font-bold mb-2">404</p>
        <h1 className="text-2xl font-bold text-foreground mb-3">
          {isEs ? 'Página no encontrada' : 'Page not found'}
        </h1>
        <p className="text-muted-foreground mb-8">
          {isEs
            ? 'Lo sentimos, la página que buscas no existe o fue movida.'
            : "Sorry, the page you're looking for doesn't exist or has been moved."}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="gold-gradient text-secondary-foreground px-6 py-3 rounded-full text-sm font-bold inline-flex items-center gap-2 hover:brightness-110 transition-all"
          >
            <Home size={16} /> {isEs ? 'Ir al Inicio' : 'Go Home'}
          </Link>
          <Link
            to="/transfers"
            className="border border-border px-6 py-3 rounded-full text-sm font-medium inline-flex items-center gap-2 hover:border-gold/40 transition-colors text-foreground"
          >
            <MapPin size={16} /> {isEs ? 'Ver Transfers' : 'View Transfers'}
          </Link>
        </div>
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-2">{isEs ? '¿Necesitas ayuda?' : 'Need help?'}</p>
          <a
            href="https://wa.me/5216241222174"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#25D366] font-medium hover:underline inline-flex items-center gap-1.5"
          >
            <Phone size={14} /> WhatsApp <ArrowRight size={12} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
