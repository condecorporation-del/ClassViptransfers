import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Lock } from 'lucide-react';
import { useState } from 'react';

const Admin = () => {
  const { t } = useLanguage();
  const [loggedIn, setLoggedIn] = useState(false);

  if (!loggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 w-full max-w-sm text-center">
          <Lock size={32} className="text-secondary mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">{t('Admin Login', 'Inicio de Sesión Admin')}</h1>
          <p className="text-muted-foreground text-sm mb-6">{t('Enter your credentials', 'Ingresa tus credenciales')}</p>
          <form onSubmit={(e) => { e.preventDefault(); setLoggedIn(true); }} className="space-y-4">
            <input type="email" placeholder={t('Email', 'Correo')} required
              className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50" />
            <input type="password" placeholder={t('Password', 'Contraseña')} required
              className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50" />
            <button type="submit" className="bg-secondary text-secondary-foreground px-6 py-3 rounded-full font-semibold text-sm w-full hover:brightness-110 transition-all">
              {t('Log In', 'Iniciar Sesión')}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold mb-8">{t('Admin Dashboard', 'Panel de Administración')}</h1>
          <div className="grid sm:grid-cols-3 gap-5 mb-8">
            {[
              { label: t('Today\'s Bookings', 'Reservaciones Hoy'), value: '12' },
              { label: t('Pending', 'Pendientes'), value: '3' },
              { label: t('Revenue', 'Ingresos'), value: '$2,450' },
            ].map((card, i) => (
              <div key={i} className="glass-card rounded-xl p-6">
                <p className="text-muted-foreground text-xs mb-1">{card.label}</p>
                <p className="text-2xl font-bold text-secondary">{card.value}</p>
              </div>
            ))}
          </div>
          <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
            {t('Dashboard content coming soon...', 'Contenido del dashboard próximamente...')}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Admin;
