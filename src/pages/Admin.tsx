import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Lock, LayoutDashboard, Map, DollarSign, MapPin, Package, CalendarCheck } from 'lucide-react';
import { useState } from 'react';

const Admin = () => {
  const { t } = useLanguage();
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const sidebarItems = [
    { key: 'admin.sidebar.dashboard', id: 'dashboard', icon: <LayoutDashboard size={18} /> },
    { key: 'admin.sidebar.zones', id: 'zones', icon: <Map size={18} /> },
    { key: 'admin.sidebar.pricing', id: 'pricing', icon: <DollarSign size={18} /> },
    { key: 'admin.sidebar.places', id: 'places', icon: <MapPin size={18} /> },
    { key: 'admin.sidebar.extras', id: 'extras', icon: <Package size={18} /> },
    { key: 'admin.sidebar.bookings', id: 'bookings', icon: <CalendarCheck size={18} /> },
  ];

  if (!loggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-32">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 w-full max-w-sm text-center border border-border">
          <div className="w-14 h-14 rounded-full gold-gradient flex items-center justify-center mx-auto mb-4">
            <Lock size={24} className="text-navy" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">{t('admin.login')}</h1>
          <p className="text-muted-foreground text-sm mb-6">{t('admin.credentials')}</p>
          <form onSubmit={(e) => { e.preventDefault(); setLoggedIn(true); }} className="space-y-4">
            <input type="email" placeholder={t('admin.email')} defaultValue="admin@classvip.com" required
              className="w-full bg-accent/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50" />
            <input type="password" placeholder={t('admin.password')} defaultValue="demo1234" required
              className="w-full bg-accent/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50" />
            <button type="submit" className="gold-gradient text-navy px-6 py-3 rounded-full font-bold text-sm w-full hover:brightness-110 transition-all gold-glow">
              {t('admin.logIn')}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 flex">
      {/* Sidebar */}
      <aside className="w-60 navy-gradient text-off-white p-4 hidden md:block flex-shrink-0">
        <div className="space-y-1">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                activeTab === item.id ? 'bg-white/10 text-gold font-semibold' : 'text-off-white/60 hover:text-off-white hover:bg-white/5'
              }`}
            >
              {item.icon} {t(item.key)}
            </button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 p-6 md:p-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold mb-8">{t('admin.dashboard')}</h1>
          <div className="grid sm:grid-cols-3 gap-5 mb-8">
            {[
              { label: t('admin.todayBookings'), value: '12' },
              { label: t('admin.pending'), value: '3' },
              { label: t('admin.revenue'), value: '$2,450' },
            ].map((card, i) => (
              <div key={i} className="glass-card rounded-xl p-6 border border-border">
                <p className="text-muted-foreground text-xs mb-1">{card.label}</p>
                <p className="text-2xl font-bold text-gold">{card.value}</p>
              </div>
            ))}
          </div>
          <div className="glass-card rounded-xl p-8 text-center text-muted-foreground border border-border">
            {t('admin.placeholder')}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Admin;
