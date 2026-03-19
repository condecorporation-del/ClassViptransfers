import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { DollarSign, CalendarCheck, LogOut, Mail } from 'lucide-react';
import { useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { PricingManager } from '@/components/PricingManager';
import { AdminBookings } from '@/components/admin/AdminBookings';
import { getApiBaseUrl } from '@/lib/api';

const Admin = () => {
  const { t } = useLanguage();
  const { email, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'bookings' | 'pricing'>('bookings');

  const sidebarItems: Array<{ key: string; id: 'bookings' | 'pricing'; icon: React.ReactNode }> = [
    { key: 'admin.sidebar.bookings', id: 'bookings', icon: <CalendarCheck size={18} /> },
    { key: 'admin.sidebar.pricing', id: 'pricing', icon: <DollarSign size={18} /> },
  ];

  return (
    <div className="min-h-screen pt-28 flex flex-col md:flex-row">
      {/* Mobile: horizontal scrollable tabs */}
      <div className="md:hidden overflow-x-auto overscroll-x-contain touch-pan-x border-b border-border bg-card sticky top-20 z-30">
        <div className="flex gap-1 p-2 min-w-min">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium touch-manipulation min-h-[44px] transition-colors whitespace-nowrap ${
                activeTab === item.id ? 'bg-gold/20 text-gold' : 'text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {item.icon}
              <span>{t(item.key)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar - desktop */}
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
        <a
          href={`${getApiBaseUrl() || window.location.origin}/api/preview/booking-email`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-off-white/60 hover:text-off-white hover:bg-white/5 transition-colors"
        >
          <Mail size={18} /> Preview email
        </a>
      </aside>

      {/* Main */}
      <div className="flex-1 p-6 md:p-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {activeTab === 'pricing' ? (
            <div>
              <h1 className="font-display text-3xl font-bold mb-8">Pricing</h1>
              <PricingManager />
            </div>
          ) : (
            <div>
              <h1 className="font-display text-3xl font-bold mb-8">Bookings</h1>
              <AdminBookings />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Admin;
