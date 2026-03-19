import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePricing, type AreaPublic, type PricingExtraPublic } from '@/hooks/usePricing';
import { getApiBaseUrl } from '@/lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface HotelOption {
  id: string;
  name: string;
  zone: string;
}

interface ChatBookingFormData {
  route: 'airport-hotel' | 'hotel-airport';
  zone: string;
  areaId: string;
  selectedHotel: HotelOption | null;
  tripType: 'oneway' | 'roundtrip';
  date: string;
  arrivalFlight: string;
  arrivalTime: string;
  departureFlight: string;
  departureTime: string;
  pickupTime: string;
  passengers: number;
  extras: string[];
  comboMode: '' | 'combo' | 'crazy';
  name: string;
  email: string;
  phone: string;
}

const SJD_AIRPORT = 'SJD International Airport';

// Mapeo área → zona de hoteles (areas y hotels usan nombres distintos en algunos casos)
const AREA_TO_HOTEL_ZONE: Record<string, string> = {
  'Corredor Turistico': 'Tourist Corridor',
  'Tourist Corridor': 'Tourist Corridor',
  'East Cape': 'Pacific & East Cape',
  'Pacific & East Cape': 'Pacific & East Cape',
};

interface ChatBookingFormProps {
  lang: 'en' | 'es';
  onClose: () => void;
}

export function ChatBookingForm({ lang, onClose }: ChatBookingFormProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { getAreas, getExtras } = usePricing();
  const [step, setStep] = useState(1);
  const [areas, setAreas] = useState<AreaPublic[]>([]);
  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [hotelSearch, setHotelSearch] = useState('');
  const [paidExtras, setPaidExtras] = useState<PricingExtraPublic[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [data, setData] = useState<ChatBookingFormData>({
    route: 'airport-hotel',
    zone: '',
    areaId: '',
    selectedHotel: null,
    tripType: 'oneway',
    date: new Date().toISOString().slice(0, 10),
    arrivalFlight: '',
    arrivalTime: '10:00',
    departureFlight: '',
    departureTime: '',
    pickupTime: '',
    passengers: 1,
    extras: [],
    comboMode: '',
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      getAreas(),
      getExtras().then((ex) => ex.filter((e) => !e.included && e.priceCents > 0)),
    ])
      .then(([a, ex]) => {
        setAreas(a);
        setPaidExtras(ex);
      })
      .finally(() => setLoadingData(false));
  }, [getAreas, getExtras]);

  useEffect(() => {
    fetch(getApiBaseUrl() + '/api/pricing/hotels')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load hotels');
        return r.json();
      })
      .then((j) => setHotels(j.data || []))
      .catch(() => setHotels([]));
  }, []);

  // Pickup 3h before departure when departureTime changes (round trip)
  useEffect(() => {
    if (data.tripType !== 'roundtrip' || !data.departureTime) return;
    const depM = timeToMinutes(data.departureTime);
    if (depM === null) return;
    const suggestedPickM = Math.max(0, depM - 180);
    setData((d) => ({ ...d, pickupTime: minutesToTime(suggestedPickM) }));
  }, [data.tripType, data.departureTime]);

  const update = (k: keyof ChatBookingFormData, v: string | number | string[] | HotelOption | null) =>
    setData((d) => ({ ...d, [k]: v }));

  const toggleExtra = (code: string) => {
    setData((d) => ({
      ...d,
      extras: d.extras.includes(code) ? d.extras.filter((x) => x !== code) : [...d.extras, code],
    }));
  };

  const selectHotel = (hotel: HotelOption) => {
    setData((d) => {
      const area = areas.find(
        (a) =>
          a.name === hotel.zone ||
          a.name.toLowerCase() === hotel.zone.toLowerCase() ||
          (AREA_TO_HOTEL_ZONE[a.name] || a.name) === hotel.zone
      );
      return {
        ...d,
        selectedHotel: hotel,
        areaId: area?.id ?? d.areaId,
      };
    });
  };

  const selectedArea = areas.find((a) => a.name === data.zone);
  const hotelZone = data.zone ? (AREA_TO_HOTEL_ZONE[data.zone] || data.zone) : '';
  const hotelsInZone = hotelZone ? hotels.filter((h) => h.zone === hotelZone) : [];
  const searchLower = hotelSearch.toLowerCase();
  const filteredHotels = hotelsInZone.filter((h) => h.name.toLowerCase().includes(searchLower));

  const arrivalFlightValid = FLIGHT_REGEX.test(data.arrivalFlight.trim());
  const departureFlightValid = FLIGHT_REGEX.test(data.departureFlight.trim());

  const isStep1Valid =
    data.zone &&
    data.areaId &&
    data.selectedHotel &&
    arrivalFlightValid &&
    data.arrivalTime &&
    (data.tripType !== 'roundtrip' ||
      (departureFlightValid && data.departureTime && data.pickupTime));

  const isStep2Valid = true;
  const isStep3Valid = true;
  const isStep4Valid =
    data.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()) &&
    data.phone.trim().length >= 8;

  const handleSubmit = async () => {
    if (!selectedArea || !data.selectedHotel || !isStep4Valid) return;
    setSubmitting(true);

    const transportPrice =
      data.tripType === 'roundtrip' ? selectedArea.roundTripPriceCents / 100 : selectedArea.oneWayPriceCents / 100;
    const items: { type: string; name: string; quantity: number; unitPrice: number }[] = [
      {
        type: 'TRANSPORTATION',
        name: `Transfer: ${selectedArea.name} (${data.tripType === 'roundtrip' ? 'Round trip' : 'One way'})`,
        quantity: 1,
        unitPrice: transportPrice,
      },
    ];
    if (data.comboMode === 'combo') {
      items.push({ type: 'COMBO', name: 'Combo', quantity: data.passengers, unitPrice: 100 });
    } else if (data.comboMode === 'crazy') {
      items.push({ type: 'CRAZY_COMBO', name: 'Crazy Combo', quantity: data.passengers, unitPrice: 125 });
    }

    const pickup =
      data.route === 'airport-hotel' ? SJD_AIRPORT : data.selectedHotel.name;
    const dropoff =
      data.route === 'airport-hotel' ? data.selectedHotel.name : SJD_AIRPORT;

    const bookingType = data.comboMode ? (data.comboMode === 'crazy' ? 'CRAZY_COMBO' : 'COMBO') : 'TRANSPORTATION';

    const payload: Record<string, unknown> = {
      type: bookingType,
      customer: {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        language: lang,
      },
      bookingDate: new Date(data.date + 'T12:00:00').toISOString(),
      bookingTime: data.arrivalTime,
      pickupLocation: pickup,
      dropoffLocation: dropoff,
      flightNumber: data.arrivalFlight.trim(),
      passengers: data.passengers,
      serviceType: 'private',
      tripType: data.tripType,
      areaId: data.areaId,
      items,
      notes: data.extras.length > 0 ? `Extras: ${data.extras.join(', ')}` : undefined,
    };

    if (data.tripType === 'roundtrip') {
      payload.departureFlightNumber = data.departureFlight.trim();
      payload.departureTime = data.departureTime;
      payload.pickupTime = data.pickupTime;
    }

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create booking');
      }
      const json = await res.json();
      const bookingId = json.data?.id;
      if (bookingId) navigate(`/checkout?bookingId=${bookingId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (lang === 'es' ? 'Error al crear la reserva' : 'Error creating booking');
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalSteps = 4;

  return (
    <div className="rounded-xl border border-gold/30 bg-card/95 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gold uppercase tracking-wider">
          {lang === 'es' ? `Paso ${step} de ${totalSteps}` : `Step ${step} of ${totalSteps}`}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {lang === 'es' ? 'Cerrar' : 'Close'}
        </button>
      </div>

      {/* Step 1 - Transport + Flight info */}
      {step === 1 && (
        <div className="space-y-3">
          {loadingData ? (
            <p className="text-sm text-muted-foreground">{t('book.area.loading')}</p>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground">{t('book.route.title')}</p>
              <div className="flex gap-2">
                {(['airport-hotel', 'hotel-airport'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      update('route', r);
                      update('selectedHotel', null);
                    }}
                    className={cn(
                      'flex-1 py-2 rounded-lg text-xs font-medium transition-colors',
                      data.route === r ? 'bg-gold text-navy' : 'bg-muted text-foreground hover:bg-gold/20'
                    )}
                  >
                    {r === 'airport-hotel' ? t('book.route.airportToHotel') : t('book.route.hotelToAirport')}
                  </button>
                ))}
              </div>

              <p className="text-sm font-medium text-foreground">{lang === 'es' ? 'Zona' : 'Zone'}</p>
              <div className="flex flex-wrap gap-1.5">
                {areas.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      update('zone', a.name);
                      update('areaId', a.id);
                      update('selectedHotel', null);
                    }}
                    className={cn(
                      'px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                      data.zone === a.name ? 'bg-gold text-navy' : 'bg-muted text-foreground hover:bg-gold/20'
                    )}
                  >
                    {a.name}
                  </button>
                ))}
              </div>

              {data.zone && (
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {lang === 'es' ? 'Hotel' : 'Hotel'}
                  </p>
                  <input
                    type="text"
                    placeholder={lang === 'es' ? 'Buscar hotel...' : 'Search hotel...'}
                    value={hotelSearch}
                    onChange={(e) => setHotelSearch(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-sm bg-background border border-border"
                  />
                  <div className="max-h-32 overflow-y-auto mt-1 space-y-1 pr-1">
                    {filteredHotels.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => selectHotel(h)}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-lg text-xs transition-colors',
                          data.selectedHotel?.id === h.id
                            ? 'bg-gold text-navy'
                            : 'bg-muted text-foreground hover:bg-gold/20'
                        )}
                      >
                        {h.name}
                      </button>
                    ))}
                    {filteredHotels.length === 0 && hotelsInZone.length > 0 && (
                      <p className="text-xs text-muted-foreground px-2">
                        {lang === 'es' ? 'Sin coincidencias' : 'No matches'}
                      </p>
                    )}
                    {hotelsInZone.length === 0 && data.zone && (
                      <p className="text-xs text-muted-foreground px-2">
                        {lang === 'es' ? 'No hay hoteles en esta zona' : 'No hotels in this zone'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <p className="text-sm font-medium text-foreground">{t('book.trip.title')}</p>
              <select
                value={data.tripType}
                onChange={(e) => update('tripType', e.target.value as 'oneway' | 'roundtrip')}
                className="w-full px-3 py-2 rounded-lg text-sm bg-background border border-border"
              >
                <option value="oneway">{t('book.trip.oneWay')}</option>
                <option value="roundtrip">{t('book.trip.roundTrip')}</option>
              </select>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    {t('book.date.arrival')}
                  </label>
                  <input
                    type="date"
                    value={data.date}
                    onChange={(e) => update('date', e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-sm bg-background border border-border"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    {lang === 'es' ? 'Hora de aterrizaje' : 'Arrival time'}
                  </label>
                  <input
                    type="time"
                    value={data.arrivalTime}
                    onChange={(e) => update('arrivalTime', e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg text-sm bg-background border border-border"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {lang === 'es' ? 'Número de vuelo llegada' : 'Arrival flight'}
                </label>
                <input
                  type="text"
                  placeholder="AA 1234"
                  value={data.arrivalFlight}
                  onChange={(e) => update('arrivalFlight', e.target.value)}
                  className={cn(
                    'w-full mt-1 px-3 py-2 rounded-lg text-sm bg-background border',
                    arrivalFlightValid || !data.arrivalFlight.trim()
                      ? 'border-border'
                      : 'border-destructive'
                  )}
                />
                {data.arrivalFlight.trim() && !arrivalFlightValid && (
                  <p className="text-xs text-destructive mt-0.5">
                    {lang === 'es' ? 'Formato: AA 1234' : 'Format: AA 1234'}
                  </p>
                )}
              </div>

              {data.tripType === 'roundtrip' && (
                <>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      {lang === 'es' ? 'Número de vuelo salida' : 'Departure flight'}
                    </label>
                    <input
                      type="text"
                      placeholder="AA 1234"
                      value={data.departureFlight}
                      onChange={(e) => update('departureFlight', e.target.value)}
                      className={cn(
                        'w-full mt-1 px-3 py-2 rounded-lg text-sm bg-background border',
                        departureFlightValid || !data.departureFlight.trim()
                          ? 'border-border'
                          : 'border-destructive'
                      )}
                    />
                    {data.departureFlight.trim() && !departureFlightValid && (
                      <p className="text-xs text-destructive mt-0.5">
                        {lang === 'es' ? 'Formato: AA 1234' : 'Format: AA 1234'}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        {lang === 'es' ? 'Hora salida vuelo' : 'Departure time'}
                      </label>
                      <input
                        type="time"
                        value={data.departureTime}
                        onChange={(e) => update('departureTime', e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-lg text-sm bg-background border border-border"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        {lang === 'es' ? 'Pickup (3h antes)' : 'Pickup (3h before)'}
                      </label>
                      <input
                        type="time"
                        value={data.pickupTime}
                        onChange={(e) => update('pickupTime', e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-lg text-sm bg-background border border-border"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {t('book.date.passengers')}
                </label>
                <div className="flex gap-1.5 mt-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => update('passengers', n)}
                      className={cn(
                        'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                        data.passengers === n
                          ? 'bg-gold text-navy'
                          : 'bg-muted text-foreground hover:bg-gold/20'
                      )}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => update('passengers', 6)}
                    className={cn(
                      'px-3 h-10 rounded-lg text-sm font-medium transition-colors',
                      data.passengers >= 6
                        ? 'bg-gold text-navy'
                        : 'bg-muted text-foreground hover:bg-gold/20'
                    )}
                  >
                    5+
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 2 - Extras */}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">{t('book.extras.addOns')}</p>
          <div className="flex flex-wrap gap-2">
            {paidExtras.map((ex) => {
              const sel = data.extras.includes(ex.code);
              return (
                <button
                  key={ex.code}
                  type="button"
                  onClick={() => toggleExtra(ex.code)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                    sel ? 'bg-gold text-navy' : 'bg-muted text-foreground hover:bg-gold/20'
                  )}
                >
                  {lang === 'es' && ex.labelEs ? ex.labelEs : ex.label} (+${(ex.priceCents / 100).toFixed(0)})
                </button>
              );
            })}
            {paidExtras.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {lang === 'es' ? 'Ningún extra de pago' : 'No paid extras'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step 3 - Activities */}
      {step === 3 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">{t('book.step.activities')}</p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => update('comboMode', '')}
              className={cn(
                'w-full py-2 rounded-lg text-sm font-medium text-left px-3 transition-colors',
                data.comboMode === '' ? 'bg-gold text-navy' : 'bg-muted text-foreground hover:bg-gold/20'
              )}
            >
              {lang === 'es' ? 'Solo transporte' : 'Transport only'}
            </button>
            <button
              type="button"
              onClick={() => update('comboMode', 'combo')}
              className={cn(
                'w-full py-2 rounded-lg text-sm font-medium text-left px-3 transition-colors',
                data.comboMode === 'combo' ? 'bg-gold text-navy' : 'bg-muted text-foreground hover:bg-gold/20'
              )}
            >
              Combo $100 — {lang === 'es' ? '2 actividades' : '2 activities'}
            </button>
            <button
              type="button"
              onClick={() => update('comboMode', 'crazy')}
              className={cn(
                'w-full py-2 rounded-lg text-sm font-medium text-left px-3 transition-colors',
                data.comboMode === 'crazy' ? 'bg-gold text-navy' : 'bg-muted text-foreground hover:bg-gold/20'
              )}
            >
              Crazy Combo $125 — {lang === 'es' ? '3 actividades' : '3 activities'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4 - Personal data */}
      {step === 4 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            {lang === 'es' ? 'Datos personales' : 'Personal data'}
          </p>
          <input
            type="text"
            placeholder={lang === 'es' ? 'Nombre completo' : 'Full name'}
            value={data.name}
            onChange={(e) => update('name', e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm bg-background border border-border"
          />
          <input
            type="email"
            placeholder={lang === 'es' ? 'Correo electrónico' : 'Email'}
            value={data.email}
            onChange={(e) => update('email', e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm bg-background border border-border"
          />
          <input
            type="tel"
            placeholder={lang === 'es' ? 'Teléfono' : 'Phone'}
            value={data.phone}
            onChange={(e) => update('phone', e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm bg-background border border-border"
          />
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-gold hover:bg-gold/15 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} /> {lang === 'es' ? 'Atrás' : 'Back'}
        </button>
        {step < totalSteps ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 1 && !isStep1Valid}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold bg-gold text-navy hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {lang === 'es' ? 'Siguiente' : 'Next'} <ChevronRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isStep4Valid || submitting}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-gold text-navy hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? lang === 'es'
                ? 'Procesando...'
                : 'Processing...'
              : lang === 'es'
                ? 'Reservar'
                : 'Book'}
          </button>
        )}
      </div>
    </div>
  );
}
