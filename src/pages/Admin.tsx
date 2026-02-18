import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { LayoutDashboard, Map, DollarSign, MapPin, Package, CalendarCheck, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const Admin = () => {
  const { t } = useLanguage();
  const { email, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const sidebarItems = [
    { key: 'admin.sidebar.dashboard', id: 'dashboard', icon: <LayoutDashboard size={18} /> },
    { key: 'admin.sidebar.zones', id: 'zones', icon: <Map size={18} /> },
    { key: 'admin.sidebar.pricing', id: 'pricing', icon: <DollarSign size={18} /> },
    { key: 'admin.sidebar.places', id: 'places', icon: <MapPin size={18} /> },
    { key: 'admin.sidebar.extras', id: 'extras', icon: <Package size={18} /> },
    { key: 'admin.sidebar.bookings', id: 'bookings', icon: <CalendarCheck size={18} /> },
  ];

  return (
    <div className="min-h-screen pt-28 flex">
      {/* Sidebar */}
      <aside className="w-60 navy-gradient text-off-white p-4 hidden md:block flex-shrink-0">
        {/* User Info */}
        {email && (
          <div className="mb-6 pb-4 border-b border-white/10">
            <p className="text-xs text-off-white/60 mb-1">Logged in as</p>
            <p className="text-sm font-semibold text-gold">{email}</p>
            <button
              onClick={logout}
              className="mt-2 text-xs text-off-white/60 hover:text-off-white flex items-center gap-1 transition-colors"
            >
              <LogOut size={12} />
              Logout
            </button>
          </div>
        )}
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
