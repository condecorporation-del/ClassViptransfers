import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Car, Repeat, MapPin, Calendar, Navigation, Sparkles, Star, ClipboardList } from 'lucide-react';

const steps = ['service', 'trip', 'route', 'date', 'locations', 'extras', 'upsell', 'review'] as const;
type Step = typeof steps[number];

const Book = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [data, setData] = useState({
    serviceType: '',
    tripType: '',
    route: '',
    date: '',
    passengers: '2',
    pickup: '',
    dropoff: '',
    extras: [] as string[],
    activities: [] as string[],
  });

  const stepIcons = [Car, Repeat, MapPin, Calendar, Navigation, Sparkles, Star, ClipboardList];
  const stepLabels = [
    t('Service', 'Servicio'), t('Trip', 'Viaje'), t('Route', 'Ruta'), t('Date', 'Fecha'),
    t('Locations', 'Ubicaciones'), t('Extras', 'Extras'), t('Activities', 'Actividades'), t('Review', 'Resumen'),
  ];

  const next = () => setCurrent(c => Math.min(c + 1, steps.length - 1));
  const prev = () => setCurrent(c => Math.max(c - 1, 0));

  const toggleExtra = (val: string) => {
    setData(d => ({ ...d, extras: d.extras.includes(val) ? d.extras.filter(v => v !== val) : [...d.extras, val] }));
  };
  const toggleActivity = (val: string) => {
    setData(d => ({ ...d, activities: d.activities.includes(val) ? d.activities.filter(v => v !== val) : [...d.activities, val] }));
  };

  const renderStep = () => {
    switch (steps[current]) {
      case 'service':
        return (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold">{t('Select Service Type', 'Selecciona Tipo de Servicio')}</h2>
            {['Private SUV', 'Sprinter Van', 'Shared Shuttle'].map(s => (
              <button key={s} onClick={() => { setData({ ...data, serviceType: s }); next(); }}
                className={`w-full glass-card rounded-xl p-5 text-left hover:border-secondary/40 transition-all ${data.serviceType === s ? 'border-secondary' : ''}`}>
                <p className="font-semibold">{s}</p>
              </button>
            ))}
          </div>
        );
      case 'trip':
        return (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold">{t('Trip Type', 'Tipo de Viaje')}</h2>
            {[t('One Way', 'Solo Ida'), t('Round Trip', 'Ida y Vuelta')].map(s => (
              <button key={s} onClick={() => { setData({ ...data, tripType: s }); next(); }}
                className={`w-full glass-card rounded-xl p-5 text-left hover:border-secondary/40 transition-all ${data.tripType === s ? 'border-secondary' : ''}`}>
                <p className="font-semibold">{s}</p>
              </button>
            ))}
          </div>
        );
      case 'route':
        return (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold">{t('Select Route', 'Selecciona Ruta')}</h2>
            {['Airport → Hotel', 'Hotel → Airport', 'Hotel → Hotel'].map(s => (
              <button key={s} onClick={() => { setData({ ...data, route: s }); next(); }}
                className={`w-full glass-card rounded-xl p-5 text-left hover:border-secondary/40 transition-all ${data.route === s ? 'border-secondary' : ''}`}>
                <p className="font-semibold">{s}</p>
              </button>
            ))}
          </div>
        );
      case 'date':
        return (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold">{t('Date & Passengers', 'Fecha y Pasajeros')}</h2>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('Date', 'Fecha')}</label>
              <input type="date" value={data.date} onChange={e => setData({ ...data, date: e.target.value })}
                className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('Passengers', 'Pasajeros')}</label>
              <select value={data.passengers} onChange={e => setData({ ...data, passengers: e.target.value })}
                className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50">
                {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        );
      case 'locations':
        return (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold">{t('Pickup & Dropoff', 'Recogida y Destino')}</h2>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('Pickup Location', 'Lugar de Recogida')}</label>
              <input type="text" placeholder={t('Hotel name or address', 'Nombre del hotel o dirección')} value={data.pickup}
                onChange={e => setData({ ...data, pickup: e.target.value })}
                className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('Dropoff Location', 'Lugar de Destino')}</label>
              <input type="text" placeholder={t('Hotel name or address', 'Nombre del hotel o dirección')} value={data.dropoff}
                onChange={e => setData({ ...data, dropoff: e.target.value })}
                className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50" />
            </div>
          </div>
        );
      case 'extras':
        return (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold">{t('Extras', 'Extras')}</h2>
            <p className="text-muted-foreground text-sm">{t('Optional add-ons', 'Complementos opcionales')}</p>
            {[t('Child Seat', 'Silla para niño'), t('Extra Luggage', 'Equipaje Extra'), t('VIP Welcome Kit', 'Kit de Bienvenida VIP'), t('Flowers & Champagne', 'Flores y Champagne')].map(e => (
              <button key={e} onClick={() => toggleExtra(e)}
                className={`w-full glass-card rounded-xl p-4 text-left hover:border-secondary/40 transition-all flex items-center justify-between ${data.extras.includes(e) ? 'border-secondary' : ''}`}>
                <span className="font-medium text-sm">{e}</span>
                {data.extras.includes(e) && <Check size={16} className="text-secondary" />}
              </button>
            ))}
          </div>
        );
      case 'upsell':
        return (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold">{t('Add Activities?', '¿Agregar Actividades?')}</h2>
            <p className="text-muted-foreground text-sm">{t('Enhance your trip with local experiences', 'Mejora tu viaje con experiencias locales')}</p>
            {[t('Camel Ride', 'Paseo en Camello'), t('ATV Adventure', 'Aventura ATV'), t('Sunset Cruise', 'Crucero al Atardecer')].map(a => (
              <button key={a} onClick={() => toggleActivity(a)}
                className={`w-full glass-card rounded-xl p-4 text-left hover:border-secondary/40 transition-all flex items-center justify-between ${data.activities.includes(a) ? 'border-secondary' : ''}`}>
                <span className="font-medium text-sm">{a}</span>
                {data.activities.includes(a) && <Check size={16} className="text-secondary" />}
              </button>
            ))}
          </div>
        );
      case 'review':
        return (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold">{t('Review & Confirm', 'Revisar y Confirmar')}</h2>
            <div className="glass-card rounded-xl p-6 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t('Service', 'Servicio')}</span><span className="font-medium">{data.serviceType || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('Trip', 'Viaje')}</span><span className="font-medium">{data.tripType || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('Route', 'Ruta')}</span><span className="font-medium">{data.route || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('Date', 'Fecha')}</span><span className="font-medium">{data.date || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('Passengers', 'Pasajeros')}</span><span className="font-medium">{data.passengers}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('Pickup', 'Recogida')}</span><span className="font-medium">{data.pickup || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('Dropoff', 'Destino')}</span><span className="font-medium">{data.dropoff || '—'}</span></div>
              {data.extras.length > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{t('Extras', 'Extras')}</span><span className="font-medium">{data.extras.join(', ')}</span></div>}
              {data.activities.length > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{t('Activities', 'Actividades')}</span><span className="font-medium">{data.activities.join(', ')}</span></div>}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Wizard */}
          <div className="lg:col-span-3">
            {/* Progress */}
            <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
              {steps.map((_, i) => {
                const Icon = stepIcons[i];
                return (
                  <button key={i} onClick={() => setCurrent(i)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      i === current ? 'bg-secondary text-secondary-foreground' :
                      i < current ? 'text-secondary' : 'text-muted-foreground'
                    }`}>
                    <Icon size={12} /> {stepLabels[i]}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Nav buttons */}
            <div className="flex justify-between mt-8">
              <button onClick={prev} disabled={current === 0}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                <ArrowLeft size={16} /> {t('Back', 'Atrás')}
              </button>
              {current === steps.length - 1 ? (
                <button onClick={() => navigate('/confirmation')}
                  className="bg-secondary text-secondary-foreground px-6 py-2.5 rounded-full text-sm font-semibold hover:brightness-110 transition-all flex items-center gap-2">
                  {t('Confirm Booking', 'Confirmar Reservación')} <Check size={16} />
                </button>
              ) : (
                <button onClick={next}
                  className="flex items-center gap-2 text-sm text-secondary font-semibold hover:gap-3 transition-all">
                  {t('Next', 'Siguiente')} <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Sticky Summary (desktop) */}
          <div className="lg:col-span-2 hidden lg:block">
            <div className="sticky top-24 glass-card rounded-2xl p-6 space-y-4">
              <h3 className="font-display text-lg font-bold text-secondary">{t('Booking Summary', 'Resumen')}</h3>
              <div className="space-y-2 text-sm">
                {data.serviceType && <div className="flex justify-between"><span className="text-muted-foreground">{t('Service', 'Servicio')}</span><span>{data.serviceType}</span></div>}
                {data.tripType && <div className="flex justify-between"><span className="text-muted-foreground">{t('Trip', 'Viaje')}</span><span>{data.tripType}</span></div>}
                {data.route && <div className="flex justify-between"><span className="text-muted-foreground">{t('Route', 'Ruta')}</span><span>{data.route}</span></div>}
                {data.date && <div className="flex justify-between"><span className="text-muted-foreground">{t('Date', 'Fecha')}</span><span>{data.date}</span></div>}
                {data.pickup && <div className="flex justify-between"><span className="text-muted-foreground">{t('Pickup', 'Recogida')}</span><span className="truncate ml-2">{data.pickup}</span></div>}
                {data.extras.length > 0 && <div><span className="text-muted-foreground block mb-1">{t('Extras', 'Extras')}</span>{data.extras.map(e => <span key={e} className="inline-block bg-secondary/10 text-secondary text-xs px-2 py-0.5 rounded-full mr-1 mb-1">{e}</span>)}</div>}
                {!data.serviceType && <p className="text-muted-foreground text-xs italic">{t('Select a service to begin', 'Selecciona un servicio para comenzar')}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Book;
