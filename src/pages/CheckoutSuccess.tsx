import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

import { getApiBaseUrl } from '@/lib/api';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<any>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    // Extract token and bookingId from URL query params
    const urlToken = searchParams.get('token');
    const urlBookingId = searchParams.get('bookingId');
    
    if (!urlToken || !urlBookingId) {
      const missing = [];
      if (!urlToken) missing.push('token');
      if (!urlBookingId) missing.push('bookingId');
      setError(lang === 'es' 
        ? `Faltan parámetros de PayPal: ${missing.join(', ')}. Por favor, contacta soporte.` 
        : `Missing PayPal parameters: ${missing.join(', ')}. Please contact support.`);
      setStatus('error');
      return;
    }

    setBookingId(urlBookingId);
    // Use token as orderId (PayPal returns token=ORDER_ID in return URL)
    capturePayment(urlToken, urlBookingId);
  }, [searchParams, lang]);

  const capturePayment = async (orderIdToken: string, bookingIdParam: string) => {
    try {
      // Call capture-order endpoint
      // Use token from URL as orderId (PayPal returns token=ORDER_ID)
      const response = await fetch(`${getApiBaseUrl()}/api/paypal/capture-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: bookingIdParam,
          orderId: orderIdToken, // token from URL is the orderId
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: await response.text() || 'Unknown error' };
        }
        const errorMsg = errorData.error || errorData.message || `HTTP ${response.status}: Failed to capture payment`;
        console.error('[CheckoutSuccess] PayPal capture-order error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorData,
        });
        throw new Error(errorMsg);
      }

      const data = await response.json();
      
      if (data.success) {
        // Fetch updated booking to show confirmation
        const bt = sessionStorage.getItem(`bt_${bookingIdParam}`) || '';
        const bookingResponse = await fetch(`${getApiBaseUrl()}/api/bookings/${bookingIdParam}${bt ? `?token=${bt}` : ''}`);
        if (bookingResponse.ok) {
          const bookingData = await bookingResponse.json();
          setBooking(bookingData.data);
        }
        
        setStatus('success');
      } else {
        throw new Error(data.error || 'Payment capture failed');
      }
    } catch (err: any) {
      console.error('Capture payment error:', err);
      setError(err.message || 'Failed to capture payment');
      setStatus('error');
    }
  };

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 size={48} className="animate-spin text-gold mx-auto" />
          <p className="text-lg font-semibold">
            {lang === 'es' ? 'Procesando pago...' : 'Processing payment...'}
          </p>
          <p className="text-sm text-muted-foreground">
            {lang === 'es' 
              ? 'Por favor espera, esto puede tomar unos segundos.'
              : 'Please wait, this may take a few seconds.'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-destructive/20 rounded-xl shadow-lg p-8 space-y-6 text-center">
          <XCircle size={64} className="text-destructive mx-auto" />
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {lang === 'es' ? 'Error en el Pago' : 'Payment Error'}
            </h1>
            <p className="text-destructive mb-4">{error}</p>
            <p className="text-sm text-muted-foreground mb-6">
              {lang === 'es'
                ? 'Hubo un problema procesando tu pago. Por favor, intenta de nuevo o contacta soporte.'
                : 'There was a problem processing your payment. Please try again or contact support.'}
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            {bookingId && (
              <button
                onClick={() => navigate(`/checkout?bookingId=${bookingId}`)}
                className="bg-gold text-navy px-6 py-2 rounded-lg font-semibold hover:brightness-110 transition-all"
              >
                {lang === 'es' ? 'Intentar de Nuevo' : 'Try Again'}
              </button>
            )}
            <button
              onClick={() => navigate('/contact')}
              className="bg-muted text-foreground px-6 py-2 rounded-lg font-semibold hover:bg-muted/80 transition-all"
            >
              {lang === 'es' ? 'Contactar Soporte' : 'Contact Support'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-gold/20 rounded-xl shadow-lg p-8 space-y-6 text-center">
        <CheckCircle size={64} className="text-green-500 mx-auto" />
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {lang === 'es' ? '¡Pago Exitoso!' : 'Payment Successful!'}
          </h1>
          <p className="text-muted-foreground mb-4">
            {lang === 'es'
              ? 'Tu reserva ha sido confirmada. Recibirás un email de confirmación en breve.'
              : 'Your booking has been confirmed. You will receive a confirmation email shortly.'}
          </p>
          {booking && (
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {lang === 'es' ? 'ID de Reserva:' : 'Booking ID:'}
                </span>
                <span className="font-mono">{booking.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {lang === 'es' ? 'Estado:' : 'Status:'}
                </span>
                <span className="font-semibold text-gold">{booking.status}</span>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => navigate('/')}
          className="w-full gold-gradient text-secondary-foreground px-6 py-3 rounded-lg font-semibold hover:brightness-110 transition-all flex items-center justify-center gap-2"
        >
          {lang === 'es' ? 'Volver al Inicio' : 'Back to Home'}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

