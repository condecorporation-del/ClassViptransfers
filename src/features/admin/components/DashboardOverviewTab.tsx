import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CalendarCheck, CheckCircle2, Clock3, Download, Loader2, TrendingUp } from 'lucide-react';
import { useAdminAuth } from '@/features/admin/hooks/useAdminAuth';
import {
  compareOperationBookings,
  getOperationBadge,
  getOperationFlight,
  getOperationHotel,
  getOperationTime,
  getOperationType,
} from '@/features/admin/lib/booking-operations';
import { getApiBaseUrl } from '@/shared/lib/api';
import { cloudinaryAssets } from '@/shared/lib/cloudinary-assets';

const apiUrl = (path: string) => {
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
};

type Booking = {
  id: string;
  confirmationCode?: string | null;
  status: string;
  bookingDate: string;
  bookingTime?: string | null;
  pickupLocation?: string | null;
  dropoffLocation?: string | null;
  flightNumber?: string | null;
  departureFlightNumber?: string | null;
  totalAmount: number;
  passengers: number;
  route?: string | null;
  tripType?: string | null;
  notes?: string | null;
  customer?: { name?: string | null };
};

type Tarea = {
  id: string;
  titulo: string;
  fecha: string;
  status: 'pendiente' | 'completada' | 'cancelada';
};

const statusTone: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  PENDING: 'bg-amber-100 text-amber-700',
  PENDING_PAYMENT: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
  OFFLINE_HOLD: 'bg-purple-100 text-purple-700',
};

const todayKey = () => new Date().toISOString().slice(0, 10);

function addDays(date: string, days: number) {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function formatDay(date: string) {
  const normalized = new Date(`${date}T12:00:00`);
  const weekday = normalized.toLocaleDateString('es-MX', { weekday: 'long' });
  const dayMonth = normalized.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${dayMonth}`;
}

function sameDay(bookingDate: string, date: string) {
  return bookingDate.slice(0, 10) === date;
}

function money(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function DashboardOverviewTab() {
  const { getAuthHeaders } = useAdminAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tasks, setTasks] = useState<Tarea[]>([]);
  const [expanded, setExpanded] = useState<'today' | 'tomorrow' | null>('today');
  const [loading, setLoading] = useState(true);

  const today = todayKey();
  const tomorrow = addDays(today, 1);
  const [printDate, setPrintDate] = useState(today);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const monthStart = new Date();
        monthStart.setDate(1);
        const dateFrom = monthStart.toISOString().slice(0, 10);
        const dateTo = addDays(today, 1);
        const res = await fetch(apiUrl(`/api/admin/bookings?dateFrom=${dateFrom}&dateTo=${dateTo}&limit=500`), {
          credentials: 'include',
          headers: getAuthHeaders(),
        });
        const json = await res.json();
        if (!cancelled) {
          setBookings(json.success && Array.isArray(json.data) ? json.data : []);
        }
      } catch {
        if (!cancelled) setBookings([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const storedTasks = localStorage.getItem('classvip-admin-tareas');
    if (storedTasks) {
      try {
        const parsed = JSON.parse(storedTasks);
        setTasks(Array.isArray(parsed) ? parsed : []);
      } catch {
        setTasks([]);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [getAuthHeaders, today]);

  const todayBookings = useMemo(
    () => bookings.filter((booking) => sameDay(booking.bookingDate, today) && ['CONFIRMED', 'PENDING', 'PENDING_PAYMENT', 'DRAFT', 'OFFLINE_HOLD'].includes(booking.status)).sort(compareOperationBookings),
    [bookings, today],
  );

  const tomorrowBookings = useMemo(
    () => bookings.filter((booking) => sameDay(booking.bookingDate, tomorrow) && ['CONFIRMED', 'PENDING', 'PENDING_PAYMENT', 'DRAFT', 'OFFLINE_HOLD'].includes(booking.status)).sort(compareOperationBookings),
    [bookings, tomorrow],
  );

  const monthBookings = useMemo(
    () => bookings.filter((booking) => booking.status !== 'CANCELLED'),
    [bookings],
  );

  const revenueMonth = monthBookings
    .filter((booking) => ['PAID', 'CONFIRMED', 'COMPLETED'].includes(booking.status))
    .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

  const pendingTasks = tasks.filter((task) => task.status === 'pendiente' && task.fecha <= today);
  const pendingBookings = bookings.filter((booking) => ['PENDING', 'PENDING_PAYMENT', 'DRAFT'].includes(booking.status));
  const printableBookings = (printDate === tomorrow ? tomorrowBookings : todayBookings).sort(compareOperationBookings);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-gold" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold mb-1">Operaciones</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Dashboard del Dia</h1>
          <p className="text-sm text-muted-foreground mt-1">Servicios, salidas, llegadas y pendientes operativos en una sola vista.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPrintDate(today)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${printDate === today ? 'bg-gold text-navy' : 'border border-border text-foreground hover:border-gold/40 hover:bg-gold/10'}`}
          >
            Imprimir hoy
          </button>
          <button
            type="button"
            onClick={() => setPrintDate(tomorrow)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${printDate === tomorrow ? 'bg-gold text-navy' : 'border border-border text-foreground hover:border-gold/40 hover:bg-gold/10'}`}
          >
            Imprimir manana
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2 text-sm font-bold text-white hover:bg-navy/90"
          >
            <Download size={15} />
            PDF operacional
          </button>
        </div>
      </div>

      <style>{`
        @media screen {
          #operations-print-area { display: none; }
        }
        @media print {
          body * { visibility: hidden !important; }
          #operations-print-area, #operations-print-area * { visibility: visible !important; }
          #operations-print-area {
            display: block !important;
            position: absolute;
            inset: 0 auto auto 0;
            width: 100%;
            min-height: 100vh;
            padding: 32px;
            background: #ffffff;
            color: #0f172a;
            font-family: Georgia, "Times New Roman", serif;
          }
          #operations-print-area .watermark {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            opacity: 0.06;
          }
          #operations-print-area table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          #operations-print-area th,
          #operations-print-area td {
            border: 1px solid #d1d5db;
            padding: 8px;
            text-align: left;
            vertical-align: top;
          }
          #operations-print-area th {
            background: #f8fafc;
            font-size: 10px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          @page { margin: 12mm; }
        }
      `}</style>

      <div id="operations-print-area">
        <div className="watermark">
          <img src={cloudinaryAssets.logo} alt="" style={{ width: 340, objectFit: 'contain' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <img src={cloudinaryAssets.logo} alt="Class VIP Transfers" style={{ height: 62, objectFit: 'contain' }} />
              <div>
                <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8a6a2f' }}>Class VIP Transfers</p>
                <h1 style={{ margin: '6px 0 0', fontSize: 26 }}>Operacion del dia</h1>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: 13 }}>Fecha</p>
              <strong style={{ fontSize: 18 }}>{formatDay(printDate)}</strong>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Tipo</th>
                <th>Cliente</th>
                <th>Hotel</th>
                <th>Vuelo</th>
                <th>Pasajeros</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {printableBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{getOperationTime(booking)}</td>
                  <td>{getOperationBadge(booking).label}</td>
                  <td>{booking.customer?.name || 'Cliente'}</td>
                  <td>{getOperationHotel(booking)}</td>
                  <td>{getOperationFlight(booking)}</td>
                  <td>{booking.passengers}</td>
                  <td>{booking.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span>Servicios ordenados por tipo operativo y horario.</span>
            <span>Class VIP Transfers · +52 624 122 2174</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <OperationsCard
          title="Servicios de Hoy"
          dateLabel={formatDay(today)}
          bookings={todayBookings}
          expanded={expanded === 'today'}
          onToggle={() => setExpanded(expanded === 'today' ? null : 'today')}
        />
        <OperationsCard
          title="Servicios de Manana"
          dateLabel={formatDay(tomorrow)}
          bookings={tomorrowBookings}
          expanded={expanded === 'tomorrow'}
          onToggle={() => setExpanded(expanded === 'tomorrow' ? null : 'tomorrow')}
        />

        <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">KPIs del Mes</p>
              <h2 className="font-display text-2xl font-bold text-foreground mt-1">Resumen mensual</h2>
            </div>
            <TrendingUp className="text-gold" size={22} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Bookings" value={monthBookings.length} />
            <Metric label="Revenue" value={money(revenueMonth)} />
            <Metric label="Promedio" value={money(monthBookings.length ? revenueMonth / monthBookings.length : 0)} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Alertas / Pendientes</p>
              <h2 className="font-display text-2xl font-bold text-foreground mt-1">Atencion requerida</h2>
            </div>
            <AlertCircle className="text-amber-500" size={22} />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <Metric label="Bookings pendientes" value={pendingBookings.length} />
            <Metric label="Tareas vencen hoy" value={pendingTasks.length} />
          </div>
          <div className="space-y-2">
            {pendingTasks.slice(0, 4).map((task) => (
              <div key={task.id} className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
                <Clock3 size={14} className="text-amber-600" />
                <span className="text-sm font-semibold text-amber-900 truncate">{task.titulo}</span>
                <span className="ml-auto text-xs text-amber-700">{task.fecha}</span>
              </div>
            ))}
            {pendingTasks.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 size={15} className="text-emerald-500" />
                Sin tareas vencidas o de hoy.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OperationsCard({
  title,
  dateLabel,
  bookings,
  expanded,
  onToggle,
}: {
  title: string;
  dateLabel: string;
  bookings: Booking[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const arrivals = bookings.filter((booking) => getOperationType(booking) === 'arrival').length;
  const departures = bookings.filter((booking) => getOperationType(booking) === 'departure').length;

  return (
    <button type="button" onClick={onToggle} className="rounded-2xl border border-border bg-card shadow-sm p-6 text-left">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{title}</p>
          <h2 className="font-display text-xl font-bold text-foreground mt-1">{dateLabel}</h2>
        </div>
        <CalendarCheck className="text-gold" size={22} />
      </div>
      <div className="mt-5 flex items-end gap-3">
        <span className="font-display text-5xl font-bold text-foreground leading-none">{bookings.length}</span>
        <span className="text-sm text-muted-foreground pb-1">{arrivals} Llegadas · {departures} Salidas</span>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-5 space-y-2 border-t border-border pt-4">
              {bookings.map((booking) => {
                const badge = getOperationBadge(booking);
                return (
                  <div key={booking.id} className="grid grid-cols-[56px_76px_minmax(0,1fr)_auto] gap-3 items-center rounded-xl bg-muted/30 px-3 py-2">
                    <span className="font-mono text-xs font-bold text-foreground">{getOperationTime(booking)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-center ${badge.className}`}>{badge.label}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{booking.customer?.name || 'Cliente'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {getOperationHotel(booking)} · {booking.passengers} pax
                        {(booking.flightNumber || booking.departureFlightNumber) ? ` · ${getOperationFlight(booking)}` : ''}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusTone[booking.status] || 'bg-slate-100 text-slate-700'}`}>
                      {booking.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                );
              })}
              {bookings.length === 0 && <p className="text-sm text-muted-foreground">No hay servicios programados.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
