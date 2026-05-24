import { useQuery } from '@tanstack/react-query';
import { getApiBaseUrl } from '@/shared/lib/api';
import {
  getPublicAreasFromSupabase,
  getPublicExtrasFromSupabase,
  getPublicHotelsFromSupabase,
} from '@/shared/lib/public-data';
import type { AreaPublic, PricingExtraPublic } from '@/features/booking/hooks/usePricing';
import type { HotelOption } from '@/features/booking/hooks/useBookingForm';

const FALLBACK_HOTELS: HotelOption[] = [
  { id: 'f-1', name: 'Hyatt Ziva Los Cabos', zone: 'San Jose del Cabo' },
  { id: 'f-2', name: 'JW Marriott Los Cabos', zone: 'San Jose del Cabo' },
  { id: 'f-3', name: 'Hilton Los Cabos', zone: 'San Jose del Cabo' },
  { id: 'f-4', name: 'Grand Velas Los Cabos', zone: 'Puerto Los Cabos' },
  { id: 'f-5', name: 'Secrets Puerto Los Cabos', zone: 'Puerto Los Cabos' },
  { id: 'f-6', name: 'Le Blanc Spa Resort', zone: 'Tourist Corridor' },
  { id: 'f-7', name: 'Chileno Bay Resort', zone: 'Tourist Corridor' },
  { id: 'f-8', name: 'Grand Fiesta Americana', zone: 'Tourist Corridor' },
  { id: 'f-9', name: 'Montage Los Cabos', zone: 'Tourist Corridor' },
  { id: 'f-10', name: 'Riu Palace Cabo San Lucas', zone: 'Cabo San Lucas' },
  { id: 'f-11', name: 'Hard Rock Hotel Los Cabos', zone: 'Cabo San Lucas' },
  { id: 'f-12', name: 'Pueblo Bonito Sunset Beach', zone: 'Cabo San Lucas' },
  { id: 'f-13', name: "Grand Solmar Land's End", zone: 'Cabo San Lucas' },
  { id: 'f-14', name: 'Paradisus Los Cabos', zone: 'Cabo Pacific Area' },
  { id: 'f-15', name: 'Rancho San Lucas', zone: 'Cabo Pacific Area' },
];

async function fetchPublicJson<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`);
  if (!response.ok) throw new Error(`Failed to fetch ${path}`);
  const json = await response.json();
  return json.data ?? [];
}

async function fetchBookingHotels(): Promise<{ hotels: HotelOption[]; usedFallback: boolean }> {
  try {
    const hotels = await fetchPublicJson<HotelOption[]>('/api/pricing/hotels');
    if (hotels.length > 0) return { hotels, usedFallback: false };
  } catch {
    // Try Supabase fallback below.
  }

  try {
    const fallbackHotels = await getPublicHotelsFromSupabase();
    if (fallbackHotels.length > 0) {
      return { hotels: fallbackHotels, usedFallback: false };
    }
  } catch {
    // Use static fallback below.
  }

  return { hotels: FALLBACK_HOTELS, usedFallback: true };
}

async function fetchBookingAreas(): Promise<AreaPublic[]> {
  try {
    return await fetchPublicJson<AreaPublic[]>('/api/pricing/areas');
  } catch {
    return getPublicAreasFromSupabase();
  }
}

async function fetchBookingExtras(): Promise<PricingExtraPublic[]> {
  try {
    return await fetchPublicJson<PricingExtraPublic[]>('/api/pricing/extras');
  } catch {
    return getPublicExtrasFromSupabase();
  }
}

export function useBookingCatalog() {
  const extrasQuery = useQuery({
    queryKey: ['booking', 'extras'],
    queryFn: fetchBookingExtras,
    staleTime: 5 * 60 * 1000,
  });

  const areasQuery = useQuery({
    queryKey: ['booking', 'areas'],
    queryFn: fetchBookingAreas,
    staleTime: 5 * 60 * 1000,
  });

  const hotelsQuery = useQuery({
    queryKey: ['booking', 'hotels'],
    queryFn: fetchBookingHotels,
    staleTime: 5 * 60 * 1000,
  });

  return {
    pricingExtras: extrasQuery.data ?? [],
    areas: areasQuery.data ?? [],
    hotels: hotelsQuery.data?.hotels ?? [],
    hotelsError: hotelsQuery.data?.usedFallback ?? false,
    hotelsLoading: hotelsQuery.isLoading,
    quoteLoading: extrasQuery.isLoading || areasQuery.isLoading,
  };
}
