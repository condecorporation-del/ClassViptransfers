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

type AccountCharge = {
  id: string;
  description: string;
  amountCents: number;
  status: 'PENDING' | 'INVOICED' | 'PAID' | 'VOID';
  serviceDate?: string | null;
  booking?: { confirmationCode?: string | null } | null;
};

type AccountDetail = {
  id: string;
  name: string;
  company?: string | null;
  charges: AccountCharge[];
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
  const [accountReceivables, setAccountReceivables] = useState<Array<{
    id: string;
    source: 'account';
    accountId: string;
    accountName: string;
    description: string;
    status: string;
    amountCents: number;
    date: string;
    reference?: string | null;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardResponse, bookingsResponse, accountsResponse] = await Promise.all([
        fetch(apiUrl('/api/admin/dashboard'), { credentials: 'include', headers: getAuthHeaders() }),
        fetch(apiUrl(`/api/admin/bookings?limit=300&dateFrom=${dateNDaysAgo(90)}`), {
          credentials: 'include',
          headers: getAuthHeaders(),
        }),
        fetch(apiUrl('/api/admin/accounts'), { credentials: 'include', headers: getAuthHeaders() }),
      ]);

      const dashboardJson = await dashboardResponse.json();
      const bookingsJson = await bookingsResponse.json();
      const accountsJson = await accountsResponse.json();

      setDashboard(dashboardJson.success ? dashboardJson.data : null);
      setBookings(bookingsJson.success ? bookingsJson.data : []);

      if (accountsJson.success) {
        const accountDetails = await Promise.all(
          (accountsJson.data as Array<{ id: string }>).map(async (account) => {
            const response = await fetch(apiUrl(`/api/admin/accounts/${account.id}`), {
              credentials: 'include',
              headers: getAuthHeaders(),
            });
            const json = await response.json();
            return json.success ? (json.data as AccountDetail) : null;
          })
        );

        const charges = accountDetails
          .filter((account): account is AccountDetail => Boolean(account))
          .flatMap((account) =>
            account.charges
              .filter((charge) => charge.status === 'PENDING' || charge.status === 'INVOICED')
              .map((charge) => ({
                id: charge.id,
                source: 'account' as const,
                accountId: account.id,
                accountName: account.name,
                description: charge.description,
                status: charge.status,
                amountCents: charge.amountCents,
                date: (charge.serviceDate || new Date().toISOString()).slice(0, 10),
                reference: charge.booking?.confirmationCode || null,
              }))
          );
        setAccountReceivables(charges);
      } else {
        setAccountReceivables([]);
      }
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

  useEffect(() => {
    if (activeTab === 'receivables' || activeTab === 'accounts') {
      void fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const bookingReceivables = useMemo(
    () => bookings
      .filter((booking) =>
        booking.totalAmount > 0 &&
        ['PENDING_PAYMENT', 'OFFLINE_HOLD', 'CONFIRMED'].includes(booking.status) &&
        booking.status !== 'PAID'
      )
      .sort((a, b) => a.bookingDate.localeCompare(b.bookingDate)),
    [bookings],
  );

  const receivables = useMemo(
    () => [
      ...bookingReceivables.map((booking) => ({
        id: booking.id,
        source: 'booking' as const,
        customer: booking.customer?.name || 'Cliente',
        service: serviceLabel(booking),
        amountCents: booking.totalAmount,
        date: booking.bookingDate.slice(0, 10),
        status: booking.status,
        reference: booking.confirmationCode || null,
      })),
      ...accountReceivables.map((charge) => ({
        id: charge.id,
        source: 'account' as const,
        customer: charge.accountName,
        service: charge.description,
        amountCents: charge.amountCents,
        date: charge.date,
        status: charge.status,
        reference: charge.reference,
      })),
    ].sort((a, b) => a.date.localeCompare(b.date)),
    [accountReceivables, bookingReceivables],
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

  const receivableTotal = receivables.reduce((sum, item) => sum + item.amountCents, 0);
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

          <div className="space-y-3 p-4 md:hidden">
            {receivables.map((item) => {
              const days = daysOverdue(item.date);
              return (
                <div key={item.id} className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.customer}</p>
                      {item.reference && <p className="mt-1 text-xs text-muted-foreground">{item.reference}</p>}
                    </div>
                    <p className="text-sm font-bold text-foreground">{usd(item.amountCents)}</p>
                  </div>
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-muted-foreground">{item.service}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                        {item.source === 'account' ? 'Cuenta abierta' : 'Reserva'}
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${urgencyClass(days)}`}>
                        {days} dias
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                        item.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : item.status === 'INVOICED'
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {item.status === 'INVOICED' ? 'Facturado' : item.status === 'PAID' ? 'Pagado' : 'Por pagar'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                      <span>{item.date}</span>
                      <button
                        type="button"
                        onClick={() => console.log('[Finance] Send reminder', item.id)}
                        className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 font-bold text-foreground hover:border-gold/40 hover:bg-gold/10"
                      >
                        <Bell size={12} />
                        Recordar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto md:block">
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
                {receivables.map((item) => {
                  const days = daysOverdue(item.date);
                  return (
                    <tr key={item.id} className="hover:bg-gold/5">
                      <td className="px-4 py-3">{item.date}</td>
                      <td className="px-4 py-3 font-semibold">
                        <div>{item.customer}</div>
                        {item.reference && <div className="text-xs text-muted-foreground">{item.reference}</div>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div>{item.service}</div>
                        <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                          {item.source === 'account' ? 'Cuenta abierta' : 'Reserva'}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold">{usd(item.amountCents)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${urgencyClass(days)}`}>
                          {days} dias
                        </span>
                        <div className="mt-2">
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                            item.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : item.status === 'INVOICED'
                                ? 'bg-blue-100 text-blue-700 border-blue-200'
                                : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}>
                            {item.status === 'INVOICED' ? 'Facturado' : item.status === 'PAID' ? 'Pagado' : 'Por pagar'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => console.log('[Finance] Send reminder', item.id)}
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
          <AccountsTab onDataChange={fetchData} />
        </div>
      )}
    </div>
  );
}
