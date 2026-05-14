import { useState, useCallback, useEffect } from 'react';
import { getApiBaseUrl } from '@/shared/lib/api';
import { getErrorMessage } from '@/shared/lib/errors';

export interface PricingRulePublic {
  zoneFrom: string;
  zoneTo: string;
  vehicleClass: string;
  tripType: string;
  basePriceCents: number;
  currency: string;
}

export interface QuoteRequest {
  serviceType: 'TRANSFER';
  tripType: 'ONE_WAY' | 'ROUND_TRIP';
  zoneFrom: string;
  zoneTo: string;
  vehicleClass: string;
  passengers?: number;
  extras?: Array<{
    code: string;
    qty: number;
  }>;
}

export interface QuoteResponse {
  basePrice: number;
  basePriceCents: number;
  extrasBreakdown: Array<{
    code: string;
    label: string;
    qty: number;
    priceCents: number;
    price: number;
  }>;
  includedBreakdown?: Array<{ code: string; label: string }>;
  subtotalCents: number;
  subtotal: number;
  totalCents: number;
  total: number;
  currency: string;
  pricingRuleId?: string;
}

export interface PricingExtraPublic {
  code: string;
  label: string;
  labelEs: string | null;
  priceCents: number;
  pricingMode: string;
  maxQty: number | null;
  description: string | null;
  included: boolean;
}

export interface AreaPublic {
  id: string;
  name: string;
  oneWayPriceCents: number;
  roundTripPriceCents: number;
  sprinterOneWayPriceCents: number;
  sprinterRoundTripPriceCents: number;
  isActive: boolean;
}

export function usePricing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRules = useCallback(async (): Promise<PricingRulePublic[]> => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/pricing/rules`);
      if (!response.ok) throw new Error('Failed to fetch rules');
      const json = await response.json();
      return json.data ?? [];
    } catch {
      return [];
    }
  }, []);

  const getZones = useCallback(async (): Promise<string[]> => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/pricing/zones`);
      if (!response.ok) throw new Error('Failed to fetch zones');
      const json = await response.json();
      return json.data ?? [];
    } catch {
      return [];
    }
  }, []);

  const getQuote = useCallback(async (request: QuoteRequest): Promise<QuoteResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/pricing/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get quote');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      setError(getErrorMessage(error, 'Failed to calculate quote'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getExtras = useCallback(async (): Promise<PricingExtraPublic[]> => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/pricing/extras`);
      if (!response.ok) throw new Error('Failed to fetch extras');
      const json = await response.json();
      return json.data ?? [];
    } catch {
      return [];
    }
  }, []);

  const getAreas = useCallback(async (): Promise<AreaPublic[]> => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/pricing/areas`);
      if (!response.ok) throw new Error('Failed to fetch areas');
      const json = await response.json();
      return json.data ?? [];
    } catch {
      return [];
    }
  }, []);

  return { getQuote, getRules, getZones, getExtras, getAreas, loading, error };
}

const MIN_LOADING_MS = 400;

/** Hook to fetch pricing rules and zones for table display. Uses minimum loading time for slow connections. */
export function usePricingTable() {
  const [rules, setRules] = useState<PricingRulePublic[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getRules, getZones } = usePricing();

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    setLoading(true);
    setError(null);
    const start = Date.now();
    Promise.all([getRules(), getZones()])
      .then(([r, z]) => {
        if (mounted) {
          setRules(r);
          setZones(z);
        }
      })
      .catch(() => mounted && setError('Failed to load pricing'))
      .finally(() => {
        if (!mounted) return;
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
        timeoutId = setTimeout(() => mounted && setLoading(false), remaining);
      });
    return () => {
      mounted = false;
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, [getRules, getZones]);

  return { rules, zones, loading, error };
}

