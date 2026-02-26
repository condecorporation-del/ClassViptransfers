import { useState, useEffect } from 'react';
import { usePricing, QuoteRequest } from '@/hooks/usePricing';
import { Loader2 } from 'lucide-react';

interface TransportQuoteProps {
  tripType: 'ONE_WAY' | 'ROUND_TRIP';
  zoneFrom: string;
  zoneTo: string;
  vehicleClass: string;
  passengers?: number;
  extras?: Array<{ code: string; qty: number }>;
  onQuoteChange?: (quote: any) => void;
}

// Zone options
export const ZONES = [
  'SJD',
  'Cabo San Lucas',
  'San Jose',
  'Corridor',
  'Todos Santos',
  'La Paz',
];

// Vehicle class options
export const VEHICLE_CLASSES = [
  { value: 'SUV', label: 'SUV (1-5 passengers)' },
  { value: 'SPRINTER', label: 'Sprinter (6-14 passengers)' },
];

export function TransportQuote({
  tripType,
  zoneFrom,
  zoneTo,
  vehicleClass,
  passengers = 1,
  extras = [],
  onQuoteChange,
}: TransportQuoteProps) {
  const { getQuote, loading, error } = usePricing();
  const [quote, setQuote] = useState<any>(null);

  useEffect(() => {
    if (!zoneFrom || !zoneTo || !vehicleClass) {
      setQuote(null);
      return;
    }

    const fetchQuote = async () => {
      const request: QuoteRequest = {
        serviceType: 'TRANSFER',
        tripType,
        zoneFrom,
        zoneTo,
        vehicleClass,
        passengers,
        extras,
      };

      const result = await getQuote(request);
      if (result) {
        setQuote(result);
        onQuoteChange?.(result);
      }
    };

    fetchQuote();
  }, [tripType, zoneFrom, zoneTo, vehicleClass, passengers, JSON.stringify(extras), getQuote, onQuoteChange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Calculating price...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (!quote) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Base Price</span>
        <span className="text-sm font-semibold">${quote.basePrice.toFixed(2)}</span>
      </div>

      {quote.extrasBreakdown.length > 0 && (
        <div className="space-y-2 border-t pt-3">
          <div className="text-xs font-medium text-muted-foreground">Extras</div>
          {quote.extrasBreakdown.map((extra: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {extra.label} {extra.qty > 1 && `× ${extra.qty}`}
              </span>
              <span className="font-medium">${extra.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-base font-semibold">Total</span>
        <span className="text-xl font-bold text-primary">
          {quote.currency} ${quote.total.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

