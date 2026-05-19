import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CalendarCheck,
  Clock3,
  CreditCard,
  Loader2,
  Route,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAdminAuth } from '@/features/admin/hooks/useAdminAuth';
import { getApiBaseUrl } from '@/shared/lib/api';

const apiUrl = (path: string) => {
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
};

type DashboardTrendPoint = {
  date: string;
  label: string;
  bookings: number;
  revenue: number;
};

type DashboardPayload = {
  totalToday: number;
  totalMonth: number;
  revenueToday: string;
  revenueMonth: string;
  trends: {
    last7Days: DashboardTrendPoint[];
    statusCounts: Record<string, number>;
    topRoutes: Array<{ route: string; count: number }>;
  };
  accounts: {
    totalAccounts: number;
    openAccounts: number;
    outstandingBalanceCents: number;
    settledAccounts: number;
  };
};

function currency(value: number | string) {
  const normalized = typeof value === 'string' ? Number(value) : value;
  return `$${normalized.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function TooltipCard({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-2xl px-3 py-2 shadow-2xl text-xs"
      style={{ background: 'rgba(6,15,30,0.96)', border: '1px solid rgba(217,174,95,0.24)' }}
    >
      <p className="text-white/45 mb-1 font-semibold">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-3">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-bold text-white">{entry.name.toLowerCase().includes('revenue') ? currency(entry.value) : entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function DashboardOverviewTab() {
  const { getAuthHeaders } = useAdminAuth();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(apiUrl('/api/admin/dashboard'), {
          credentials: 'include',
          headers: getAuthHeaders(),
        });
        const json = await response.json();
        if (!cancelled && json.success) {
          setData(json.data);
        }
      } catch {
        if (!cancelled) {
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [getAuthHeaders]);

  const statusRows = useMemo(() => {
    const counts = data?.trends.statusCounts || {};
    return [
      { label: 'Confirmed', value: counts.CONFIRMED || 0, tone: 'text-emerald-600 bg-emerald-50 border-emerald-200/70' },
      { label: 'Pending', value: counts.PENDING_PAYMENT || 0, tone: 'text-amber-600 bg-amber-50 border-amber-200/70' },
      { label: 'Hold', value: counts.OFFLINE_HOLD || 0, tone: 'text-blue-600 bg-blue-50 border-blue-200/70' },
      { label: 'Cancelled', value: counts.CANCELLED || 0, tone: 'text-slate-600 bg-slate-50 border-slate-200/70' },
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <Loader2 size={28} className="animate-spin text-gold mx-auto" />
          <p className="text-sm text-muted-foreground">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-sm text-muted-foreground">Could not load dashboard.</div>;
  }

  const cards = [
    {
      label: 'Bookings Today',
      value: data.totalToday,
      detail: `${data.totalMonth} this month`,
      icon: <CalendarCheck size={18} />,
      tone: 'from-amber-50 to-white border-gold/25 text-gold',
    },
    {
      label: 'Revenue Today',
      value: currency(data.revenueToday),
      detail: `${currency(data.revenueMonth)} this month`,
      icon: <TrendingUp size={18} />,
      tone: 'from-emerald-50 to-white border-emerald-200/70 text-emerald-600',
    },
    {
      label: 'Open Accounts',
      value: data.accounts.openAccounts,
      detail: currency(data.accounts.outstandingBalanceCents / 100),
      icon: <Wallet size={18} />,
      tone: 'from-blue-50 to-white border-blue-200/70 text-blue-600',
    },
    {
      label: 'Settled Accounts',
      value: data.accounts.settledAccounts,
      detail: `${data.accounts.totalAccounts} total`,
      icon: <CreditCard size={18} />,
      tone: 'from-slate-50 to-white border-slate-200/70 text-slate-600',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold mb-1">Overview</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Operations Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Revenue, booking flow, and credit-account exposure in one place.</p>
        </div>
        <div className="rounded-full border border-border/60 bg-white px-3 py-1.5 text-xs font-semibold text-muted-foreground">
          Last 7 days
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-2xl border bg-gradient-to-b ${card.tone} p-5 shadow-sm`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl bg-white/80 flex items-center justify-center">{card.icon}</div>
              <ArrowUpRight size={14} className="text-foreground/30" />
            </div>
            <p className="text-3xl font-display font-bold text-foreground">{card.value}</p>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_1fr] gap-5">
        <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold mb-1">Trend</p>
            <h2 className="font-display text-xl font-bold text-foreground">Bookings and Revenue</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trends.last7Days} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d9ae5f" stopOpacity={0.38} />
                    <stop offset="100%" stopColor="#d9ae5f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,22,40,0.08)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip content={<TooltipCard />} />
                <Bar yAxisId="left" dataKey="bookings" name="Bookings" fill="#0f172a" radius={[6, 6, 0, 0]} />
                <Area yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#d9ae5f" fill="url(#revenueFill)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold mb-1">Status Mix</p>
              <h2 className="font-display text-xl font-bold text-foreground">Booking States</h2>
            </div>
            <div className="space-y-2">
              {statusRows.map((row) => (
                <div key={row.label} className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${row.tone}`}>
                  <span className="text-sm font-semibold">{row.label}</span>
                  <span className="text-lg font-display font-bold">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold mb-1">Routes</p>
              <h2 className="font-display text-xl font-bold text-foreground">Top Demand</h2>
            </div>
            <div className="space-y-3">
              {data.trends.topRoutes.length === 0 && (
                <p className="text-sm text-muted-foreground">No route data yet.</p>
              )}
              {data.trends.topRoutes.map((item) => (
                <div key={item.route} className="flex items-center gap-3 rounded-2xl bg-muted/40 px-4 py-3">
                  <div className="w-9 h-9 rounded-2xl bg-gold/10 text-gold flex items-center justify-center shrink-0">
                    <Route size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{item.route}</p>
                    <p className="text-xs text-muted-foreground">{item.count} bookings</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock3 size={16} className="text-amber-500" />
            <h3 className="font-display text-lg font-bold text-foreground">Credit Exposure</h3>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">{currency(data.accounts.outstandingBalanceCents / 100)}</p>
          <p className="text-sm text-muted-foreground mt-1">Open client-account balance pending collection.</p>
        </div>
        <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={16} className="text-blue-500" />
            <h3 className="font-display text-lg font-bold text-foreground">Open Accounts</h3>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">{data.accounts.openAccounts}</p>
          <p className="text-sm text-muted-foreground mt-1">Clients currently carrying running balances.</p>
        </div>
        <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-emerald-500" />
            <h3 className="font-display text-lg font-bold text-foreground">Momentum</h3>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">{data.trends.last7Days.reduce((sum, item) => sum + item.bookings, 0)}</p>
          <p className="text-sm text-muted-foreground mt-1">Bookings captured over the last 7 operational days.</p>
        </div>
      </div>
    </div>
  );
}
