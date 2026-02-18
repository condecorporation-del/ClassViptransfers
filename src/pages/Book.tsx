import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Car, Users, Minus, Plus, Plane, MessageCircle, CalendarDays, Clock, MapPin, Sparkles, Zap, Shield, Star, ChevronUp, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const steps = ['service', 'trip', 'route', 'date', 'locations', 'extras', 'upsell', 'review'] as const;

const upsellActivities = [
  { id: 'camel', key: 'activity.camel', emoji: '🐫', duration: '1h', price: 120 },
  { id: 'horseback', key: 'activity.horseback', emoji: '🐎', duration: '1h', price: 120 },
  { id: 'atv', key: 'activity.atv', emoji: '🏍️', duration: '2h', price: 120 },
  { id: 'skyBikes', key: 'activity.skyBikes', emoji: '🚲', duration: '2h', price: 96 },
  { id: 'rzr', key: 'activity.rzr', emoji: '🏎️', duration: '2h', price: 205 },
  { id: 'doubleMoto', key: 'activity.doubleMoto', emoji: '🏍️', duration: '2h', price: 200 },
  { id: 'camelKids', key: 'activity.camelKids', emoji: '🐫', duration: '1h', price: 120 },
];

const Book = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
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
    comboMode: '' as '' | 'combo' | 'crazy' | 'individual',
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
      const max = d.comboMode === 'combo' ? 2 : d.comboMode === 'crazy' ? 3 : 10;
      if (d.activities.length >= max) return d;
      return { ...d, activities: [...d.activities, val] };
    });
  };

  // Pricing logic
  const transferPrice = useMemo(() => {
    let base = 0;
    if (data.serviceType === 'private') base = 85;
    else if (data.serviceType === 'shuttle') base = 25 * data.passengers;
    if (data.tripType === 'roundtrip') base *= 2;
    return base;
  }, [data.serviceType, data.tripType, data.passengers]);

  const activitiesPrice = useMemo(() => {
    if (data.activities.length === 0) return 0;
    if (data.comboMode === 'combo') return 100 * data.passengers;
    if (data.comboMode === 'crazy') return 125 * data.passengers;
    // Individual pricing
    return data.activities.reduce((sum, id) => {
      const act = upsellActivities.find(a => a.id === id);
      return sum + (act?.price || 120);
    }, 0) * data.passengers;
  }, [data.activities, data.comboMode, data.passengers]);

  const total = transferPrice + activitiesPrice;

  // Create booking and redirect to checkout
  const handlePayPalCheckout = async () => {
    // Validate required fields
    if (!data.serviceType || !data.tripType || !data.route || !data.arrivalDate || !data.pickup || !data.dropoff) {
      setBookingError(lang === 'es' ? 'Por favor completa todos los campos requeridos' : 'Please complete all required fields');
      return;
    }

    // Check if API URL is configured
    if (!API_BASE_URL || API_BASE_URL === 'http://localhost:3001') {
      // In production, this should be set
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        setBookingError(lang === 'es' 
          ? 'Error de configuración: Backend no configurado. Por favor contacta soporte.' 
          : 'Configuration error: Backend not configured. Please contact support.');
        console.error('[Book] API_BASE_URL not configured for production:', API_BASE_URL);
        return;
      }
    }

    setCreatingBooking(true);
    setBookingError(null);

    try {
      // Determine booking type
      let bookingType: 'TRANSPORTATION' | 'ACTIVITY' | 'COMBO' | 'CRAZY_COMBO' = 'TRANSPORTATION';
      if (data.activities.length > 0) {
        if (data.comboMode === 'crazy') bookingType = 'CRAZY_COMBO';
        else if (data.comboMode === 'combo') bookingType = 'COMBO';
        else bookingType = 'ACTIVITY';
      }

      // Build items array
      const items: any[] = [];
      
      // Add transportation item
      items.push({
        type: 'TRANSPORTATION',
        name: `${data.serviceType} ${data.tripType} transfer`,
        quantity: 1,
        unitPrice: transferPrice,
      });

      // Add activity items
      if (data.activities.length > 0) {
        if (data.comboMode === 'combo' || data.comboMode === 'crazy') {
          items.push({
            type: data.comboMode === 'crazy' ? 'CRAZY_COMBO' : 'COMBO',
            name: data.comboMode === 'crazy' ? 'Crazy Combo' : 'Combo',
            quantity: data.passengers,
            unitPrice: data.comboMode === 'crazy' ? 125 : 100,
          });
        } else {
          data.activities.forEach(activityId => {
            const act = upsellActivities.find(a => a.id === activityId);
            if (act) {
              items.push({
                type: 'ACTIVITY',
                name: act.key,
                quantity: data.passengers,
                unitPrice: act.price,
              });
            }
          });
        }
      }

      // Create booking payload
      const bookingPayload = {
        type: bookingType,
        customer: {
          name: 'Guest', // Will be updated in checkout
          email: 'guest@example.com', // Will be updated in checkout
          phone: '+1234567890', // Will be updated in checkout
          country: 'US',
          language: lang,
        },
        bookingDate: data.arrivalDate.toISOString(),
        bookingTime: data.arrivalTime || '10:00',
        pickupLocation: data.pickup,
        dropoffLocation: data.dropoff,
        flightNumber: data.flightNumber || undefined,
        arrivalTime: data.arrivalTime || undefined,
        departureFlightNumber: data.departureFlightNumber || undefined,
        departureTime: data.departureTime || undefined,
        passengers: data.passengers,
        serviceType: data.serviceType,
        tripType: data.tripType,
        route: data.route,
        items,
        notes: data.extras.length > 0 ? `Extras: ${data.extras.join(', ')}` : undefined,
      };

      // Create booking
      const apiUrl = `${API_BASE_URL}/api/bookings`;
      console.log('[Book] Creating booking at:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: await response.text() || 'Failed to create booking' };
        }
        
        // Better error messages
        if (response.status === 0 || response.status === 500) {
          throw new Error(lang === 'es' 
            ? 'No se pudo conectar con el servidor. Verifica tu conexión o contacta soporte.' 
            : 'Could not connect to server. Check your connection or contact support.');
        }
        
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: Failed to create booking`);
      }

      const result = await response.json();
      const bookingId = result.data?.id;

      if (!bookingId) {
        throw new Error('No booking ID returned');
      }

      // Redirect to checkout
      navigate(`/checkout?bookingId=${bookingId}`);
    } catch (err: any) {
      console.error('Error creating booking:', err);
      
      // Network errors
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setBookingError(lang === 'es' 
          ? 'Error de conexión. Verifica que el backend esté corriendo o contacta soporte.' 
          : 'Connection error. Verify the backend is running or contact support.');
      } else {
        setBookingError(err.message || (lang === 'es' ? 'Error al crear la reserva' : 'Error creating booking'));
      }
      
      setCreatingBooking(false);
    }
  };

  const extrasOptions = [
    { id: 'baby', label: t('book.extras.babySeat') },
    { id: 'assist', label: t('book.extras.specialAssist') },
    { id: 'grocery', label: t('book.extras.groceryStop') },
    { id: 'oversize', label: t('book.extras.oversize') },
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
              <InputField label={t('book.date.flightNumber')} icon={<Plane size={18} className="text-gold" />}>
                <input type="text" placeholder="AA 1234" value={data.flightNumber} onChange={e => setData({ ...data, flightNumber: e.target.value })}
                  className="input-luxury pl-11" />
              </InputField>
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

      /* ===== UPGRADED UPSELL STEP ===== */
      case 'upsell':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                {lang === 'es' ? '¡Agrega Aventuras!' : 'Add Adventures!'}
              </h2>
              <p className="text-muted-foreground text-sm md:text-base mt-2 leading-relaxed">
                {lang === 'es' ? 'Haz tu viaje inolvidable con experiencias exclusivas' : 'Make your trip unforgettable with exclusive experiences'}
              </p>
            </div>

            {/* Crazy Combo CTA — primary upsell */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "relative rounded-2xl p-6 border-2 overflow-hidden cursor-pointer transition-all",
                data.comboMode === 'crazy'
                  ? "border-gold bg-gold/5"
                  : "border-gold/30 hover:border-gold/60 bg-gradient-to-br from-gold/5 to-transparent"
              )}
              onClick={() => {
                setData(d => ({ ...d, comboMode: 'crazy', activities: d.activities.slice(0, 3) }));
              }}
            >
              <div className="absolute inset-0 shimmer pointer-events-none" />
              <div className="absolute top-0 right-0 gold-gradient text-secondary-foreground text-[10px] font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-wider">
                {lang === 'es' ? 'MEJOR VALOR' : 'BEST VALUE'}
              </div>
              <div className="flex items-start gap-4">
                <div className="text-3xl">🔥</div>
                <div className="flex-1">
                  <p className="font-display text-xl font-bold text-foreground">Crazy Combo</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {lang === 'es' ? '3 actividades (1 hr cada una) · Transporte incluido' : '3 activities (1 hr each) · Transport included'}
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-gold text-2xl font-bold">$125</span>
                    <span className="text-muted-foreground text-sm">USD/{lang === 'es' ? 'persona' : 'person'}</span>
                    <span className="text-xs line-through text-muted-foreground/60 ml-2">$360</span>
                    <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full">
                      {lang === 'es' ? 'AHORRA 65%' : 'SAVE 65%'}
                    </span>
                  </div>
                </div>
                {data.comboMode === 'crazy' && (
                  <div className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center flex-shrink-0">
                    <Check size={15} className="text-navy" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Combo option */}
            <div
              className={cn(
                "rounded-xl p-5 border cursor-pointer transition-all flex items-center justify-between",
                data.comboMode === 'combo'
                  ? "border-gold bg-gold/5"
                  : "border-border hover:border-gold/30 glass-card"
              )}
              onClick={() => {
                setData(d => ({ ...d, comboMode: 'combo', activities: d.activities.slice(0, 2) }));
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🎯</span>
                <div>
                  <p className="font-display font-bold text-foreground">Combo</p>
                  <p className="text-muted-foreground text-xs">
                    {lang === 'es' ? '2 actividades · $100/persona' : '2 activities · $100/person'}
                  </p>
                </div>
              </div>
              {data.comboMode === 'combo' && (
                <div className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center flex-shrink-0">
                  <Check size={15} className="text-navy" />
                </div>
              )}
            </div>

            {/* Individual option */}
            <div
              className={cn(
                "rounded-xl p-5 border cursor-pointer transition-all flex items-center justify-between",
                data.comboMode === 'individual'
                  ? "border-gold bg-gold/5"
                  : "border-border hover:border-gold/30 glass-card"
              )}
              onClick={() => setData(d => ({ ...d, comboMode: 'individual' }))}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">✨</span>
                <div>
                  <p className="font-display font-bold text-foreground">
                    {lang === 'es' ? 'Actividades Individuales' : 'Individual Activities'}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {lang === 'es' ? 'Elige las que quieras al precio individual' : 'Pick any at individual pricing'}
                  </p>
                </div>
              </div>
              {data.comboMode === 'individual' && (
                <div className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center flex-shrink-0">
                  <Check size={15} className="text-navy" />
                </div>
              )}
            </div>

            {/* Skip option */}
            {!data.comboMode && (
              <p className="text-center text-sm text-muted-foreground">
                {lang === 'es' ? 'O haz clic en "Continuar" para omitir' : 'Or click "Continue" to skip'}
              </p>
            )}

            {/* Activity selection grid (when a mode is chosen) */}
            {data.comboMode && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    {lang === 'es' ? 'Selecciona tus actividades' : 'Select your activities'}
                  </p>
                  {(data.comboMode === 'combo' || data.comboMode === 'crazy') && (
                    <span className="text-xs text-gold font-bold bg-gold/10 px-3 py-1 rounded-full">
                      {data.activities.length}/{data.comboMode === 'combo' ? 2 : 3}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {upsellActivities.map(act => {
                    const selected = data.activities.includes(act.id);
                    const maxReached = (data.comboMode === 'combo' && data.activities.length >= 2) ||
                                       (data.comboMode === 'crazy' && data.activities.length >= 3);
                    const disabled = !selected && maxReached;
                    return (
                      <button
                        key={act.id}
                        onClick={() => !disabled && toggleActivity(act.id)}
                        disabled={disabled}
                        className={cn(
                          "rounded-xl p-4 text-center border transition-all",
                          selected ? "border-gold bg-gold/5" : disabled ? "border-border/50 opacity-40 cursor-not-allowed" : "border-border hover:border-gold/30 glass-card"
                        )}
                      >
                        <span className="text-2xl block mb-1">{act.emoji}</span>
                        <p className="font-display text-xs font-bold text-foreground leading-tight">{t(act.key)}</p>
                        <p className="text-muted-foreground text-[10px] mt-1 flex items-center justify-center gap-1">
                          <Clock size={9} /> {act.duration}
                        </p>
                        {data.comboMode === 'individual' && (
                          <p className="text-gold text-xs font-bold mt-1">${act.price}</p>
                        )}
                        {selected && (
                          <div className="w-5 h-5 rounded-full gold-gradient flex items-center justify-center mx-auto mt-2">
                            <Check size={11} className="text-navy" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-accent rounded-xl p-3 border border-border">
                  <Shield size={14} className="text-gold flex-shrink-0 mt-0.5" />
                  <span>{lang === 'es' ? 'Incluye transporte, equipo, guía bilingüe. Entrada al parque $25/persona pagada en sitio.' : 'Includes transport, equipment, bilingual guide. Park fee $25/person paid on-site.'}</span>
                </div>
              </motion.div>
            )}
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
              {data.activities.length > 0 && (
                <Row label={t('book.review.activitiesUpsell')} value={data.activities.map(id => {
                  const act = upsellActivities.find(a => a.id === id);
                  return act ? t(act.key) : id;
                }).join(', ')} />
              )}
            </div>

            {/* Pricing */}
            <div className="booking-card rounded-2xl p-6 md:p-8 space-y-4 text-sm">
              <Row label={t('book.review.transferPrice')} value={`$${transferPrice} USD`} gold />
              {activitiesPrice > 0 && (
                <Row label={data.comboMode === 'crazy' ? 'Crazy Combo' : data.comboMode === 'combo' ? 'Combo' : t('book.review.activitiesDeposit')}
                  value={`$${activitiesPrice} USD`} gold />
              )}
              <div className="border-t border-border pt-4">
                <Row label={t('book.review.total')} value={`$${total} USD`} gold bold />
              </div>
            </div>

            {/* Trust elements */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><Shield size={14} className="text-gold" /> {lang === 'es' ? 'Pago seguro' : 'Secure checkout'}</div>
              <div className="flex items-center gap-1.5"><Star size={14} className="text-gold" /> {lang === 'es' ? '4.9/5 calificación' : '4.9/5 rating'}</div>
            </div>

            {/* PayPal Checkout Button */}
            <button
              onClick={handlePayPalCheckout}
              disabled={creatingBooking}
              className="w-full py-4 rounded-xl bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {creatingBooking ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {lang === 'es' ? 'Creando reserva...' : 'Creating booking...'}
                </>
              ) : (
                <>
                  <Shield size={20} />
                  {t('book.review.paypal')}
                </>
              )}
            </button>
            {bookingError && (
              <p className="text-center text-sm text-destructive mt-2">{bookingError}</p>
            )}
            {!bookingError && !creatingBooking && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                {lang === 'es' ? 'Serás redirigido a PayPal para completar el pago' : 'You will be redirected to PayPal to complete payment'}
              </p>
            )}
          </div>
        );
    }
  };

  return (
    <div className="pt-32 pb-28 lg:pb-20 px-4">
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
                {data.activities.length > 0 && (
                  <div>
                    <span className="text-muted-foreground block mb-1">{t('book.review.activitiesUpsell')}</span>
                    {data.activities.map(id => {
                      const act = upsellActivities.find(a => a.id === id);
                      return <span key={id} className="inline-block bg-gold/10 text-gold text-xs font-semibold px-2.5 py-1 rounded-full mr-1 mb-1">{act ? t(act.key) : id}</span>;
                    })}
                  </div>
                )}
                {!data.serviceType && <p className="text-muted-foreground text-sm italic">{t('book.summaryEmpty')}</p>}
              </div>

              {transferPrice > 0 && (
                <div className="border-t border-border pt-4 space-y-2.5">
                  <Row label={t('book.review.transferPrice')} value={`$${transferPrice}`} gold />
                  {activitiesPrice > 0 && <Row label={data.comboMode === 'crazy' ? 'Crazy Combo' : data.comboMode === 'combo' ? 'Combo' : lang === 'es' ? 'Actividades' : 'Activities'} value={`$${activitiesPrice}`} gold />}
                  <div className="border-t border-border pt-3">
                    <Row label={t('book.review.total')} value={`$${total}`} gold bold />
                  </div>
                </div>
              )}

              {/* Upsell prompt in summary */}
              {current < 6 && data.activities.length === 0 && (
                <div className="border-t border-border pt-4">
                  <button onClick={() => setCurrent(6)} className="w-full text-left rounded-xl p-3 border border-gold/20 bg-gold/5 hover:bg-gold/10 transition-all group">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-gold" />
                      <span className="text-xs font-bold text-gold">
                        {lang === 'es' ? '🔥 ¡Agrega Crazy Combo!' : '🔥 Add Crazy Combo!'}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {lang === 'es' ? '3 actividades por $125/persona' : '3 activities for $125/person'}
                    </p>
                  </button>
                </div>
              )}

              <a href="https://wa.me/5216241222174?text=Hello%2C%20I%27d%20like%20to%20book%20a%20transfer" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors pt-2">
                <MessageCircle size={16} className="text-[#25D366]" /> {t('transfers.cta.chat')}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom summary bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/98 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="w-full px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChevronUp size={16} className={cn("text-muted-foreground transition-transform", mobileOpen && "rotate-180")} />
            <span className="text-sm font-semibold text-foreground">{t('book.summary')}</span>
          </div>
          <span className="text-gold font-bold text-lg">${total} USD</span>
        </button>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border"
            >
              <div className="px-4 py-4 space-y-2.5 text-sm max-h-60 overflow-y-auto">
                {data.serviceType && <Row label={t('book.review.service')} value={data.serviceType} />}
                {data.tripType && <Row label={t('book.review.trip')} value={data.tripType} />}
                <Row label={t('book.review.passengers')} value={String(data.passengers)} />
                {transferPrice > 0 && <Row label={t('book.review.transferPrice')} value={`$${transferPrice}`} gold />}
                {activitiesPrice > 0 && <Row label={lang === 'es' ? 'Actividades' : 'Activities'} value={`$${activitiesPrice}`} gold />}

                {/* Mobile upsell prompt */}
                {data.activities.length === 0 && current < 6 && (
                  <button onClick={() => { setCurrent(6); setMobileOpen(false); }} className="w-full text-left rounded-lg p-2.5 border border-gold/20 bg-gold/5 mt-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={12} className="text-gold" />
                      <span className="text-[11px] font-bold text-gold">🔥 {lang === 'es' ? '¡Agrega Crazy Combo por $125!' : 'Add Crazy Combo for $125!'}</span>
                    </div>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
