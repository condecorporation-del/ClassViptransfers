import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Car, Minus, Plus, Plane, MessageCircle, CalendarDays, Clock, MapPin, Sparkles, Shield, ChevronUp, AlertCircle } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePricing, type PricingExtraPublic, type AreaPublic } from '@/hooks/usePricing';
import { LuxurySpinner } from '@/components/ui/luxury-spinner';
import { TrustBadges } from '@/components/trust/TrustBadges';
import { getApiBaseUrl } from '@/lib/api';
import { SEO } from '@/components/SEO';

const steps = ['route', 'date', 'extras', 'review'] as const;

// Mapeo área → zona de hoteles (areas y hotels usan nombres distintos en algunos casos)
const AREA_TO_HOTEL_ZONE: Record<string, string> = {
  'Corredor Turistico': 'Tourist Corridor',
  'Tourist Corridor': 'Tourist Corridor',
  'East Cape': 'Pacific & East Cape',
  'Pacific & East Cape': 'Pacific & East Cape',
};

const upsellActivities = [
  { id: 'camel', key: 'activity.camel', emoji: '🐫', duration: '1h', price: 120 },
  { id: 'horseback', key: 'activity.horseback', emoji: '🐎', duration: '1h', price: 120 },
  { id: 'atv', key: 'activity.atv', emoji: '🏍️', duration: '1h', price: 120 },
  { id: 'skyBikes', key: 'activity.skyBikes', emoji: '🚲', duration: '1h', price: 96 },
  { id: 'rzr', key: 'activity.rzr', emoji: '🏎️', duration: '1h', price: 205 },
  { id: 'doubleMoto', key: 'activity.doubleMoto', emoji: '🏍️', duration: '1h', price: 200 },
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
    serviceType: 'private' as const,
    tripType: '' as '' | 'oneway' | 'roundtrip',
    areaId: '' as string,
    route: '' as '' | 'airport-hotel' | 'hotel-airport',
    zoneFrom: '',
    zoneTo: '',
    selectedHotel: null as { id: string; name: string; zone: string } | null,
    vehicleClass: 'SUV' as 'SUV' | 'SPRINTER',
    arrivalDate: null as Date | null,
    departureDate: null as Date | null,
    flightNumber: '',
    arrivalTime: '',
    departureFlightNumber: '',
    departureTime: '',
    pickupTime: '', // roundtrip: time we pick up at hotel (min 3h before departureTime)
    passengers: 1,
    pickup: '',
    dropoff: '',
    extras: [] as string[],
    activities: [] as string[],
    comboMode: '' as '' | 'combo' | 'crazy',
  });

  const { getExtras, getAreas, loading: quoteLoading } = usePricing();
  const [pricingExtras, setPricingExtras] = useState<PricingExtraPublic[]>([]);
  const [areas, setAreas] = useState<AreaPublic[]>([]);
  const [hotels, setHotels] = useState<Array<{ id: string; name: string; zone: string }>>([]);
  const [hotelSearch, setHotelSearch] = useState('');
  const [selectedZoneForHotel, setSelectedZoneForHotel] = useState<string | null>(null);

  const FLIGHT_REGEX = /^[A-Za-z]{2,3}\s?\d{1,4}$/;
  const timeToMinutes = (hhmm: string): number | null => {
    if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return null;
    const [h, m] = hhmm.split(':').map(Number);
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
  };
  const minutesToTime = (mins: number): string => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };
  type DateStepErrors = { arrivalDate?: string; departureDate?: string; flightNumber?: string; departureFlightNumber?: string; pickupTime?: string };
  const validateDateStep = (): DateStepErrors => {
    const err: DateStepErrors = {};
    const today = startOfDay(new Date());
    if (data.arrivalDate && startOfDay(data.arrivalDate) < today) err.arrivalDate = t('book.date.errorPast');
    if (data.tripType === 'roundtrip' && data.arrivalDate && data.departureDate) {
      if (startOfDay(data.departureDate) < startOfDay(data.arrivalDate)) err.departureDate = t('book.date.errorDepartureBefore');
    }
    if (data.flightNumber.trim() && !FLIGHT_REGEX.test(data.flightNumber.trim())) err.flightNumber = t('book.date.errorFlightFormat');
    if (data.tripType === 'roundtrip' && data.departureFlightNumber.trim() && !FLIGHT_REGEX.test(data.departureFlightNumber.trim())) err.departureFlightNumber = t('book.date.errorFlightFormat');
    if (data.tripType === 'roundtrip' && data.departureTime && data.pickupTime) {
      const depM = timeToMinutes(data.departureTime);
      const pickM = timeToMinutes(data.pickupTime);
      if (depM !== null && pickM !== null) {
        const diffMinutes = depM - pickM;
        if (diffMinutes < 180) err.pickupTime = t('book.date.errorPickupTooLate');
      }
    }
    return err;
  };
  const [dateStepErrors, setDateStepErrors] = useState<DateStepErrors>({});
  useEffect(() => {
    setDateStepErrors(validateDateStep());
  }, [data.arrivalDate, data.departureDate, data.flightNumber, data.departureFlightNumber, data.tripType, data.departureTime, data.pickupTime, t]);

  // Suggest pickup time 3h before departure when departure time changes (roundtrip)
  useEffect(() => {
    if (data.tripType !== 'roundtrip' || !data.departureTime) return;
    const depM = timeToMinutes(data.departureTime);
    if (depM === null) return;
    const suggestedPickM = Math.max(0, depM - 180);
    const suggested = minutesToTime(suggestedPickM);
    setData((d) => ({ ...d, pickupTime: suggested }));
  }, [data.tripType, data.departureTime]);

  useEffect(() => {
    getExtras().then(setPricingExtras);
  }, [getExtras]);
  useEffect(() => {
    getAreas().then(setAreas);
  }, [getAreas]);

  const FALLBACK_HOTELS: Array<{ id: string; name: string; zone: string }> = [
    { id: 'f-1', name: 'Hyatt Ziva Los Cabos', zone: 'San Jose del Cabo' },
    { id: 'f-2', name: 'JW Marriott Los Cabos', zone: 'San Jose del Cabo' },
    { id: 'f-3', name: 'Hilton Los Cabos', zone: 'San Jose del Cabo' },
    { id: 'f-4', name: 'Grand Velas Los Cabos', zone: 'Port Los Cabos' },
    { id: 'f-5', name: 'Secrets Puerto Los Cabos', zone: 'Port Los Cabos' },
    { id: 'f-6', name: 'Le Blanc Spa Resort', zone: 'Tourist Corridor' },
    { id: 'f-7', name: 'Chileno Bay Resort', zone: 'Tourist Corridor' },
    { id: 'f-8', name: 'Grand Fiesta Americana', zone: 'Tourist Corridor' },
    { id: 'f-9', name: 'Montage Los Cabos', zone: 'Tourist Corridor' },
    { id: 'f-10', name: 'Riu Palace Cabo San Lucas', zone: 'Cabo San Lucas' },
    { id: 'f-11', name: 'Hard Rock Hotel Los Cabos', zone: 'Cabo San Lucas' },
    { id: 'f-12', name: 'Pueblo Bonito Sunset Beach', zone: 'Cabo San Lucas' },
    { id: 'f-13', name: 'Grand Solmar Land\'s End', zone: 'Cabo San Lucas' },
    { id: 'f-14', name: 'Paradisus Los Cabos', zone: 'Cabo Pacific Area' },
    { id: 'f-15', name: 'Rancho San Lucas', zone: 'Cabo Pacific Area' },
  ];

  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [hotelsError, setHotelsError] = useState(false);
  useEffect(() => {
    setHotelsLoading(true);
    setHotelsError(false);
    fetch(getApiBaseUrl() + '/api/pricing/hotels')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load hotels');
        return r.json();
      })
      .then((j) => {
        const data = j.data || [];
        setHotels(data.length > 0 ? data : FALLBACK_HOTELS);
        setHotelsError(false);
      })
      .catch(() => {
        setHotels(FALLBACK_HOTELS);
        setHotelsError(true);
      })
      .finally(() => setHotelsLoading(false));
  }, []);

  // Set airport zone when route changes (SJD = airport)
  useEffect(() => {
    if (data.route === 'airport-hotel') {
      setData((d) => ({ ...d, zoneFrom: 'SJD', zoneTo: d.selectedHotel?.zone || '' }));
    } else if (data.route === 'hotel-airport') {
      setData((d) => ({ ...d, zoneTo: 'SJD', zoneFrom: d.selectedHotel?.zone || '' }));
    }
  }, [data.route]);

  const SJD_AIRPORT = 'SJD International Airport';

  // When hotel selected: set zone, pickup/dropoff, and areaId for pricing (area name matches zone)
  const selectHotel = (hotel: { id: string; name: string; zone: string }) => {
    setData((d) => {
      const next = { ...d, selectedHotel: hotel };
      if (d.route === 'airport-hotel') {
        next.zoneFrom = 'SJD';
        next.zoneTo = hotel.zone;
        next.pickup = SJD_AIRPORT;
        next.dropoff = hotel.name;
      } else if (d.route === 'hotel-airport') {
        next.zoneFrom = hotel.zone;
        next.zoneTo = 'SJD';
        next.pickup = hotel.name;
        next.dropoff = SJD_AIRPORT;
      }
      const zoneForPricing = hotel.zone;
      const area = areas.find((a) => a.name === zoneForPricing || a.name.toLowerCase() === zoneForPricing.toLowerCase());
      if (area) next.areaId = area.id;
      return next;
    });
  };

  // Default first hotel when route set and none selected (one-time); set areaId from zone
  useEffect(() => {
    if (!data.route || data.selectedHotel || hotels.length === 0) return;
    const needZone = data.route === 'airport-hotel' ? !data.zoneTo : !data.zoneFrom;
    if (!needZone) return;
    const first = hotels[0];
    setData((d) => {
      const next = { ...d, selectedHotel: first };
      if (d.route === 'airport-hotel') {
        next.zoneFrom = 'SJD';
        next.zoneTo = first.zone;
        next.pickup = SJD_AIRPORT;
        next.dropoff = first.name;
      } else {
        next.zoneFrom = first.zone;
        next.zoneTo = 'SJD';
        next.pickup = first.name;
        next.dropoff = SJD_AIRPORT;
      }
      const area = areas.find((a) => a.name === first.zone || a.name.toLowerCase() === first.zone.toLowerCase());
      if (area) next.areaId = area.id;
      return next;
    });
  }, [data.route, hotels.length, areas]);

  // When areas load and we already have a selected hotel/zone, set areaId if missing
  useEffect(() => {
    if (areas.length === 0 || data.areaId) return;
    const zone = data.route === 'airport-hotel' ? data.zoneTo : data.route === 'hotel-airport' ? data.zoneFrom : '';
    if (!zone) return;
    const area = areas.find((a) => a.name === zone || a.name.toLowerCase() === zone.toLowerCase());
    if (area) setData((d) => ({ ...d, areaId: area.id }));
  }, [areas, data.route, data.zoneFrom, data.zoneTo, data.areaId]);

  const selectedArea = areas.find((a) => a.id === data.areaId);
  const next = () => setCurrent(c => Math.min(c + 1, steps.length - 1));
  const prev = () => setCurrent(c => Math.max(c - 1, 0));

  const toggleExtra = (code: string) => {
    setData(d => ({ ...d, extras: d.extras.includes(code) ? d.extras.filter((v) => v !== code) : [...d.extras, code] }));
  };
  const toggleActivity = (val: string) => {
    setData(d => {
      const has = d.activities.includes(val);
      if (has) return { ...d, activities: d.activities.filter(v => v !== val) };
      const max = d.comboMode === 'combo' ? 2 : d.comboMode === 'crazy' ? 3 : 0;
      if (d.activities.length >= max) return d;
      return { ...d, activities: [...d.activities, val] };
    });
  };

  // Transport price from selected area + trip type (no hardcoded prices)
  const transferPrice = useMemo(() => {
    if (!data.serviceType || !data.areaId || !data.tripType || !selectedArea) return 0;
    const cents = data.tripType === 'roundtrip' ? selectedArea.roundTripPriceCents : selectedArea.oneWayPriceCents;
    return cents / 100;
  }, [data.serviceType, data.areaId, data.tripType, selectedArea]);

  const activitiesPrice = useMemo(() => {
    if (data.activities.length === 0) return 0;
    if (data.comboMode === 'combo') return 100 * data.passengers;
    if (data.comboMode === 'crazy') return 125 * data.passengers;
    return 0;
  }, [data.activities, data.comboMode, data.passengers]);

  const total = transferPrice + activitiesPrice;

  // Create booking and redirect to checkout
  const handlePayPalCheckout = async () => {
    if (!reviewValidation.valid && reviewValidation.firstInvalidStepIndex !== null) {
      const sectionKey = `book.step.${steps[reviewValidation.firstInvalidStepIndex]}`;
      setBookingError(`${t('book.validation.incomplete')} ${t(sectionKey)}`);
      setCurrent(reviewValidation.firstInvalidStepIndex);
      return;
    }

    const apiBase = getApiBaseUrl();
    if (!apiBase && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setBookingError(lang === 'es' 
        ? 'Error de configuración: Backend no configurado. Por favor contacta soporte.' 
        : 'Configuration error: Backend not configured. Please contact support.');
      return;
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

      // Build items: backend calculates transport from areaId + tripType when provided
      const items: any[] = [];
      const useAreaPricing = data.serviceType && data.areaId && data.tripType && selectedArea;

      items.push({
        type: 'TRANSPORTATION',
        name: useAreaPricing
          ? `Transfer: ${selectedArea.name} (${data.tripType === 'roundtrip' ? 'Round trip' : 'One way'})`
          : `${data.serviceType} ${data.tripType} transfer`,
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

      // Create booking payload (strip undefined to avoid validation issues)
      // Draft customer placeholder; real name/email/phone collected at Checkout
      const bookingPayload: Record<string, unknown> = {
        type: bookingType,
        customer: {
          name: 'Guest',
          email: 'guest@example.com',
          phone: '+1234567890',
          country: 'US',
          language: lang,
        },
        bookingDate: (data.arrivalDate || new Date()).toISOString(),
        bookingTime: data.arrivalTime || '10:00',
        pickupLocation: data.pickup || '',
        dropoffLocation: data.dropoff || '',
        passengers: data.passengers,
        serviceType: data.serviceType,
        tripType: data.tripType,
        route: data.route,
        items,
      };
      if (useAreaPricing) {
        bookingPayload.areaId = data.areaId;
        bookingPayload.tripType = data.tripType;
      }
      if (data.flightNumber) bookingPayload.flightNumber = data.flightNumber;
      if (data.arrivalTime) bookingPayload.arrivalTime = data.arrivalTime;
      if (data.departureFlightNumber) bookingPayload.departureFlightNumber = data.departureFlightNumber;
      if (data.departureTime) bookingPayload.departureTime = data.departureTime;
      if (data.tripType === 'roundtrip' && data.pickupTime) bookingPayload.pickupTime = data.pickupTime;
      if (data.extras.length > 0) bookingPayload.notes = `Extras: ${data.extras.map(getExtraLabel).join(', ')}`;

      // Create booking
      const apiUrl = `${getApiBaseUrl()}/api/bookings`;
      
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
      const lookupToken = result.lookupToken;

      if (!bookingId) {
        throw new Error('No booking ID returned');
      }

      if (lookupToken) {
        sessionStorage.setItem(`bt_${bookingId}`, lookupToken);
      }

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

  const includedExtras = pricingExtras.filter((e) => e.included);
  const excludedExtras = ['EXTRA_STOP', 'WAIT_TIME', 'LATE_NIGHT', 'EARLY_MORNING', 'SPECIAL_ASSISTANCE'];
  const arrivalUpgradeCodes = ['CHAMPAGNE', 'CHAMPAGNE_UPGRADE', 'BIRTHDAY_KIT', 'ROMANTIC_KIT', 'DELUXE_ARRIVAL_KIT'];
  const paidExtrasRaw = pricingExtras.filter((e) => !e.included && !arrivalUpgradeCodes.includes(e.code) && !excludedExtras.includes(e.code));
  const paidExtras = paidExtrasRaw;
  const upsellKits = pricingExtras.filter((e) => !e.included && arrivalUpgradeCodes.includes(e.code));
  const roundTripSuggestedCodes = ['GROCERY_STOP', 'BABY_SEAT'];
  const getExtraLabel = (code: string) => {
    const e = pricingExtras.find((x) => x.code === code);
    if (!e) return code;
    return (lang === 'es' && e.labelEs ? e.labelEs : e.label) || code;
  };

  // Checkout validation — mapped to new 4-step indices: 0=route, 1=date+locations, 2=extras, 3=review
  const reviewValidation = useMemo(() => {
    if (!data.tripType || !data.route || !data.areaId) return { valid: false, firstInvalidStepIndex: 0 };
    if (!data.arrivalDate || Object.values(dateStepErrors).some(Boolean)) return { valid: false, firstInvalidStepIndex: 1 };
    if (data.tripType === 'roundtrip') {
      if (!data.departureDate || !data.departureTime?.trim() || !data.pickupTime?.trim()) return { valid: false, firstInvalidStepIndex: 1 };
    }
    if (!data.pickup?.trim() || !data.dropoff?.trim()) return { valid: false, firstInvalidStepIndex: 1 };
    return { valid: true, firstInvalidStepIndex: null as number | null };
  }, [
    data.tripType,
    data.serviceType,
    data.route,
    data.areaId,
    data.arrivalDate,
    data.departureDate,
    data.departureTime,
    data.pickupTime,
    data.pickup,
    data.dropoff,
    dateStepErrors,
  ]);

  const renderStep = () => {
    switch (steps[current]) {
      case 'route': {
        const zonesOrdered = areas.length > 0 ? areas.map((a) => a.name) : [...new Set(hotels.map((h) => h.zone))].sort();
        const zoneSelected = selectedZoneForHotel ?? data.selectedHotel?.zone ?? null;
        const hotelZone = zoneSelected ? (AREA_TO_HOTEL_ZONE[zoneSelected] || zoneSelected) : '';
        const hotelsInZone = hotelZone ? hotels.filter((h) => h.zone === hotelZone) : [];
        const searchLower = hotelSearch.toLowerCase();
        const filteredHotels = hotelsInZone.filter(
          (h) => h.name.toLowerCase().includes(searchLower)
        );
        return (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                {lang === 'es' ? 'Tu Traslado' : 'Your Transfer'}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {lang === 'es' ? 'Tipo de viaje, dirección y hotel' : 'Trip type, direction & hotel'}
              </p>
            </div>

            {/* Trip type */}
            <div>
              <p className="text-xs font-semibold text-gold uppercase tracking-wider mb-3">{t('book.trip.title')}</p>
              <div className="flex gap-3">
                {[
                  { id: 'oneway' as const, label: t('book.trip.oneWay') },
                  { id: 'roundtrip' as const, label: t('book.trip.roundTrip') },
                ].map(s => (
                  <motion.button
                    key={s.id}
                    onClick={() => setData({ ...data, tripType: s.id })}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn('flex-1 booking-card rounded-xl p-4 text-center', data.tripType === s.id ? 'selected border-gold' : '')}
                  >
                    <p className="font-semibold text-sm text-foreground">{s.label}</p>
                    {data.tripType === s.id && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-5 h-5 rounded-full gold-gradient flex items-center justify-center mx-auto mt-2">
                        <Check size={11} className="text-navy" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Route direction */}
            {data.tripType && (
              <div>
                <p className="text-xs font-semibold text-gold uppercase tracking-wider mb-3">{t('book.route.title')}</p>
                <div className="flex gap-3">
                  {[
                    { id: 'airport-hotel' as const, label: t('book.route.airportToHotel') },
                    { id: 'hotel-airport' as const, label: t('book.route.hotelToAirport') },
                  ].map(s => (
                    <motion.button
                      key={s.id}
                      onClick={() => { setData({ ...data, route: s.id }); setSelectedZoneForHotel(null); }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn('flex-1 booking-card rounded-xl p-4 text-center', data.route === s.id ? 'selected border-gold' : '')}
                    >
                      <p className="font-semibold text-sm text-foreground">{s.label}</p>
                      {data.route === s.id && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-5 h-5 rounded-full gold-gradient flex items-center justify-center mx-auto mt-2">
                          <Check size={11} className="text-navy" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Area + Hotel — shown when route is set */}
            {data.route && (
              <div className="space-y-4 p-4 rounded-xl border border-border bg-muted/20">
                {!zoneSelected ? (
                  <>
                    <p className="text-sm font-semibold text-foreground">
                      {lang === 'es' ? 'Selecciona tu área' : 'Select your area'}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {zonesOrdered.map((zone) => {
                        const hz = AREA_TO_HOTEL_ZONE[zone] || zone;
                        const count = hotels.filter((h) => h.zone === hz).length;
                        return (
                          <button
                            key={zone}
                            type="button"
                            onClick={() => setSelectedZoneForHotel(zone)}
                            className="booking-card rounded-xl p-4 text-left border border-border hover:border-gold/40 transition-all"
                          >
                            <p className="font-semibold text-sm text-foreground">{zone} · {count} {lang === 'es' ? 'hoteles' : 'hotels'}</p>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">
                        {lang === 'es' ? 'Hotel en' : 'Hotel in'} <span className="text-gold">{zoneSelected}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => { setSelectedZoneForHotel(null); setData((d) => ({ ...d, selectedHotel: null })); }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border-2 border-gold text-gold bg-gold/10 hover:bg-gold/20 hover:border-gold transition-all focus:outline-none focus:ring-2 focus:ring-gold/40"
                      >
                        {lang === 'es' ? '← Cambiar área' : '← Change area'}
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder={t('book.locations.searchHotel')}
                      value={hotelSearch}
                      onChange={(e) => setHotelSearch(e.target.value)}
                      className="input-luxury w-full"
                    />
                    <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                      {filteredHotels.map((h) => {
                        const isSelected = data.selectedHotel?.id === h.id;
                        return (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => selectHotel(h)}
                            className={cn(
                              'w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all',
                              isSelected ? 'bg-gold/20 border border-gold' : 'border border-transparent hover:bg-muted/50'
                            )}
                          >
                            {h.name}
                          </button>
                        );
                      })}
                    </div>
                    {filteredHotels.length === 0 && hotelsInZone.length > 0 && (
                      <p className="text-sm text-muted-foreground">{t('book.locations.noHotel')}</p>
                    )}
                    {/* Hotel not listed → WhatsApp */}
                    <a
                      href={`https://wa.me/5216241222174?text=${encodeURIComponent(lang === 'es' ? 'Hola, mi hotel no aparece en la lista. ¿Pueden ayudarme con una cotización?' : 'Hi, my hotel is not listed. Can you help me with a quote?')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#25D366] hover:underline mt-2 font-medium"
                    >
                      <MessageCircle size={14} />
                      {lang === 'es' ? '¿Tu hotel no está en la lista? Contáctanos' : "Hotel not listed? Contact us"}
                    </a>
                  </>
                )}
                {hotelsLoading && <p className="text-sm text-muted-foreground">{t('book.locations.loadingHotels')}</p>}
                {!hotelsLoading && hotelsError && (
                  <div className="space-y-2">
                    <p className="text-sm text-amber-600">
                      {lang === 'es' ? 'No pudimos cargar la lista de hoteles.' : 'Could not load hotel list.'}
                    </p>
                    <a href="https://wa.me/5216241222174" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-[#25D366] font-medium hover:underline">
                      <MessageCircle size={14} />
                      {lang === 'es' ? 'Cotiza por WhatsApp' : 'Get a quote via WhatsApp'}
                    </a>
                  </div>
                )}
                {!hotelsLoading && !hotelsError && hotels.length === 0 && <p className="text-sm text-muted-foreground">{t('book.locations.noHotels')}</p>}
              </div>
            )}
          </div>
        );
      }
      case 'date':
        return (
          <div className="space-y-6">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              {lang === 'es' ? 'Fecha & Detalles' : 'Date & Details'}
            </h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">{t('book.date.arrival')}</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn(
                      "input-luxury w-full flex items-center gap-3 text-left",
                      !data.arrivalDate && "text-muted-foreground",
                      dateStepErrors.arrivalDate && "border-destructive ring-1 ring-destructive"
                    )}>
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
                {dateStepErrors.arrivalDate && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-destructive">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    {dateStepErrors.arrivalDate}
                  </p>
                )}
              </div>
              <InputField label={t('book.date.flightNumber')} icon={<Plane size={18} className="text-gold" />} error={dateStepErrors.flightNumber}>
                <input type="text" placeholder="AA 1234" value={data.flightNumber} onChange={e => setData({ ...data, flightNumber: e.target.value })}
                  className={cn("input-luxury pl-11", dateStepErrors.flightNumber && "border-destructive ring-1 ring-destructive")} />
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
                      <button className={cn(
                        "input-luxury w-full flex items-center gap-3 text-left",
                        !data.departureDate && "text-muted-foreground",
                        dateStepErrors.departureDate && "border-destructive ring-1 ring-destructive"
                      )}>
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
                  {dateStepErrors.departureDate && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-destructive">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      {dateStepErrors.departureDate}
                    </p>
                  )}
                </div>
                <InputField label={t('book.date.flightNumber')} icon={<Plane size={18} className="text-gold" />} error={dateStepErrors.departureFlightNumber}>
                  <input type="text" placeholder="AA 1234" value={data.departureFlightNumber} onChange={e => setData({ ...data, departureFlightNumber: e.target.value })}
                    className={cn("input-luxury pl-11", dateStepErrors.departureFlightNumber && "border-destructive ring-1 ring-destructive")} />
                </InputField>
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
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">{t('book.date.pickupTime')}</label>
                  <div className="relative">
                    <Clock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold pointer-events-none z-10" />
                    <select value={data.pickupTime} onChange={e => setData({ ...data, pickupTime: e.target.value })}
                      className={cn("input-luxury pl-11 w-full appearance-none cursor-pointer", dateStepErrors.pickupTime && "border-destructive ring-1 ring-destructive")}>
                      <option value="">Select time</option>
                      {Array.from({ length: 24 }, (_, h) => [0, 30].map(m => {
                        const val = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                        const label = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
                        return <option key={val} value={val}>{label}</option>;
                      })).flat()}
                    </select>
                  </div>
                  {dateStepErrors.pickupTime && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-destructive">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      {dateStepErrors.pickupTime}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">{t('book.date.pickupSuggestion')}</p>
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
                <motion.button
                  onClick={() => setData((d) => {
                    const minPax = d.serviceType === 'private' && d.vehicleClass === 'SPRINTER' ? 6 : 1;
                    return { ...d, passengers: Math.max(minPax, d.passengers - 1) };
                  })}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 rounded-xl border-2 border-border flex items-center justify-center hover:border-gold/40 hover:bg-gold/5 transition-all"
                >
                  <Minus size={18} />
                </motion.button>
                <span className="text-3xl font-bold w-10 text-center text-foreground">{data.passengers}</span>
                <motion.button
                  onClick={() => setData((d) => {
                    const maxPax = d.serviceType === 'private' && d.vehicleClass === 'SUV' ? 5 : 14;
                    return { ...d, passengers: Math.min(maxPax, d.passengers + 1) };
                  })}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 rounded-xl border-2 border-border flex items-center justify-center hover:border-gold/40 hover:bg-gold/5 transition-all"
                >
                  <Plus size={18} />
                </motion.button>
              </div>
            </div>
            {/* Vehicle class for private */}
            {data.serviceType === 'private' && (
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground mb-3 block">
                  {t('book.vehicle.title', { defaultValue: 'Vehicle' })}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['SUV', 'SPRINTER'] as const).map((vc) => {
                    const paxRange = vc === 'SUV' ? '1-5' : '6-14';
                    return (
                      <button
                        key={vc}
                        onClick={() => setData((d) => {
                          const next = { ...d, vehicleClass: vc };
                          if (vc === 'SPRINTER' && d.passengers < 6) next.passengers = 6;
                          return next;
                        })}
                        className={cn(
                          'px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
                          data.vehicleClass === vc ? 'gold-gradient text-secondary-foreground' : 'border border-border hover:border-gold/40'
                        )}
                      >
                        {vc} ({paxRange})
                      </button>
                    );
                  })}
                </div>
                {data.vehicleClass === 'SUV' && data.passengers >= 5 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    {lang === 'es' ? 'Para 6 o más pasajeros, elige Sprinter.' : 'For 6+ passengers, choose Sprinter.'}
                  </p>
                )}
              </div>
            )}

            {/* Locations — merged into date step */}
            <div className="pt-4 border-t border-border space-y-4">
              <p className="text-xs font-semibold text-gold uppercase tracking-wider">
                {lang === 'es' ? 'Puntos de traslado' : 'Transfer points'}
              </p>
              <p className="text-sm text-muted-foreground -mt-2">
                {lang === 'es' ? 'Pre-llenados según tu hotel. Edita si es necesario.' : 'Pre-filled from your hotel. Edit if needed.'}
              </p>
              <InputField label={t('book.locations.pickup')} icon={<MapPin size={18} className="text-gold" />}>
                <div className="flex gap-3">
                  <input type="text" placeholder={t('book.locations.placeholder')} value={data.pickup}
                    onChange={e => setData({ ...data, pickup: e.target.value })}
                    className="input-luxury pl-11 flex-1" />
                  <button type="button" onClick={() => setData(d => ({ ...d, pickup: SJD_AIRPORT }))}
                    className="text-xs font-bold text-gold border-2 border-gold/30 rounded-xl px-4 hover:bg-gold/5 hover:border-gold/50 transition-all whitespace-nowrap">
                    {t('book.locations.quickFill')}
                  </button>
                </div>
              </InputField>
              <InputField label={t('book.locations.dropoff')} icon={<MapPin size={18} className="text-ocean" />}>
                <div className="flex gap-3">
                  <input type="text" placeholder={t('book.locations.placeholder')} value={data.dropoff}
                    onChange={e => setData({ ...data, dropoff: e.target.value })}
                    className="input-luxury pl-11 flex-1" />
                  <button type="button" onClick={() => setData(d => ({ ...d, dropoff: SJD_AIRPORT }))}
                    className="text-xs font-bold text-gold border-2 border-gold/30 rounded-xl px-4 hover:bg-gold/5 hover:border-gold/50 transition-all whitespace-nowrap">
                    {t('book.locations.quickFill')}
                  </button>
                </div>
              </InputField>
            </div>
          </div>
        );
      case 'extras':
        const isAirportRoute = data.route === 'airport-hotel' || data.route === 'hotel-airport';
        return (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">{t('book.extras.title')}</h2>
              <p className="text-muted-foreground text-sm md:text-base mt-2 leading-relaxed">{t('book.extras.subtitle')}</p>
            </div>

            {/* Included - always shown */}
            {includedExtras.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/50">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider mb-2">
                  {t('book.extras.included', { en: 'Included', es: 'Incluido' })}
                </p>
                <p className="text-sm font-medium text-foreground">
                  {includedExtras.map((e) => (lang === 'es' && e.labelEs ? e.labelEs : e.label)).join(' · ')}
                </p>
              </motion.div>
            )}

            {/* Round trip suggestions */}
            {data.tripType === 'roundtrip' && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-gold/5 border border-gold/20">
                <p className="text-xs font-semibold text-gold uppercase tracking-wider mb-3">
                  {t('book.upsells.roundTripSuggest', { en: 'Popular with round trip guests', es: 'Popular con viajes redondos' })}
                </p>
                <div className="flex flex-wrap gap-2">
                  {roundTripSuggestedCodes.map((code) => {
                    const ex = pricingExtras.find((e) => e.code === code);
                    if (!ex) return null;
                    const selected = data.extras.includes(code);
                    return (
                      <motion.button
                        key={code}
                        type="button"
                        onClick={() => toggleExtra(code)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={cn(
                          'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                          selected ? 'bg-gold/20 border border-gold text-foreground' : 'border border-gold/30 text-muted-foreground hover:border-gold/50 hover:text-foreground'
                        )}
                      >
                        {selected && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          >
                            <Check size={14} className="text-gold" />
                          </motion.span>
                        )}
                        {(lang === 'es' && ex.labelEs ? ex.labelEs : ex.label)} (+${(ex.priceCents / 100).toFixed(0)})
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Paid extras (grocery, baby, oversize, etc.) */}
            {paidExtras.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gold uppercase tracking-wider">{t('book.extras.addOns', { en: 'Add-ons', es: 'Complementos' })}</p>
                {paidExtras.map((ex) => {
                  const selected = data.extras.includes(ex.code);
                  return (
                    <motion.button
                      key={ex.code}
                      type="button"
                      onClick={() => toggleExtra(ex.code)}
                      whileHover={{ scale: 1.01, x: 2 }}
                      whileTap={{ scale: 0.99 }}
                      layout
                      className={cn(
                        'w-full booking-card rounded-xl p-5 text-left flex items-center justify-between transition-all',
                        selected ? 'selected border-gold' : ''
                      )}
                    >
                      <span className="font-medium text-sm text-foreground">{lang === 'es' && ex.labelEs ? ex.labelEs : ex.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gold font-bold">${(ex.priceCents / 100).toFixed(0)}</span>
                        {selected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center flex-shrink-0"
                          >
                            <Check size={15} className="text-navy" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Upgrade kits */}
            {upsellKits.length > 0 && (isAirportRoute || true) && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <p className="text-xs font-semibold text-gold uppercase tracking-wider">{t('book.upsells.arrivalUpgrades', { en: 'Upgrade kits', es: 'Kits de upgrade' })}</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {upsellKits.map((ex) => {
                    const selected = data.extras.includes(ex.code);
                    return (
                      <motion.button
                        key={ex.code}
                        type="button"
                        onClick={() => toggleExtra(ex.code)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          'flex items-center justify-between gap-3 p-4 rounded-xl border text-left transition-all',
                          selected ? 'border-gold bg-gold/5' : 'border-border hover:border-gold/30 glass-card'
                        )}
                      >
                        <span className="font-medium text-sm text-foreground">{lang === 'es' && ex.labelEs ? ex.labelEs : ex.label}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-gold font-bold">${(ex.priceCents / 100).toFixed(0)}</span>
                          {selected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                              className="w-6 h-6 rounded-full gold-gradient flex items-center justify-center"
                            >
                              <Check size={12} className="text-navy" />
                            </motion.div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Activities upsell — merged into extras step */}
            <div className="pt-4 border-t border-border space-y-4">
              <div>
                <p className="text-xs font-semibold text-gold uppercase tracking-wider">
                  {lang === 'es' ? 'Actividades (opcional)' : 'Activities (optional)'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {lang === 'es' ? 'Experiencias exclusivas en Los Cabos' : 'Exclusive experiences in Los Cabos'}
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
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">{t('book.review.title')}</h2>

            {/* Trip summary - premium card */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="glass-card rounded-2xl p-6 md:p-8 space-y-4"
            >
              <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                {lang === 'es' ? 'Resumen del viaje' : 'Trip summary'}
              </h3>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Row label={t('book.review.service')} value={data.serviceType || '—'} />
                <Row label={t('book.review.trip')} value={data.tripType || '—'} />
                <Row label={t('book.review.route')} value={data.route || '—'} />
                <Row label={t('book.review.date')} value={data.arrivalDate ? format(data.arrivalDate, 'PPP') : '—'} />
                <Row label={t('book.review.passengers')} value={String(data.passengers)} />
                <Row label={t('book.review.pickup')} value={data.pickup || '—'} />
                <Row label={t('book.review.dropoff')} value={data.dropoff || '—'} />
                {data.extras.length > 0 && <Row label={t('book.review.extras')} value={data.extras.map(getExtraLabel).join(', ')} className="sm:col-span-2" />}
                {data.activities.length > 0 && (
                  <Row label={t('book.review.activitiesUpsell')} value={data.activities.map(id => {
                    const act = upsellActivities.find(a => a.id === id);
                    return act ? t(act.key) : id;
                  }).join(', ')} className="sm:col-span-2" />
                )}
              </div>
            </motion.div>

            {/* Pricing breakdown - premium */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="glass-card rounded-2xl p-6 md:p-8 border-2 border-gold/20"
            >
              <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">
                {lang === 'es' ? 'Desglose de precios' : 'Price breakdown'}
              </h3>
              <div className="space-y-4">
                {data.serviceType && selectedArea ? (
                  <>
                    <Row
                      label={t('book.review.transferPrice')}
                      value={`$${transferPrice.toFixed(0)} USD`}
                      gold
                    />
                    <p className="text-xs text-muted-foreground">
                      {selectedArea.name} · {data.tripType === 'roundtrip' ? (lang === 'es' ? 'Ida y vuelta' : 'Round trip') : (lang === 'es' ? 'Solo ida' : 'One way')}
                    </p>
                  </>
                ) : data.serviceType && !data.areaId ? (
                  <p className="text-amber-600 dark:text-amber-400 text-sm py-2">{t('book.area.selectToSeePrice')}</p>
                ) : data.serviceType ? (
                  <Row label={t('book.review.transferPrice')} value={`$${transferPrice.toFixed(0)} USD`} gold />
                ) : null}
                {activitiesPrice > 0 && (
                  <Row label={data.comboMode === 'crazy' ? 'Crazy Combo' : data.comboMode === 'combo' ? 'Combo' : t('book.review.activitiesDeposit')}
                    value={`$${activitiesPrice} USD`} gold />
                )}
              </div>

              {/* Total - prominent */}
              <div className="mt-6 pt-6 border-t-2 border-gold/30 bg-gold/5 -mx-6 md:-mx-8 px-6 md:px-8 py-5 rounded-b-2xl">
                <div className="flex justify-between items-center">
                  <span className="font-display text-base font-bold text-foreground">{t('book.review.total')}</span>
                  <span className="text-gold font-display text-2xl font-bold">${total} USD</span>
                </div>
              </div>
            </motion.div>

            {/* Validation alert: incomplete section */}
            {!reviewValidation.valid && reviewValidation.firstInvalidStepIndex !== null && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border-2 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {t('book.validation.incomplete')}{' '}
                    <span className="font-semibold">{stepLabels[steps[reviewValidation.firstInvalidStepIndex]]}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrent(reviewValidation.firstInvalidStepIndex!)}
                  className="shrink-0 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 inline-flex items-center gap-1.5"
                >
                  {t('book.validation.goTo')} <ArrowRight size={14} />
                </button>
              </motion.div>
            )}

            {/* Trust + CTA */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="space-y-4"
            >
              <TrustBadges compact />

              <motion.button
                onClick={handlePayPalCheckout}
                disabled={creatingBooking || !reviewValidation.valid}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                  'w-full py-5 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all',
                  'bg-[#0070ba] hover:bg-[#005ea6] text-white',
                  'shadow-lg shadow-[#0070ba]/25 hover:shadow-xl hover:shadow-[#0070ba]/30',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                )}
              >
                {creatingBooking ? (
                  <>
                    <LuxurySpinner size={22} />
                    {lang === 'es' ? 'Creando reserva...' : 'Creating booking...'}
                  </>
                ) : (
                  <>
                    <Shield size={22} />
                    {t('book.review.paypal')}
                  </>
                )}
              </motion.button>
              {bookingError && (
                <div className="text-center mt-2 space-y-2">
                  <p className="text-sm text-destructive">{bookingError}</p>
                  <a href="https://wa.me/5216241222174" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-[#25D366] font-medium hover:underline">
                    <MessageCircle size={14} />
                    {lang === 'es' ? 'Reservar por WhatsApp' : 'Book via WhatsApp'}
                  </a>
                </div>
              )}
              {!bookingError && !creatingBooking && (
                <p className="text-center text-sm text-muted-foreground">
                  {lang === 'es' ? 'Serás redirigido a PayPal para completar el pago' : 'You will be redirected to PayPal to complete payment'}
                </p>
              )}
            </motion.div>
          </div>
        );
      default:
        return (
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-bold text-foreground">{t('book.title')}</h2>
            <p className="text-muted-foreground text-sm">{lang === 'es' ? 'Cargando...' : 'Loading...'}</p>
          </div>
        );
    }
  };

  const stepLabels: Record<string, string> = {
    route: lang === 'es' ? 'Traslado' : 'Transfer',
    date: lang === 'es' ? 'Fecha' : 'Date',
    extras: lang === 'es' ? 'Extras' : 'Extras',
    review: lang === 'es' ? 'Resumen' : 'Review',
  };

  return (
    <div className="pt-28 pb-36 lg:pb-24 px-4 min-h-screen bg-gradient-to-b from-background to-muted/30">
      <SEO
        title="Book Your Transfer"
        description="Book your private luxury airport transfer in Los Cabos in minutes. Choose your vehicle, route, date, and extras. Secure payment via PayPal."
        keywords="book cabo transfer, reserve los cabos transportation, cabo airport pickup, private driver reservation los cabos"
      />
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">{t('book.title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {(stepLabels[steps[current]] || steps[current])} · {current + 1} {lang === 'es' ? 'de' : 'of'} {steps.length}
          </p>
        </motion.div>

        {/* Modern Stepper */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-10"
        >
          <div className="hidden md:flex items-center justify-between gap-1">
            {steps.map((step, i) => {
              const isActive = i === current;
              const isComplete = i < current;
              const isClickable = i <= current;
              return (
                <div key={step} className="flex flex-1 items-center last:flex-initial">
                  <button
                    type="button"
                    onClick={() => isClickable && setCurrent(i)}
                    disabled={!isClickable}
                    className={cn(
                      'flex flex-col items-center gap-1.5 transition-all duration-300',
                      isClickable && 'cursor-pointer'
                    )}
                  >
                    <div
                      className={cn(
                        'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                        isActive && 'gold-gradient text-secondary-foreground shadow-lg shadow-gold/20 scale-110',
                        isComplete && 'bg-gold/20 text-gold',
                        !isActive && !isComplete && 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isComplete ? <Check size={16} strokeWidth={3} /> : i + 1}
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-medium max-w-[4rem] text-center leading-tight transition-colors',
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {(typeof stepLabels[step] === 'string' ? stepLabels[step] : step).split(' ')[0]}
                    </span>
                  </button>
                  {i < steps.length - 1 && (
                    <div className="flex-1 min-w-[12px] h-0.5 mx-0.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full bg-gold/60 rounded-full"
                        initial={false}
                        animate={{ width: current > i ? '100%' : 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Mobile: compact progress with step label */}
          <div className="md:hidden space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">{stepLabels[steps[current]] || steps[current]}</span>
              <span className="text-xs font-semibold text-gold tabular-nums">{current + 1}/{steps.length}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full gold-gradient rounded-full"
                initial={false}
                animate={{ width: `${((current + 1) / steps.length) * 100}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                style={{ width: `${((current + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Wizard */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Nav buttons - touch-friendly min height on mobile */}
            <motion.div
              layout
              className="flex justify-between items-center mt-10 gap-4 touch-target"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <motion.button
                onClick={prev}
                disabled={current === 0}
                whileHover={current > 0 ? { scale: 1.02 } : {}}
                whileTap={current > 0 ? { scale: 0.98 } : {}}
                className={cn(
                  'flex items-center gap-2 text-sm font-semibold py-3 px-4 rounded-xl transition-all duration-200',
                  'text-muted-foreground hover:text-foreground hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent'
                )}
              >
                <ArrowLeft size={18} /> {t('book.back')}
              </motion.button>
              {current < steps.length - 1 && (
                <motion.button
                  onClick={next}
                  disabled={current === 1 && Object.values(dateStepErrors).some(Boolean)}
                  whileHover={current !== 2 || !Object.values(dateStepErrors).some(Boolean) ? { scale: 1.02 } : {}}
                  whileTap={current !== 2 || !Object.values(dateStepErrors).some(Boolean) ? { scale: 0.98 } : {}}
                  className={cn(
                    "gold-gradient text-navy px-10 py-3.5 rounded-xl text-sm font-bold inline-flex items-center gap-2 shadow-lg shadow-gold/25 transition-shadow",
                    current === 1 && Object.values(dateStepErrors).some(Boolean)
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:shadow-xl hover:shadow-gold/30 active:scale-[0.98]"
                  )}
                >
                  {t('book.next')} <ArrowRight size={18} />
                </motion.button>
              )}
            </motion.div>
          </div>

          {/* Sticky Summary (desktop) */}
          <div className="lg:col-span-2 hidden lg:block">
            <div className="sticky top-32 glass-card rounded-2xl p-6 space-y-4 border-2 border-gold/10">
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
                    {data.extras.map(e => <span key={e} className="inline-block bg-gold/10 text-gold text-xs font-semibold px-2.5 py-1 rounded-full mr-1 mb-1">{getExtraLabel(e)}</span>)}
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
                  <Row label={t('book.review.transferPrice')} value={`$${transferPrice} USD`} gold />
                  {activitiesPrice > 0 && <Row label={data.comboMode === 'crazy' ? 'Crazy Combo' : data.comboMode === 'combo' ? 'Combo' : lang === 'es' ? 'Actividades' : 'Activities'} value={`$${activitiesPrice} USD`} gold />}
                  <div className="border-t-2 border-gold/20 pt-4 mt-2 rounded-xl bg-gold/5 px-4 py-3">
                    <Row label={t('book.review.total')} value={`$${total} USD`} gold bold />
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

      {/* Mobile: sticky CTA bar (Prev/Next) when not on review */}
      {current < steps.length - 1 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/98 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-pb">
          <div className="flex items-center justify-between gap-4 px-4 py-3 min-h-[56px]">
            <motion.button
              onClick={prev}
              disabled={current === 0}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold touch-manipulation min-h-[44px]',
                'text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none'
              )}
            >
              <ArrowLeft size={18} /> {t('book.back')}
            </motion.button>
            <motion.button
              onClick={next}
              disabled={current === 1 && Object.values(dateStepErrors).some(Boolean)}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "gold-gradient text-navy px-6 py-3 rounded-xl text-sm font-bold inline-flex items-center gap-2 touch-manipulation min-h-[44px] shadow-lg shadow-gold/25",
                current === 1 && Object.values(dateStepErrors).some(Boolean) && "opacity-50 cursor-not-allowed pointer-events-none"
              )}
            >
              {t('book.next')} <ArrowRight size={18} />
            </motion.button>
          </div>
        </div>
      )}

      {/* Mobile bottom summary bar - visible on review or as expandable */}
      <div className={cn(
        'lg:hidden fixed left-0 right-0 z-40 bg-card/98 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-pb',
        current < steps.length - 1 ? 'bottom-14' : 'bottom-0'
      )}>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="w-full px-4 py-3 flex items-center justify-between min-h-[48px] touch-manipulation">
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
const InputField = ({ label, icon, error, children }: { label: string; icon: React.ReactNode; error?: string; children: React.ReactNode }) => (
  <div>
    <label className="text-sm font-semibold text-foreground mb-2 block">{label}</label>
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">{icon}</div>
      {children}
    </div>
    {error && (
      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-destructive">
        <AlertCircle size={14} className="flex-shrink-0" />
        {error}
      </p>
    )}
  </div>
);

const Row = ({ label, value, gold, bold, className }: { label: string; value: string; gold?: boolean; bold?: boolean; className?: string }) => (
  <div className={cn('flex justify-between items-baseline gap-3', bold && 'font-bold', className)}>
    <span className="text-muted-foreground text-sm shrink-0">{label}</span>
    <span className={cn(
      gold ? 'text-gold font-semibold' : 'text-foreground',
      bold && 'text-lg',
      'ml-auto truncate max-w-[220px] text-right'
    )}>{value}</span>
  </div>
);

export default Book;
