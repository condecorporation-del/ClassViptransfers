import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DollarSign, CalendarCheck, LogOut, Mail, LayoutDashboard, PlusCircle,
  TrendingUp, Clock, AlertCircle, CheckCircle2, CreditCard, Banknote, Send,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { PricingManager } from '@/components/PricingManager';
import { AdminBookings } from '@/components/admin/AdminBookings';
import { getApiBaseUrl } from '@/lib/api';

const apiUrl = (path: string) => {
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
};

type Tab = 'dashboard' | 'bookings' | 'pricing' | 'new-booking';

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

function DashboardTab() {
  const { getAuthHeaders } = useAdminAuth();
  const [stats, setStats] = useState<{
    bookingsToday: number;
    emailsSentToday: number;
    pendingCount: number;
    revenueToday: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl('/api/admin/stats'), { credentials: 'include', headers: getAuthHeaders() })
      .then(r => r.json())
      .then(json => { if (json.success) setStats(json.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading stats...</div>;
  if (!stats) return <div className="p-10 text-center text-muted-foreground">Could not load stats</div>;

  const cards = [
    { label: "Bookings Today", value: stats.bookingsToday, icon: <CalendarCheck size={20} />, color: 'text-gold' },
    { label: "Revenue Today", value: `$${stats.revenueToday}`, icon: <TrendingUp size={20} />, color: 'text-emerald-500' },
    { label: "Pending Payment", value: stats.pendingCount, icon: <Clock size={20} />, color: 'text-amber-500' },
    { label: "Emails Sent Today", value: stats.emailsSentToday, icon: <Mail size={20} />, color: 'text-blue-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of today&apos;s activity</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="group relative rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gold/20">
            <div className={`inline-flex p-2.5 rounded-xl bg-muted/60 ${c.color} mb-4`}>{c.icon}</div>
            <p className="text-2xl font-bold tracking-tight">{c.value}</p>
            <p className="text-sm font-medium text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/80 px-5 py-4">
        <p className="text-sm text-emerald-800/90 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          Stats are calculated for today&apos;s date. Go to <strong className="text-emerald-900 font-semibold">Bookings</strong> to filter by week, month, or search by customer.
        </p>
      </div>
    </div>
  );
}

// ─── Quick Booking Form ───────────────────────────────────────────────────────

type PaymentMethod = 'none' | 'paypal' | 'cash';

const PAYMENT_OPTIONS: Array<{
  id: PaymentMethod;
  icon: React.ReactNode;
  title: string;
  desc: string;
  badge?: string;
  badgeColor?: string;
}> = [
  {
    id: 'none',
    icon: <Send size={18} />,
    title: 'Save only',
    desc: 'Create the booking without sending any email.',
  },
  {
    id: 'paypal',
    icon: <CreditCard size={18} />,
    title: 'Send PayPal link',
    desc: 'Client receives a payment link by email. Confirmation is sent automatically when paid.',
    badge: 'Recommended',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'cash',
    icon: <Banknote size={18} />,
    title: 'Paid in cash',
    desc: 'Mark as paid and send a confirmation email to the client immediately.',
    badge: 'Cash / Manual',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
];

/** Calculate pickup time = departure time minus 3 hours */
function calcPickupTime(depTime: string): string {
  if (!depTime) return '';
  const match = depTime.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return '';
  let mins = parseInt(match[1], 10) * 60 + parseInt(match[2], 10) - 180;
  if (mins < 0) mins += 1440;
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const suffix = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function QuickBookingTab() {
  const { getAuthHeaders } = useAdminAuth();
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    tripType: 'oneway' as 'oneway' | 'roundtrip',
    hotelName: '',           // hotel or property name (stored as dropoffLocation)
    passengers: '1',
    priceUsd: '',            // manual price in USD
    arrivalDate: '',
    arrivalTime: '',         // when client lands / arrives
    arrivalFlight: '',       // arrival flight number
    departureDate: '',       // return date (roundtrip)
    departureTime: '',       // departure flight time → pickup = T-3h
    departureFlight: '',     // departure flight number
    notes: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paypal');
  const [showDepartureInfo, setShowDepartureInfo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; code?: string; detail?: string } | null>(null);

  const f = (key: keyof typeof form) => (v: string) => setForm(prev => ({ ...prev, [key]: v }));

  // Auto-computed pickup time for departure (3h before flight)
  const computedPickupTime = calcPickupTime(form.departureTime);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.customerName?.trim();
    const email = form.customerEmail?.trim();
    const phone = form.customerPhone?.trim();
    const hotel = form.hotelName?.trim();
    if (!name || !email || !phone || !form.arrivalDate || !hotel) {
      setResult({ success: false, message: 'Required: customer info, arrival date, and hotel / destination.' });
      return;
    }
    setSubmitting(true);
    setResult(null);

    try {
      const priceNum = parseFloat(form.priceUsd) || 0;
      const tripLabel = form.tripType === 'roundtrip' ? 'Round Trip' : 'One Way';
      const body = {
        type: 'TRANSPORTATION',
        customer: {
          name: name!,
          email: email!,
          phone: phone!,
          language: 'en',
        },
        bookingDate: new Date(form.arrivalDate + 'T12:00:00').toISOString(),
        bookingTime: form.arrivalTime || undefined,
        flightNumber: form.arrivalFlight?.trim() || undefined,
        arrivalTime: form.arrivalTime?.trim() || undefined,
        departureFlightNumber: form.departureFlight?.trim() || undefined,
        departureTime: form.departureTime?.trim() || undefined,
        pickupLocation: 'SJD Airport',
        dropoffLocation: hotel!,
        passengers: parseInt(form.passengers) || 1,
        serviceType: 'private',
        tripType: form.tripType,
        notes: form.notes?.trim() || undefined,
        status: paymentMethod === 'cash' ? 'CONFIRMED' : 'OFFLINE_HOLD',
        sendConfirmation: paymentMethod === 'cash',
        sendPaymentLink: paymentMethod === 'paypal',
        items: [
          {
            type: 'TRANSPORTATION',
            name: `Private Transfer — ${hotel} (${tripLabel})`,
            quantity: 1,
            unitPrice: priceNum,
          },
        ],
      };

      const res = await fetch(apiUrl('/api/admin/bookings/manual'), {
        method: 'POST',
        credentials: 'include',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (json.success) {
        const code = json.data?.confirmationCode || json.data?.id?.slice(0, 8).toUpperCase();
        const emailMsg =
          paymentMethod === 'paypal' ? 'Payment link sent to client email.' :
          paymentMethod === 'cash'   ? 'Confirmation email sent to client.' :
          'Booking saved (no email sent).';
        setResult({ success: true, message: `Booking created: ${code}`, detail: emailMsg, code });
        setForm({
          customerName: '', customerEmail: '', customerPhone: '',
          tripType: 'oneway', hotelName: '', passengers: '1', priceUsd: '',
          arrivalDate: '', arrivalTime: '', arrivalFlight: '',
          departureDate: '', departureTime: '', departureFlight: '', notes: '',
        });
        setShowDepartureInfo(false);
        setPaymentMethod('paypal');
      } else {
        setResult({ success: false, message: json.error || 'Failed to create booking.' });
      }
    } catch {
      setResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const submitLabel =
    paymentMethod === 'paypal' ? 'Create & Send Payment Link' :
    paymentMethod === 'cash'   ? 'Create & Send Confirmation' :
    'Create Booking';

  return (
    <div className="max-w-2xl">
      <div className="mb-7">
        <h1 className="font-display text-3xl font-bold">Quick Booking</h1>
        <p className="text-muted-foreground text-sm mt-1">Create a manual reservation — private transfer.</p>
      </div>

      {result && (
        <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 border ${
          result.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {result.success
            ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            : <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />}
          <div>
            <p className="font-semibold text-sm">{result.message}</p>
            {result.detail && <p className="text-xs mt-0.5 opacity-75">{result.detail}</p>}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Customer ── */}
        <FormSection title="Customer" icon="👤">
          <div className="grid sm:grid-cols-3 gap-3">
            <QField label="Full Name *" value={form.customerName} onChange={f('customerName')} placeholder="John Smith" />
            <QField label="Email *" type="email" value={form.customerEmail} onChange={f('customerEmail')} placeholder="john@email.com" />
            <QField label="Phone *" value={form.customerPhone} onChange={f('customerPhone')} placeholder="+1 555 000 0000" />
          </div>
        </FormSection>

        {/* ── Service ── */}
        <FormSection title="Service — Private Transfer" icon="🚗">
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            {/* Trip type */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Trip Type *</label>
              <div className="flex rounded-lg border border-border overflow-hidden">
                {(['oneway', 'roundtrip'] as const).map(t => (
                  <button key={t} type="button"
                    onClick={() => setForm(p => ({ ...p, tripType: t }))}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      form.tripType === t ? 'bg-gold text-navy' : 'bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {t === 'oneway' ? 'One Way' : 'Round Trip'}
                  </button>
                ))}
              </div>
            </div>
            <QField label="Passengers" type="number" value={form.passengers} onChange={f('passengers')} />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <QField label="Hotel / Property / Destination *" value={form.hotelName} onChange={f('hotelName')} placeholder="Pueblo Bonito, Villa Serena, Corridor…" />
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Price (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input
                  type="number"
                  value={form.priceUsd}
                  onChange={e => setForm(p => ({ ...p, priceUsd: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                />
              </div>
            </div>
          </div>
        </FormSection>

        {/* ── Arrival ── */}
        <FormSection title="Arrival" icon="🛬">
          <div className="grid sm:grid-cols-3 gap-3">
            <QField label="Arrival Date *" type="date" value={form.arrivalDate} onChange={f('arrivalDate')} />
            <QField label="Arrival Time" type="time" value={form.arrivalTime} onChange={f('arrivalTime')} />
            <QField label="Flight Number" value={form.arrivalFlight} onChange={f('arrivalFlight')} placeholder="AA 1234" />
          </div>
        </FormSection>

        {/* ── Departure (always show for round trip; also show if explicitly expanded or any departure field filled) ── */}
        {(form.tripType === 'roundtrip' || showDepartureInfo || form.departureTime || form.departureFlight) && (
          <FormSection title="Departure" icon="🛫">
            <div className="grid sm:grid-cols-3 gap-3">
              {form.tripType === 'roundtrip' && (
                <QField label="Departure Date" type="date" value={form.departureDate} onChange={f('departureDate')} />
              )}
              <QField label="Departure Flight" value={form.departureFlight} onChange={f('departureFlight')} placeholder="AA 5678" />
              <QField label="Departure Flight Time" type="time" value={form.departureTime} onChange={f('departureTime')} />
            </div>

            {/* Auto pickup time */}
            {computedPickupTime && (
              <div className="mt-3 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                <Clock size={16} className="text-amber-600 shrink-0" />
                <div>
                  <p className="text-xs text-amber-700 font-medium">Pickup time (3h before flight)</p>
                  <p className="text-lg font-bold text-amber-900">{computedPickupTime}</p>
                </div>
                <p className="text-xs text-amber-600 ml-auto">Departure at {form.departureTime}</p>
              </div>
            )}
          </FormSection>
        )}

        {/* Show departure section trigger for one-way if not yet visible */}
        {form.tripType === 'oneway' && !showDepartureInfo && !form.departureTime && !form.departureFlight && (
          <button
            type="button"
            onClick={() => setShowDepartureInfo(true)}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            + Add departure flight info
          </button>
        )}

        {/* ── Notes ── */}
        <FormSection title="Notes" icon="📝">
          <textarea
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            rows={2}
            placeholder="Special requests, internal notes…"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
        </FormSection>

        {/* ── Payment Method ── */}
        <FormSection title="Payment Method" icon="💳">
          <div className="grid sm:grid-cols-3 gap-3">
            {PAYMENT_OPTIONS.map(opt => {
              const active = paymentMethod === opt.id;
              return (
                <button key={opt.id} type="button" onClick={() => setPaymentMethod(opt.id)}
                  className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all ${
                    active ? 'border-gold bg-gold/10 shadow-sm' : 'border-border bg-background hover:border-gold/40 hover:bg-gold/5'
                  }`}
                >
                  <div className={`flex items-center gap-2 ${active ? 'text-gold' : 'text-muted-foreground'}`}>
                    <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${active ? 'border-gold bg-gold' : 'border-border'}`}>
                      {active && <span className="w-2 h-2 rounded-full bg-navy" />}
                    </span>
                    {opt.icon}
                    <span className="font-semibold text-sm">{opt.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{opt.desc}</p>
                  {opt.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${opt.badgeColor}`}>{opt.badge}</span>
                  )}
                </button>
              );
            })}
          </div>

          {paymentMethod === 'paypal' && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs">
              <CreditCard size={14} className="mt-0.5 shrink-0" />
              <span>Client receives a payment link by email. Confirmation is sent automatically when PayPal payment is completed.</span>
            </div>
          )}
          {paymentMethod === 'cash' && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
              <Banknote size={14} className="mt-0.5 shrink-0" />
              <span>Booking marked as Confirmed. Client receives confirmation email + PDF voucher immediately.</span>
            </div>
          )}
        </FormSection>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !form.customerName?.trim() || !form.customerEmail?.trim() || !form.customerPhone?.trim() || !form.hotelName?.trim() || !form.arrivalDate}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#0A1628' }}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
              Creating booking...
            </span>
          ) : submitLabel}
        </button>
      </form>
    </div>
  );
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

function FormSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/60 border-b border-border">
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function QField({
  label, value, onChange, type = 'text', placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-colors"
      />
    </div>
  );
}

// ─── Admin Shell ──────────────────────────────────────────────────────────────

const Admin = () => {
  const { t } = useLanguage();
  const { email, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const sidebarItems: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'bookings', label: t('admin.sidebar.bookings'), icon: <CalendarCheck size={18} /> },
    { id: 'new-booking', label: 'Quick Booking', icon: <PlusCircle size={18} /> },
    { id: 'pricing', label: t('admin.sidebar.pricing'), icon: <DollarSign size={18} /> },
  ];

  return (
    <div className="min-h-screen pt-20 flex flex-col md:flex-row">
      {/* Mobile: horizontal scrollable tabs */}
      <div className="md:hidden overflow-x-auto overscroll-x-contain touch-pan-x border-b border-border bg-card sticky top-16 z-30">
        <div className="flex gap-1 p-2 min-w-min">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium touch-manipulation min-h-[44px] transition-colors whitespace-nowrap ${
                activeTab === item.id ? 'bg-gold/20 text-gold' : 'text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar - desktop */}
      <aside className="w-64 hidden md:flex md:flex-col flex-shrink-0 bg-[hsl(var(--navy))] border-r border-white/5">
        {email && (
          <div className="p-5 border-b border-white/10">
            <p className="text-[11px] font-medium uppercase tracking-wider text-off-white/50 mb-1.5">Logged in as</p>
            <p className="text-sm font-semibold text-off-white truncate pr-2">{email}</p>
            <button
              onClick={logout}
              className="mt-3 flex items-center gap-2 text-xs text-off-white/60 hover:text-off-white transition-colors"
            >
              <LogOut size={14} strokeWidth={2} /> Logout
            </button>
          </div>
        )}
        <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 pl-5 pr-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-white/12 text-gold shadow-lg shadow-black/10'
                  : 'text-off-white/70 hover:text-off-white hover:bg-white/6'
              }`}
              style={activeTab === item.id ? { borderLeft: '3px solid hsl(42 78% 50%)' } : undefined}
            >
              <span className={activeTab === item.id ? 'text-gold' : 'text-off-white/60'}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 p-6 md:p-10 overflow-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'bookings' && (
            <div>
              <h1 className="font-display text-3xl font-bold mb-8">Bookings</h1>
              <AdminBookings />
            </div>
          )}
          {activeTab === 'new-booking' && <QuickBookingTab />}
          {activeTab === 'pricing' && (
            <div>
              <h1 className="font-display text-3xl font-bold mb-8">Pricing</h1>
              <PricingManager />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Admin;
