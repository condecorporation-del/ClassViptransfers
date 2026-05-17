import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2, RefreshCw, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';
import { useAdminAuth } from '@/features/admin/hooks/useAdminAuth';
import { getApiBaseUrl } from '@/shared/lib/api';

const apiUrl = (path: string) => {
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
};

const fmtUSDDecimal = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric' });

function daysBetween(isoDate: string): number {
  const now = new Date();
  const then = new Date(isoDate);
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function useCountUp(target: number, duration = 1300) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const run = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(run);
    };
    const id = requestAnimationFrame(run);
    return () => cancelAnimationFrame(id);
  }, [target, duration]);
  return value;
}

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
  customer: { name: string; email: string };
};

const GOLD = '#D9AE5F';
const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: '#10b981',
  PENDING_PAYMENT: '#f59e0b',
  OFFLINE_HOLD: '#3b82f6',
  CANCELLED: '#6b7280',
};

function GlassTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3.5 py-2.5 shadow-2xl text-sm pointer-events-none"
      style={{ background: 'rgba(6,15,30,0.95)', border: '1px solid rgba(212,175,55,0.3)', backdropFilter: 'blur(16px)' }}>
      <p className="text-[10px] font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
      <p className="font-black text-sm" style={{ color: GOLD }}>${payload[0].value.toLocaleString('en-US')}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    PENDING_PAYMENT: { label: 'Pendiente', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    OFFLINE_HOLD:    { label: 'En Espera', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
    CONFIRMED:       { label: 'Confirmada',color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
    CANCELLED:       { label: 'Cancelada', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  };
  const s = map[status] ?? { label: status, color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}25` }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function FinanzasTab() {
  const { getAuthHeaders } = useAdminAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const dateFrom = dateNDaysAgo(60);
      const [dashRes, bookRes] = await Promise.all([
        fetch(apiUrl('/api/admin/dashboard'), { credentials: 'include', headers: getAuthHeaders() }),
        fetch(apiUrl(`/api/admin/bookings?limit=200&dateFrom=${dateFrom}`), { credentials: 'include', headers: getAuthHeaders() }),
      ]);
      const dashJson = await dashRes.json();
      const bookJson = await bookRes.json();
      if (dashJson.success && dashJson.data) setDashboard(dashJson.data);
      if (bookJson.success && bookJson.data) setBookings(bookJson.data);
    } catch {
      setError('No se pudo cargar la información financiera.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pendingBookings = useMemo(
    () => bookings
      .filter((b) => b.status === 'PENDING_PAYMENT' || b.status === 'OFFLINE_HOLD')
      .sort((a, b) => new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime()),
    [bookings],
  );

  const cuentasPorCobrar = useMemo(
    () => pendingBookings.reduce((sum, b) => sum + b.totalAmount, 0),
    [pendingBookings],
  );

  const tasaCobro = useMemo(() => {
    const nonCancelled = bookings.filter((b) => b.status !== 'CANCELLED');
    if (nonCancelled.length === 0) return 0;
    return Math.round((bookings.filter((b) => b.status === 'CONFIRMED').length / nonCancelled.length) * 100);
  }, [bookings]);

  const revenueChartData = useMemo(() => {
    const cutoff = dateNDaysAgo(29);
    const byDay: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      byDay[d.toISOString().slice(0, 10)] = 0;
    }
    bookings.forEach((b) => {
      const day = b.bookingDate.slice(0, 10);
      if (day >= cutoff && b.status !== 'CANCELLED' && day in byDay)
        byDay[day] = (byDay[day] || 0) + b.totalAmount;
    });
    return Object.entries(byDay).map(([date, cents]) => ({
      date,
      label: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.round(cents / 100),
    }));
  }, [bookings]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { CONFIRMED: 0, PENDING_PAYMENT: 0, OFFLINE_HOLD: 0, CANCELLED: 0 };
    bookings.forEach((b) => { c[b.status in c ? b.status : 'CANCELLED']++; });
    return [
      { name: 'Confirmadas', key: 'CONFIRMED',       value: c.CONFIRMED,       color: STATUS_COLORS.CONFIRMED       },
      { name: 'Pendientes',  key: 'PENDING_PAYMENT',  value: c.PENDING_PAYMENT,  color: STATUS_COLORS.PENDING_PAYMENT  },
      { name: 'En Espera',   key: 'OFFLINE_HOLD',     value: c.OFFLINE_HOLD,     color: STATUS_COLORS.OFFLINE_HOLD     },
      { name: 'Canceladas',  key: 'CANCELLED',        value: c.CANCELLED,        color: STATUS_COLORS.CANCELLED        },
    ];
  }, [bookings]);

  const animRevMonth  = useCountUp(Math.round((dashboard?.revenueMonth ?? 0) / 100));
  const animRevToday  = useCountUp(Math.round((dashboard?.revenueToday ?? 0) / 100));
  const animPendiente = useCountUp(Math.round(cuentasPorCobrar / 100));

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-36 gap-5">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full animate-ping" style={{ border: '2px solid rgba(217,174,95,0.25)' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-gold" />
        </div>
      </div>
      <p className="text-sm font-medium text-muted-foreground">Cargando datos financieros…</p>
    </div>
  );

  if (error) return (
    <div className="rounded-2xl border border-red-200/70 bg-red-50/60 p-6 flex items-start gap-3 text-red-700">
      <AlertCircle size={18} className="shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-sm">{error}</p>
        <button onClick={() => void fetchData()} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-800 transition-colors">
          <RefreshCw size={11} /> Reintentar
        </button>
      </div>
    </div>
  );

  const subMetrics = [
    { label: 'Reservaciones', value: String(dashboard?.totalMonth ?? 0), sub: `${dashboard?.totalToday ?? 0} hoy`, accent: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.08)', color: '#fff' },
    { label: 'Por Cobrar',    value: `$${animPendiente.toLocaleString('en-US')}`, sub: `${pendingBookings.length} pendiente${pendingBookings.length !== 1 ? 's' : ''}`, accent: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', color: '#fbbf24' },
    { label: 'Tasa de Cobro', value: `${tasaCobro}%`,  sub: 'de confirmadas', accent: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)', color: '#34d399' },
  ];

  return (
    <div className="space-y-6">

      {/* ── Hero card ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #060f1e 0%, #0c1829 45%, #050d1a 100%)',
          border: '1px solid rgba(212,175,55,0.18)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.28), inset 0 1px 0 rgba(212,175,55,0.06)',
        }}
      >
        {/* Glow */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 65%)' }} />
        <div className="absolute -bottom-16 left-1/4 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 65%)' }} />

        {/* Background sparkline */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none opacity-[0.07]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueChartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="heroBg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D9AE5F" stopOpacity={1} />
                  <stop offset="100%" stopColor="#D9AE5F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke="#D9AE5F" strokeWidth={1.5} fill="url(#heroBg)" dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="relative p-6 md:p-8">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-1.5" style={{ color: 'rgba(212,175,55,0.45)' }}>
                Class VIP · Finanzas
              </p>
              <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {new Date().toLocaleDateString('es-MX', { weekday: 'long', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => void fetchData()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105"
                style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.22)', color: '#D9AE5F' }}>
                <RefreshCw size={9} /> Actualizar
              </button>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.22)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">Live</span>
              </div>
            </div>
          </div>

          {/* Main number */}
          <div className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Ingresos del Mes
            </p>
            <div className="flex items-end gap-4 flex-wrap">
              <span className="font-display font-black leading-none"
                style={{
                  fontSize: 'clamp(2.8rem, 8vw, 4.5rem)',
                  color: '#D9AE5F',
                  textShadow: '0 0 60px rgba(217,174,95,0.3), 0 0 120px rgba(217,174,95,0.12)',
                  letterSpacing: '-0.02em',
                }}>
                ${animRevMonth.toLocaleString('en-US')}
              </span>
              <div className="mb-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                <ArrowUpRight size={11} style={{ color: '#D9AE5F' }} />
                <span className="text-xs font-bold" style={{ color: '#D9AE5F' }}>
                  ${animRevToday.toLocaleString('en-US')} hoy
                </span>
              </div>
            </div>
          </div>

          {/* Sub-metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {subMetrics.map((m) => (
              <div key={m.label} className="rounded-2xl p-4 transition-all"
                style={{ background: m.accent, border: `1px solid ${m.border}` }}>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] mb-2" style={{ color: m.color, opacity: 0.55 }}>
                  {m.label}
                </p>
                <p className="text-2xl font-black leading-none mb-1" style={{ color: m.color }}>
                  {m.value}
                </p>
                <p className="text-[10px]" style={{ color: m.color, opacity: 0.35 }}>{m.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Charts ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Area chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="lg:col-span-2 rounded-2xl bg-white p-5 shadow-sm"
          style={{ border: '1px solid rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.25em] mb-0.5" style={{ color: GOLD }}>Tendencia</p>
              <p className="font-bold text-sm text-foreground">Ingresos — Últimos 30 días</p>
            </div>
            <div className="w-2 h-2 rounded-full" style={{ background: GOLD, boxShadow: `0 0 8px ${GOLD}99` }} />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="areaGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D9AE5F" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#D9AE5F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.35)', fontWeight: 600 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.35)', fontWeight: 600 }} tickLine={false} axisLine={false}
                tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} width={44} />
              <Tooltip content={<GlassTooltip />} cursor={{ stroke: GOLD, strokeWidth: 1, strokeDasharray: '4 2' }} />
              <Area type="monotone" dataKey="value" stroke={GOLD} strokeWidth={2.5} fill="url(#areaGold)" dot={false}
                activeDot={{ r: 5, fill: GOLD, strokeWidth: 0, style: { filter: 'drop-shadow(0 0 6px rgba(217,174,95,0.9))' } }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie donut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.24 }}
          className="rounded-2xl bg-white p-5 shadow-sm flex flex-col"
          style={{ border: '1px solid rgba(0,0,0,0.06)' }}
        >
          <div className="mb-4">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] mb-0.5" style={{ color: GOLD }}>Distribución</p>
            <p className="font-bold text-sm text-foreground">Estado — 60 días</p>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <div className="relative">
              <ResponsiveContainer width={168} height={168}>
                <PieChart>
                  <Pie data={statusCounts} cx="50%" cy="50%" innerRadius={50} outerRadius={76}
                    dataKey="value" startAngle={90} endAngle={-270} strokeWidth={3} stroke="white">
                    {statusCounts.map((e) => <Cell key={e.key} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-foreground leading-none">{bookings.length}</span>
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground mt-1">total</span>
              </div>
            </div>
            <div className="mt-4 w-full space-y-3">
              {statusCounts.map((e) => (
                <div key={e.key} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: e.color }} />
                    <span className="text-xs font-medium text-muted-foreground truncate">{e.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="h-1 rounded-full overflow-hidden" style={{ width: 44, background: 'rgba(0,0,0,0.06)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${bookings.length > 0 ? (e.value / bookings.length) * 100 : 0}%`, background: e.color }} />
                    </div>
                    <span className="text-xs font-black w-5 text-right" style={{ color: e.color }}>{e.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Cuentas por Cobrar ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.32 }}
      >
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] mb-0.5" style={{ color: GOLD }}>Cobros Pendientes</p>
            <p className="font-display text-xl font-bold text-foreground">Cuentas por Cobrar</p>
          </div>
          {pendingBookings.length > 0 && (
            <div className="rounded-xl px-4 py-2.5 text-right"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.22)' }}>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-600 mb-0.5">Total por cobrar</p>
              <p className="font-black text-xl text-amber-700 leading-none">{fmtUSDDecimal(cuentasPorCobrar)}</p>
            </div>
          )}
        </div>

        {pendingBookings.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 flex flex-col items-center gap-3 text-center"
            style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <CheckCircle2 size={22} className="text-emerald-500" />
            </div>
            <p className="font-bold text-sm text-foreground">Sin cuentas pendientes</p>
            <p className="text-xs text-muted-foreground">No hay reservaciones con cobro pendiente en los últimos 60 días.</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white overflow-hidden shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border/40">
              {pendingBookings.map((b, i) => {
                const dias = daysBetween(b.bookingDate);
                return (
                  <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold" style={{ color: GOLD }}>
                        {b.confirmationCode || b.id.slice(0, 8).toUpperCase()}
                      </span>
                      <StatusPill status={b.status} />
                    </div>
                    <p className="font-semibold text-sm text-foreground">{b.customer?.name || '—'}</p>
                    <p className="text-xs text-muted-foreground mb-2">{fmtDate(b.bookingDate)}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground">{fmtUSDDecimal(b.totalAmount)}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${dias > 7 ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'}`}>
                        {dias}d pendiente
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {/* Desktop table */}
            <table className="hidden md:table w-full text-sm min-w-[640px]">
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  {['ID', 'Cliente', 'Fecha', 'Monto', 'Estado', 'Antiguedad'].map((h, i) => (
                    <th key={h} className={`px-5 py-3.5 text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground ${i >= 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingBookings.map((b, i) => {
                  const dias = daysBetween(b.bookingDate);
                  return (
                    <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-border/30 transition-colors hover:bg-muted/20">
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold" style={{ color: GOLD }}>
                          {b.confirmationCode || b.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-sm text-foreground">{b.customer?.name || '—'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{b.customer?.email}</p>
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(b.bookingDate)}</td>
                      <td className="px-5 py-4 text-right font-black text-sm text-foreground whitespace-nowrap">{fmtUSDDecimal(b.totalAmount)}</td>
                      <td className="px-5 py-4 text-right"><StatusPill status={b.status} /></td>
                      <td className="px-5 py-4 text-right">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-full ${dias > 7 ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'}`}>
                          {dias}d
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: 'rgba(0,0,0,0.02)', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <td colSpan={3} className="px-5 py-3.5 text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                    Total — {pendingBookings.length} registro{pendingBookings.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-5 py-3.5 text-right font-black text-sm text-foreground">{fmtUSDDecimal(cuentasPorCobrar)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
