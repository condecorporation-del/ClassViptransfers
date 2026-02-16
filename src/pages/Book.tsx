import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Car, Users, Minus, Plus, Plane, MessageCircle, CalendarDays, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const steps = ['service', 'trip', 'route', 'date', 'locations', 'extras', 'upsell', 'review'] as const;

const Book = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [data, setData] = useState({
    serviceType: '' as '' | 'private' | 'shuttle',
    tripType: '' as '' | 'oneway' | 'roundtrip',
    route: '' as '' | 'airport-hotel' | 'hotel-airport',
    arrivalDate: null as Date | null,
    departureDate: null as Date | null,
    flightNumber: '',
    arrivalTime: '',
    departureFlightNumber: '',
    departureTime: '',
    passengers: 1,
    pickup: '',
    dropoff: '',
    extras: [] as string[],
    activities: [] as string[],
  });

  const next = () => setCurrent(c => Math.min(c + 1, steps.length - 1));
  const prev = () => setCurrent(c => Math.max(c - 1, 0));

  const toggleExtra = (val: string) => {
    setData(d => ({ ...d, extras: d.extras.includes(val) ? d.extras.filter(v => v !== val) : [...d.extras, val] }));
  };
  const toggleActivity = (val: string) => {
    setData(d => {
      const has = d.activities.includes(val);
      if (has) return { ...d, activities: d.activities.filter(v => v !== val) };
      if (d.activities.length >= 3) return d;
      return { ...d, activities: [...d.activities, val] };
    });
  };

  // Pricing
  const transferPrice = useMemo(() => {
    let base = 0;
    if (data.serviceType === 'private') base = 85;
    else if (data.serviceType === 'shuttle') base = 25 * data.passengers;
    if (data.tripType === 'roundtrip') base *= 2;
    return base;
  }, [data.serviceType, data.tripType, data.passengers]);

  const activitiesDeposit = data.activities.length > 0 ? 125 * data.passengers : 0;
  const total = transferPrice + activitiesDeposit;

  const extrasOptions = [
    { id: 'baby', label: t('book.extras.babySeat') },
    { id: 'assist', label: t('book.extras.specialAssist') },
    { id: 'grocery', label: t('book.extras.groceryStop') },
    { id: 'oversize', label: t('book.extras.oversize') },
  ];

  const upsellActivities = [
    { id: 'camel', label: t('activity.camel') },
    { id: 'horseback', label: t('activity.horseback') },
    { id: 'atv', label: t('activity.atv') },
    { id: 'rzr', label: t('activity.rzr') },
    { id: 'skyBikes', label: t('activity.skyBikes') },
    { id: 'doubleMoto', label: t('activity.doubleMoto') },
    { id: 'camelKids', label: t('activity.camelKids') },
  ];

  const renderStep = () => {
    switch (steps[current]) {
      case 'service':
        return (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">{t('book.service.title')}</h2>
              <p className="text-muted-foreground text-sm md:text-base mt-2 leading-relaxed">{t('book.service.subtitle')}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <button onClick={() => { setData({ ...data, serviceType: 'private' }); }}
                className={`booking-card rounded-xl p-8 text-center ${data.serviceType === 'private' ? 'selected border-gold' : ''}`}>
                <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <Car size={26} className="text-gold" />
                </div>
                <p className="font-display font-bold text-lg text-foreground">{t('book.service.private')}</p>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{t('book.service.privateDesc')}</p>
              </button>
              <button onClick={() => { setData({ ...data, serviceType: 'shuttle' }); }}
                className={`booking-card rounded-xl p-8 text-center ${data.serviceType === 'shuttle' ? 'selected border-gold' : ''}`}>
                <div className="w-14 h-14 rounded-full bg-ocean/10 flex items-center justify-center mx-auto mb-4">
                  <Users size={26} className="text-ocean" />
                </div>
                <p className="font-display font-bold text-lg text-foreground">{t('book.service.shuttle')}</p>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{t('book.service.shuttleDesc')}</p>
              </button>
            </div>
          </div>
        );
      case 'trip':
        return (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">{t('book.trip.title')}</h2>
              <p className="text-muted-foreground text-sm md:text-base mt-2 leading-relaxed">{t('book.trip.subtitle')}</p>
            </div>
            {[
              { id: 'oneway' as const, label: t('book.trip.oneWay'), desc: t('book.trip.oneWayDesc') },
              { id: 'roundtrip' as const, label: t('book.trip.roundTrip'), desc: t('book.trip.roundTripDesc') },
            ].map(s => (
              <button key={s.id} onClick={() => { setData({ ...data, tripType: s.id }); }}
                className={`w-full booking-card rounded-xl p-5 md:p-6 text-left flex items-center justify-between ${data.tripType === s.id ? 'selected border-gold' : ''}`}>
                <div>
                  <p className="font-semibold text-base text-foreground">{s.label}</p>
                  <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{s.desc}</p>
                </div>
                {data.tripType === s.id && <div className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center flex-shrink-0 ml-3"><Check size={15} className="text-navy" /></div>}
              </button>
            ))}
          </div>
        );
      case 'route':
        return (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">{t('book.route.title')}</h2>
              <p className="text-muted-foreground text-sm md:text-base mt-2 leading-relaxed">{t('book.route.subtitle')}</p>
            </div>
            {[
              { id: 'airport-hotel' as const, label: t('book.route.airportToHotel') },
              { id: 'hotel-airport' as const, label: t('book.route.hotelToAirport') },
            ].map(s => (
              <button key={s.id} onClick={() => { setData({ ...data, route: s.id }); }}
                className={`w-full booking-card rounded-xl p-5 md:p-6 text-left flex items-center justify-between ${data.route === s.id ? 'selected border-gold' : ''}`}>
                <p className="font-semibold text-base text-foreground">{s.label}</p>
                {data.route === s.id && <div className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center flex-shrink-0 ml-3"><Check size={15} className="text-navy" /></div>}
              </button>
            ))}
          </div>
        );
      case 'date':
        return (
          <div className="space-y-6">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">{t('book.date.title')}</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {/* Arrival Date */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">{t('book.date.arrival')}</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn("input-luxury w-full flex items-center gap-3 text-left", !data.arrivalDate && "text-muted-foreground")}>
                      <CalendarDays size={18} className="text-gold flex-shrink-0" />
                      {data.arrivalDate ? format(data.arrivalDate, 'PPP') : 'Select date'}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={data.arrivalDate ?? undefined}
                      onSelect={(d) => d && setData({ ...data, arrivalDate: d })}
                      disabled={(d) => d < new Date()}
                      initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Flight Number */}
              <InputField label={t('book.date.flightNumber')} icon={<Plane size={18} className="text-gold" />}>
                <input type="text" placeholder="AA 1234" value={data.flightNumber} onChange={e => setData({ ...data, flightNumber: e.target.value })}
                  className="input-luxury pl-11" />
              </InputField>

              {/* Arrival Time */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">{t('book.date.arrivalTime')}</label>
                <div className="relative">
                  <Clock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold pointer-events-none z-10" />
                  <select value={data.arrivalTime} onChange={e => setData({ ...data, arrivalTime: e.target.value })}
                    className="input-luxury pl-11 w-full appearance-none cursor-pointer">
                    <option value="">Select time</option>
                    {Array.from({ length: 24 }, (_, h) => [0, 30].map(m => {
                      const val = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                      const label = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
                      return <option key={val} value={val}>{label}</option>;
                    })).flat()}
                  </select>
                </div>
              </div>
            </div>

            {data.tripType === 'roundtrip' && (
              <div className="grid sm:grid-cols-2 gap-5 pt-4 border-t border-border">
                {/* Departure Date */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">{t('book.date.departure')}</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={cn("input-luxury w-full flex items-center gap-3 text-left", !data.departureDate && "text-muted-foreground")}>
                        <CalendarDays size={18} className="text-gold flex-shrink-0" />
                        {data.departureDate ? format(data.departureDate, 'PPP') : 'Select date'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={data.departureDate ?? undefined}
                        onSelect={(d) => d && setData({ ...data, departureDate: d })}
                        disabled={(d) => d < (data.arrivalDate ?? new Date())}
                        initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Departure Time */}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">{t('book.date.departureTime')}</label>
                  <div className="relative">
                    <Clock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold pointer-events-none z-10" />
                    <select value={data.departureTime} onChange={e => setData({ ...data, departureTime: e.target.value })}
                      className="input-luxury pl-11 w-full appearance-none cursor-pointer">
                      <option value="">Select time</option>
                      {Array.from({ length: 24 }, (_, h) => [0, 30].map(m => {
                        const val = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                        const label = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
                        return <option key={val} value={val}>{label}</option>;
                      })).flat()}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {data.departureTime && data.tripType === 'roundtrip' && (
              <div className="flex items-center gap-3 text-sm text-gold bg-gold/5 border border-gold/20 rounded-xl px-4 py-3">
                <Plane size={16} className="flex-shrink-0" />
                <span className="leading-relaxed">{t('book.date.pickupNote')}</span>
              </div>
            )}

            {/* Passengers */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-3 block">{t('book.date.passengers')}</label>
              <div className="flex items-center gap-5">
                <button onClick={() => setData(d => ({ ...d, passengers: Math.max(1, d.passengers - 1) }))}
                  className="w-12 h-12 rounded-xl border-2 border-border flex items-center justify-center hover:border-gold/40 hover:bg-gold/5 transition-all active:scale-95">
                  <Minus size={18} />
                </button>
                <span className="text-3xl font-bold w-10 text-center text-foreground">{data.passengers}</span>
                <button onClick={() => setData(d => ({ ...d, passengers: Math.min(10, d.passengers + 1) }))}
                  className="w-12 h-12 rounded-xl border-2 border-border flex items-center justify-center hover:border-gold/40 hover:bg-gold/5 transition-all active:scale-95">
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>
        );
      case 'locations':
        return (
          <div className="space-y-5">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">{t('book.locations.title')}</h2>
            <InputField label={t('book.locations.pickup')} icon={<MapPin size={18} className="text-gold" />}>
              <div className="flex gap-3">
                <input type="text" placeholder={t('book.locations.placeholder')} value={data.pickup}
                  onChange={e => setData({ ...data, pickup: e.target.value })}
                  className="input-luxury pl-11 flex-1" />
                <button onClick={() => setData(d => ({ ...d, pickup: 'SJD International Airport' }))}
                  className="text-xs font-bold text-gold border-2 border-gold/30 rounded-xl px-4 hover:bg-gold/5 hover:border-gold/50 transition-all whitespace-nowrap">
                  {t('book.locations.quickFill')}
                </button>
              </div>
            </InputField>
            <InputField label={t('book.locations.dropoff')} icon={<MapPin size={18} className="text-ocean" />}>
              <input type="text" placeholder={t('book.locations.placeholder')} value={data.dropoff}
                onChange={e => setData({ ...data, dropoff: e.target.value })}
                className="input-luxury pl-11" />
            </InputField>
          </div>
        );
      case 'extras':
        return (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">{t('book.extras.title')}</h2>
              <p className="text-muted-foreground text-sm md:text-base mt-2 leading-relaxed">{t('book.extras.subtitle')}</p>
            </div>
            {extrasOptions.map(e => (
              <button key={e.id} onClick={() => toggleExtra(e.id)}
                className={`w-full booking-card rounded-xl p-5 text-left flex items-center justify-between ${data.extras.includes(e.id) ? 'selected border-gold' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm text-foreground">{e.label}</span>
                  <span className="text-xs text-gold font-bold bg-gold/10 px-2 py-0.5 rounded-full">{t('common.free')}</span>
                </div>
                {data.extras.includes(e.id) && <div className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center flex-shrink-0"><Check size={15} className="text-navy" /></div>}
              </button>
            ))}
          </div>
        );
      case 'upsell':
        return (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">{t('book.upsell.title')}</h2>
              <p className="text-muted-foreground text-sm md:text-base mt-2 leading-relaxed">{t('book.upsell.subtitle')}</p>
            </div>
            {upsellActivities.map(a => (
              <button key={a.id} onClick={() => toggleActivity(a.id)}
                className={`w-full booking-card rounded-xl p-5 text-left flex items-center justify-between ${data.activities.includes(a.id) ? 'selected border-gold' : ''}`}>
                <span className="font-medium text-sm text-foreground">{a.label}</span>
                {data.activities.includes(a.id) && <div className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center flex-shrink-0"><Check size={15} className="text-navy" /></div>}
              </button>
            ))}
          </div>
        );
      case 'review':
        return (
          <div className="space-y-6">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">{t('book.review.title')}</h2>
            <div className="booking-card rounded-2xl p-6 md:p-8 space-y-4 text-sm">
              <Row label={t('book.review.service')} value={data.serviceType || '—'} />
              <Row label={t('book.review.trip')} value={data.tripType || '—'} />
              <Row label={t('book.review.route')} value={data.route || '—'} />
              <Row label={t('book.review.date')} value={data.arrivalDate ? format(data.arrivalDate, 'PPP') : '—'} />
              <Row label={t('book.review.passengers')} value={String(data.passengers)} />
              <Row label={t('book.review.pickup')} value={data.pickup || '—'} />
              <Row label={t('book.review.dropoff')} value={data.dropoff || '—'} />
              {data.extras.length > 0 && <Row label={t('book.review.extras')} value={data.extras.join(', ')} />}
              {data.activities.length > 0 && <Row label={t('book.review.activitiesUpsell')} value={data.activities.join(', ')} />}
            </div>

            {/* Pricing */}
            <div className="booking-card rounded-2xl p-6 md:p-8 space-y-4 text-sm">
              <Row label={t('book.review.transferPrice')} value={`$${transferPrice} USD`} gold />
              {activitiesDeposit > 0 && <Row label={t('book.review.activitiesDeposit')} value={`$${activitiesDeposit} USD`} gold />}
              <div className="border-t border-border pt-4">
                <Row label={t('book.review.total')} value={`$${total} USD`} gold bold />
              </div>
            </div>

            {/* PayPal placeholder */}
            <button disabled className="w-full py-4 rounded-xl bg-[#0070ba] text-white font-bold text-base opacity-50 cursor-not-allowed">
              {t('book.review.paypal')}
            </button>
            <p className="text-center text-sm text-muted-foreground">{t('book.review.paypalDisabled')}</p>
          </div>
        );
    }
  };

  return (
    <div className="pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Title + step counter */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">{t('book.title')}</h1>
          <span className="text-muted-foreground text-sm font-semibold bg-accent px-3 py-1 rounded-full">{current + 1}/8</span>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-10">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => i <= current && setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? 'w-8 bg-gold' : i < current ? 'w-2 bg-gold/50 hover:bg-gold/70' : 'w-2 bg-border'
              }`}
            />
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Wizard */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Nav buttons */}
            <div className="flex justify-between mt-10">
              <button onClick={prev} disabled={current === 0}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors py-2">
                <ArrowLeft size={16} /> {t('book.back')}
              </button>
              {current < steps.length - 1 && (
                <button onClick={next}
                  className="gold-gradient text-navy px-8 py-3 rounded-xl text-sm font-bold inline-flex items-center gap-2 hover:brightness-110 transition-all gold-glow active:scale-[0.97]">
                  {t('book.next')} <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Sticky Summary (desktop) */}
          <div className="lg:col-span-2 hidden lg:block">
            <div className="sticky top-32 booking-card rounded-2xl p-6 space-y-4">
              <h3 className="font-display text-lg font-bold text-foreground">{t('book.summary')}</h3>
              <div className="space-y-2.5 text-sm">
                {data.serviceType && <Row label={t('book.review.service')} value={data.serviceType} />}
                {data.tripType && <Row label={t('book.review.trip')} value={data.tripType} />}
                {data.route && <Row label={t('book.review.route')} value={data.route} />}
                {data.arrivalDate && <Row label={t('book.review.date')} value={format(data.arrivalDate, 'PPP')} />}
                <Row label={t('book.review.passengers')} value={String(data.passengers)} />
                {data.pickup && <Row label={t('book.review.pickup')} value={data.pickup} />}
                {data.extras.length > 0 && (
                  <div>
                    <span className="text-muted-foreground block mb-1">{t('book.review.extras')}</span>
                    {data.extras.map(e => <span key={e} className="inline-block bg-gold/10 text-gold text-xs font-semibold px-2.5 py-1 rounded-full mr-1 mb-1">{e}</span>)}
                  </div>
                )}
                {!data.serviceType && <p className="text-muted-foreground text-sm italic">{t('book.summaryEmpty')}</p>}
              </div>

              {transferPrice > 0 && (
                <div className="border-t border-border pt-4 space-y-2.5">
                  <Row label={t('book.review.transferPrice')} value={`$${transferPrice}`} gold />
                  {activitiesDeposit > 0 && <Row label={t('book.review.activitiesDeposit')} value={`$${activitiesDeposit}`} gold />}
                  <div className="border-t border-border pt-3">
                    <Row label={t('book.review.total')} value={`$${total}`} gold bold />
                  </div>
                </div>
              )}

              <a href="https://wa.me/526241234567?text=Hello%2C%20I%27d%20like%20to%20book%20a%20transfer" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors pt-2">
                <MessageCircle size={16} className="text-[#25D366]" /> {t('transfers.cta.chat')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Reusable input field wrapper with icon */
const InputField = ({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div>
    <label className="text-sm font-semibold text-foreground mb-2 block">{label}</label>
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">{icon}</div>
      {children}
    </div>
  </div>
);

const Row = ({ label, value, gold, bold }: { label: string; value: string; gold?: boolean; bold?: boolean }) => (
  <div className={`flex justify-between items-baseline ${bold ? 'font-bold' : ''}`}>
    <span className="text-muted-foreground text-sm">{label}</span>
    <span className={`${gold ? 'text-gold font-semibold' : 'text-foreground'} ${bold ? 'text-lg' : ''} ml-3 truncate max-w-[180px] text-right`}>{value}</span>
  </div>
);

export default Book;
