import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Car, Users, Minus, Plus, Plane, MessageCircle } from 'lucide-react';

const steps = ['service', 'trip', 'route', 'date', 'locations', 'extras', 'upsell', 'review'] as const;

const Book = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [data, setData] = useState({
    serviceType: '' as '' | 'private' | 'shuttle',
    tripType: '' as '' | 'oneway' | 'roundtrip',
    route: '' as '' | 'airport-hotel' | 'hotel-airport',
    arrivalDate: '',
    departureDate: '',
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
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-2xl font-bold">{t('book.service.title')}</h2>
              <p className="text-muted-foreground text-sm mt-1">{t('book.service.subtitle')}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <button onClick={() => { setData({ ...data, serviceType: 'private' }); }}
                className={`glass-card rounded-xl p-8 text-center premium-card border transition-all ${data.serviceType === 'private' ? 'border-gold' : 'border-border'}`}>
                <Car size={28} className="mx-auto mb-3 text-foreground/60" />
                <p className="font-semibold text-lg">{t('book.service.private')}</p>
                <p className="text-muted-foreground text-xs mt-1">{t('book.service.privateDesc')}</p>
              </button>
              <button onClick={() => { setData({ ...data, serviceType: 'shuttle' }); }}
                className={`glass-card rounded-xl p-8 text-center premium-card border transition-all ${data.serviceType === 'shuttle' ? 'border-gold' : 'border-border'}`}>
                <Users size={28} className="mx-auto mb-3 text-foreground/60" />
                <p className="font-semibold text-lg">{t('book.service.shuttle')}</p>
                <p className="text-muted-foreground text-xs mt-1">{t('book.service.shuttleDesc')}</p>
              </button>
            </div>
          </div>
        );
      case 'trip':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-2xl font-bold">{t('book.trip.title')}</h2>
              <p className="text-muted-foreground text-sm mt-1">{t('book.trip.subtitle')}</p>
            </div>
            {[
              { id: 'oneway' as const, label: t('book.trip.oneWay'), desc: t('book.trip.oneWayDesc') },
              { id: 'roundtrip' as const, label: t('book.trip.roundTrip'), desc: t('book.trip.roundTripDesc') },
            ].map(s => (
              <button key={s.id} onClick={() => { setData({ ...data, tripType: s.id }); }}
                className={`w-full glass-card rounded-xl p-5 text-left premium-card border transition-all flex items-center justify-between ${data.tripType === s.id ? 'border-gold' : 'border-border'}`}>
                <div>
                  <p className="font-semibold">{s.label}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{s.desc}</p>
                </div>
                {data.tripType === s.id && <div className="w-6 h-6 rounded-full gold-gradient flex items-center justify-center flex-shrink-0"><Check size={14} className="text-navy" /></div>}
              </button>
            ))}
          </div>
        );
      case 'route':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-2xl font-bold">{t('book.route.title')}</h2>
              <p className="text-muted-foreground text-sm mt-1">{t('book.route.subtitle')}</p>
            </div>
            {[
              { id: 'airport-hotel' as const, label: t('book.route.airportToHotel') },
              { id: 'hotel-airport' as const, label: t('book.route.hotelToAirport') },
            ].map(s => (
              <button key={s.id} onClick={() => { setData({ ...data, route: s.id }); }}
                className={`w-full glass-card rounded-xl p-5 text-left premium-card border transition-all flex items-center justify-between ${data.route === s.id ? 'border-gold' : 'border-border'}`}>
                <p className="font-semibold">{s.label}</p>
                {data.route === s.id && <div className="w-6 h-6 rounded-full gold-gradient flex items-center justify-center flex-shrink-0"><Check size={14} className="text-navy" /></div>}
              </button>
            ))}
          </div>
        );
      case 'date':
        return (
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-bold">{t('book.date.title')}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('book.date.arrival')}</label>
                <input type="date" value={data.arrivalDate} onChange={e => setData({ ...data, arrivalDate: e.target.value })}
                  className="w-full bg-accent/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('book.date.flightNumber')}</label>
                <input type="text" placeholder="AA 1234" value={data.flightNumber} onChange={e => setData({ ...data, flightNumber: e.target.value })}
                  className="w-full bg-accent/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t('book.date.arrivalTime')}</label>
                <input type="time" value={data.arrivalTime} onChange={e => setData({ ...data, arrivalTime: e.target.value })}
                  className="w-full bg-accent/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50" />
              </div>
            </div>

            {data.tripType === 'roundtrip' && (
              <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{t('book.date.departure')}</label>
                  <input type="date" value={data.departureDate} onChange={e => setData({ ...data, departureDate: e.target.value })}
                    className="w-full bg-accent/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{t('book.date.departureTime')}</label>
                  <input type="time" value={data.departureTime} onChange={e => setData({ ...data, departureTime: e.target.value })}
                    className="w-full bg-accent/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50" />
                </div>
              </div>
            )}

            {data.departureTime && data.tripType === 'roundtrip' && (
              <div className="flex items-center gap-2 text-xs text-gold bg-gold/5 rounded-lg px-3 py-2">
                <Plane size={14} />
                {t('book.date.pickupNote')}
              </div>
            )}

            {/* Passengers */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('book.date.passengers')}</label>
              <div className="flex items-center gap-4">
                <button onClick={() => setData(d => ({ ...d, passengers: Math.max(1, d.passengers - 1) }))}
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors">
                  <Minus size={16} />
                </button>
                <span className="text-2xl font-bold w-8 text-center">{data.passengers}</span>
                <button onClick={() => setData(d => ({ ...d, passengers: Math.min(10, d.passengers + 1) }))}
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        );
      case 'locations':
        return (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold">{t('book.locations.title')}</h2>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('book.locations.pickup')}</label>
              <div className="flex gap-2">
                <input type="text" placeholder={t('book.locations.placeholder')} value={data.pickup}
                  onChange={e => setData({ ...data, pickup: e.target.value })}
                  className="flex-1 bg-accent/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50" />
                <button onClick={() => setData(d => ({ ...d, pickup: 'SJD International Airport' }))}
                  className="text-xs font-medium text-gold border border-gold/30 rounded-lg px-3 hover:bg-gold/5 transition-colors whitespace-nowrap">
                  {t('book.locations.quickFill')}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('book.locations.dropoff')}</label>
              <input type="text" placeholder={t('book.locations.placeholder')} value={data.dropoff}
                onChange={e => setData({ ...data, dropoff: e.target.value })}
                className="w-full bg-accent/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50" />
            </div>
          </div>
        );
      case 'extras':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-2xl font-bold">{t('book.extras.title')}</h2>
              <p className="text-muted-foreground text-sm mt-1">{t('book.extras.subtitle')}</p>
            </div>
            {extrasOptions.map(e => (
              <button key={e.id} onClick={() => toggleExtra(e.id)}
                className={`w-full glass-card rounded-xl p-4 text-left premium-card border transition-all flex items-center justify-between ${data.extras.includes(e.id) ? 'border-gold' : 'border-border'}`}>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">{e.label}</span>
                  <span className="text-xs text-gold font-semibold">{t('common.free')}</span>
                </div>
                {data.extras.includes(e.id) && <div className="w-6 h-6 rounded-full gold-gradient flex items-center justify-center flex-shrink-0"><Check size={14} className="text-navy" /></div>}
              </button>
            ))}
          </div>
        );
      case 'upsell':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-2xl font-bold">{t('book.upsell.title')}</h2>
              <p className="text-muted-foreground text-sm mt-1">{t('book.upsell.subtitle')}</p>
            </div>
            {upsellActivities.map(a => (
              <button key={a.id} onClick={() => toggleActivity(a.id)}
                className={`w-full glass-card rounded-xl p-4 text-left premium-card border transition-all flex items-center justify-between ${data.activities.includes(a.id) ? 'border-gold' : 'border-border'}`}>
                <span className="font-medium text-sm">{a.label}</span>
                {data.activities.includes(a.id) && <div className="w-6 h-6 rounded-full gold-gradient flex items-center justify-center flex-shrink-0"><Check size={14} className="text-navy" /></div>}
              </button>
            ))}
          </div>
        );
      case 'review':
        return (
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-bold">{t('book.review.title')}</h2>
            <div className="glass-card rounded-xl p-6 space-y-3 text-sm border border-border">
              <Row label={t('book.review.service')} value={data.serviceType || '—'} />
              <Row label={t('book.review.trip')} value={data.tripType || '—'} />
              <Row label={t('book.review.route')} value={data.route || '—'} />
              <Row label={t('book.review.date')} value={data.arrivalDate || '—'} />
              <Row label={t('book.review.passengers')} value={String(data.passengers)} />
              <Row label={t('book.review.pickup')} value={data.pickup || '—'} />
              <Row label={t('book.review.dropoff')} value={data.dropoff || '—'} />
              {data.extras.length > 0 && <Row label={t('book.review.extras')} value={data.extras.join(', ')} />}
              {data.activities.length > 0 && <Row label={t('book.review.activitiesUpsell')} value={data.activities.join(', ')} />}
            </div>

            {/* Pricing */}
            <div className="glass-card rounded-xl p-6 space-y-3 text-sm border border-border">
              <Row label={t('book.review.transferPrice')} value={`$${transferPrice} USD`} gold />
              {activitiesDeposit > 0 && <Row label={t('book.review.activitiesDeposit')} value={`$${activitiesDeposit} USD`} gold />}
              <div className="border-t border-border pt-3">
                <Row label={t('book.review.total')} value={`$${total} USD`} gold bold />
              </div>
            </div>

            {/* PayPal placeholder */}
            <button disabled className="w-full py-4 rounded-xl bg-[#0070ba] text-white font-bold text-sm opacity-50 cursor-not-allowed">
              {t('book.review.paypal')}
            </button>
            <p className="text-center text-xs text-muted-foreground">{t('book.review.paypalDisabled')}</p>
          </div>
        );
    }
  };

  return (
    <div className="pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Title + step counter */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-display text-3xl font-bold">{t('book.title')}</h1>
          <span className="text-muted-foreground text-sm font-medium">{current + 1}/8</span>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => i <= current && setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? 'w-8 bg-gold' : i < current ? 'w-2 bg-gold/50' : 'w-2 bg-border'
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
            <div className="flex justify-between mt-8">
              <button onClick={prev} disabled={current === 0}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                <ArrowLeft size={16} /> {t('book.back')}
              </button>
              {current < steps.length - 1 && (
                <button onClick={next}
                  className="gold-gradient text-navy px-6 py-2.5 rounded-full text-sm font-bold inline-flex items-center gap-2 hover:brightness-110 transition-all gold-glow">
                  {t('book.next')} <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Sticky Summary (desktop) */}
          <div className="lg:col-span-2 hidden lg:block">
            <div className="sticky top-32 glass-card rounded-2xl p-6 space-y-4 border border-border">
              <h3 className="font-display text-lg font-bold">{t('book.summary')}</h3>
              <div className="space-y-2 text-sm">
                {data.serviceType && <Row label={t('book.review.service')} value={data.serviceType} />}
                {data.tripType && <Row label={t('book.review.trip')} value={data.tripType} />}
                {data.route && <Row label={t('book.review.route')} value={data.route} />}
                {data.arrivalDate && <Row label={t('book.review.date')} value={data.arrivalDate} />}
                <Row label={t('book.review.passengers')} value={String(data.passengers)} />
                {data.pickup && <Row label={t('book.review.pickup')} value={data.pickup} />}
                {data.extras.length > 0 && (
                  <div>
                    <span className="text-muted-foreground block mb-1">{t('book.review.extras')}</span>
                    {data.extras.map(e => <span key={e} className="inline-block bg-gold/10 text-gold text-xs px-2 py-0.5 rounded-full mr-1 mb-1">{e}</span>)}
                  </div>
                )}
                {!data.serviceType && <p className="text-muted-foreground text-xs italic">{t('book.summaryEmpty')}</p>}
              </div>

              {transferPrice > 0 && (
                <div className="border-t border-border pt-3 space-y-2">
                  <Row label={t('book.review.transferPrice')} value={`$${transferPrice}`} gold />
                  {activitiesDeposit > 0 && <Row label={t('book.review.activitiesDeposit')} value={`$${activitiesDeposit}`} gold />}
                  <div className="border-t border-border pt-2">
                    <Row label={t('book.review.total')} value={`$${total}`} gold bold />
                  </div>
                </div>
              )}

              <a href="https://wa.me/526241234567?text=Hello%2C%20I%27d%20like%20to%20book%20a%20transfer" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors pt-2">
                <MessageCircle size={14} className="text-[#25D366]" /> {t('transfers.cta.chat')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value, gold, bold }: { label: string; value: string; gold?: boolean; bold?: boolean }) => (
  <div className={`flex justify-between ${bold ? 'font-bold' : ''}`}>
    <span className="text-muted-foreground">{label}</span>
    <span className={`${gold ? 'text-gold' : ''} ${bold ? 'text-lg' : ''} ml-2 truncate max-w-[180px] text-right`}>{value}</span>
  </div>
);

export default Book;
