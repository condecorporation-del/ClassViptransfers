import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CheckoutCancel() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  
  const bookingId = searchParams.get('bookingId');

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-muted rounded-xl shadow-lg p-8 space-y-6 text-center">
        <XCircle size={64} className="text-muted-foreground mx-auto" />
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {lang === 'es' ? 'Pago Cancelado' : 'Payment Cancelled'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {lang === 'es'
              ? 'Has cancelado el pago. Tu reserva está guardada y puedes completar el pago más tarde.'
              : 'You cancelled the payment. Your booking is saved and you can complete the payment later.'}
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          {bookingId && (
            <button
              onClick={() => navigate(`/checkout?bookingId=${bookingId}`)}
              className="bg-gold text-navy px-6 py-2 rounded-lg font-semibold hover:brightness-110 transition-all flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              {lang === 'es' ? 'Volver al Checkout' : 'Back to Checkout'}
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="bg-muted text-foreground px-6 py-2 rounded-lg font-semibold hover:bg-muted/80 transition-all"
          >
            {lang === 'es' ? 'Volver al Inicio' : 'Back to Home'}
          </button>
        </div>
      </div>
    </div>
  );
}

