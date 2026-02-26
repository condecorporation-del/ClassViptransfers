import { prisma } from '../lib/prisma';
import { ServiceType, TripType, VehicleClass, ExtraCode, PricingMode } from '@prisma/client';

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

export class PricingService {
  /**
   * Calculate quote for transportation booking
   */
  async calculateQuote(request: QuoteRequest): Promise<QuoteResponse> {
    // Find matching pricing rule
    const whereClause: any = {
      active: true,
      serviceType: request.serviceType as ServiceType,
      tripType: request.tripType as TripType,
      zoneFrom: request.zoneFrom,
      zoneTo: request.zoneTo,
      vehicleClass: request.vehicleClass as VehicleClass,
    };

    // Add passenger constraints if provided
    if (request.passengers) {
      whereClause.AND = [
        {
          OR: [
            { passengersMin: null },
            { passengersMin: { lte: request.passengers } },
          ],
        },
        {
          OR: [
            { passengersMax: null },
            { passengersMax: { gte: request.passengers } },
          ],
        },
      ];
    }

    const pricingRule = await prisma.pricingRule.findFirst({
      where: whereClause,
      orderBy: {
        createdAt: 'desc', // Most recent first
      },
    });

    if (!pricingRule) {
      throw new Error(
        `Pricing not configured for route: ${request.zoneFrom} → ${request.zoneTo} (${request.vehicleClass}, ${request.tripType})`
      );
    }

    // Calculate base price
    let basePriceCents = pricingRule.basePriceCents;
    
    // For round trip, multiply by 2
    if (request.tripType === 'ROUND_TRIP') {
      basePriceCents = basePriceCents * 2;
    }

    // Calculate extras
    const extrasBreakdown: QuoteResponse['extrasBreakdown'] = [];
    let extrasTotalCents = 0;

    if (request.extras && request.extras.length > 0) {
      const extraCodes = request.extras.map(e => e.code);
      const pricingExtras = await prisma.pricingExtra.findMany({
        where: {
          active: true,
          code: {
            in: extraCodes as ExtraCode[],
          },
        },
      });

      for (const requestedExtra of request.extras) {
        const pricingExtra = pricingExtras.find(e => e.code === requestedExtra.code);
        if (!pricingExtra) {
          continue; // Skip invalid extras
        }

        let extraPriceCents = 0;
        
        switch (pricingExtra.pricingMode) {
          case PricingMode.PER_BOOKING:
            extraPriceCents = pricingExtra.priceCents * 1; // Once per booking
            break;
          case PricingMode.PER_STOP:
            extraPriceCents = pricingExtra.priceCents * requestedExtra.qty;
            break;
          case PricingMode.PER_SEAT:
            extraPriceCents = pricingExtra.priceCents * requestedExtra.qty;
            break;
          case PricingMode.PER_HOUR:
            extraPriceCents = pricingExtra.priceCents * requestedExtra.qty;
            break;
        }

        // Apply max quantity limit if set
        if (pricingExtra.maxQty && requestedExtra.qty > pricingExtra.maxQty) {
          throw new Error(`Maximum quantity for ${pricingExtra.label} is ${pricingExtra.maxQty}`);
        }

        extrasTotalCents += extraPriceCents;

        extrasBreakdown.push({
          code: pricingExtra.code,
          label: pricingExtra.label,
          qty: requestedExtra.qty,
          priceCents: extraPriceCents,
          price: extraPriceCents / 100,
        });
      }
    }

    const subtotalCents = basePriceCents + extrasTotalCents;
    const totalCents = subtotalCents; // No tax for now, can be added later

    // Fetch included items for display (never charged)
    const includedExtras = await prisma.pricingExtra.findMany({
      where: { active: true, included: true },
      select: { code: true, label: true },
    });
    const includedBreakdown = includedExtras.map((e) => ({ code: e.code, label: e.label }));

    return {
      basePrice: basePriceCents / 100,
      basePriceCents,
      extrasBreakdown,
      includedBreakdown,
      subtotalCents,
      subtotal: subtotalCents / 100,
      totalCents,
      total: totalCents / 100,
      currency: pricingRule.currency,
      pricingRuleId: pricingRule.id,
    };
  }

  /**
   * Get public pricing rules (read-only, for UI)
   * Returns only active TRANSFER rules with minimal fields
   */
  async getPublicPricingRules() {
    const rules = await prisma.pricingRule.findMany({
      where: {
        active: true,
        serviceType: ServiceType.TRANSFER,
      },
      select: {
        zoneFrom: true,
        zoneTo: true,
        vehicleClass: true,
        tripType: true,
        basePriceCents: true,
        currency: true,
      },
      orderBy: [
        { zoneFrom: 'asc' },
        { zoneTo: 'asc' },
        { vehicleClass: 'asc' },
      ],
    });
    return rules;
  }

  /**
   * Get unique zones for building price table
   */
  async getZones(): Promise<string[]> {
    const rules = await prisma.pricingRule.findMany({
      where: { active: true, serviceType: ServiceType.TRANSFER },
      select: { zoneFrom: true, zoneTo: true },
    });
    const zoneSet = new Set<string>();
    for (const r of rules) {
      zoneSet.add(r.zoneFrom);
      zoneSet.add(r.zoneTo);
    }
    return Array.from(zoneSet).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Get all active pricing rules
   */
  async getPricingRules(includeInactive: boolean = false) {
    return await prisma.pricingRule.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: [
        { serviceType: 'asc' },
        { zoneFrom: 'asc' },
        { zoneTo: 'asc' },
        { vehicleClass: 'asc' },
      ],
    });
  }

  /**
   * Get pricing rule by ID
   */
  async getPricingRuleById(id: string) {
    return await prisma.pricingRule.findUnique({
      where: { id },
    });
  }

  /**
   * Create pricing rule
   */
  async createPricingRule(data: {
    active?: boolean;
    serviceType: ServiceType;
    tripType: TripType;
    zoneFrom: string;
    zoneTo: string;
    vehicleClass: VehicleClass;
    basePriceCents: number;
    currency?: string;
    passengersMin?: number;
    passengersMax?: number;
    notes?: string;
  }) {
    return await prisma.pricingRule.create({
      data: {
        active: data.active ?? true,
        serviceType: data.serviceType,
        tripType: data.tripType,
        zoneFrom: data.zoneFrom,
        zoneTo: data.zoneTo,
        vehicleClass: data.vehicleClass,
        basePriceCents: data.basePriceCents,
        currency: data.currency || 'USD',
        passengersMin: data.passengersMin,
        passengersMax: data.passengersMax,
        notes: data.notes,
      },
    });
  }

  /**
   * Update pricing rule
   */
  async updatePricingRule(id: string, data: {
    active?: boolean;
    serviceType?: ServiceType;
    tripType?: TripType;
    zoneFrom?: string;
    zoneTo?: string;
    vehicleClass?: VehicleClass;
    basePriceCents?: number;
    currency?: string;
    passengersMin?: number;
    passengersMax?: number;
    notes?: string;
  }) {
    return await prisma.pricingRule.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete pricing rule (soft delete)
   */
  async deletePricingRule(id: string) {
    return await prisma.pricingRule.update({
      where: { id },
      data: { active: false },
    });
  }

  /**
   * Get public extras (for booking UI) - included + paid. Meet & Greet excluded.
   */
  async getPublicExtras() {
    const extras = await prisma.pricingExtra.findMany({
      where: {
        active: true,
        code: { not: 'MEET_GREET' },
      },
      select: {
        code: true,
        label: true,
        labelEs: true,
        priceCents: true,
        pricingMode: true,
        maxQty: true,
        description: true,
        included: true,
      },
      orderBy: [{ included: 'desc' }, { code: 'asc' }],
    });
    return extras;
  }

  /**
   * Get all active pricing extras (admin)
   */
  async getPricingExtras(includeInactive: boolean = false) {
    return await prisma.pricingExtra.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: [{ included: 'desc' }, { code: 'asc' }],
    });
  }

  /**
   * Get pricing extra by ID
   */
  async getPricingExtraById(id: string) {
    return await prisma.pricingExtra.findUnique({
      where: { id },
    });
  }

  /**
   * Create pricing extra
   */
  async createPricingExtra(data: {
    active?: boolean;
    included?: boolean;
    code: ExtraCode;
    label: string;
    labelEs?: string;
    priceCents: number;
    pricingMode: PricingMode;
    maxQty?: number;
    description?: string;
  }) {
    return await prisma.pricingExtra.create({
      data: {
        active: data.active ?? true,
        included: data.included ?? false,
        code: data.code,
        label: data.label,
        labelEs: data.labelEs ?? null,
        priceCents: data.priceCents,
        pricingMode: data.pricingMode,
        maxQty: data.maxQty,
        description: data.description,
      },
    });
  }

  /**
   * Update pricing extra
   */
  async updatePricingExtra(id: string, data: {
    active?: boolean;
    included?: boolean;
    code?: ExtraCode;
    label?: string;
    labelEs?: string;
    priceCents?: number;
    pricingMode?: PricingMode;
    maxQty?: number;
    description?: string;
  }) {
    return await prisma.pricingExtra.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete pricing extra (soft delete)
   */
  async deletePricingExtra(id: string) {
    return await prisma.pricingExtra.update({
      where: { id },
      data: { active: false },
    });
  }

  // ─── Areas (dynamic transport pricing) ─────────────────────────────────────

  /**
   * List areas (public: active only; admin: optional includeInactive)
   */
  async listAreas(activeOnly: boolean = true) {
    return await prisma.area.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { name: 'asc' },
    });
  }

  async getAreaById(id: string) {
    return await prisma.area.findUnique({
      where: { id },
    });
  }

  /**
   * Get transport price in cents for an area and trip type (for booking calculation)
   */
  async getTransportPriceByArea(areaId: string, tripType: 'oneway' | 'roundtrip') {
    const area = await prisma.area.findFirst({
      where: { id: areaId, isActive: true },
    });
    if (!area) throw new Error('Area not found or inactive');
    const totalCents = tripType === 'roundtrip' ? area.roundTripPriceCents : area.oneWayPriceCents;
    return { totalCents, area };
  }

  async createArea(data: {
    name: string;
    oneWayPriceCents: number;
    roundTripPriceCents: number;
    isActive?: boolean;
  }) {
    return await prisma.area.create({
      data: {
        name: data.name,
        oneWayPriceCents: data.oneWayPriceCents,
        roundTripPriceCents: data.roundTripPriceCents,
        isActive: data.isActive ?? true,
      },
    });
  }

  async updateArea(
    id: string,
    data: {
      name?: string;
      oneWayPriceCents?: number;
      roundTripPriceCents?: number;
      isActive?: boolean;
    }
  ) {
    return await prisma.area.update({
      where: { id },
      data,
    });
  }

  /**
   * Deactivate area (soft delete)
   */
  async deactivateArea(id: string) {
    return await prisma.area.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

