import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CreditCard, CheckCircle, Mail, User, Phone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface Booking {
  id: string;
  type: string;
  totalAmount: number;
  currency: string;
  customer: {
    name: string;
    email: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    totalPrice: number;
  }>;
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const bookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paypalUrl, setPaypalUrl] = useState<string | null>(null);
  
  // Customer info form
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setError(lang === 'es' ? 'ID de reserva no encontrado' : 'Booking ID not found');
      setLoading(false);
      return;
    }

    fetchBooking();
  }, [bookingId, lang]);

  const fetchBooking = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch booking');
      }
      const data = await response.json();
      setBooking(data.data);
      
      // Pre-fill customer form if email is guest@example.com
      if (data.data?.customer) {
        const customer = data.data.customer;
        if (customer.email === 'guest@example.com' || !customer.email) {
          setShowCustomerForm(true);
        } else {
          setCustomerInfo({
            name: customer.name || '',
            email: customer.email || '',
            phone: customer.phone || '',
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  const updateCustomerInfo = async () => {
    if (!bookingId) return;

    // Validate required fields
    if (!customerInfo.email || !customerInfo.name || !customerInfo.phone) {
      setError(lang === 'es' 
        ? 'Por favor completa todos los campos requeridos' 
        : 'Please complete all required fields');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/customer`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerInfo),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update customer info' }));
        throw new Error(errorData.error || 'Failed to update customer info');
      }

      const data = await response.json();
      setBooking(data.data);
      setShowCustomerForm(false);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update customer information');
    }
  };

  const handlePayPalCheckout = async () => {
    if (!bookingId) return;

    // If customer form is shown and not filled, show error
    if (showCustomerForm && (!customerInfo.email || !customerInfo.name || !customerInfo.phone)) {
      setError(lang === 'es' 
        ? 'Por favor completa tu información de contacto antes de pagar' 
        : 'Please complete your contact information before paying');
      return;
    }

    // If customer info needs to be updated, update it first
    if (showCustomerForm) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/customer`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(customerInfo),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to update customer info' }));
          throw new Error(errorData.error || 'Failed to update customer info');
        }

        const data = await response.json();
        setBooking(data.data);
        setShowCustomerForm(false);
      } catch (err: any) {
        setError(err.message || 'Failed to update customer information');
        return;
      }
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/paypal/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: await response.text() || 'Unknown error' };
        }
        const errorMsg = errorData.error || errorData.message || `HTTP ${response.status}: Failed to create PayPal order`;
        console.error('[Checkout] PayPal create-order error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorData,
        });
        throw new Error(errorMsg);
      }

      const data = await response.json();
      if (data.success && data.data.approvalUrl) {
        // Redirect to PayPal
        window.location.href = data.data.approvalUrl;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-gold" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || 'Booking not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gold text-navy px-6 py-2 rounded-lg font-semibold hover:bg-gold-dark transition-colors"
          >
            {lang === 'es' ? 'Volver al inicio' : 'Back to Home'}
          </button>
        </div>
      </div>
    );
  }

  const totalDollars = (booking.totalAmount / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border border-gold/20 rounded-xl shadow-lg p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-display text-foreground mb-2">
              {lang === 'es' ? 'Completar Pago' : 'Complete Payment'}
            </h1>
            <p className="text-muted-foreground">
              {lang === 'es'
                ? 'Revisa los detalles y procede con el pago'
                : 'Review details and proceed with payment'}
            </p>
          </div>

          {/* Customer Information Form */}
          {showCustomerForm && (
            <div className="border border-gold/20 rounded-lg p-6 space-y-4 bg-muted/30">
              <h2 className="font-semibold text-lg text-gold flex items-center gap-2">
                <User size={20} />
                {lang === 'es' ? 'Información de Contacto' : 'Contact Information'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {lang === 'es' 
                  ? 'Por favor ingresa tu información para recibir la confirmación por email'
                  : 'Please enter your information to receive email confirmation'}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {lang === 'es' ? 'Nombre completo' : 'Full Name'} *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gold/20 rounded-lg bg-background"
                    placeholder={lang === 'es' ? 'Tu nombre' : 'Your name'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    <Mail size={14} />
                    {lang === 'es' ? 'Email' : 'Email'} *
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gold/20 rounded-lg bg-background"
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    <Phone size={14} />
                    {lang === 'es' ? 'Teléfono' : 'Phone'} *
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gold/20 rounded-lg bg-background"
                    placeholder="+1234567890"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Booking Summary */}
          <div className="border border-gold/20 rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-lg text-gold">
              {lang === 'es' ? 'Resumen de Reserva' : 'Booking Summary'}
            </h2>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {lang === 'es' ? 'ID de Reserva:' : 'Booking ID:'}
                </span>
                <span className="font-mono text-sm">{booking.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {lang === 'es' ? 'Cliente:' : 'Customer:'}
                </span>
                <span>{booking.customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {lang === 'es' ? 'Tipo:' : 'Type:'}
                </span>
                <span>{booking.type}</span>
              </div>
            </div>

            <div className="border-t border-gold/20 pt-4">
              <h3 className="font-semibold mb-2">
                {lang === 'es' ? 'Items:' : 'Items:'}
              </h3>
              <ul className="space-y-1">
                {booking.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between text-sm">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>${((item.totalPrice / 100) * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-gold/20 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">
                  {lang === 'es' ? 'Total:' : 'Total:'}
                </span>
                <span className="text-2xl font-bold text-gold">
                  ${totalDollars} {booking.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="border border-gold/20 rounded-lg p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-gold" />
              {lang === 'es' ? 'Método de Pago' : 'Payment Method'}
            </h3>

            <button
              onClick={handlePayPalCheckout}
              disabled={processing}
              className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white px-6 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {lang === 'es' ? 'Procesando...' : 'Processing...'}
                </>
              ) : (
                <>
                  <CreditCard size={20} />
                  {lang === 'es' ? 'Pagar con PayPal' : 'Pay with PayPal'}
                </>
              )}
            </button>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              {lang === 'es'
                ? 'Serás redirigido a PayPal para completar el pago de forma segura'
                : 'You will be redirected to PayPal to complete your secure payment'}
            </p>
          </div>

          {/* Important Note */}
          <div className="bg-muted/50 border border-gold/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">
                {lang === 'es' ? 'Nota importante:' : 'Important:'}
              </strong>{' '}
              {lang === 'es'
                ? 'Tu reserva será confirmada automáticamente una vez que el pago sea completado.'
                : 'Your booking will be automatically confirmed once payment is completed.'}
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

