import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { LayoutDashboard, Map, DollarSign, MapPin, Package, CalendarCheck, LogOut, Mail, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { PricingManager } from '@/components/PricingManager';
import { AdminBookings } from '@/components/admin/AdminBookings';
import { getApiBaseUrl } from '@/lib/api';

function MarkAsPaidButton({ bookingId, onSuccess }: { bookingId: string; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const { getAuthHeaders } = useAdminAuth();
  const base = getApiBaseUrl();
  const url = base ? `${base}/api/admin/bookings/${bookingId}/confirm` : `/api/admin/bookings/${bookingId}/confirm`;

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({ notes: 'Marked as paid offline from admin' }),
      });
      const json = await res.json();
      if (json.success) onSuccess();
      else alert(json.error || 'Error');
    } catch (e) {
      alert('Error al confirmar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="px-3 py-1 rounded text-xs bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-medium disabled:opacity-50"
    >
      {loading ? '...' : 'Mark as paid'}
    </button>
  );
}

type DashboardData = {
  totalToday: number;
  totalMonth: number;
  revenueToday: string;
  revenueMonth: string;
  bookingsToday: Array<{
    id: string;
    status: string;
    bookingDate: string;
    bookingTime: string | null;
    totalAmount: number;
    customer: { name: string; email: string };
  }>;
  bookingsRecent: Array<{
    id: string;
    status: string;
    bookingDate: string;
    bookingTime: string | null;
    totalAmount: number;
    customer: { name: string; email: string };
  }>;
};

const Admin = () => {
  const { t } = useLanguage();
  const { email, logout, getAuthHeaders } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = () => {
    const base = getApiBaseUrl();
    const url = base ? `${base}/api/admin/dashboard` : '/api/admin/dashboard';
    setLoading(true);
    fetch(url, { credentials: 'include', headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) setDashboard(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard();
  }, [activeTab]);

  const sidebarItems = [
    { key: 'admin.sidebar.dashboard', id: 'dashboard', icon: <LayoutDashboard size={18} /> },
    { key: 'admin.sidebar.zones', id: 'zones', icon: <Map size={18} /> },
    { key: 'admin.sidebar.pricing', id: 'pricing', icon: <DollarSign size={18} /> },
    { key: 'admin.sidebar.places', id: 'places', icon: <MapPin size={18} /> },
    { key: 'admin.sidebar.extras', id: 'extras', icon: <Package size={18} /> },
    { key: 'admin.sidebar.bookings', id: 'bookings', icon: <CalendarCheck size={18} /> },
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
              <h1 className="font-display text-3xl font-bold mb-8">Pricing Manager</h1>
              <PricingManager />
            </div>
          ) : activeTab === 'bookings' ? (
            <div>
              <h1 className="font-display text-3xl font-bold mb-8">Bookings</h1>
              <AdminBookings />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <h1 className="font-display text-3xl font-bold">{t('admin.dashboard')}</h1>
                <div className="flex items-center gap-2">
                  <a
                    href={`${getApiBaseUrl() || ''}/api/preview/booking-email`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-gold hover:bg-white/20 text-sm md:hidden"
                  >
                    <Mail size={16} /> Preview email
                  </a>
                  <button
                    onClick={fetchDashboard}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold/20 text-gold hover:bg-gold/30 text-sm disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                  </button>
                </div>
              </div>
              {loading ? (
                <div className="glass-card rounded-xl p-8 text-center">Loading...</div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    <div className="glass-card rounded-xl p-6 border border-border">
                      <p className="text-muted-foreground text-xs mb-1">{t('admin.todayBookings')}</p>
                      <p className="text-2xl font-bold text-gold">{dashboard?.totalToday ?? 0}</p>
                    </div>
                    <div className="glass-card rounded-xl p-6 border border-border">
                      <p className="text-muted-foreground text-xs mb-1">Reservas del mes</p>
                      <p className="text-2xl font-bold text-gold">{dashboard?.totalMonth ?? 0}</p>
                    </div>
                    <div className="glass-card rounded-xl p-6 border border-border">
                      <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                        <DollarSign size={12} /> Ingresos hoy
                      </p>
                      <p className="text-2xl font-bold text-gold">${dashboard?.revenueToday ?? '0.00'}</p>
                    </div>
                    <div className="glass-card rounded-xl p-6 border border-border">
                      <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                        <DollarSign size={12} /> Ingresos mes
                      </p>
                      <p className="text-2xl font-bold text-gold">${dashboard?.revenueMonth ?? '0.00'}</p>
                    </div>
                  </div>
                  <div className="glass-card rounded-xl border border-border overflow-hidden mb-6">
                    <h2 className="font-display font-semibold px-6 py-4 border-b border-border">Bookings recientes</h2>
                    <div className="overflow-x-auto table-scroll-x -mx-2 px-2">
                      <table className="w-full text-sm min-w-[500px]">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="text-left p-3 font-medium">ID</th>
                            <th className="text-left p-3 font-medium">Cliente</th>
                            <th className="text-left p-3 font-medium">Fecha</th>
                            <th className="text-left p-3 font-medium">Estado</th>
                            <th className="text-right p-3 font-medium">Total</th>
                            <th className="p-3" />
                          </tr>
                        </thead>
                        <tbody>
                          {(dashboard?.bookingsRecent ?? []).map((b) => (
                            <tr key={b.id} className="border-b border-border hover:bg-muted/20">
                              <td className="p-3 font-mono text-xs">{b.id.slice(0, 8)}</td>
                              <td className="p-3">{b.customer?.name ?? '-'}</td>
                              <td className="p-3">
                                {new Date(b.bookingDate).toLocaleDateString()} {b.bookingTime ?? ''}
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    ['PAID', 'CONFIRMED'].includes(b.status)
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : ['DRAFT', 'PENDING_PAYMENT'].includes(b.status)
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {b.status.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="p-3 text-right font-medium">${(b.totalAmount / 100).toFixed(2)}</td>
                              <td className="p-3">
                                {['DRAFT', 'PENDING_PAYMENT'].includes(b.status) && (
                                  <MarkAsPaidButton bookingId={b.id} onSuccess={fetchDashboard} />
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {(dashboard?.bookingsRecent ?? []).length === 0 && (
                      <div className="p-8 text-center text-muted-foreground">No hay reservas recientes</div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Admin;
