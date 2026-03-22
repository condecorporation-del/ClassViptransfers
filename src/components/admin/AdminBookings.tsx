import { useState, useEffect, useCallback } from 'react';
import {
  Mail, ChevronRight, ArrowLeft, RefreshCw, FileDown,
  Search, Edit2, X, Save, UserCheck, CheckCircle, XCircle,
  Car, Calendar, Filter, Download,
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getApiBaseUrl } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  customer: { name: string; email: string; phone: string };
  items: BookingItem[];
  payments?: Payment[];
  assignments?: Assignment[];
  emailLogs?: EmailLog[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const apiUrl = (path: string) => {
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
};

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtCents = (c: number) => `$${(c / 100).toFixed(2)}`;
const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-200 text-gray-700',
  PENDING_PAYMENT: 'bg-amber-100 text-amber-800',
  PAID: 'bg-emerald-100 text-emerald-800',
  CONFIRMED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  OFFLINE_HOLD: 'bg-purple-100 text-purple-800',
};

function today() { return new Date().toISOString().slice(0, 10); }
function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10);
}
function weekStart() {
  const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().slice(0, 10);
}
function monthStart() {
  const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function monthEnd() {
  const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const AdminBookings = () => {
  const { getAuthHeaders } = useAdminAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customFrom, setCustomFrom] = useState(today());
  const [customTo, setCustomTo] = useState(today());
  const [searchQ, setSearchQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
    try {
      const { dateFrom, dateTo } = getDateRange();
      const qs = new URLSearchParams({ dateFrom, dateTo, limit: '100' });
      if (searchQ.trim()) qs.set('q', searchQ.trim());
      if (statusFilter) qs.set('status', statusFilter);

      const res = await fetch(apiUrl(`/api/admin/bookings?${qs}`), {
        credentials: 'include', headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setBookings(json.data);
        setTotal(json.total ?? json.data.length);
      } else {
        setBookings([]); setTotal(0);
      }
    } catch { setBookings([]); setTotal(0); }
    finally { setLoading(false); }
  }, [getDateRange, searchQ, statusFilter, getAuthHeaders]);

  useEffect(() => { fetchBookings(); }, [period, statusFilter]);

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

  // ── Search on Enter ──
  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') fetchBookings();
  };

  if (selectedId) {
    return (
      <div>
        <button
          onClick={() => { setSelectedId(null); setBookingDetail(null); }}
          className="flex items-center gap-2 text-sm text-gold hover:underline mb-6"
        >
          <ArrowLeft size={16} /> Back to bookings
        </button>
        {detailLoading ? (
          <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">Loading...</div>
        ) : bookingDetail ? (
          <BookingDetailView
            booking={bookingDetail}
            onRefresh={fetchBookings}
            onRefetchDetail={() => fetchDetail(selectedId)}
          />
        ) : (
          <div className="glass-card rounded-xl p-8 text-center text-red-500">Booking not found</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Period buttons */}
        <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1">
          {(['today', 'week', 'month', 'custom'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                period === p ? 'bg-gold text-navy' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'Custom'}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date" value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-border bg-background text-sm"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <input
              type="date" value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-border bg-background text-sm"
            />
            <button
              onClick={fetchBookings}
              className="px-3 py-1.5 rounded-lg bg-gold/20 text-gold hover:bg-gold/30 text-sm"
            >
              Apply
            </button>
          </div>
        )}

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm"
        >
          <option value="">All statuses</option>
          <option value="PENDING_PAYMENT">Pending Payment</option>
          <option value="PAID">Paid</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="OFFLINE_HOLD">Offline Hold</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="COMPLETED">Completed</option>
          <option value="DRAFT">Draft</option>
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Name, email, CLASS2026..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onKeyDown={handleSearchKey}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm"
          />
        </div>

        {/* Actions */}
        <button
          onClick={fetchBookings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/20 text-gold hover:bg-gold/30 text-sm"
        >
          <RefreshCw size={14} /> Refresh
        </button>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-sm"
          title="Export to CSV"
        >
          <Download size={14} /> CSV
        </button>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="glass-card rounded-xl p-10 text-center text-muted-foreground">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="glass-card rounded-xl p-10 text-center text-muted-foreground">
          No bookings found for this period
        </div>
      ) : (
        <div>
          <p className="text-xs text-muted-foreground mb-2">{total} booking{total !== 1 ? 's' : ''} found</p>
          <div className="glass-card rounded-xl border border-border overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[780px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium">Confirmation</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Customer</th>
                  <th className="text-left p-3 font-medium">Flight / Time</th>
                  <th className="text-left p-3 font-medium">Service</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => fetchDetail(b.id)}
                    className="border-b border-border hover:bg-muted/20 cursor-pointer"
                  >
                    <td className="p-3 font-mono text-xs font-semibold text-gold">
                      {b.confirmationCode || b.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="p-3 text-xs">{fmt(b.bookingDate)}</td>
                    <td className="p-3">
                      <p className="font-medium">{b.customer?.name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{b.customer?.email}</p>
                    </td>
                    <td className="p-3 text-xs">
                      <p className="font-mono">{b.flightNumber || '—'}</p>
                      <p className="text-muted-foreground">{b.arrivalTime || b.bookingTime || '—'}</p>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {[b.serviceType, b.route].filter(Boolean).join(' · ') || b.type.replace(/_/g, ' ')}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-700'}`}>
                        {b.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-right font-semibold">{fmtCents(b.totalAmount)}</td>
                    <td className="p-3">
                      <ChevronRight size={16} className="text-muted-foreground" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Detail View ──────────────────────────────────────────────────────────────

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

  const downloadPdf = async () => {
    setBusy('pdf');
    try {
      const res = await fetch(apiUrl(`/api/admin/bookings/${booking.id}/confirmation-pdf`), {
        credentials: 'include', headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reservation-${(booking.confirmationCode || booking.id.slice(0, 8)).toUpperCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { flash('Failed to generate PDF', true); }
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
    const reason = prompt('Reason for cancellation (optional):') ?? undefined;
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

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Alerts */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{success}</div>
      )}

      {/* ── Header ── */}
      <div className="glass-card rounded-xl p-5 border border-border">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Booking</p>
            <h2 className="font-display text-2xl font-bold text-gold">
              {booking.confirmationCode || booking.id.slice(0, 8).toUpperCase()}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[booking.status] || ''}`}>
                {booking.status.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-muted-foreground">{booking.source}</span>
              <span className="text-xs text-muted-foreground">{booking.type.replace(/_/g, ' ')}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!['CANCELLED', 'COMPLETED'].includes(booking.status) && (
              <button
                onClick={() => setShowEditForm(!showEditForm)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:bg-muted text-sm"
              >
                <Edit2 size={14} /> Edit
              </button>
            )}
            {booking.status === 'PENDING_PAYMENT' && (
              <button
                onClick={confirmBooking}
                disabled={busy === 'confirm'}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 text-sm"
              >
                <CheckCircle size={14} /> {busy === 'confirm' ? 'Confirming...' : 'Confirm (offline)'}
              </button>
            )}
            {!['CANCELLED', 'COMPLETED'].includes(booking.status) && (
              <button
                onClick={cancelBooking}
                disabled={busy === 'cancel'}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 text-sm border border-red-200"
              >
                <XCircle size={14} /> {busy === 'cancel' ? 'Cancelling...' : 'Cancel'}
              </button>
            )}
            <button
              onClick={openAssignForm}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:bg-muted text-sm"
            >
              <UserCheck size={14} /> Assign Driver
            </button>
            <button
              onClick={resendEmails}
              disabled={busy === 'resend'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:bg-muted text-sm disabled:opacity-50"
            >
              <Mail size={14} /> {busy === 'resend' ? 'Sending...' : 'Resend'}
            </button>
            <button
              onClick={downloadPdf}
              disabled={busy === 'pdf'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-sm"
            >
              <FileDown size={14} /> {busy === 'pdf' ? 'Generating...' : 'PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Edit Form ── */}
      {showEditForm && (
        <EditBookingForm
          booking={booking}
          onSave={async (data) => {
            setBusy('save');
            try {
              const json = await doPatch(`/api/admin/bookings/${booking.id}`, data);
              if (json.success) { setShowEditForm(false); flash('Booking updated'); onRefetchDetail(); }
              else flash(json.error || 'Failed to update', true);
            } finally { setBusy(null); }
          }}
          onCancel={() => setShowEditForm(false)}
          saving={busy === 'save'}
        />
      )}

      {/* ── Assign Driver Form ── */}
      {showAssignForm && (
        <AssignDriverForm
          booking={booking}
          drivers={drivers}
          vehicles={vehicles}
          onSave={async (data) => {
            setBusy('assign');
            try {
              const json = await doPost(`/api/admin/bookings/${booking.id}/assign`, data);
              if (json.success) { setShowAssignForm(false); flash('Driver/vehicle assigned'); onRefetchDetail(); }
              else flash(json.error || 'Failed to assign', true);
            } finally { setBusy(null); }
          }}
          onCancel={() => setShowAssignForm(false)}
          saving={busy === 'assign'}
        />
      )}

      {/* ── Main Info ── */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Customer */}
        <div className="glass-card rounded-xl p-5 border border-border space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Customer</p>
          <p className="font-semibold">{booking.customer?.name}</p>
          <p className="text-sm text-muted-foreground">{booking.customer?.email}</p>
          <p className="text-sm text-muted-foreground">{booking.customer?.phone}</p>
        </div>

        {/* Booking Details */}
        <div className="glass-card rounded-xl p-5 border border-border space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Service Details</p>
          <Row label="Date" value={fmt(booking.bookingDate)} />
          <Row label="Time" value={booking.bookingTime || booking.arrivalTime || '—'} />
          <Row label="Passengers" value={String(booking.passengers)} />
          <Row label="Service" value={[booking.serviceType, booking.tripType?.replace('_', ' ')].filter(Boolean).join(' · ') || '—'} />
          <Row label="Route" value={booking.route || '—'} />
        </div>

        {/* Flights */}
        <div className="glass-card rounded-xl p-5 border border-border space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Flight Info</p>
          <Row label="Arrival flight" value={booking.flightNumber || '—'} />
          <Row label="Arrival time" value={booking.arrivalTime || '—'} />
          <Row label="Departure flight" value={booking.departureFlightNumber || '—'} />
          <Row label="Departure time" value={booking.departureTime || '—'} />
          <Row label="Pickup time" value={booking.pickupTime || '—'} />
        </div>

        {/* Location + Payment */}
        <div className="glass-card rounded-xl p-5 border border-border space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Location & Payment</p>
          <Row label="Pickup" value={booking.pickupLocation || '—'} />
          <Row label="Dropoff" value={booking.dropoffLocation || '—'} />
          <div className="border-t border-border pt-2 mt-2">
            <Row label="Total" value={fmtCents(booking.totalAmount)} bold />
            {lastPayment && (
              <>
                <Row label="Payment" value={`${lastPayment.provider} · ${lastPayment.status}`} />
                {lastPayment.orderId && <Row label="Order ID" value={lastPayment.orderId} mono />}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Items ── */}
      {booking.items && booking.items.length > 0 && (
        <div className="glass-card rounded-xl p-5 border border-border">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Items</p>
          <div className="space-y-1.5">
            {booking.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                <div>
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted-foreground ml-2">× {item.quantity}</span>
                  <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">{item.type}</span>
                </div>
                <span className="font-medium">{fmtCents(item.totalPrice)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Assignment ── */}
      {(currentDriver || currentVehicle) && (
        <div className="glass-card rounded-xl p-5 border border-border">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            <Car size={14} className="inline mr-1" />Assignment
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

      {/* ── Notes ── */}
      {(booking.notes || booking.internalNotes) && (
        <div className="glass-card rounded-xl p-5 border border-border">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Notes</p>
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

      {/* ── Email Log ── */}
      {booking.emailLogs && booking.emailLogs.length > 0 && (
        <div className="glass-card rounded-xl p-5 border border-border">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1">
            <Mail size={14} /> Email Log
          </p>
          <div className="space-y-2">
            {booking.emailLogs.map((log) => (
              <div key={log.id} className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/30 text-xs">
                <span className="font-medium">{log.type.replace(/_/g, ' ')}</span>
                <span className="text-muted-foreground">→ {log.to}</span>
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

// ─── Edit Form ────────────────────────────────────────────────────────────────

function EditBookingForm({
  booking, onSave, onCancel, saving,
}: {
  booking: Booking;
  onSave: (data: Record<string, any>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    bookingDate: booking.bookingDate.slice(0, 10),
    bookingTime: booking.bookingTime || '',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      passengers: parseInt(form.passengers) || 1,
      bookingTime: form.bookingTime || null,
      flightNumber: form.flightNumber || null,
      arrivalTime: form.arrivalTime || null,
      departureFlightNumber: form.departureFlightNumber || null,
      departureTime: form.departureTime || null,
      pickupLocation: form.pickupLocation || null,
      dropoffLocation: form.dropoffLocation || null,
      notes: form.notes || null,
      internalNotes: form.internalNotes || null,
    });
  };

  return (
    <div className="glass-card rounded-xl p-5 border border-gold/30">
      <h3 className="font-semibold mb-4 flex items-center gap-2"><Edit2 size={16} /> Edit Booking</h3>
      <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-3 text-sm">
        <Field label="Date" type="date" value={form.bookingDate} onChange={(v) => setForm({ ...form, bookingDate: v })} />
        <Field label="Time" type="time" value={form.bookingTime} onChange={(v) => setForm({ ...form, bookingTime: v })} />
        <Field label="Passengers" type="number" value={form.passengers} onChange={(v) => setForm({ ...form, passengers: v })} />
        <Field label="Arrival flight" value={form.flightNumber} onChange={(v) => setForm({ ...form, flightNumber: v })} />
        <Field label="Arrival time" value={form.arrivalTime} onChange={(v) => setForm({ ...form, arrivalTime: v })} placeholder="HH:MM" />
        <Field label="Departure flight" value={form.departureFlightNumber} onChange={(v) => setForm({ ...form, departureFlightNumber: v })} />
        <Field label="Departure time" value={form.departureTime} onChange={(v) => setForm({ ...form, departureTime: v })} placeholder="HH:MM" />
        <Field label="Pickup location" value={form.pickupLocation} onChange={(v) => setForm({ ...form, pickupLocation: v })} />
        <Field label="Dropoff location" value={form.dropoffLocation} onChange={(v) => setForm({ ...form, dropoffLocation: v })} />
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Customer notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Internal notes (admin only)</label>
          <textarea
            value={form.internalNotes}
            onChange={(e) => setForm({ ...form, internalNotes: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
          />
        </div>
        <div className="sm:col-span-2 flex gap-2 pt-1">
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
      </form>
    </div>
  );
}

// ─── Assign Driver Form ───────────────────────────────────────────────────────

function AssignDriverForm({
  booking, drivers, vehicles, onSave, onCancel, saving,
}: {
  booking: Booking;
  drivers: Driver[];
  vehicles: Vehicle[];
  onSave: (data: Record<string, any>) => void;
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
    <div className="glass-card rounded-xl p-5 border border-gold/30">
      <h3 className="font-semibold mb-4 flex items-center gap-2"><UserCheck size={16} /> Assign Driver / Vehicle</h3>
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

// ─── Small helpers ────────────────────────────────────────────────────────────

function Row({ label, value, bold, mono }: { label: string; value: string; bold?: boolean; mono?: boolean }) {
  return (
    <div className="flex justify-between text-sm py-0.5 gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={`text-right ${bold ? 'font-semibold' : ''} ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}

function Field({
  label, value, onChange, type = 'text', placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
      />
    </div>
  );
}
