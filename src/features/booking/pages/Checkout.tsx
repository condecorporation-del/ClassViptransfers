import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CreditCard, CheckCircle, Shield, Lock, MapPin, Calendar, Users } from 'lucide-react';
import { useLanguage } from '@/shared/providers/LanguageContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getApiBaseUrl } from '@/shared/lib/api';
import { getErrorMessage } from '@/shared/lib/errors';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

interface Booking {
  id: string;
  type: string;
  totalAmount: number;
  currency: string;
  confirmationCode?: string;
  bookingDate?: string;
  passengers?: number;
  pickupLocation?: string;
  dropoffLocation?: string;
  customer: { name: string; email: string };
  items: Array<{ name: string; quantity: number; totalPrice: number }>;
}

// ─── Stripe Logo Strip ────────────────────────────────────────────────────────
function StripeBadgeStrip({ lang }: { lang: string }) {
  return (
    <div
      className="py-2 flex items-center justify-center gap-2"
      style={{ background: '#071524', borderTop: '1px solid rgba(212,175,55,0.18)' }}
    >
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
        <path d="M6 0a6 6 0 100 12A6 6 0 006 0zm.5 8.5h-1v-4h1v4zm0-5h-1V2.5h1V3.5z" fill="#635BFF" opacity="0.9" />
      </svg>
      <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(212,175,55,0.55)', letterSpacing: '0.03em' }}>
        {lang === 'es' ? 'Protegido por' : 'Secured by'}
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, fontStyle: 'italic', color: '#635BFF', letterSpacing: '-0.3px' }}>
        stripe
      </span>
    </div>
  );
}

// ─── Inner Stripe Form ──────────────────────────────────────────────────────
function StripePaymentForm({ bookingId, totalDollars, onSuccess }: {
  bookingId: string;
  totalDollars: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { lang } = useLanguage();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitErr } = await elements.submit();
    if (submitErr) {
      setError(submitErr.message || 'Validation error');
      setProcessing(false);
      return;
    }

    const { error: confirmErr, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (confirmErr) {
      setError(confirmErr.message || 'Payment failed');
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      try {
        await fetch(`${getApiBaseUrl()}/api/stripe/confirm-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId, paymentIntentId: paymentIntent.id }),
        });
      } catch {
        // Webhook will handle it if this fails
      }
      onSuccess();
    } else {
      setError('Payment was not completed. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement
        options={{
          layout: 'tabs',
          wallets: { applePay: 'auto', googlePay: 'auto' },
        }}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Premium pay button */}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full rounded-xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-shadow hover:shadow-[0_16px_48px_rgba(212,175,55,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        style={{ boxShadow: '0 8px 28px rgba(212,175,55,0.28)' }}
      >
        {/* Gold action area */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F5C842 60%, #D4AF37 100%)' }}
        >
          <div className="flex items-center gap-3">
            {processing
              ? <Loader2 size={20} className="animate-spin" style={{ color: '#0A1628' }} />
              : <Lock size={20} style={{ color: '#0A1628' }} />}
            <span className="font-bold text-lg tracking-wide" style={{ color: '#0A1628' }}>
              {processing
                ? (lang === 'es' ? 'Procesando...' : 'Processing...')
                : (lang === 'es' ? 'Pagar Ahora' : 'Pay Now')}
            </span>
          </div>
          <span className="font-display font-bold text-xl" style={{ color: '#0A1628' }}>
            ${totalDollars} USD
          </span>
        </div>
        <StripeBadgeStrip lang={lang} />
      </button>

      {/* Security row */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-1">
        <span className="flex items-center gap-1.5">
          <Shield size={11} className="text-gold/60" />
          256-bit SSL
        </span>
        <span className="text-gold/20">·</span>
        <span className="flex items-center gap-1.5">
          <CreditCard size={11} className="text-gold/60" />
          {lang === 'es' ? 'Datos cifrados' : 'Encrypted data'}
        </span>
        <span className="text-gold/20">·</span>
        <span className="flex items-center gap-1.5">
          <Lock size={11} className="text-gold/60" />
          PCI DSS
        </span>
      </div>
    </form>
  );
}

// ─── Success Screen ──────────────────────────────────────────────────────────
function SuccessScreen() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative inline-flex items-center justify-center mx-auto">
          <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle size={44} className="text-emerald-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-bold text-foreground">
            {lang === 'es' ? '¡Pago Exitoso!' : 'Payment Successful!'}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {lang === 'es'
              ? 'Tu reservación está confirmada. Recibirás un correo con todos los detalles en breve.'
              : 'Your booking is confirmed. You will receive a confirmation email with all details shortly.'}
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="w-full py-3.5 rounded-xl font-bold text-navy transition-shadow hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#0A1628' }}
        >
          {lang === 'es' ? 'Volver al Inicio' : 'Back to Home'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Checkout Page ───────────────────────────────────────────────────────
export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const bookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState<Booking | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  const getBookingToken = useCallback(() => {
    if (!bookingId) return '';
    const bt = sessionStorage.getItem(`bt_${bookingId}`) || searchParams.get('bt') || '';
    return bt ? `?token=${bt}` : '';
  }, [bookingId, searchParams]);

  const loadBookingAndIntent = useCallback(async () => {
    try {
      const bookingRes = await fetch(`${getApiBaseUrl()}/api/bookings/${bookingId}${getBookingToken()}`);
      if (!bookingRes.ok) throw new Error('Failed to load booking');
      const bookingData = await bookingRes.json();
      setBooking(bookingData.data);

      const intentRes = await fetch(`${getApiBaseUrl()}/api/stripe/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      if (!intentRes.ok) {
        const err = await intentRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to initialize payment');
      }
      const intentData = await intentRes.json();
      setClientSecret(intentData.data.clientSecret);
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to load checkout'));
    } finally {
      setLoading(false);
    }
  }, [bookingId, getBookingToken]);

  useEffect(() => {
    if (!bookingId) {
      setError('Booking ID not found');
      setLoading(false);
      return;
    }
    loadBookingAndIntent();
  }, [bookingId, loadBookingAndIntent]);

  if (paid) return <SuccessScreen />;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 size={36} className="animate-spin text-gold" />
        <p className="text-sm text-muted-foreground font-medium">
          {lang === 'es' ? 'Preparando pago seguro...' : 'Preparing secure checkout...'}
        </p>
      </div>
    );
  }

  if (error || !booking || !clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error || 'Booking not found'}</p>
          <button onClick={() => navigate('/')}
            className="bg-gold text-navy px-6 py-2.5 rounded-xl font-semibold text-sm">
            {lang === 'es' ? 'Volver al inicio' : 'Back to Home'}
          </button>
        </div>
      </div>
    );
  }

  const totalDollars = (booking.totalAmount / 100).toFixed(2);

  const stripeAppearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#D4AF37',
      colorBackground: '#ffffff',
      colorText: '#1e293b',
      colorDanger: '#ef4444',
      fontFamily: 'system-ui, sans-serif',
      borderRadius: '10px',
      spacingUnit: '4px',
    },
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-lg mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="text-center space-y-1 pb-2">
          <h1 className="font-display font-bold text-2xl text-foreground">
            {lang === 'es' ? 'Finalizar Reserva' : 'Complete Your Booking'}
          </h1>
          {booking.confirmationCode && (
            <p className="text-xs text-muted-foreground font-mono tracking-widest uppercase">
              #{booking.confirmationCode}
            </p>
          )}
        </div>

        {/* ── Booking Summary Card ── */}
        <div className="bg-card rounded-2xl border border-gold/20 overflow-hidden">
          {/* Card header */}
          <div className="px-5 py-3 flex items-center gap-2 border-b border-gold/15"
            style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.06), rgba(212,175,55,0.02))' }}>
            <CreditCard size={15} className="text-gold" />
            <span className="text-xs font-bold uppercase tracking-widest text-gold/80">
              {lang === 'es' ? 'Resumen de Reserva' : 'Booking Summary'}
            </span>
          </div>

          {/* Meta row */}
          <div className="px-5 py-4 grid grid-cols-3 gap-3 text-xs border-b border-border/50">
            {booking.bookingDate && (
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar size={10} /> {lang === 'es' ? 'Fecha' : 'Date'}
                </span>
                <span className="font-semibold text-foreground">
                  {new Date(booking.bookingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}
            {booking.passengers && (
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Users size={10} /> {lang === 'es' ? 'Pasajeros' : 'Passengers'}
                </span>
                <span className="font-semibold text-foreground">{booking.passengers}</span>
              </div>
            )}
            {booking.pickupLocation && (
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <MapPin size={10} /> Pickup
                </span>
                <span className="font-semibold text-foreground truncate">{booking.pickupLocation}</span>
              </div>
            )}
          </div>

          {/* Items list */}
          <div className="px-5 py-4 space-y-2.5">
            {booking.items.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{item.name} × {item.quantity}</span>
                <span className="font-semibold text-foreground">
                  ${((item.totalPrice ?? 0) / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="px-5 py-4 flex justify-between items-center border-t border-gold/20"
            style={{ background: 'rgba(212,175,55,0.04)' }}>
            <span className="font-bold text-sm text-foreground">
              {lang === 'es' ? 'Total a Pagar' : 'Total Due Now'}
            </span>
            <span className="font-display font-bold text-2xl text-gold">${totalDollars} USD</span>
          </div>
        </div>

        {/* ── Payment Form Card ── */}
        <div className="bg-card rounded-2xl border border-gold/20 overflow-hidden">
          {/* Card header */}
          <div className="px-5 py-3 flex items-center gap-2 border-b border-gold/15"
            style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.06), rgba(212,175,55,0.02))' }}>
            <Lock size={15} className="text-gold" />
            <span className="text-xs font-bold uppercase tracking-widest text-gold/80">
              {lang === 'es' ? 'Información de Pago' : 'Payment Information'}
            </span>
          </div>

          <div className="p-5">
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance: stripeAppearance, locale: lang === 'es' ? 'es' : 'en' }}
            >
              <StripePaymentForm
                bookingId={bookingId!}
                totalDollars={totalDollars}
                onSuccess={() => setPaid(true)}
              />
            </Elements>
          </div>
        </div>

        {/* ── Customer info ── */}
        <div className="text-center text-xs text-muted-foreground pb-4">
          {lang === 'es' ? 'Confirmación enviada a' : 'Confirmation sent to'}{' '}
          <span className="font-semibold text-foreground">{booking.customer.email}</span>
        </div>

      </div>
    </div>
  );
}
