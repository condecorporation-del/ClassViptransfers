import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CalendarCheck, CheckCircle2, Clock3, Download, Loader2, TrendingUp } from 'lucide-react';
import { useAdminAuth } from '@/features/admin/hooks/useAdminAuth';
import {
  compareOperationBookings,
  expandBookingOperations,
  getOperationBadge,
  type AdminOperationEvent,
} from '@/features/admin/lib/booking-operations';
import { addLocalDays, isDateWithinRange, localDateKey, monthEndKey, monthStartKey, sameLocalDay } from '@/features/admin/lib/admin-date';
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
  pickupTime?: string | null;
  arrivalTime?: string | null;
  departureTime?: string | null;
  pickupLocation?: string | null;
  dropoffLocation?: string | null;
  flightNumber?: string | null;
  departureFlightNumber?: string | null;
  totalAmount: number;
  passengers: number;
  route?: string | null;
  tripType?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  customer?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
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

const operationalStatuses = ['CONFIRMED', 'PAID', 'PENDING', 'PENDING_PAYMENT', 'DRAFT', 'OFFLINE_HOLD'];

function formatDay(date: string) {
  const normalized = new Date(`${date}T12:00:00`);
  const weekday = normalized.toLocaleDateString('es-MX', { weekday: 'long' });
  const dayMonth = normalized.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${dayMonth}`;
}

function money(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function DashboardOverviewTab({ refreshToken = 0 }: { refreshToken?: number }) {
  const { getAuthHeaders } = useAdminAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tasks, setTasks] = useState<Tarea[]>([]);
  const [expanded, setExpanded] = useState<'today' | 'tomorrow' | null>('today');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const today = localDateKey();
  const tomorrow = addLocalDays(today, 1);
  const [printDate, setPrintDate] = useState(today);

  const triggerOperationalPrint = (targetDate: string) => {
    setPrintDate(targetDate);
    window.setTimeout(() => window.print(), 80);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const dateFrom = addLocalDays(today, -120);
        const dateTo = addLocalDays(today, 120);
        const response = await fetch(apiUrl(`/api/admin/bookings?dateFrom=${dateFrom}&dateTo=${dateTo}&limit=500`), {
          credentials: 'include',
          headers: getAuthHeaders(),
        });
        const json = await response.json();
        if (!cancelled) {
          if (json.success && Array.isArray(json.data)) {
            setBookings(json.data);
          } else {
            setBookings([]);
            setLoadError('No se pudo actualizar el dashboard operativo.');
          }
        }
      } catch {
        if (!cancelled) {
          setBookings([]);
          setLoadError('No se pudo actualizar el dashboard operativo.');
        }
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
  }, [getAuthHeaders, refreshToken, today]);

  const operationEvents = useMemo(
    () => bookings.flatMap((booking) => expandBookingOperations(booking)),
    [bookings],
  );

  const todayBookings = useMemo(
    () =>
      operationEvents
        .filter((event) => sameLocalDay(event.serviceDate, today) && operationalStatuses.includes(event.booking.status))
        .sort(compareOperationBookings),
    [operationEvents, today],
  );

  const tomorrowBookings = useMemo(
    () =>
      operationEvents
        .filter((event) => sameLocalDay(event.serviceDate, tomorrow) && operationalStatuses.includes(event.booking.status))
        .sort(compareOperationBookings),
    [operationEvents, tomorrow],
  );

  const monthBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        const serviceDate = booking.bookingDate.slice(0, 10);
        return booking.status !== 'CANCELLED' && isDateWithinRange(serviceDate, monthStartKey(), today);
      }),
    [bookings, today],
  );

  const revenueMonth = useMemo(
    () =>
      monthBookings.reduce((sum, booking) => {
        const completedPayments = (booking as Booking & {
          payments?: Array<{ amount?: number; completedAt?: string | null; createdAt?: string }>;
        }).payments || [];

        return sum + completedPayments.reduce((paymentSum, payment) => {
          const paymentDate = (payment.completedAt || payment.createdAt || '').slice(0, 10);
          if (!paymentDate || !isDateWithinRange(paymentDate, monthStartKey(), today)) {
            return paymentSum;
          }
          return paymentSum + (payment.amount || 0);
        }, 0);
      }, 0),
    [monthBookings, today],
  );

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
      {loadError && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle size={16} className="shrink-0" />
          {loadError}
        </div>
      )}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Operaciones</p>
          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">Dashboard del Dia</h1>
          <p className="mt-1 text-sm text-muted-foreground">Servicios, salidas, llegadas y pendientes operativos en una sola vista.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => triggerOperationalPrint(today)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${printDate === today ? 'bg-gold text-navy' : 'border border-border text-foreground hover:border-gold/40 hover:bg-gold/10'}`}
          >
            Imprimir hoy
          </button>
          <button
            type="button"
            onClick={() => triggerOperationalPrint(tomorrow)}
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
              {printableBookings.map((event) => (
                <tr key={event.key}>
                  <td>{event.serviceTime}</td>
                  <td>{getOperationBadge(event).label}</td>
                  <td>{event.booking.customer?.name || 'Cliente'}</td>
                  <td>{event.hotel}</td>
                  <td>{event.flight}</td>
                  <td>{event.booking.passengers}</td>
                  <td>{event.booking.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span>Servicios ordenados por tipo operativo y horario.</span>
            <span>Class VIP Transfers | +52 624 122 2174</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
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

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">KPIs del Mes</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-foreground">Resumen mensual</h2>
            </div>
            <TrendingUp className="text-gold" size={22} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Bookings" value={monthBookings.length} />
            <Metric label="Revenue" value={money(revenueMonth)} />
            <Metric label="Promedio" value={money(monthBookings.length ? revenueMonth / monthBookings.length : 0)} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Alertas / Pendientes</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-foreground">Atencion requerida</h2>
            </div>
            <AlertCircle className="text-amber-500" size={22} />
          </div>
          <div className="mb-5 grid grid-cols-2 gap-3">
            <Metric label="Bookings pendientes" value={pendingBookings.length} />
            <Metric label="Tareas vencen hoy" value={pendingTasks.length} />
          </div>
          <div className="space-y-2">
            {pendingTasks.slice(0, 4).map((task) => (
              <div key={task.id} className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                <Clock3 size={14} className="text-amber-600" />
                <span className="truncate text-sm font-semibold text-amber-900">{task.titulo}</span>
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
  bookings: AdminOperationEvent<Booking>[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const arrivals = bookings.filter((event) => event.operationType === 'arrival').length;
  const departures = bookings.filter((event) => event.operationType === 'departure').length;

  return (
    <button type="button" onClick={onToggle} className="rounded-2xl border border-border bg-card p-6 text-left shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{title}</p>
          <h2 className="mt-1 font-display text-xl font-bold text-foreground">{dateLabel}</h2>
        </div>
        <CalendarCheck className="text-gold" size={22} />
      </div>

      <div className="mt-5 flex items-end gap-3">
        <span className="font-display text-5xl font-bold leading-none text-foreground">{bookings.length}</span>
        <span className="pb-1 text-sm text-muted-foreground">{arrivals} Llegadas  |  {departures} Salidas</span>
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
              {bookings.map((event) => {
                const badge = getOperationBadge(event);
                return (
                  <div key={event.key} className="grid grid-cols-[64px_84px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-muted/30 px-3 py-2">
                    <span className="font-mono text-xs font-bold text-foreground">{event.serviceTime}</span>
                    <span className={`rounded-full px-2 py-0.5 text-center text-[10px] font-bold uppercase ${badge.className}`}>{badge.label}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{event.booking.customer?.name || 'Cliente'}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {event.hotel}  |  {event.booking.passengers} pax
                        {event.flight !== '---' ? `  |  ${event.flight}` : ''}
                      </p>
                      {event.booking.notes && <p className="mt-1 truncate text-[11px] text-muted-foreground">{event.booking.notes}</p>}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusTone[event.booking.status] || 'bg-slate-100 text-slate-700'}`}>
                      {event.booking.status.replace(/_/g, ' ')}
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

