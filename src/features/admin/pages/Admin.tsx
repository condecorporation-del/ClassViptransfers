import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarCheck, LogOut, Mail, LayoutDashboard, PlusCircle,
  TrendingUp, Clock, AlertCircle, CheckCircle2, CreditCard, Banknote, Send,
  MoreHorizontal, User, Plane, StickyNote, X,
  Paperclip, Truck, ChevronRight, Pencil, Check,
  BarChart2, Megaphone, Users, Settings,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/features/admin/hooks/useAdminAuth';
import { PricingManager } from '@/features/admin/components/PricingManager';
import { AdminBookings } from '@/features/admin/components/AdminBookings';
import { FinanzasTab } from '@/features/admin/components/FinanzasTab';
import { DashboardOverviewTab } from '@/features/admin/components/DashboardOverviewTab';
import { MarketingTab } from '@/features/admin/components/MarketingTab';
import { RRHHTab } from '@/features/admin/components/RRHHTab';
import { TareasTab } from '@/features/admin/components/TareasTab';
import { getApiBaseUrl } from '@/shared/lib/api';
import { cloudinaryAssets } from '@/shared/lib/cloudinary-assets';

const apiUrl = (path: string) => {
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
};

type Tab = 'dashboard' | 'bookings' | 'pricing' | 'new-booking' | 'finanzas' | 'marketing' | 'rrhh' | 'tareas';

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

function DashboardTab() {
  return <DashboardOverviewTab />;
}
// ─── Quick Booking Form ───────────────────────────────────────────────────────

type PaymentMethod = 'none' | 'stripe' | 'cash';
type QuickBookingMode = 'oneway' | 'roundtrip' | 'account';
type QuickAccountSummary = {
  id: string;
  name: string;
  company?: string | null;
  balanceCents: number;
};

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
    icon: <Send size={16} />,
    title: 'Save only',
    desc: 'Create the booking without sending any email.',
  },
  {
    id: 'stripe',
    icon: <CreditCard size={16} />,
    title: 'Send Stripe Link',
    desc: 'Client receives a secure payment link. Confirmed automatically when paid.',
    badge: 'Recommended',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
  {
    id: 'cash',
    icon: <Banknote size={16} />,
    title: 'Paid in cash',
    desc: 'Mark as paid and send a confirmation email immediately.',
    badge: 'Cash / Manual',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
];

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
    tripType: 'oneway' as QuickBookingMode,
    hotelName: '',
    passengers: '1',
    priceUsd: '',
    arrivalDate: '',
    arrivalTime: '',
    arrivalFlight: '',
    departureDate: '',
    departureTime: '',
    departureFlight: '',
    notes: '',
    serviceDescription: '',
    accountId: '',
  });
  const [accounts, setAccounts] = useState<QuickAccountSummary[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [showDepartureInfo, setShowDepartureInfo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; code?: string; detail?: string } | null>(null);

  const f = (key: keyof typeof form) => (v: string) => setForm(prev => ({ ...prev, [key]: v }));
  const computedPickupTime = calcPickupTime(form.departureTime);
  const isAccountService = form.tripType === 'account';

  useEffect(() => {
    let cancelled = false;

    const loadAccounts = async () => {
      setAccountsLoading(true);
      try {
        const response = await fetch(apiUrl('/api/admin/accounts'), {
          credentials: 'include',
          headers: getAuthHeaders(),
        });
        const json = await response.json();
        if (!cancelled && json.success) {
          setAccounts(Array.isArray(json.data) ? json.data : []);
        }
      } catch {
        if (!cancelled) setAccounts([]);
      } finally {
        if (!cancelled) setAccountsLoading(false);
      }
    };

    void loadAccounts();
    return () => {
      cancelled = true;
    };
  }, [getAuthHeaders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.customerName?.trim();
    const email = form.customerEmail?.trim();
    const phone = form.customerPhone?.trim();
    const hotel = form.hotelName?.trim();

    if (!name || !email || !phone) {
      setResult({ success: false, message: 'Required: customer name, email, and phone.' });
      return;
    }
    if (!isAccountService && (!form.arrivalDate || !hotel)) {
      setResult({ success: false, message: 'Required: arrival date and hotel / destination.' });
      return;
    }
    if (isAccountService && !form.accountId) {
      setResult({ success: false, message: 'Select the existing account that should carry this service.' });
      return;
    }
    if (isAccountService && !form.serviceDescription?.trim()) {
      setResult({ success: false, message: 'Required: service description for the account service.' });
      return;
    }
    setSubmitting(true);
    setResult(null);

    try {
      const priceNum = parseFloat(form.priceUsd) || 0;
      const tripLabel = isAccountService ? 'Account Service' : form.tripType === 'roundtrip' ? 'Round Trip' : 'One Way';
      const itemName = isAccountService
        ? (form.serviceDescription?.trim() || 'Account Service')
        : `Private Transfer — ${hotel} (${tripLabel})`;
      const body = {
        type: 'TRANSPORTATION',
        customer: { name: name!, email: email!, phone: phone!, language: 'en' },
        bookingDate: isAccountService
          ? new Date().toISOString()
          : new Date(form.arrivalDate + 'T12:00:00').toISOString(),
        bookingTime: form.arrivalTime || undefined,
        flightNumber: form.arrivalFlight?.trim() || undefined,
        arrivalTime: form.arrivalTime?.trim() || undefined,
        departureFlightNumber: form.departureFlight?.trim() || undefined,
        departureTime: form.departureTime?.trim() || undefined,
        pickupLocation: isAccountService ? undefined : 'SJD Airport',
        dropoffLocation: isAccountService ? undefined : hotel!,
        passengers: parseInt(form.passengers) || 1,
        serviceType: 'private',
        tripType: isAccountService ? 'oneway' : form.tripType,
        notes: isAccountService
          ? `[ACCOUNT SERVICE] ${form.serviceDescription?.trim()}\n${form.notes?.trim() || ''}`
          : (form.notes?.trim() || undefined),
        status: paymentMethod === 'cash' ? 'CONFIRMED' : 'OFFLINE_HOLD',
        sendConfirmation: paymentMethod === 'cash',
        sendPaymentLink: !isAccountService && paymentMethod === 'stripe',
        items: [{ type: 'TRANSPORTATION' as const, name: itemName, quantity: 1, unitPrice: priceNum }],
      };

      const res = await fetch(apiUrl('/api/admin/bookings/manual'), {
        method: 'POST',
        credentials: 'include',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (json.success) {
        if (isAccountService && form.accountId && json.data?.id) {
          await fetch(apiUrl(`/api/admin/accounts/${form.accountId}/bookings`), {
            method: 'POST',
            credentials: 'include',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId: json.data.id }),
          });
        }

        const code = json.data?.confirmationCode || json.data?.id?.slice(0, 8).toUpperCase();
        const emailMeta = json.data?.email as
          | { mode?: 'payment-link' | 'confirmation' | 'none'; customerSent?: boolean; companySent?: boolean }
          | undefined;
        const customerEmailSent = emailMeta?.customerSent !== false;
        const emailMsg =
          paymentMethod === 'stripe'
            ? (customerEmailSent
                ? 'Stripe payment link sent to client email.'
                : 'Booking created, but payment email could not be sent. Check email provider configuration.')
            : paymentMethod === 'cash'
              ? (customerEmailSent
                  ? 'Confirmation email sent to client.'
                  : 'Booking created, but confirmation email could not be sent. Check email provider configuration.')
            :
          'Booking saved (no email sent).';
        setResult({
          success: true,
          message: isAccountService ? `Service added to account: ${code}` : `Booking created: ${code}`,
          detail: isAccountService ? 'The service was linked to the selected open account.' : emailMsg,
          code,
        });
        setForm({
          customerName: '', customerEmail: '', customerPhone: '',
          tripType: 'oneway', hotelName: '', passengers: '1', priceUsd: '',
          arrivalDate: '', arrivalTime: '', arrivalFlight: '',
          departureDate: '', departureTime: '', departureFlight: '', notes: '',
          serviceDescription: '',
          accountId: '',
        });
        setShowDepartureInfo(false);
        setAttachedFile(null);
        setPaymentMethod('stripe');
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
    isAccountService
      ? 'Create Service & Add to Account'
      : paymentMethod === 'stripe' ? 'Create & Send Stripe Link' :
      paymentMethod === 'cash'   ? 'Create & Send Confirmation' :
      'Save Booking';

  return (
    <div className="max-w-5xl">
      {/* Page header */}
      <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-stretch">
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold mb-1">New Reservation</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Quick Booking</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAccountService
              ? 'Create a service and charge it to an existing open account.'
              : 'Manual reservation entry with cleaner payment handling and better operational context.'}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 xl:w-[560px]">
          <QuickBookingStatCard
            title="Booking Mode"
            value={isAccountService ? 'Account Service' : form.tripType === 'roundtrip' ? 'Round Trip' : 'One Way'}
            detail={isAccountService ? 'Open balance workflow' : 'Direct reservation flow'}
          />
          <QuickBookingStatCard
            title="Payment"
            value={isAccountService ? 'On Account' : paymentMethod === 'stripe' ? 'Stripe Link' : paymentMethod === 'cash' ? 'Cash' : 'Save Only'}
            detail={isAccountService ? 'Settled later' : paymentMethod === 'stripe' ? 'Client pays remotely' : paymentMethod === 'cash' ? 'Confirmed immediately' : 'No email automation'}
          />
          <QuickBookingStatCard
            title="Amount"
            value={form.priceUsd ? `$${Number(form.priceUsd || 0).toFixed(2)}` : '$0.00'}
            detail={isAccountService ? 'Added to ledger' : 'Current booking value'}
          />
        </div>
      </div>

      {/* Result banner */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`mb-6 p-4 rounded-2xl flex items-start gap-3 border ${
              result.success
                ? 'bg-emerald-50 border-emerald-200/80 text-emerald-800'
                : 'bg-red-50 border-red-200/80 text-red-700'
            }`}
          >
            {result.success
              ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
              : <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />}
            <div>
              <p className="font-semibold text-sm">{result.message}</p>
              {result.detail && <p className="text-xs mt-0.5 opacity-75">{result.detail}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Customer ── */}
        <FormSection title="Customer" icon={<User size={14} />}>
          <div className="grid sm:grid-cols-3 gap-3">
            <QField label="Full Name *" value={form.customerName} onChange={f('customerName')} placeholder="John Smith" />
            <QField label="Email *" type="email" value={form.customerEmail} onChange={f('customerEmail')} placeholder="john@email.com" />
            <QField label="Phone *" value={form.customerPhone} onChange={f('customerPhone')} placeholder="+1 555 000 0000" />
          </div>
        </FormSection>

        {/* ── Service ── */}
        <FormSection title="Service Type" icon={<Truck size={14} />}>
          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">Service Type *</p>
            <div className="grid md:grid-cols-3 gap-3">
              {([
                { id: 'oneway', label: 'One Way', desc: 'Single transfer service for arrivals or departures.', badge: 'Transfer' },
                { id: 'roundtrip', label: 'Round Trip', desc: 'Arrival and departure booked together.', badge: 'Transfer' },
                { id: 'account', label: 'Add to Account', desc: 'Dinner, errands, private driver, or any service carried on credit.', badge: 'Account' },
              ] as const).map(t => (
                <button key={t.id} type="button"
                  onClick={() => setForm(p => ({ ...p, tripType: t.id }))}
                  className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                    form.tripType === t.id
                      ? 'border-gold bg-[hsl(var(--navy))] text-white shadow-[0_10px_30px_rgba(10,22,40,0.12)]'
                      : 'border-border bg-background text-muted-foreground hover:border-gold/30 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-sm font-bold ${form.tripType === t.id ? 'text-gold' : 'text-foreground'}`}>{t.label}</p>
                      <p className={`mt-1 text-xs leading-5 ${form.tripType === t.id ? 'text-white/70' : 'text-muted-foreground'}`}>{t.desc}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                      form.tripType === t.id ? 'bg-gold/15 text-gold' : 'bg-muted text-muted-foreground'
                    }`}>
                      {t.badge}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {!isAccountService && (
            <>
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <QField label="Hotel / Property / Destination *" value={form.hotelName} onChange={f('hotelName')} placeholder="Pueblo Bonito, Villa Serena…" />
                <QField label="Passengers" type="number" value={form.passengers} onChange={f('passengers')} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">Price (USD)</p>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">$</span>
                  <input type="number" value={form.priceUsd} onChange={e => setForm(p => ({ ...p, priceUsd: e.target.value }))}
                    placeholder="0.00" min="0" step="0.01"
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/50 transition-all" />
                </div>
              </div>
            </>
          )}

          {isAccountService && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-blue-200/70 bg-blue-50/70 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-700 mb-1">Account Workflow</p>
                <p className="text-sm text-blue-900">Use this when the guest or villa keeps an open balance and settles later.</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">Existing Open Account *</p>
                <select
                  value={form.accountId}
                  onChange={e => setForm(p => ({ ...p, accountId: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/50 transition-all"
                >
                  <option value="">{accountsLoading ? 'Loading accounts...' : 'Select an open account'}</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}{account.company ? ` - ${account.company}` : ''} ({`$${(account.balanceCents / 100).toFixed(2)}`})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">Service Description *</p>
                <textarea
                  value={form.serviceDescription}
                  onChange={e => setForm(p => ({ ...p, serviceDescription: e.target.value }))}
                  rows={4}
                  placeholder="Example: Dinner transfer to Flora Farms, private driver 4 hours, airport errand, grocery stop..."
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/50 transition-all"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">Amount (USD) *</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">$</span>
                    <input type="number" value={form.priceUsd} onChange={e => setForm(p => ({ ...p, priceUsd: e.target.value }))}
                      placeholder="0.00" min="0" step="0.01"
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/50 transition-all" />
                  </div>
                </div>
                <QField label="Passengers / Group size" type="number" value={form.passengers} onChange={f('passengers')} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">Attach file (optional)</p>
                <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-border bg-background cursor-pointer hover:border-gold/40 hover:bg-gold/3 transition-all">
                  <Paperclip size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground truncate">
                    {attachedFile ? attachedFile.name : 'PDF, image, or document…'}
                  </span>
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={e => setAttachedFile(e.target.files?.[0] || null)} />
                  {attachedFile && (
                    <button type="button" onClick={(e) => { e.preventDefault(); setAttachedFile(null); }}
                      className="ml-auto text-muted-foreground hover:text-foreground">
                      <X size={14} />
                    </button>
                  )}
                </label>
              </div>
            </div>
          )}
        </FormSection>

        {/* ── Arrival ── */}
        {!isAccountService && (
          <FormSection title="Arrival" icon={<Plane size={14} className="rotate-[-45deg]" />}>
            <div className="grid sm:grid-cols-3 gap-3">
              <QField label="Arrival Date *" type="date" value={form.arrivalDate} onChange={f('arrivalDate')} />
              <QField label="Arrival Time" type="time" value={form.arrivalTime} onChange={f('arrivalTime')} />
              <QField label="Flight Number" value={form.arrivalFlight} onChange={f('arrivalFlight')} placeholder="AA 1234" />
            </div>
          </FormSection>
        )}

        {/* ── Departure ── */}
        {!isAccountService && (form.tripType === 'roundtrip' || showDepartureInfo || form.departureTime || form.departureFlight) && (
          <FormSection title="Departure" icon={<Plane size={14} className="rotate-45" />}>
            <div className="grid sm:grid-cols-3 gap-3">
              {form.tripType === 'roundtrip' && (
                <QField label="Departure Date" type="date" value={form.departureDate} onChange={f('departureDate')} />
              )}
              <QField label="Departure Flight" value={form.departureFlight} onChange={f('departureFlight')} placeholder="AA 5678" />
              <QField label="Departure Flight Time" type="time" value={form.departureTime} onChange={f('departureTime')} />
            </div>
            {computedPickupTime && (
              <div className="mt-3 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200/80">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100">
                  <Clock size={15} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Pickup time (3h before)</p>
                  <p className="text-lg font-display font-bold text-amber-900">{computedPickupTime}</p>
                </div>
                <p className="text-xs text-amber-500 ml-auto">Flight at {form.departureTime}</p>
              </div>
            )}
          </FormSection>
        )}

        {!isAccountService && form.tripType === 'oneway' && !showDepartureInfo && !form.departureTime && !form.departureFlight && (
          <button
            type="button"
            onClick={() => setShowDepartureInfo(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-gold transition-colors"
          >
            <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">+</span>
            Add departure flight info
          </button>
        )}

        {/* ── Notes ── */}
        <FormSection title="Notes" icon={<StickyNote size={14} />}>
          <textarea
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            rows={2}
            placeholder="Special requests, internal notes…"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/50 transition-all"
          />
        </FormSection>

        {/* ── Payment Method ── */}
        <FormSection title="Payment Method" icon={<CreditCard size={14} />}>
          <div className="grid sm:grid-cols-3 gap-3">
            {PAYMENT_OPTIONS.map(opt => {
              const active = paymentMethod === opt.id;
              const disabled = isAccountService && opt.id === 'stripe';
              return (
                <button key={opt.id} type="button" onClick={() => !disabled && setPaymentMethod(opt.id)}
                  disabled={disabled}
                  className={`flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                    active
                      ? 'border-gold bg-[hsl(var(--navy))] shadow-md'
                      : 'border-border bg-background hover:border-gold/30 hover:bg-muted/40'
                  } ${disabled ? 'cursor-not-allowed opacity-45' : ''}`}
                >
                  <div className={`flex items-center gap-2 ${active ? 'text-gold' : 'text-muted-foreground'}`}>
                    <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${active ? 'border-gold bg-gold' : 'border-muted-foreground/40'}`}>
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-navy" />}
                    </span>
                    <span className={active ? 'text-gold' : 'text-muted-foreground'}>{opt.icon}</span>
                    <span className={`font-bold text-xs uppercase tracking-wide ${active ? 'text-gold' : 'text-foreground'}`}>{opt.title}</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${active ? 'text-white/60' : 'text-muted-foreground'}`}>{opt.desc}</p>
                  {opt.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-gold/20 text-gold' : opt.badgeColor}`}>{opt.badge}</span>
                  )}
                </button>
              );
            })}
          </div>

          {isAccountService && (
            <div className="mt-3 flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 text-slate-700 text-xs">
              <CreditCard size={13} className="mt-0.5 shrink-0" />
              <span>Account services should remain on the client ledger. Use Save Only or Paid in Cash, then settle from Cuentas Abiertas.</span>
            </div>
          )}
          {!isAccountService && paymentMethod === 'stripe' && (
            <div className="mt-3 flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/80 border border-indigo-200/70 text-indigo-700 text-xs">
              <CreditCard size={13} className="mt-0.5 shrink-0" />
              <span>Client receives a Stripe payment link by email. Booking confirmed automatically when payment is completed.</span>
            </div>
          )}
          {!isAccountService && paymentMethod === 'stripe' && (!form.priceUsd || parseFloat(form.priceUsd) <= 0) && (
            <div className="mt-2 flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 text-amber-700 text-xs">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              <span>A price greater than $0 is required to generate a Stripe payment link.</span>
            </div>
          )}
          {paymentMethod === 'cash' && (
            <div className="mt-3 flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/70 text-emerald-700 text-xs">
              <Banknote size={13} className="mt-0.5 shrink-0" />
              <span>Booking marked as Confirmed. Client receives confirmation email + PDF voucher immediately.</span>
            </div>
          )}
        </FormSection>

        {/* Submit */}
        <button
          type="submit"
          disabled={
            submitting ||
            !form.customerName?.trim() ||
            !form.customerEmail?.trim() ||
            !form.customerPhone?.trim() ||
            (!isAccountService && (!form.hotelName?.trim() || !form.arrivalDate)) ||
            (isAccountService && (!form.serviceDescription?.trim() || !form.accountId))
          }
          className="w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 hover:shadow-[0_6px_24px_rgba(212,175,55,0.35)]"
          style={{ background: 'linear-gradient(135deg, #c9a227, #f0c040, #c9a227)', color: '#0A1628' }}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
              Creating booking…
            </span>
          ) : submitLabel}
        </button>
      </form>
    </div>
  );
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

function FormSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/70 overflow-hidden shadow-sm">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-[hsl(var(--navy))/4] border-b border-border/60"
        style={{ background: 'linear-gradient(to right, hsl(210 60% 8% / 0.05), transparent)' }}>
        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-gold/10 text-gold">
          {icon}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground/70">{title}</span>
      </div>
      <div className="p-4 bg-card">{children}</div>
    </div>
  );
}

function QuickBookingStatCard({ title, value, detail }: { title: string; value: string | number; detail: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-white/90 px-4 py-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold mb-1">{title}</p>
      <p className="text-lg font-display font-bold text-foreground leading-none">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{detail}</p>
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
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">{label}</p>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/50 transition-all placeholder:text-muted-foreground/50"
      />
    </div>
  );
}

// ─── Admin Shell ──────────────────────────────────────────────────────────────

const Admin = () => {
  const { email, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [mobileMenu, setMobileMenu] = useState(false);

  const sidebarItems: Array<{ id: Tab; label: string; icon: React.ReactNode; mobileLabel?: string; group?: string }> = [
    { id: 'dashboard',   label: 'Dashboard',         icon: <LayoutDashboard size={17} />, mobileLabel: 'Home',    group: 'OPERACIONES' },
    { id: 'bookings',    label: 'Reservaciones',      icon: <CalendarCheck size={17} />,   mobileLabel: 'Res.',    group: 'OPERACIONES' },
    { id: 'new-booking', label: 'Nueva Reserva',      icon: <PlusCircle size={17} />,      mobileLabel: 'Nueva',   group: 'OPERACIONES' },
    { id: 'tareas',      label: 'Tareas',             icon: <CheckCircle2 size={17} />,    mobileLabel: 'Tareas',  group: 'OPERACIONES' },
    { id: 'finanzas',    label: 'Finanzas',           icon: <BarChart2 size={17} />,       mobileLabel: 'Fin.',    group: 'ANALYTICS' },
    { id: 'marketing',   label: 'Marketing',          icon: <Megaphone size={17} />,       mobileLabel: 'Mkt.',    group: 'ANALYTICS' },
    { id: 'rrhh',        label: 'Recursos Humanos',   icon: <Users size={17} />,           mobileLabel: 'RRHH',    group: 'EQUIPO' },
    { id: 'pricing',     label: 'Configuración',      icon: <Settings size={17} />,        mobileLabel: 'Config',  group: 'EQUIPO' },
  ];

  const activeLabel = sidebarItems.find(s => s.id === activeTab)?.label || 'Admin';

  // User initials for avatar
  const initials = email
    ? email.split('@')[0].slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row" style={{ background: 'hsl(40 20% 96%)' }}>

      {/* ═══ Mobile: Top header ═══ */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-border/40 bg-white/95 backdrop-blur-xl"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0.75rem)' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold to-amber-400 flex items-center justify-center">
            <span className="text-[9px] font-black text-navy">{initials}</span>
          </div>
          <h2 className="text-sm font-bold text-foreground">{activeLabel}</h2>
        </div>
        <button onClick={() => setMobileMenu(true)}
          className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* ═══ Mobile: Bottom navigation ═══ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-white/95 backdrop-blur-xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-around h-[58px]">
          {(['dashboard', 'bookings', 'new-booking', 'tareas', 'finanzas'] as Tab[]).map(tabId => {
            const item = sidebarItems.find(s => s.id === tabId)!;
            return (
              <button key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all ${
                  activeTab === item.id ? 'text-gold' : 'text-muted-foreground'
                }`}
              >
                <span className={`p-1 rounded-lg transition-all ${activeTab === item.id ? 'bg-gold/10' : ''}`}>
                  {item.icon}
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-wide ${activeTab === item.id ? 'text-gold' : 'text-muted-foreground/70'}`}>
                  {item.mobileLabel || item.label}
                </span>
              </button>
            );
          })}
          <button onClick={() => setMobileMenu(true)}
            className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl text-muted-foreground">
            <span className={`p-1 rounded-lg transition-all ${(['marketing', 'pricing', 'rrhh'].includes(activeTab)) ? 'bg-gold/10' : ''}`}>
              <MoreHorizontal size={17} className={['marketing', 'pricing', 'rrhh'].includes(activeTab) ? 'text-gold' : ''} />
            </span>
            <span className={`text-[9px] font-bold uppercase tracking-wide ${['marketing', 'pricing', 'rrhh'].includes(activeTab) ? 'text-gold' : 'text-muted-foreground/70'}`}>
              {['marketing', 'pricing', 'rrhh'].includes(activeTab) ? sidebarItems.find(s => s.id === activeTab)?.mobileLabel : 'Mas'}
            </span>
          </button>
        </div>
      </nav>

      {/* ═══ Mobile: "More" slide-up sheet ═══ */}
      <AnimatePresence>
        {mobileMenu && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenu(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 rounded-t-3xl overflow-hidden"
              style={{ background: 'hsl(var(--navy))', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold to-amber-400 flex items-center justify-center shadow-lg">
                  <span className="text-sm font-black text-navy">{initials}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{email || 'Admin'}</p>
                  <p className="text-xs text-white/40">Administrator</p>
                </div>
              </div>
              <div className="p-3 space-y-1">
                {sidebarItems.map(item => (
                  <button key={item.id}
                    onClick={() => { setActiveTab(item.id); setMobileMenu(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all ${
                      activeTab === item.id
                        ? 'bg-gold/15 text-gold'
                        : 'text-white/70 hover:text-white hover:bg-white/8'
                    }`}
                  >
                    <span className={activeTab === item.id ? 'text-gold' : 'text-white/40'}>{item.icon}</span>
                    {item.label}
                    {activeTab === item.id && <ChevronRight size={14} className="ml-auto text-gold/60" />}
                  </button>
                ))}
              </div>
              <div className="p-3 pt-0">
                <button onClick={() => { logout(); setMobileMenu(false); }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 font-bold text-sm hover:bg-red-500/20 transition-all">
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ Desktop: Sidebar ═══ */}
      <aside className="w-64 hidden md:flex md:flex-col flex-shrink-0 border-r border-white/5"
        style={{ background: 'linear-gradient(180deg, #080f1e 0%, #0d1f3c 60%, #080f1e 100%)' }}>

        {/* Branding */}
        <div className="px-5 pt-6 pb-5 border-b border-white/8">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg shadow-gold/20 overflow-hidden">
              <img
                src="https://res.cloudinary.com/dt9iyiorn/image/upload/e_trim:60/w_180,h_180,c_pad,b_rgb:071A2B/v1774175173/classvip/apple-touch-icon.png"
                alt="Class VIP App Icon"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <p className="text-[13px] font-bold text-white leading-none">Class VIP</p>
              <p className="text-[10px] text-white/35 mt-0.5 leading-none">Transfers Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto">
          {(['OPERACIONES', 'ANALYTICS', 'EQUIPO'] as const).map((group) => {
            const groupItems = sidebarItems.filter(i => i.group === group);
            return (
              <div key={group} className="mb-3">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25 px-3 pt-3 pb-2">{group}</p>
                <div className="space-y-0.5">
                  {groupItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                        activeTab === item.id
                          ? 'text-gold'
                          : 'text-white/50 hover:text-white hover:bg-white/6'
                      }`}
                      style={activeTab === item.id ? {
                        background: 'linear-gradient(to right, rgba(212,175,55,0.12), rgba(212,175,55,0.04))',
                        borderLeft: '2px solid hsl(42 78% 50%)',
                        paddingLeft: '10px',
                      } : undefined}
                    >
                      <span className={`transition-colors ${activeTab === item.id ? 'text-gold' : 'text-white/30 group-hover:text-white/60'}`}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                      {activeTab === item.id && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User section */}
        {email && (
          <div className="p-3 border-t border-white/8">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-all group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center shadow flex-shrink-0">
                <span className="text-[10px] font-black text-navy">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-white truncate">{email}</p>
                <p className="text-[9px] text-white/30 uppercase tracking-wide">Administrator</p>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="text-white/25 hover:text-red-400 transition-colors ml-auto flex-shrink-0"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ═══ Main content ═══ */}
      <div className="flex-1 overflow-auto pb-20 md:pb-0">
        {/* Desktop content header bar */}
        <div className="hidden md:block sticky top-0 z-20 px-8 pt-3 pb-3">
          <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-white/85 backdrop-blur-md px-5 py-3.5 shadow-[0_6px_18px_rgba(8,15,30,0.06)]">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-muted-foreground/55 font-medium">Admin</span>
            <ChevronRight size={13} className="text-muted-foreground/30" />
              <span className="font-semibold text-foreground">{activeLabel}</span>
            </div>
            <span className="text-xs font-semibold tracking-wide text-muted-foreground/70 bg-muted/60 px-3 py-1 rounded-full">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="p-5 md:p-8"
        >
          {activeTab === 'dashboard' && <DashboardTab />}

          {activeTab === 'bookings' && (
            <div>
              <div className="mb-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold mb-1">Management</p>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Bookings</h1>
                <p className="text-sm text-muted-foreground mt-1">View, search and manage all reservations</p>
              </div>
              <AdminBookings />
            </div>
          )}

          {activeTab === 'new-booking' && <QuickBookingTab />}

          {activeTab === 'pricing' && (
            <div>
              <div className="mb-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold mb-1">Configuration</p>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Pricing</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage transfer rates and service pricing</p>
              </div>
              <PricingManager />
            </div>
          )}

          {activeTab === 'finanzas' && <FinanzasTab />}

          {activeTab === 'tareas' && <TareasTab />}

          {activeTab === 'marketing' && <MarketingTab />}

          {activeTab === 'rrhh' && <RRHHTab />}
        </motion.div>
      </div>
    </div>
  );
};

export default Admin;


