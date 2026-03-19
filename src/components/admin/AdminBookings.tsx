import { useState, useEffect } from 'react';
import { Mail, ChevronRight, ArrowLeft, RefreshCw, FileDown } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getApiBaseUrl } from '@/lib/api';

type Booking = {
  id: string;
  type: string;
  status: string;
  bookingDate: string;
  bookingTime: string | null;
  arrivalTime: string | null;
  flightNumber: string | null;
  route: string | null;
  serviceType: string | null;
  totalAmount: number;
  passengers: number;
  customer: { name: string; email: string; phone: string };
  items: Array<{ name: string; type: string }>;
  emailLogs?: EmailLog[];
};

type EmailLog = {
  id: string;
  type: string;
  status: string;
  to: string;
  subject: string;
  error: string | null;
  sentAt: string | null;
  createdAt: string;
};

const getAdminApiUrl = (path: string) => {
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
};

export const AdminBookings = () => {
  const { getAuthHeaders } = useAdminAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bookingDetail, setBookingDetail] = useState<Booking | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ date: dateFilter, limit: '50' });
      const res = await fetch(getAdminApiUrl(`/api/admin/bookings?${qs}`), {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success && json.data) setBookings(json.data);
      else setBookings([]);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingDetail = async (id: string) => {
    setDetailLoading(true);
    setSelectedId(id);
    try {
      const res = await fetch(getAdminApiUrl(`/api/admin/bookings/${id}`), {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success && json.data) setBookingDetail(json.data);
      else setBookingDetail(null);
    } catch {
      setBookingDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [dateFilter]);

  const formatType = (t: string) =>
    t.replace(/_/g, ' ');
  const formatStatus = (s: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-200 text-gray-700',
      PENDING_PAYMENT: 'bg-amber-100 text-amber-800',
      PAID: 'bg-emerald-100 text-emerald-800',
      CONFIRMED: 'bg-emerald-100 text-emerald-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[s] || 'bg-gray-100 text-gray-700';
  };
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatCents = (c: number) => `$${(c / 100).toFixed(2)}`;

  if (selectedId && (bookingDetail || detailLoading)) {
    return (
      <div>
        <button
          onClick={() => { setSelectedId(null); setBookingDetail(null); }}
          className="flex items-center gap-2 text-sm text-gold hover:underline mb-4"
        >
          <ArrowLeft size={16} /> Back to list
        </button>
        {detailLoading ? (
          <div className="glass-card rounded-xl p-8 text-center">Loading...</div>
        ) : bookingDetail ? (
          <BookingDetailView
            booking={bookingDetail}
            onRefresh={fetchBookings}
            onRefetchDetail={() => selectedId && fetchBookingDetail(selectedId)}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-background"
        />
        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold/20 text-gold hover:bg-gold/30 transition-colors"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>
      {loading ? (
        <div className="glass-card rounded-xl p-8 text-center">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
          No bookings found for this date
        </div>
      ) : (
        <div className="glass-card rounded-xl border border-border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Customer</th>
                <th className="text-left p-3 font-medium">Arrival time</th>
                <th className="text-left p-3 font-medium">Flight</th>
                <th className="text-left p-3 font-medium">Service / Route</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Total</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-border hover:bg-muted/20 cursor-pointer"
                  onClick={() => fetchBookingDetail(b.id)}
                >
                  <td className="p-3">{formatDate(b.bookingDate)}</td>
                  <td className="p-3">{b.customer?.name || '-'}</td>
                  <td className="p-3">{b.bookingTime || b.arrivalTime || '—'}</td>
                  <td className="p-3 font-mono text-xs">{b.flightNumber || '—'}</td>
                  <td className="p-3 text-muted-foreground">
                    {[b.serviceType, b.route].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${formatStatus(b.status)}`}>
                      {formatType(b.status)}
                    </span>
                  </td>
                  <td className="p-3 text-right font-medium">{formatCents(b.totalAmount)}</td>
                  <td className="p-3">
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

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
  const [resending, setResending] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const downloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const res = await fetch(getAdminApiUrl(`/api/admin/bookings/${booking.id}/confirmation-pdf`), {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to generate PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reservation-${booking.id.slice(0, 8).toUpperCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // could show toast
    } finally {
      setDownloadingPdf(false);
    }
  };

  const resendEmails = async () => {
    setResending(true);
    try {
      const res = await fetch(getAdminApiUrl(`/api/admin/bookings/${booking.id}/resend-confirmation`), {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        onRefresh();
        onRefetchDetail();
      }
    } finally {
      setResending(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
  const formatType = (t: string) => t.replace(/_/g, ' ');

  const logs = booking.emailLogs || [];

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6 border border-border">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="font-display text-xl font-bold">
            Booking {booking.id.slice(0, 8).toUpperCase()}
          </h2>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={downloadingPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-sm"
          >
            <FileDown size={16} /> {downloadingPdf ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Customer</p>
            <p className="font-medium">{booking.customer?.name}</p>
            <p>{booking.customer?.email}</p>
            <p>{booking.customer?.phone}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Details</p>
            <p>Date: {new Date(booking.bookingDate).toLocaleDateString()} {booking.bookingTime || ''}</p>
            <p>Arrival time: {booking.bookingTime || booking.arrivalTime || '—'}</p>
            <p>Flight: {booking.flightNumber || '—'}</p>
            <p>Service / Route: {[booking.serviceType, booking.route].filter(Boolean).join(' · ') || '—'}</p>
            <p>Total: ${(booking.totalAmount / 100).toFixed(2)}</p>
            <p>Status: {formatType(booking.status)}</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold flex items-center gap-2">
            <Mail size={18} /> Email log
          </h3>
          <button
            onClick={resendEmails}
            disabled={resending}
            className="px-4 py-2 rounded-lg bg-gold/20 text-gold hover:bg-gold/30 disabled:opacity-50 text-sm"
          >
            {resending ? 'Sending...' : 'Resend confirmation'}
          </button>
        </div>
        {logs.length === 0 ? (
          <p className="text-muted-foreground text-sm">No emails sent for this booking</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/30 text-sm"
              >
                <span className="font-medium">{formatType(log.type)}</span>
                <span className="text-muted-foreground">→ {log.to}</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    log.status === 'SENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {log.status}
                </span>
                {log.sentAt && (
                  <span className="text-muted-foreground text-xs">{formatDate(log.sentAt)}</span>
                )}
                {log.error && (
                  <span className="text-red-600 text-xs truncate max-w-[200px]" title={log.error}>
                    {log.error}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
