import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowUpRight, Bell, Loader2, RefreshCw, WalletCards } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AccountsTab } from '@/features/admin/components/AccountsTab';
import { useAdminAuth } from '@/features/admin/hooks/useAdminAuth';
import { getApiBaseUrl } from '@/shared/lib/api';

const apiUrl = (path: string) => {
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
};

type FinanceTab = 'summary' | 'receivables' | 'accounts';

type DashboardData = {
  totalToday: number;
  totalMonth: number;
  revenueToday: number;
  revenueMonth: number;
};

type Booking = {
  id: string;
  confirmationCode?: string | null;
  status: string;
  totalAmount: number;
  bookingDate: string;
  serviceType?: string | null;
  route?: string | null;
  tripType?: string | null;
  customer?: { name?: string | null; email?: string | null };
};

const tabs: Array<{ id: FinanceTab; label: string }> = [
  { id: 'summary', label: 'Resumen Financiero' },
  { id: 'receivables', label: 'Cuentas por Cobrar' },
  { id: 'accounts', label: 'Cuentas Abiertas' },
];

function usd(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function daysOverdue(date: string) {
  const today = new Date();
  const bookingDate = new Date(`${date.slice(0, 10)}T12:00:00`);
  return Math.max(0, Math.floor((today.getTime() - bookingDate.getTime()) / 86_400_000));
}

function urgencyClass(days: number) {
  if (days > 14) return 'bg-red-100 text-red-700 border-red-200';
  if (days >= 7) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  return 'bg-emerald-100 text-emerald-700 border-emerald-200';
}

function serviceLabel(booking: Booking) {
  if (booking.tripType === 'roundtrip') return 'Redondo';
  if (booking.route === 'airport-hotel') return 'Llegada';
  if (booking.route === 'hotel-airport') return 'Salida';
  return booking.serviceType || 'Servicio';
}

function dateNDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export function FinanzasTab() {
  const { getAuthHeaders } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<FinanceTab>('summary');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardResponse, bookingsResponse] = await Promise.all([
        fetch(apiUrl('/api/admin/dashboard'), { credentials: 'include', headers: getAuthHeaders() }),
        fetch(apiUrl(`/api/admin/bookings?limit=300&dateFrom=${dateNDaysAgo(90)}`), {
          credentials: 'include',
          headers: getAuthHeaders(),
        }),
      ]);

      const dashboardJson = await dashboardResponse.json();
      const bookingsJson = await bookingsResponse.json();

      setDashboard(dashboardJson.success ? dashboardJson.data : null);
      setBookings(bookingsJson.success ? bookingsJson.data : []);
    } catch {
      setError('No se pudo cargar la informacion financiera.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const receivables = useMemo(
    () => bookings
      .filter((booking) =>
        booking.totalAmount > 0 &&
        ['PENDING_PAYMENT', 'OFFLINE_HOLD', 'CONFIRMED'].includes(booking.status) &&
        booking.status !== 'PAID'
      )
      .sort((a, b) => a.bookingDate.localeCompare(b.bookingDate)),
    [bookings],
  );

  const chartData = useMemo(() => {
    const days: Record<string, number> = {};
    for (let index = 29; index >= 0; index -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - index);
      days[date.toISOString().slice(0, 10)] = 0;
    }

    bookings.forEach((booking) => {
      const day = booking.bookingDate.slice(0, 10);
      if (day in days && booking.status !== 'CANCELLED') {
        days[day] += booking.totalAmount;
      }
    });

    return Object.entries(days).map(([date, cents]) => ({
      date: new Date(`${date}T12:00:00`).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
      revenue: Math.round(cents / 100),
    }));
  }, [bookings]);

  const receivableTotal = receivables.reduce((sum, booking) => sum + booking.totalAmount, 0);
  const averageTicket = dashboard?.totalMonth ? (dashboard.revenueMonth / dashboard.totalMonth) : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-28 text-muted-foreground">
        <Loader2 className="animate-spin text-gold" size={24} />
        <p className="text-sm font-semibold">Cargando finanzas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <div className="flex items-center gap-2 font-bold">
          <AlertCircle size={18} />
          {error}
        </div>
        <button onClick={() => void fetchData()} className="mt-3 inline-flex items-center gap-2 text-sm font-bold">
          <RefreshCw size={14} />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Finanzas</p>
          <h2 className="font-serif text-2xl font-bold text-foreground">Control financiero</h2>
        </div>
        <div className="inline-flex rounded-xl bg-muted/40 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
                activeTab === tab.id ? 'bg-gold text-navy' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'summary' && (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ['Revenue Mes', usd(dashboard?.revenueMonth ?? 0), `${dashboard?.totalMonth ?? 0} reservas`],
              ['Revenue Hoy', usd(dashboard?.revenueToday ?? 0), `${dashboard?.totalToday ?? 0} servicios`],
              ['Por Cobrar', usd(receivableTotal), `${receivables.length} cuentas`],
              ['Promedio', usd(averageTicket), 'por servicio'],
            ].map(([label, value, sub]) => (
              <div key={label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
                <p className="mt-3 text-2xl font-black text-foreground">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Tendencia</p>
                <h3 className="text-lg font-bold text-foreground">Revenue ultimos 30 dias</h3>
              </div>
              <ArrowUpRight className="text-gold" size={18} />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="financeGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D9AE5F" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#D9AE5F" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#D9AE5F" strokeWidth={2} fill="url(#financeGold)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'receivables' && (
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Cobranza</p>
              <h3 className="text-lg font-bold text-foreground">Cuentas por cobrar</h3>
            </div>
            <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
              {usd(receivableTotal)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Fecha', 'Cliente', 'Servicio', 'Monto', 'Dias vencido', 'Accion'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {receivables.map((booking) => {
                  const days = daysOverdue(booking.bookingDate);
                  return (
                    <tr key={booking.id} className="hover:bg-gold/5">
                      <td className="px-4 py-3">{booking.bookingDate.slice(0, 10)}</td>
                      <td className="px-4 py-3 font-semibold">{booking.customer?.name || 'Cliente'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{serviceLabel(booking)}</td>
                      <td className="px-4 py-3 font-bold">{usd(booking.totalAmount)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${urgencyClass(days)}`}>
                          {days} dias
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => console.log('[Finance] Send reminder', booking.id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:border-gold/40 hover:bg-gold/10"
                        >
                          <Bell size={13} />
                          Enviar recordatorio
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {receivables.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">No hay cuentas por cobrar pendientes.</div>
          )}
        </div>
      )}

      {activeTab === 'accounts' && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gold/10 p-3 text-gold">
                <WalletCards size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Cuentas abiertas</p>
                <h3 className="text-lg font-bold text-foreground">Clientes con credito abierto y saldo por liquidar</h3>
              </div>
            </div>
          </div>
          <AccountsTab />
        </div>
      )}
    </div>
  );
}
