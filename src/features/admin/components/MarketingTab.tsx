import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2, RefreshCw, MapPin, Clock, CalendarDays, TrendingUp, BarChart2, Star } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts';
import { useAdminAuth } from '@/features/admin/hooks/useAdminAuth';
import { getApiBaseUrl } from '@/shared/lib/api';

const apiUrl = (path: string) => {
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
};

const fmtUSD = (cents: number) => `$${Math.round(cents / 100).toLocaleString('en-US')}`;

function dateNDaysAgo(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const DAY_NAMES_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function extractZone(location: string | null | undefined): string {
  if (!location) return 'Desconocido';
  const ZONES = ['Cabo San Lucas','San Jose del Cabo','Los Cabos','La Paz','Todos Santos','Airport','Hotel Zone','Marina','Palmilla','Corridor','Corredor'];
  for (const z of ZONES) {
    if (location.toLowerCase().includes(z.toLowerCase())) return z;
  }
  const first = location.split(',')[0].trim();
  return first.length > 0 ? first : 'Desconocido';
}

function useCountUp(target: number, duration = 1200) {
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

type Booking = {
  id: string;
  status: string;
  totalAmount: number;
  bookingDate: string;
  pickupLocation?: string | null;
  dropoffLocation?: string | null;
};

type DashboardData = {
  totalToday: number;
  totalMonth: number;
  revenueToday: number;
  revenueMonth: number;
};

const GOLD = '#D9AE5F';
const GREEN = '#10b981';
const AMBER = '#f59e0b';

// ─── Glass tooltip ────────────────────────────────────────────────────────────

function GlassTooltipCount({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="rounded-xl px-3.5 py-2.5 shadow-2xl text-sm pointer-events-none"
      style={{ background: 'rgba(6,15,30,0.95)', border: '1px solid rgba(212,175,55,0.3)', backdropFilter: 'blur(16px)' }}>
      <p className="text-[10px] font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
      <p className="font-black text-sm" style={{ color: GOLD }}>{v} reservación{v !== 1 ? 'es' : ''}</p>
    </div>
  );
}

function GlassTooltipStatus({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3.5 py-2.5 shadow-2xl text-sm pointer-events-none"
      style={{ background: 'rgba(6,15,30,0.95)', border: '1px solid rgba(212,175,55,0.3)', backdropFilter: 'blur(16px)' }}>
      <p className="text-[10px] font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-bold text-xs mb-0.5" style={{ color: p.color }}>
          {p.name === 'confirmadas' ? 'Confirmadas' : 'Pendientes'}: {p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function MarketingTab() {
  const { getAuthHeaders } = useAdminAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, bookRes] = await Promise.all([
        fetch(apiUrl('/api/admin/dashboard'), { credentials: 'include', headers: getAuthHeaders() }),
        fetch(apiUrl('/api/admin/bookings?limit=200'), { credentials: 'include', headers: getAuthHeaders() }),
      ]);
      const dashJson = await dashRes.json();
      const bookJson = await bookRes.json();
      if (dashJson.success && dashJson.data) setDashboard(dashJson.data as DashboardData);
      if (bookJson.success && bookJson.data) setBookings(bookJson.data as Booking[]);
    } catch {
      setError('No se pudo cargar la información de marketing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const conversionRate = useMemo(() => {
    const relevant = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING_PAYMENT' || b.status === 'OFFLINE_HOLD');
    if (!relevant.length) return 0;
    return Math.round((relevant.filter((b) => b.status === 'CONFIRMED').length / relevant.length) * 100);
  }, [bookings]);

  const avgBookingValue = useMemo(() => {
    const total = dashboard?.totalMonth ?? 0;
    if (!total) return 0;
    return Math.round((dashboard?.revenueMonth ?? 0) / total);
  }, [dashboard]);

  const bookingsByDay = useMemo(() => {
    const cutoff = dateNDaysAgo(29);
    const byDay: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      byDay[d.toISOString().slice(0, 10)] = 0;
    }
    bookings.forEach((b) => {
      const day = b.bookingDate.slice(0, 10);
      if (day >= cutoff && day in byDay) byDay[day] = (byDay[day] || 0) + 1;
    });
    return Object.entries(byDay).map(([date, count]) => ({
      date, count,
      label: new Date(date + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
    }));
  }, [bookings]);

  const zoneData = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach((b) => {
      const zone = extractZone(b.dropoffLocation || b.pickupLocation);
      counts[zone] = (counts[zone] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 7)
      .map(([zone, count]) => ({ zone: truncate(zone, 18), count }));
  }, [bookings]);

  const statusGroupedData = useMemo(() => {
    const result: { month: string; confirmadas: number; pendientes: number }[] = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
      const inMonth = bookings.filter((b) => {
        const bd = new Date(b.bookingDate);
        return bd.getFullYear() === d.getFullYear() && bd.getMonth() === d.getMonth();
      });
      result.push({
        month: d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
        confirmadas: inMonth.filter((b) => b.status === 'CONFIRMED').length,
        pendientes: inMonth.filter((b) => b.status === 'PENDING_PAYMENT' || b.status === 'OFFLINE_HOLD').length,
      });
    }
    return result;
  }, [bookings]);

  const topDayOfWeek = useMemo(() => {
    const counts = Array(7).fill(0);
    bookings.forEach((b) => counts[new Date(b.bookingDate).getDay()]++);
    const maxIdx = counts.indexOf(Math.max(...counts));
    return counts[maxIdx] === 0 ? 'N/A' : DAY_NAMES_ES[maxIdx];
  }, [bookings]);

  const topZone = useMemo(() => zoneData[0]?.zone ?? 'N/A', [zoneData]);

  const peakHour = useMemo(() => {
    const counts: Record<number, number> = {};
    bookings.forEach((b) => { const h = new Date(b.bookingDate).getHours(); if (!isNaN(h)) counts[h] = (counts[h] || 0) + 1; });
    const entries = Object.entries(counts);
    if (!entries.length) return 'N/A';
    const h = parseInt(entries.sort((a, b) => b[1] - a[1])[0][0]);
    return `${h % 12 === 0 ? 12 : h % 12}:00 ${h >= 12 ? 'PM' : 'AM'}`;
  }, [bookings]);

  const animMonth   = useCountUp(dashboard?.totalMonth ?? 0);
  const animToday   = useCountUp(dashboard?.totalToday ?? 0);
  const animConv    = useCountUp(conversionRate);
  const animAvg     = useCountUp(Math.round(avgBookingValue / 100));

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-36 gap-5">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full animate-ping" style={{ border: '2px solid rgba(217,174,95,0.25)' }} />
        <div className="absolute inset-0 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-gold" /></div>
      </div>
      <p className="text-sm font-medium text-muted-foreground">Cargando datos de marketing…</p>
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

  // KPI cards config
  const kpis = [
    { label: 'Reservaciones del Mes', value: animMonth, suffix: '', icon: CalendarDays, accent: 'rgba(212,175,55,0.06)', border: 'rgba(212,175,55,0.2)', color: GOLD },
    { label: 'Reservaciones Hoy',     value: animToday, suffix: '', icon: TrendingUp,  accent: 'rgba(59,130,246,0.06)',  border: 'rgba(59,130,246,0.2)',  color: '#60a5fa' },
    { label: 'Tasa de Conversión',    value: animConv,  suffix: '%', icon: BarChart2,  accent: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)', color: '#34d399' },
    { label: 'Valor Promedio (Mes)',   value: animAvg,  suffix: '', prefix: '$', icon: Star, accent: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', color: '#fbbf24' },
  ];

  return (
    <div className="space-y-6">

      {/* ── Dark header strip ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl overflow-hidden px-6 py-5 md:px-8 md:py-6"
        style={{
          background: 'linear-gradient(135deg, #060f1e 0%, #0c1829 60%, #050d1a 100%)',
          border: '1px solid rgba(212,175,55,0.18)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.22), inset 0 1px 0 rgba(212,175,55,0.06)',
        }}
      >
        <div className="absolute -top-16 right-0 w-72 h-72 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 65%)' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-2" style={{ color: 'rgba(212,175,55,0.45)' }}>
              Class VIP · Marketing
            </p>
            <p className="font-display font-black text-white leading-none" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)' }}>
              Análisis de Demanda
            </p>
            <p className="text-xs font-medium mt-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Últimas 200 reservaciones · {new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button onClick={() => void fetchData()}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105"
            style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: GOLD }}>
            <RefreshCw size={10} /> Actualizar
          </button>
        </div>
      </motion.div>

      {/* ── KPI Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
            className="rounded-2xl p-5"
            style={{ background: k.accent, border: `1px solid ${k.border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground leading-tight">{k.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${k.color}15` }}>
                <k.icon size={14} style={{ color: k.color }} />
              </div>
            </div>
            <p className="font-display font-black text-3xl leading-none text-foreground">
              {k.prefix ?? ''}{k.value.toLocaleString('en-US')}{k.suffix}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ── Bookings per day ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.18 }}
        className="rounded-2xl bg-white p-5 shadow-sm"
        style={{ border: '1px solid rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] mb-0.5" style={{ color: GOLD }}>Volumen Diario</p>
            <p className="font-bold text-sm text-foreground">Reservaciones por Día — Últimos 30 días</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: GOLD, boxShadow: `0 0 8px ${GOLD}99` }} />
            <span className="text-[10px] font-bold text-muted-foreground">reservaciones</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={bookingsByDay} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.35)', fontWeight: 600 }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.35)', fontWeight: 600 }} tickLine={false} axisLine={false} allowDecimals={false} width={24} />
            <Tooltip content={<GlassTooltipCount />} cursor={{ fill: 'rgba(217,174,95,0.06)' }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {bookingsByDay.map((entry) => (
                <Cell key={entry.date} fill={GOLD} fillOpacity={entry.count > 0 ? 1 : 0.25} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ── Zone + Monthly ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Zone horizontal bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.24 }}
          className="rounded-2xl bg-white p-5 shadow-sm"
          style={{ border: '1px solid rgba(0,0,0,0.06)' }}
        >
          <div className="mb-5">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] mb-0.5" style={{ color: GOLD }}>Geográfico</p>
            <p className="font-bold text-sm text-foreground">Reservaciones por Zona</p>
          </div>
          {zoneData.length === 0 ? (
            <div className="flex items-center justify-center h-56 text-muted-foreground text-sm">Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={zoneData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.35)', fontWeight: 600 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="zone" tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.45)', fontWeight: 600 }} tickLine={false} axisLine={false} width={110} />
                <Tooltip content={<GlassTooltipCount />} cursor={{ fill: 'rgba(217,174,95,0.06)' }} />
                <Bar dataKey="count" fill={GOLD} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Monthly status grouped */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.3 }}
          className="rounded-2xl bg-white p-5 shadow-sm"
          style={{ border: '1px solid rgba(0,0,0,0.06)' }}
        >
          <div className="mb-5">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] mb-0.5" style={{ color: GOLD }}>Calidad</p>
            <p className="font-bold text-sm text-foreground">Confirmadas vs Pendientes — 3 Meses</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={statusGroupedData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.45)', fontWeight: 700 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.35)', fontWeight: 600 }} tickLine={false} axisLine={false} allowDecimals={false} width={24} />
              <Tooltip content={<GlassTooltipStatus />} cursor={{ fill: 'rgba(217,174,95,0.06)' }} />
              <Bar dataKey="confirmadas" fill={GREEN} radius={[4, 4, 0, 0]} name="confirmadas" />
              <Bar dataKey="pendientes"  fill={AMBER}  radius={[4, 4, 0, 0]} name="pendientes"  />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 mt-4">
            {[{ color: GREEN, label: 'Confirmadas' }, { color: AMBER, label: 'Pendientes' }].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                <span className="text-xs font-medium text-muted-foreground">{l.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Insights ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Día de Mayor Demanda', value: topDayOfWeek, icon: CalendarDays, color: GOLD },
          { label: 'Zona más Reservada',   value: topZone,      icon: MapPin,       color: '#60a5fa' },
          { label: 'Hora Pico',            value: peakHour,     icon: Clock,        color: '#34d399' },
        ].map((ins, i) => (
          <motion.div
            key={ins.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.36 + i * 0.07 }}
            className="relative rounded-2xl overflow-hidden p-5"
            style={{
              background: 'linear-gradient(135deg, #060f1e 0%, #0c1829 100%)',
              border: `1px solid ${ins.color}25`,
              boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
            }}
          >
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${ins.color}12 0%, transparent 70%)` }} />
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${ins.color}12`, border: `1px solid ${ins.color}25` }}>
                <ins.icon size={18} style={{ color: ins.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-1.5" style={{ color: `${ins.color}60` }}>
                  {ins.label}
                </p>
                <p className="font-bold text-sm text-white truncate">{ins.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
