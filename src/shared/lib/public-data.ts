import { supabasePublic } from '@/shared/lib/supabase-public';
import type {
  AreaPublic,
  PricingExtraPublic,
  PricingRulePublic,
} from '@/features/booking/hooks/usePricing';

export interface PublicHotel {
  id: string;
  name: string;
  zone: string;
  isActive?: boolean;
}

export interface PublicHotelDetail extends PublicHotel {
  slug: string;
  oneWayPriceUSD: number | null;
  roundTripPriceUSD: number | null;
  driveMinutes: number;
}

const DRIVE_MINUTES_BY_ZONE: Record<string, number> = {
  'San Jose del Cabo': 20,
  'Port Los Cabos': 25,
  'Tourist Corridor': 30,
  'Cabo San Lucas': 40,
  'Cabo Pacific Area': 45,
  'Pacific & East Cape': 55,
};

export const toHotelSlug = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

async function requireSupabase() {
  if (!supabasePublic) {
    throw new Error('Supabase public env vars are not configured');
  }
  return supabasePublic;
}

export async function getPublicHotelsFromSupabase(zone?: string): Promise<PublicHotel[]> {
  const supabase = await requireSupabase();
  let query = supabase
    .from('Hotel')
    .select('id, name, zone, isActive')
    .eq('isActive', true)
    .order('zone', { ascending: true })
    .order('name', { ascending: true });

  if (zone) {
    query = query.eq('zone', zone);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PublicHotel[];
}

export async function getPublicAreasFromSupabase(): Promise<AreaPublic[]> {
  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from('Area')
    .select('id, name, oneWayPriceCents, roundTripPriceCents, sprinterOneWayPriceCents, sprinterRoundTripPriceCents, isActive')
    .eq('isActive', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as AreaPublic[];
}

export async function getPublicExtrasFromSupabase(): Promise<PricingExtraPublic[]> {
  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from('PricingExtra')
    .select('code, label, labelEs, priceCents, pricingMode, maxQty, description, included')
    .eq('active', true)
    .neq('code', 'MEET_GREET')
    .order('included', { ascending: false })
    .order('code', { ascending: true });

  if (error) throw error;
  return (data ?? []) as PricingExtraPublic[];
}

export async function getPublicRulesFromSupabase(): Promise<PricingRulePublic[]> {
  const supabase = await requireSupabase();
  const { data, error } = await supabase
    .from('PricingRule')
    .select('zoneFrom, zoneTo, vehicleClass, tripType, basePriceCents, currency')
    .eq('active', true)
    .eq('serviceType', 'TRANSFER')
    .order('zoneFrom', { ascending: true })
    .order('zoneTo', { ascending: true })
    .order('vehicleClass', { ascending: true });

  if (error) throw error;
  return (data ?? []) as PricingRulePublic[];
}

export async function getPublicZonesFromSupabase(): Promise<string[]> {
  const rules = await getPublicRulesFromSupabase();
  const unique = new Set<string>();
  for (const rule of rules) {
    unique.add(rule.zoneFrom);
    unique.add(rule.zoneTo);
  }
  return Array.from(unique).sort((a, b) => a.localeCompare(b));
}

export async function getPublicHotelDetailFromSupabase(slug: string): Promise<PublicHotelDetail | null> {
  const [hotels, areas] = await Promise.all([
    getPublicHotelsFromSupabase(),
    getPublicAreasFromSupabase(),
  ]);

  const hotel = hotels.find((item) => toHotelSlug(item.name) === slug);
  if (!hotel) return null;

  const area = areas.find((item) => item.name.toLowerCase() === hotel.zone.toLowerCase());

  return {
    ...hotel,
    slug,
    oneWayPriceUSD: area ? area.oneWayPriceCents / 100 : null,
    roundTripPriceUSD: area ? area.roundTripPriceCents / 100 : null,
    driveMinutes: DRIVE_MINUTES_BY_ZONE[hotel.zone] ?? 35,
  };
}

