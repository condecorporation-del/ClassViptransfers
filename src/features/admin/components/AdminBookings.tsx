import { useState, useEffect, useCallback } from 'react';
import {
  Mail, ChevronRight, ArrowLeft, RefreshCw, FileDown,
  Search, Edit2, X, Save, UserCheck, CheckCircle, XCircle,
  Car, Calendar, Filter, Download, Loader2, CalendarX, AlertCircle,
  Printer,
} from 'lucide-react';
import { useAdminAuth } from '@/features/admin/hooks/useAdminAuth';
import {
  compareOperationBookings,
  expandBookingOperations,
  getOperationBadge,
  getOperationFlight,
  getOperationHotel,
  getOperationType,
  getOperationTime,
  type AdminOperationEvent,
} from '@/features/admin/lib/booking-operations';
import { addLocalDays, localDateKey, monthEndKey, monthStartKey, startOfCurrentWeekKey } from '@/features/admin/lib/admin-date';
import { getApiBaseUrl } from '@/shared/lib/api';
import { cloudinaryAssets } from '@/shared/lib/cloudinary-assets';

// âââ Types ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

type Driver = { id: string; name: string; phone: string; email?: string; isActive: boolean };
type Vehicle = { id: string; make: string; model: string; year?: number; licensePlate: string; capacity: number; isActive: boolean };

type Assignment = {
  id: string;
  type: 'DRIVER' | 'VEHICLE';
  driver?: Driver | null;
  vehicle?: Vehicle | null;
  notes?: string | null;
};

type Payment = {
  id: string;
  provider: string;
  status: string;
  amount: number;
  orderId?: string | null;
  completedAt?: string | null;
  createdAt?: string;
};

type EmailLog = {
  id: string; type: string; status: string;
  to: string; subject: string; error: string | null;
  sentAt: string | null; createdAt: string;
};

type BookingItem = { id: string; type: string; name: string; quantity: number; unitPrice: number; totalPrice: number };

type Booking = {
  id: string;
  confirmationCode?: string | null;
  type: string; status: string; source: string;
  bookingDate: string;
  createdAt?: string;
  confirmedAt?: string | null;
  bookingTime: string | null;
  pickupTime: string | null;
  pickupLocation: string | null;
  dropoffLocation: string | null;
  flightNumber: string | null;
  arrivalTime: string | null;
  departureFlightNumber: string | null;
  departureTime: string | null;
  totalAmount: number;
  passengers: number;
  serviceType: string | null;
  tripType: string | null;
  route: string | null;
  notes: string | null;
  internalNotes: string | null;
  customer: { name: string; email: string; phone: string; country?: string | null; language?: string | null };
  items: BookingItem[];
  payments?: Payment[];
  assignments?: Assignment[];
  emailLogs?: EmailLog[];
};

type BookingUpdateInput = {
  bookingDate: string;
  bookingTime: string | null;
  pickupTime: string | null;
  passengers: number;
  flightNumber: string | null;
  arrivalTime: string | null;
  departureFlightNumber: string | null;
  departureTime: string | null;
  pickupLocation: string | null;
  dropoffLocation: string | null;
  notes: string | null;
  internalNotes: string | null;
};

type CustomerUpdateInput = {
  name: string;
  email: string;
  phone: string;
  country?: string | null;
};

type BookingEditorPayload = {
  booking: BookingUpdateInput;
  customer: CustomerUpdateInput;
};

type BookingOperationRow = AdminOperationEvent<Booking>;

type AssignmentUpdateInput = {
  driverId: string | null;
  vehicleId: string | null;
  pickupTime?: string;
  internalNotes?: string;
};

// âââ Helpers ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

const apiUrl = (path: string) => {
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
};

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtCents = (c: number) => `$${(c / 100).toFixed(2)}`;
const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });

const normalizeText = (value?: string | null) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const STATUS_COLORS: Record<string, string> = {
  DRAFT:           'bg-gray-200 text-gray-700',
  PENDING_PAYMENT: 'bg-amber-100 text-amber-800',
  PAID:            'bg-emerald-100 text-emerald-800',
  CONFIRMED:       'bg-emerald-100 text-emerald-800',
  CANCELLED:       'bg-red-100 text-red-800',
  COMPLETED:       'bg-blue-100 text-blue-800',
  OFFLINE_HOLD:    'bg-purple-100 text-purple-800',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT:           'Draft',
  PENDING_PAYMENT: 'Pending Payment',
  PAID:            'Paid',
  CONFIRMED:       'Confirmed',
  CANCELLED:       'Cancelled',
  COMPLETED:       'Completed',
  OFFLINE_HOLD:    'Hold',
};

const SERVICE_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'arrival', label: 'Llegada' },
  { value: 'departure', label: 'Salida' },
] as const;

const STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'PENDING_PAYMENT', label: 'Pendiente' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'COMPLETED', label: 'Completado' },
] as const;

function today() { return localDateKey(); }
function addDays(dateStr: string, n: number) { return addLocalDays(dateStr, n); }
function weekStart() { return startOfCurrentWeekKey(); }
function monthStart() { return monthStartKey(); }
function monthEnd() { return monthEndKey(); }

// âââ Main Component âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export const AdminBookings = ({
  onDataChanged,
  initialSearchQ,
}: {
  onDataChanged?: () => void;
  initialSearchQ?: string;
}) => {
  const { getAuthHeaders } = useAdminAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customFrom, setCustomFrom] = useState(today());
  const [customTo, setCustomTo] = useState(today());
  const [dateFilter, setDateFilter] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  // Detail
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bookingDetail, setBookingDetail] = useState<Booking | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Computed date range from period
  const getDateRange = useCallback(() => {
    if (period === 'today') return { dateFrom: today(), dateTo: today() };
    if (period === 'week') return { dateFrom: weekStart(), dateTo: addDays(weekStart(), 6) };
    if (period === 'month') return { dateFrom: monthStart(), dateTo: monthEnd() };
    return { dateFrom: customFrom, dateTo: customTo };
  }, [period, customFrom, customTo]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const qs = new URLSearchParams({
        limit: searchQ.trim() ? '1000' : '800',
      });
      if (searchQ.trim()) {
        qs.set('q', searchQ.trim());
      } else {
        const { dateFrom, dateTo } = getDateRange();
        const sourceFrom = addDays(dateFrom, -120);
        qs.set('dateFrom', sourceFrom);
        qs.set('dateTo', dateTo);
      }
      const res = await fetch(apiUrl(`/api/admin/bookings?${qs}`), {
        credentials: 'include', headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setBookings(json.data);
        setTotal(json.total ?? json.data.length);
      } else {
        setLoadError(json.error || 'No se pudieron cargar las reservaciones.');
        setBookings([]);
        setTotal(0);
      }
    } catch {
      setLoadError('No se pudieron cargar las reservaciones.');
      setBookings([]);
      setTotal(0);
    }
    finally { setLoading(false); }
  }, [getDateRange, getAuthHeaders, searchQ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchBookings();
    }, searchQ.trim() ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [fetchBookings, searchQ]);

  useEffect(() => {
    if (!initialSearchQ?.trim()) return;
    setSearchQ(initialSearchQ.trim());
  }, [initialSearchQ]);

  const fetchDetail = async (id: string) => {
    setDetailLoading(true);
    setSelectedId(id);
    try {
      const res = await fetch(apiUrl(`/api/admin/bookings/${id}`), {
        credentials: 'include', headers: getAuthHeaders(),
      });
      const json = await res.json();
      setBookingDetail(json.success ? json.data : null);
    } catch { setBookingDetail(null); }
    finally { setDetailLoading(false); }
  };

  const exportCSV = () => {
    const { dateFrom } = getDateRange();
    window.open(apiUrl(`/api/admin/bookings/export?date=${dateFrom}&format=csv`), '_blank');
  };

  const refreshAdminData = async () => {
    await fetchBookings();
    onDataChanged?.();
  };

  // Search on Enter
  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') fetchBookings();
  };

  const operationRows: BookingOperationRow[] = bookings.flatMap((booking) => expandBookingOperations(booking));

  const filteredBookings = operationRows
    .filter((event) => {
      const booking = event.booking;
      const dateMatches = !dateFilter || event.serviceDate === dateFilter;
      const type = event.operationType;
      const serviceMatches = !serviceFilter || type === serviceFilter;
      const statusMatches = !statusFilter || booking.status === statusFilter;
      const q = normalizeText(searchQ.trim());
      const searchMatches =
        !q ||
        normalizeText(booking.customer?.name).includes(q) ||
        normalizeText(booking.confirmationCode).includes(q) ||
        normalizeText(booking.customer?.email).includes(q) ||
        normalizeText(booking.customer?.phone).includes(q) ||
        normalizeText(booking.pickupLocation).includes(q) ||
        normalizeText(booking.dropoffLocation).includes(q) ||
        normalizeText(booking.flightNumber).includes(q) ||
        normalizeText(booking.departureFlightNumber).includes(q) ||
        normalizeText(booking.notes).includes(q) ||
        normalizeText(booking.internalNotes).includes(q) ||
        normalizeText(booking.id).includes(q);
      return dateMatches && serviceMatches && statusMatches && searchMatches;
    })
    .sort(compareOperationBookings);

  const printBookings = [...filteredBookings].sort(compareOperationBookings);
  const operationalSummary = {
    total: filteredBookings.length,
    arrivals: filteredBookings.filter((event) => event.operationType === 'arrival').length,
    departures: filteredBookings.filter((event) => event.operationType === 'departure').length,
    pending: filteredBookings.filter((event) => ['DRAFT', 'PENDING_PAYMENT', 'OFFLINE_HOLD'].includes(event.booking.status)).length,
  };

  if (selectedId) {
    return (
      <div>
        <button
          onClick={() => { setSelectedId(null); setBookingDetail(null); }}
          className="flex items-center gap-2 text-sm font-semibold text-gold hover:text-gold/80 transition-colors mb-6"
        >
          <ArrowLeft size={15} /> Back to bookings
        </button>
        {detailLoading ? (
          <div className="rounded-2xl border border-border bg-card p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 size={22} className="animate-spin text-gold" />
            <p className="text-sm font-medium">Loading booking...</p>
          </div>
        ) : bookingDetail ? (
          <BookingDetailView
            booking={bookingDetail}
            onRefresh={refreshAdminData}
            onRefetchDetail={() => fetchDetail(selectedId)}
          />
        ) : (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-red-600 text-sm font-medium">
            Booking not found or could not be loaded.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {loadError && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle size={16} className="shrink-0" />
          {loadError}
        </div>
      )}
      {/* ââ Toolbar ââ */}
      <div className="space-y-2.5">
        {/* Row 1: period + actions */}
        <div className="flex items-center gap-2">
          {/* Period: scrollable on mobile */}
          <div className="flex-1 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1 w-max min-w-full">
              {(['today', 'week', 'month', 'custom'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-md text-xs md:text-sm font-semibold whitespace-nowrap transition-colors ${
                    period === p ? 'bg-gold text-navy' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p === 'today' ? 'Today' : p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'Custom'}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={fetchBookings}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gold/20 text-gold hover:bg-gold/30 text-xs font-semibold shrink-0"
            title="Refresh"
          >
            <RefreshCw size={13} /><span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold shrink-0"
            title="Export CSV"
          >
            <Download size={13} /><span className="hidden sm:inline">CSV</span>
          </button>
        </div>

        {/* Custom date range */}
        {period === 'custom' && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date" value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-border bg-background text-sm flex-1 min-w-[130px]"
            />
            <span className="text-muted-foreground text-sm">→</span>
            <input
              type="date" value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-border bg-background text-sm flex-1 min-w-[130px]"
            />
            <button
              onClick={fetchBookings}
              className="px-3 py-1.5 rounded-lg bg-gold/20 text-gold hover:bg-gold/30 text-sm font-semibold"
            >
              Apply
            </button>
          </div>
        )}

      </div>

      {/* ââ Table ââ */}
      <div className="grid gap-2 rounded-2xl border border-border bg-card p-3 shadow-sm md:grid-cols-[160px_150px_170px_minmax(180px,1fr)_auto_auto]">
        <input
          type="date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          className="rounded-xl border-2 border-border bg-background px-3 py-2 text-sm focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/20"
        />
        <select
          value={serviceFilter}
          onChange={(event) => setServiceFilter(event.target.value)}
          className="rounded-xl border-2 border-border bg-background px-3 py-2 text-sm focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/20"
        >
          {SERVICE_FILTERS.map((filter) => (
            <option key={filter.value} value={filter.value}>{filter.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border-2 border-border bg-background px-3 py-2 text-sm focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/20"
        >
          {STATUS_FILTERS.map((filter) => (
            <option key={filter.value} value={filter.value}>{filter.label}</option>
          ))}
        </select>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cliente, email o codigo..."
            value={searchQ}
            onChange={(event) => setSearchQ(event.target.value)}
            onKeyDown={handleSearchKey}
            className="w-full rounded-xl border-2 border-border bg-background py-2 pl-8 pr-3 text-sm focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
        </div>
        <button
          type="button"
          onClick={() => setDateFilter(today())}
          className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-foreground transition-colors hover:border-gold/40 hover:bg-gold/10"
        >
          Hoy
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-navy/90"
        >
          <Printer size={15} />
          Imprimir
        </button>
      </div>

      <style>{`
        @media screen {
          #print-area { display: none; }
        }
        @media print {
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area {
            display: block !important;
            position: absolute;
            inset: 0 auto auto 0;
            width: 100%;
            padding: 28px;
            background: #fff;
            color: #111827;
            font-family: Georgia, "Times New Roman", serif;
          }
          #print-area table { width: 100%; border-collapse: collapse; font-size: 12px; }
          #print-area th, #print-area td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
          #print-area th { background: #f3f4f6; text-transform: uppercase; font-size: 10px; letter-spacing: 0.08em; }
          @page { margin: 14mm; }
        }
      `}</style>

      <div id="print-area">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <img src={cloudinaryAssets.logo} alt="Class VIP Transfers" style={{ height: 54, objectFit: 'contain' }} />
          <div style={{ textAlign: 'right' }}>
            <h1 style={{ margin: 0, fontSize: 22 }}>Servicios del Dia</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13 }}>{dateFilter || today()}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Hora</th>
              <th>Tipo</th>
              <th>Cliente</th>
              <th>Hotel</th>
              <th>Pasajeros</th>
              <th>Vuelo</th>
              <th>Notas</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {printBookings.map((event) => (
              <tr key={event.key}>
                <td>{getOperationTime(event)}</td>
                <td>{getOperationBadge(event).label}</td>
                <td>{event.booking.customer?.name || '--'}</td>
                <td>{getOperationHotel(event)}</td>
                <td>{event.booking.passengers}</td>
                <td>{getOperationFlight(event)}</td>
                <td>{event.booking.notes || event.booking.internalNotes || '--'}</td>
                <td>{STATUS_LABELS[event.booking.status] | event.booking.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 20, fontSize: 12 }}>Class VIP Transfers · +52 624 122 2174</p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-14 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 size={22} className="animate-spin text-gold" />
          <p className="text-sm font-medium">Loading bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-14 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center">
            <CalendarX size={22} className="text-muted-foreground/60" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">No bookings found</p>
            <p className="text-xs text-muted-foreground mt-0.5">Try a different date range or search term</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Servicios</p>
              <p className="mt-2 font-display text-2xl font-bold text-foreground">{operationalSummary.total}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-blue-700">Llegadas</p>
              <p className="mt-2 font-display text-2xl font-bold text-blue-900">{operationalSummary.arrivals}</p>
            </div>
            <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-orange-700">Salidas</p>
              <p className="mt-2 font-display text-2xl font-bold text-orange-900">{operationalSummary.departures}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-amber-700">Pendientes</p>
              <p className="mt-2 font-display text-2xl font-bold text-amber-900">{operationalSummary.pending}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {filteredBookings.length} servicio{filteredBookings.length !== 1 ? 's' : ''} operativo{filteredBookings.length !== 1 ? 's' : ''} encontrado{filteredBookings.length !== 1 ? 's' : ''} de {total}
          </p>
            {/* Mobile: card list */}
          <div className="md:hidden space-y-2">
            {filteredBookings.map((event) => {
              const b = event.booking;
              const op = getOperationBadge(event);
              return (
              <button
                key={event.key}
                type="button"
                onClick={() => fetchDetail(b.id)}
                className="w-full text-left rounded-2xl border border-border bg-card p-4 hover:border-gold/40 hover:bg-gold/5 active:scale-[0.99] transition-all shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <span className="font-mono text-sm font-bold text-gold">
                    {b.confirmationCode || b.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-700'}`}>
                    {STATUS_LABELS[b.status] | b.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-foreground leading-tight">{b.customer?.name || '--'}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${op.className}`}>{op.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{b.customer?.email}</p>
                <p className="mb-3 mt-1 text-xs text-muted-foreground">{event.routeLabel} / {getOperationHotel(event)}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{fmt(event.serviceDate)}</span>
                    {(b.arrivalTime || b.bookingTime || b.departureTime || b.pickupTime) && (
                      <span className="font-mono bg-muted/60 px-1.5 py-0.5 rounded">{getOperationTime(event)}</span>
                    )}
                    {(b.flightNumber || b.departureFlightNumber) && <span className="font-mono">{getOperationFlight(event)}</span>}
                  </div>
                  <span className="font-bold text-sm text-foreground">{fmtCents(b.totalAmount)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{b.passengers} pax</span>
                  <span className="truncate pl-3">{b.notes || b.internalNotes || 'Sin notas'}</span>
                </div>
              </button>
            );})}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden overflow-x-auto shadow-sm">
            <table className="w-full text-sm min-w-[980px]">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40">
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Confirmation</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Hora</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Customer</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Vuelo</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Operacion</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Notas</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Total</th>
                  <th className="px-4 py-3 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredBookings.map((event) => {
                  const b = event.booking;
                  const op = getOperationBadge(event);
                  return (
                  <tr
                    key={event.key}
                    onClick={() => fetchDetail(b.id)}
                    className="hover:bg-gold/5 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-gold">
                      {b.confirmationCode || b.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">{fmt(event.serviceDate)}</td>
                    <td className="px-4 py-3.5 text-xs">
                      <p className="font-mono font-semibold text-foreground">{getOperationTime(event)}</p>
                      <p className="mt-0.5 text-muted-foreground">{b.passengers} pax</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-foreground leading-tight">{b.customer?.name || '--'}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${op.className}`}>{op.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{b.customer?.email || '--'}</p>
                      <p className="text-xs text-muted-foreground">{b.customer?.phone || '--'}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      <p className="font-mono font-semibold text-foreground">{getOperationFlight(event)}</p>
                      <p className="text-muted-foreground mt-0.5">{event.routeLabel}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground">{event.routeLabel}</p>
                      <p className="mt-0.5">{getOperationHotel(event)}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      <div className="max-w-[220px] truncate">{b.notes || b.internalNotes || 'Sin notas'}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold leading-none ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABELS[b.status] | b.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-sm">{fmtCents(b.totalAmount)}</td>
                    <td className="px-4 py-3.5">
                      <ChevronRight size={15} className="text-muted-foreground/40 group-hover:text-gold transition-colors" />
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// âââ Detail View ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function BookingDetailView({
  booking,
  onRefresh,
  onRefetchDetail,
}: {
  booking: Booking;
  onRefresh: () => void;
  onRefetchDetail: () => void;
}) {
  const { getAuthHeaders } = useAdminAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const flash = (msg: string, isError = false) => {
    if (isError) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(null); setSuccess(null); }, 3500);
  };

  const doPost = async (path: string, body?: object) => {
    const res = await fetch(apiUrl(path), {
      method: 'POST', credentials: 'include',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  };

  const doPatch = async (path: string, body: object) => {
    const res = await fetch(apiUrl(path), {
      method: 'PATCH', credentials: 'include',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const getPrintableHtml = () => {
    const operationRows = expandBookingOperations(booking).map((event) => {
      const badge = getOperationBadge(event);
      return `
        <tr>
          <td>${fmt(event.serviceDate)}</td>
          <td>${getOperationTime(event)}</td>
          <td>${badge.label}</td>
          <td>${event.routeLabel}</td>
          <td>${event.hotel}</td>
          <td>${event.flight}</td>
        </tr>
      `;
    }).join('');

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Reservation ${booking.confirmationCode || booking.id.slice(0, 8).toUpperCase()}</title>
    <style>
      body { margin: 0; padding: 32px; background: #fff; color: #0f172a; font-family: Georgia, "Times New Roman", serif; }
      .sheet { position: relative; }
      .watermark { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0.05; pointer-events: none; }
      .header { display: flex; justify-content: space-between; align-items: center; gap: 24px; margin-bottom: 24px; }
      .brand { display: flex; align-items: center; gap: 16px; }
      .eyebrow { margin: 0; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: #8a6a2f; }
      h1 { margin: 6px 0 0; font-size: 28px; }
      .card { position: relative; z-index: 1; border: 1px solid #d4d4d8; border-radius: 18px; padding: 18px 20px; margin-bottom: 18px; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
      .label { display: block; margin-bottom: 4px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; }
      .value { font-size: 14px; line-height: 1.45; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #d4d4d8; padding: 8px 10px; text-align: left; vertical-align: top; }
      th { background: #f8fafc; text-transform: uppercase; font-size: 10px; letter-spacing: 0.08em; }
      .footer { margin-top: 18px; color: #64748b; font-size: 11px; text-align: center; }
      @page { margin: 12mm; }
    </style>
  </head>
  <body>
    <div class="watermark"><img src="${cloudinaryAssets.logo}" alt="" style="width:340px;object-fit:contain;" /></div>
    <div class="sheet">
      <div class="header">
        <div class="brand">
          <img src="${cloudinaryAssets.logo}" alt="Class VIP Transfers" style="height:58px;object-fit:contain;" />
          <div>
            <p class="eyebrow">Class VIP Transfers</p>
            <h1>Reservation Dossier</h1>
          </div>
        </div>
        <div style="text-align:right;">
          <p style="margin:0;font-size:13px;">Confirmation</p>
          <strong style="font-size:18px;">${booking.confirmationCode || booking.id.slice(0, 8).toUpperCase()}</strong>
        </div>
      </div>
      <div class="card">
        <div class="grid">
          <div><span class="label">Guest</span><div class="value">${booking.customer?.name || '-'}</div></div>
          <div><span class="label">Email</span><div class="value">${booking.customer?.email || '-'}</div></div>
          <div><span class="label">Phone</span><div class="value">${booking.customer?.phone || '-'}</div></div>
          <div><span class="label">Status</span><div class="value">${paymentState}</div></div>
          <div><span class="label">Service Date</span><div class="value">${fmt(booking.bookingDate)}</div></div>
          <div><span class="label">Passengers</span><div class="value">${booking.passengers}</div></div>
          <div><span class="label">Pickup</span><div class="value">${booking.pickupLocation || '-'}</div></div>
          <div><span class="label">Dropoff</span><div class="value">${booking.dropoffLocation || '-'}</div></div>
        </div>
      </div>
      <div class="card">
        <p class="eyebrow" style="margin-bottom:12px;">Operational Timeline</p>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Operation</th>
              <th>Route</th>
              <th>Hotel</th>
              <th>Flight</th>
            </tr>
          </thead>
          <tbody>${operationRows}</tbody>
        </table>
      </div>
      <div class="card">
        <span class="label">Customer Notes</span>
        <div class="value">${booking.notes || '-'}</div>
        <div style="height:12px;"></div>
        <span class="label">Internal Notes</span>
        <div class="value">${booking.internalNotes || '-'}</div>
      </div>
      <div class="footer">Class VIP Transfers · +52 624 122 2174</div>
    </div>
  </body>
</html>`;
  };

  const openPrintableReservationView = () => {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=900');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.open();
    printWindow.document.write(getPrintableHtml());
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const downloadPdf = async () => {
    setBusy('pdf');
    try {
      const res = await fetch(apiUrl(`/api/admin/bookings/${booking.id}/confirmation-pdf`), {
        credentials: 'include', headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('server-pdf-failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reservation-${(booking.confirmationCode || booking.id.slice(0, 8)).toUpperCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      openPrintableReservationView();
      flash('Opened professional print view. Use "Save as PDF" in the print dialog.');
    }
    finally { setBusy(null); }
  };

  const resendEmails = async () => {
    setBusy('resend');
    try {
      const json = await doPost(`/api/admin/bookings/${booking.id}/resend-confirmation`);
      if (json.success) { flash('Confirmation emails re-sent'); onRefetchDetail(); }
      else flash(json.error || 'Failed to resend', true);
    } finally { setBusy(null); }
  };

  const confirmBooking = async () => {
    if (!confirm('Mark this booking as CONFIRMED (paid offline)?')) return;
    setBusy('confirm');
    try {
      const json = await doPost(`/api/admin/bookings/${booking.id}/confirm`);
      if (json.success) { flash('Booking confirmed'); onRefresh(); onRefetchDetail(); }
      else flash(json.error || 'Failed to confirm', true);
    } finally { setBusy(null); }
  };

  const cancelBooking = async () => {
    const reason = prompt('Reason for cancellation (optional):') | undefined;
    if (reason === null) return;
    setBusy('cancel');
    try {
      const json = await doPost(`/api/admin/bookings/${booking.id}/cancel`, { reason });
      if (json.success) { flash('Booking cancelled'); onRefresh(); onRefetchDetail(); }
      else flash(json.error || 'Failed to cancel', true);
    } finally { setBusy(null); }
  };

  const loadDriversVehicles = async () => {
    const [dRes, vRes] = await Promise.all([
      fetch(apiUrl('/api/admin/drivers'), { credentials: 'include', headers: getAuthHeaders() }),
      fetch(apiUrl('/api/admin/vehicles'), { credentials: 'include', headers: getAuthHeaders() }),
    ]);
    const dJson = await dRes.json();
    const vJson = await vRes.json();
    if (dJson.success) setDrivers(dJson.data.filter((d: Driver) => d.isActive));
    if (vJson.success) setVehicles(vJson.data.filter((v: Vehicle) => v.isActive));
  };

  const openAssignForm = () => { loadDriversVehicles(); setShowAssignForm(true); };

  const currentDriver = booking.assignments?.find(a => a.type === 'DRIVER')?.driver;
  const currentVehicle = booking.assignments?.find(a => a.type === 'VEHICLE')?.vehicle;
  const lastPayment = booking.payments?.[0];
  const paymentState = lastPayment?.status === 'COMPLETED'
    ? 'Pagado'
    : booking.status === 'PENDING_PAYMENT'
      ? 'Pendiente de cobro'
      : booking.status === 'OFFLINE_HOLD'
        ? 'Por cobrar'
        : booking.status === 'CONFIRMED'
          ? 'Confirmada'
          : booking.status.replace(/_/g, ' ');
  const operationEvents = expandBookingOperations(booking);
  const serviceDescriptor = [booking.serviceType, booking.tripType?.replace('_', ' ')].filter(Boolean).join(' · ') || 'Service pending';
  const routeDescriptor = booking.route === 'airport-hotel'
    ? 'Airport -> Hotel'
    : booking.route === 'hotel-airport'
      ? 'Hotel -> Airport'
      : booking.route || 'Route pending';

  return (
    <div className="space-y-4 max-w-4xl">
      <style>{`
        @media screen {
          #booking-print-area { display: none; }
        }
        @media print {
          body * { visibility: hidden !important; }
          #booking-print-area, #booking-print-area * { visibility: visible !important; }
          #booking-print-area {
            display: block !important;
            position: absolute;
            inset: 0 auto auto 0;
            width: 100%;
            padding: 28px;
            background: #fff;
            color: #0f172a;
            font-family: Georgia, "Times New Roman", serif;
          }
          #booking-print-area .watermark {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.05;
            pointer-events: none;
          }
          #booking-print-area table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          #booking-print-area th, #booking-print-area td {
            border: 1px solid #d1d5db;
            padding: 8px;
            text-align: left;
            vertical-align: top;
          }
          #booking-print-area th {
            background: #f8fafc;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.08em;
          }
          @page { margin: 12mm; }
        }
      `}</style>

      <div id="booking-print-area">
        <div className="watermark">
          <img src={cloudinaryAssets.logo} alt="" style={{ width: 340, objectFit: 'contain' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <img src={cloudinaryAssets.logo} alt="Class VIP Transfers" style={{ height: 58, objectFit: 'contain' }} />
              <div>
                <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8a6a2f' }}>Class VIP Transfers</p>
                <h1 style={{ margin: '6px 0 0', fontSize: 26 }}>Reservation Dossier</h1>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: 13 }}>Confirmation</p>
              <strong style={{ fontSize: 18 }}>{booking.confirmationCode || booking.id.slice(0, 8).toUpperCase()}</strong>
            </div>
          </div>

          <table>
            <tbody>
              <tr>
                <th>Cliente</th>
                <td>{booking.customer?.name || '-'}</td>
                <th>Email</th>
                <td>{booking.customer?.email || '-'}</td>
              </tr>
              <tr>
                <th>Telefono</th>
                <td>{booking.customer?.phone || '-'}</td>
                <th>Estado</th>
                <td>{paymentState}</td>
              </tr>
              <tr>
                <th>Fecha servicio</th>
                <td>{fmt(booking.bookingDate)}</td>
                <th>Hora</th>
                <td>{booking.bookingTime || booking.arrivalTime || booking.pickupTime || '-'}</td>
              </tr>
              <tr>
                <th>Pickup</th>
                <td>{booking.pickupLocation || '-'}</td>
                <th>Dropoff</th>
                <td>{booking.dropoffLocation || '-'}</td>
              </tr>
              <tr>
                <th>Vuelo llegada</th>
                <td>{booking.flightNumber || '-'}</td>
                <th>Vuelo salida</th>
                <td>{booking.departureFlightNumber || '-'}</td>
              </tr>
              <tr>
                <th>Pasajeros</th>
                <td>{booking.passengers}</td>
                <th>Total</th>
                <td>{fmtCents(booking.totalAmount)}</td>
              </tr>
              <tr>
                <th>Notas cliente</th>
                <td colSpan={3}>{booking.notes || '-'}</td>
              </tr>
              <tr>
                <th>Notas internas</th>
                <td colSpan={3}>{booking.internalNotes || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          <XCircle size={15} className="shrink-0" />{error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
          <CheckCircle size={15} className="shrink-0" />{success}
        </div>
      )}

      {/* ââ Header ââ */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5">Reservation</p>
            <h2 className="font-display text-2xl font-bold text-gold leading-none">
              {booking.confirmationCode || booking.id.slice(0, 8).toUpperCase()}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLORS[booking.status] || ''}`}>
                {STATUS_LABELS[booking.status] | booking.status.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-muted-foreground/70 capitalize">{booking.source}</span>
              <span className="text-xs text-muted-foreground/70 capitalize">{booking.type.replace(/_/g, ' ')}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!['CANCELLED', 'COMPLETED'].includes(booking.status) && (
              <button
                onClick={() => setShowEditForm(!showEditForm)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:bg-muted text-sm font-medium transition-colors"
              >
                <Edit2 size={13} /> Edit
              </button>
            )}
            {booking.status === 'PENDING_PAYMENT' && (
              <button
                onClick={confirmBooking}
                disabled={busy === 'confirm'}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                <CheckCircle size={13} /> {busy === 'confirm' ? 'Confirming...' : 'Confirm (offline)'}
              </button>
            )}
            {!['CANCELLED', 'COMPLETED'].includes(booking.status) && (
              <button
                onClick={cancelBooking}
                disabled={busy === 'cancel'}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 text-sm font-medium border border-red-200 transition-colors"
              >
                <XCircle size={13} /> {busy === 'cancel' ? 'Cancelling...' : 'Cancel'}
              </button>
            )}
            <button
              onClick={openAssignForm}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:bg-muted text-sm font-medium transition-colors"
            >
              <UserCheck size={13} /> Assign Driver
            </button>
            <button
              onClick={resendEmails}
              disabled={busy === 'resend'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:bg-muted text-sm font-medium disabled:opacity-50 transition-colors"
            >
              <Mail size={13} /> {busy === 'resend' ? 'Sending...' : 'Resend'}
            </button>
            <button
              onClick={downloadPdf}
              disabled={busy === 'pdf'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[hsl(var(--navy))] text-white hover:opacity-90 disabled:opacity-50 text-sm font-medium transition-all"
            >
              <FileDown size={13} /> {busy === 'pdf' ? 'Generating...' : 'PDF / Print'}
            </button>
          </div>
        </div>
      </div>

      {/* ââ Edit Form ââ */}
      {showEditForm && (
        <EditBookingForm
          booking={booking}
          onSave={async ({ booking: bookingData, customer }) => {
            setBusy('save');
            try {
              const [bookingJson, customerJson] = await Promise.all([
                doPatch(`/api/admin/bookings/${booking.id}`, bookingData),
                doPatch(`/api/bookings/${booking.id}/customer`, customer),
              ]);
              if (bookingJson.success && customerJson.success) {
                setShowEditForm(false);
                flash('Booking updated');
                onRefresh();
                onRefetchDetail();
              }
              else {
                flash(bookingJson.error || customerJson.error || 'Failed to update', true);
              }
            } finally { setBusy(null); }
          }}
          onCancel={() => setShowEditForm(false)}
          saving={busy === 'save'}
        />
      )}

      {/* ââ Assign Driver Form ââ */}
      {showAssignForm && (
        <AssignDriverForm
          booking={booking}
          drivers={drivers}
          vehicles={vehicles}
          onSave={async (data) => {
            setBusy('assign');
            try {
              const json = await doPost(`/api/admin/bookings/${booking.id}/assign`, data);
              if (json.success) { setShowAssignForm(false); flash('Driver/vehicle assigned'); onRefresh(); onRefetchDetail(); }
              else flash(json.error || 'Failed to assign', true);
            } finally { setBusy(null); }
          }}
          onCancel={() => setShowAssignForm(false)}
          saving={busy === 'assign'}
        />
      )}

      {/* ââ Main Info ââ */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Operational Timeline</p>
            <h3 className="mt-1 font-display text-xl font-bold text-foreground">Arrival / departure breakdown</h3>
          </div>
          <div className="text-xs text-muted-foreground">
            Arrival and departure are managed as separate operational services.
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {operationEvents.map((event) => {
            const badge = getOperationBadge(event);
            return (
              <div key={event.key} className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${badge.className}`}>
                      {badge.label}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{event.routeLabel}</span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{fmt(event.serviceDate)}</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Row label="Service time" value={getOperationTime(event)} bold />
                  <Row label="Hotel" value={event.hotel} />
                  <Row label="Flight" value={event.flight} mono />
                  <Row
                    label="Pickup"
                    value={event.operationType === 'departure' ? (booking.pickupTime || 'Auto / pending') : (booking.arrivalTime || booking.bookingTime || 'Pending')}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        {/* Customer */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">Customer Dossier</p>
          <p className="font-bold text-base text-foreground leading-tight">{booking.customer?.name || 'Guest pending'}</p>
          <p className="text-sm text-muted-foreground mt-1">{booking.customer?.email || 'Email pending'}</p>
          <p className="text-sm text-muted-foreground">{booking.customer?.phone || 'Phone pending'}</p>
          <p className="text-sm text-muted-foreground">{booking.customer?.country || 'Country pending'}</p>
        </div>

        {/* Booking details */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">Service Dossier</p>
          <Row label="Date" value={fmt(booking.bookingDate)} />
          <Row label="Booking time" value={booking.bookingTime || booking.arrivalTime || '--'} />
          <Row label="Pickup time" value={booking.pickupTime || '--'} />
          <Row label="Passengers" value={String(booking.passengers)} />
          <Row label="Service" value={serviceDescriptor} />
          <Row label="Route" value={routeDescriptor} />
        </div>

        {/* Flights */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">Flight Dossier</p>
          <Row label="Arrival flight" value={booking.flightNumber || '--'} mono />
          <Row label="Arrival time" value={booking.arrivalTime || '--'} />
          <Row label="Departure flight" value={booking.departureFlightNumber || '--'} mono />
          <Row label="Departure time" value={booking.departureTime || '--'} />
          <Row label="Booking source" value={booking.source || '--'} />
        </div>

        {/* Location + Payment */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">Locations & Payment</p>
          <Row label="Pickup" value={booking.pickupLocation || '--'} />
          <Row label="Dropoff" value={booking.dropoffLocation || '--'} />
          <div className="border-t border-border/60 pt-3 mt-3">
            <Row label="Total" value={fmtCents(booking.totalAmount)} bold />
            <Row label="Collection" value={paymentState} />
            {lastPayment && (
              <>
                <Row label="Payment" value={lastPayment.provider + ' · ' + lastPayment.status} />
                {lastPayment.orderId && <Row label="Order ID" value={lastPayment.orderId} mono />}
                {lastPayment.completedAt && <Row label="Completed at" value={fmtDateTime(lastPayment.completedAt)} />}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      {booking.items && booking.items.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">Items</p>
          <div className="space-y-1.5">
            {booking.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                <div>
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted-foreground ml-2">x {item.quantity}</span>
                  <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">{item.type}</span>
                </div>
                <span className="font-medium">{fmtCents(item.totalPrice)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ââ Assignment ââ */}
      {(currentDriver || currentVehicle) && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-1.5">
            <Car size={13} />Assignment
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            {currentDriver && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="font-semibold">{currentDriver.name}</p>
                <p className="text-muted-foreground">{currentDriver.phone}</p>
                {currentDriver.email && <p className="text-muted-foreground">{currentDriver.email}</p>}
              </div>
            )}
            {currentVehicle && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="font-semibold">{currentVehicle.make} {currentVehicle.model} {currentVehicle.year || ''}</p>
                <p className="text-muted-foreground">{currentVehicle.licensePlate} · {currentVehicle.capacity} pax</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ââ Notes ââ */}
      {(booking.notes || booking.internalNotes) && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">Notes</p>
          {booking.notes && (
            <div className="mb-2">
              <p className="text-xs text-muted-foreground mb-1">Customer notes</p>
              <p className="text-sm">{booking.notes}</p>
            </div>
          )}
          {booking.internalNotes && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Internal notes</p>
              <p className="text-sm text-amber-700 dark:text-amber-400">{booking.internalNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* ââ Email Log ââ */}
      {booking.emailLogs && booking.emailLogs.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-1.5">
            <Mail size={13} /> Email Log
          </p>
          <div className="space-y-2">
            {booking.emailLogs.map((log) => (
              <div key={log.id} className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/30 text-xs">
                <span className="font-medium">{log.type.replace(/_/g, ' ')}</span>
                <span className="text-muted-foreground">to {log.to}</span>
                <span className={`px-2 py-0.5 rounded font-medium ${log.status === 'SENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                  {log.status}
                </span>
                {log.sentAt && <span className="text-muted-foreground">{fmtDateTime(log.sentAt)}</span>}
                {log.error && <span className="text-red-600 truncate max-w-[200px]" title={log.error}>{log.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// âââ Edit Form ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function EditBookingForm({
  booking, onSave, onCancel, saving,
}: {
  booking: Booking;
  onSave: (data: BookingEditorPayload) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    customerName: booking.customer?.name || '',
    customerEmail: booking.customer?.email || '',
    customerPhone: booking.customer?.phone || '',
    customerCountry: booking.customer?.country || '',
    bookingDate: booking.bookingDate.slice(0, 10),
    bookingTime: booking.bookingTime || '',
    pickupTime: booking.pickupTime || '',
    passengers: String(booking.passengers),
    flightNumber: booking.flightNumber || '',
    arrivalTime: booking.arrivalTime || '',
    departureFlightNumber: booking.departureFlightNumber || '',
    departureTime: booking.departureTime || '',
    pickupLocation: booking.pickupLocation || '',
    dropoffLocation: booking.dropoffLocation || '',
    notes: booking.notes || '',
    internalNotes: booking.internalNotes || '',
  });

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const isRoundTrip = booking.tripType === 'roundtrip';
  const isArrivalBooking = booking.route === 'airport-hotel' || isRoundTrip;
  const isDepartureBooking = booking.route === 'hotel-airport' || isRoundTrip;
  const autoPickupTime = getOperationalPickupTime(form.departureTime);
  const activePickupTime = form.pickupTime || autoPickupTime;
  const serviceDateLabel = form.bookingDate ? fmt(form.bookingDate) : '--';
  const bookingSummaryItems = [
    { label: 'Servicio', value: [booking.serviceType, booking.tripType].filter(Boolean).join(' | ') || 'Pendiente' },
    { label: 'Ruta', value: booking.route === 'airport-hotel' ? 'Airport -> Hotel' : booking.route === 'hotel-airport' ? 'Hotel -> Airport' : isRoundTrip ? 'Round trip' : 'Servicio' },
    { label: 'Fecha', value: serviceDateLabel },
    { label: 'Pickup operativo', value: activePickupTime || '--' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      booking: {
        bookingDate: form.bookingDate,
        passengers: parseInt(form.passengers) || 1,
        bookingTime: emptyToNull(form.bookingTime),
        pickupTime: emptyToNull(form.pickupTime || autoPickupTime),
        flightNumber: emptyToNull(form.flightNumber),
        arrivalTime: emptyToNull(form.arrivalTime),
        departureFlightNumber: emptyToNull(form.departureFlightNumber),
        departureTime: emptyToNull(form.departureTime),
        pickupLocation: emptyToNull(form.pickupLocation),
        dropoffLocation: emptyToNull(form.dropoffLocation),
        notes: emptyToNull(form.notes),
        internalNotes: emptyToNull(form.internalNotes),
      },
      customer: {
        name: form.customerName.trim(),
        email: form.customerEmail.trim(),
        phone: form.customerPhone.trim(),
        country: form.customerCountry.trim() || null,
      },
    });
  };

  return (
    <div className="rounded-2xl border border-gold/30 bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground"><Edit2 size={15} className="text-gold" /> Edit Booking</h3>
          <p className="mt-1 text-sm text-muted-foreground">Ajusta datos clave sin perder tiempo. El formulario prioriza la operacion diaria.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/70 bg-muted/20 p-3 text-sm sm:grid-cols-4">
          {bookingSummaryItems.map((item) => (
            <div key={item.label}>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{item.label}</p>
              <p className="mt-1 font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 text-sm">
        <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Customer profile</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name" value={form.customerName} onChange={(v) => setField('customerName', v)} />
            <Field label="Email" type="email" value={form.customerEmail} onChange={(v) => setField('customerEmail', v)} />
            <Field label="Phone" value={form.customerPhone} onChange={(v) => setField('customerPhone', v)} />
            <Field label="Country" value={form.customerCountry} onChange={(v) => setField('customerCountry', v)} />
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Service details</p>
              <p className="mt-1 text-xs text-muted-foreground">Fecha, pasajeros y horas operativas principales.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {isDepartureBooking && (
                <button
                  type="button"
                  onClick={() => setField('pickupTime', autoPickupTime)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold text-foreground hover:border-gold/40 hover:bg-gold/10"
                >
                  Pickup -3h
                </button>
              )}
              {isArrivalBooking && form.arrivalTime && !form.bookingTime && (
                <button
                  type="button"
                  onClick={() => setField('bookingTime', form.arrivalTime)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold text-foreground hover:border-gold/40 hover:bg-gold/10"
                >
                  Usar hora llegada
                </button>
              )}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Date" type="date" value={form.bookingDate} onChange={(v) => setField('bookingDate', v)} />
            <Field label="Booking time" type="time" value={form.bookingTime} onChange={(v) => setField('bookingTime', v)} />
            <Field label="Pickup time" type="time" value={form.pickupTime} onChange={(v) => setField('pickupTime', v)} hint={isDepartureBooking && autoPickupTime ? `Sugerido: ${autoPickupTime}` : undefined} />
            <Field label="Passengers" type="number" value={form.passengers} onChange={(v) => setField('passengers', v)} />
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-blue-200/70 bg-blue-50/40 p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-700">Arrival leg</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Arrival flight" value={form.flightNumber} onChange={(v) => setField('flightNumber', v)} />
              <Field label="Arrival time" value={form.arrivalTime} onChange={(v) => setField('arrivalTime', v)} placeholder="HH:MM" />
              <Field label="Pickup location" value={form.pickupLocation} onChange={(v) => setField('pickupLocation', v)} />
              <Field label="Dropoff location" value={form.dropoffLocation} onChange={(v) => setField('dropoffLocation', v)} />
            </div>
          </div>

          <div className="rounded-xl border border-orange-200/70 bg-orange-50/40 p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-orange-700">Departure leg</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Departure flight" value={form.departureFlightNumber} onChange={(v) => setField('departureFlightNumber', v)} />
              <Field label="Departure time" value={form.departureTime} onChange={(v) => setField('departureTime', v)} placeholder="HH:MM" />
              <Field label="Pickup location" value={form.pickupLocation} onChange={(v) => setField('pickupLocation', v)} />
              <Field label="Dropoff location" value={form.dropoffLocation} onChange={(v) => setField('dropoffLocation', v)} />
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Customer notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
          />
          </div>
          <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Internal notes (admin only)</label>
          <textarea
            value={form.internalNotes}
            onChange={(e) => setField('internalNotes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
          />
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            {isRoundTrip
              ? 'Round trip: revisa llegada y salida antes de guardar.'
              : isDepartureBooking
                ? 'Salida: confirma pickup y vuelo antes de guardar.'
                : 'Llegada: confirma hora y destino antes de guardar.'}
          </div>
          <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold text-navy font-medium disabled:opacity-50"
          >
            <Save size={14} /> {saving ? 'Saving...' : 'Save changes'}
          </button>
          <button type="button" onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border hover:bg-muted">
            <X size={14} /> Cancel
          </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// âââ Assign Driver Form âââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function AssignDriverForm({
  booking, drivers, vehicles, onSave, onCancel, saving,
}: {
  booking: Booking;
  drivers: Driver[];
  vehicles: Vehicle[];
  onSave: (data: AssignmentUpdateInput) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const currentDriver = booking.assignments?.find(a => a.type === 'DRIVER')?.driver;
  const currentVehicle = booking.assignments?.find(a => a.type === 'VEHICLE')?.vehicle;

  const [driverId, setDriverId] = useState(currentDriver?.id || '');
  const [vehicleId, setVehicleId] = useState(currentVehicle?.id || '');
  const [pickupTime, setPickupTime] = useState(booking.pickupTime || '');
  const [internalNotes, setInternalNotes] = useState('');

  return (
    <div className="rounded-2xl border border-gold/30 bg-card p-5 shadow-sm">
      <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><UserCheck size={15} className="text-gold" /> Assign Driver / Vehicle</h3>
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Driver</label>
          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          >
            <option value="">— Unassigned —</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.name} · {d.phone}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Vehicle</label>
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          >
            <option value="">— Unassigned —</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.make} {v.model} · {v.licensePlate} ({v.capacity} pax)</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Pickup time</label>
          <input
            type="time" value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
          <input
            type="text" value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            placeholder="Optional notes"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
          />
        </div>
        <div className="sm:col-span-2 flex gap-2 pt-1">
          <button
            onClick={() => onSave({
              driverId: driverId || null,
              vehicleId: vehicleId || null,
              pickupTime: pickupTime || undefined,
              internalNotes: internalNotes || undefined,
            })}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold text-navy font-medium disabled:opacity-50"
          >
            <UserCheck size={14} /> {saving ? 'Saving...' : 'Assign'}
          </button>
          <button onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border hover:bg-muted">
            <X size={14} /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// âââ Small helpers ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function Row({ label, value, bold, mono }: { label: string; value: string; bold?: boolean; mono?: boolean }) {
  return (
    <div className="flex justify-between text-sm py-0.5 gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={`text-right ${bold ? 'font-semibold' : ''} ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}

function Field({
  label, value, onChange, type = 'text', placeholder, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="block text-xs font-medium text-muted-foreground">{label}</label>
        {hint && <span className="text-[11px] font-medium text-gold">{hint}</span>}
      </div>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
      />
    </div>
  );
}

function emptyToNull(value: string | null | undefined) {
  const trimmed = (value || '').trim();
  return trimmed ? trimmed : null;
}

function getOperationalPickupTime(departureTime: string | null | undefined) {
  if (!departureTime || !/^\d{1,2}:\d{2}$/.test(departureTime)) return '';
  const [hours, minutes] = departureTime.split(':').map(Number);
  const totalMinutes = (hours * 60) + minutes - 180;
  const normalized = totalMinutes < 0 ? totalMinutes + 1440 : totalMinutes;
  const pickupHours = Math.floor(normalized / 60) % 24;
  const pickupMinutes = normalized % 60;
  return `${String(pickupHours).padStart(2, '0')}:${String(pickupMinutes).padStart(2, '0')}`;
}

