import { Request, Response } from 'express';
import { prisma } from '../../../shared/lib/prisma';
import { PricingService } from '../services/pricing.service';
import { createAuditLog } from '../../../shared/lib/audit';
import { getErrorMessage } from '../../../shared/lib/errors';
import { ServiceType, TripType, VehicleClass, ExtraCode, PricingMode } from '@prisma/client';

const pricingService = new PricingService();

export class PricingController {
  /**
   * GET /api/pricing/rules
   * Public endpoint - active pricing rules for UI (read-only)
   */
  async getPublicRules(req: Request, res: Response) {
    try {
      const rules = await pricingService.getPublicPricingRules();
      res.json({
        success: true,
        data: rules,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: getErrorMessage(error, ),
      });
    }
  }

  /**
   * GET /api/pricing/hotels
   * Public endpoint - active hotels grouped by zone
   */
  async getHotels(req: Request, res: Response) {
    try {
      const zone = req.query.zone as string | undefined;
      const hotels = await prisma.hotel.findMany({
        where: { isActive: true, ...(zone ? { zone } : {}) },
        orderBy: [{ zone: 'asc' }, { name: 'asc' }],
      });
      res.json({ success: true, data: hotels });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: getErrorMessage(error, ),
      });
    }
  }

  /**
   * GET /api/pricing/extras
   * Public endpoint - active pricing extras (included + paid) for booking UI
   */
  async getPublicExtras(req: Request, res: Response) {
    try {
      const extras = await pricingService.getPublicExtras();
      res.json({ success: true, data: extras });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: getErrorMessage(error, ),
      });
    }
  }

  /**
   * GET /api/pricing/areas
   * Public endpoint - active areas for booking UI
   */
  async getPublicAreas(req: Request, res: Response) {
    try {
      const areas = await pricingService.listAreas(true);
      res.json({ success: true, data: areas });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: getErrorMessage(error, ),
      });
    }
  }

  /**
   * GET /api/pricing/zones
   * Public endpoint - unique zones for price table
   */
  async getZones(req: Request, res: Response) {
    try {
      const zones = await pricingService.getZones();
      res.json({
        success: true,
        data: zones,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: getErrorMessage(error, ),
      });
    }
  }

  /**
   * POST /api/pricing/quote
   * Public endpoint to get pricing quote
   */
  async getQuote(req: Request, res: Response) {
    try {
      const {
        serviceType,
        tripType,
        zoneFrom,
        zoneTo,
        vehicleClass,
        passengers,
        extras,
      } = req.body;

      if (!serviceType || !tripType || !zoneFrom || !zoneTo || !vehicleClass) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: serviceType, tripType, zoneFrom, zoneTo, vehicleClass',
        });
      }

      const quote = await pricingService.calculateQuote({
        serviceType: serviceType as 'TRANSFER',
        tripType: tripType as 'ONE_WAY' | 'ROUND_TRIP',
        zoneFrom,
        zoneTo,
        vehicleClass,
        passengers,
        extras,
      });

      res.json({
        success: true,
        data: quote,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: getErrorMessage(error, ),
      });
    }
  }

  /**
   * GET /api/admin/pricing/rules
   * List pricing rules
   */
  async listRules(req: Request, res: Response) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const rules = await pricingService.getPricingRules(includeInactive);

      res.json({
        success: true,
        data: rules,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: getErrorMessage(error, ),
      });
    }
  }

  /**
   * POST /api/admin/pricing/rules
   * Create pricing rule
   */
  async createRule(req: Request, res: Response) {
    try {
      const {
        active,
        serviceType,
        tripType,
        zoneFrom,
        zoneTo,
        vehicleClass,
        basePriceCents,
        currency,
        passengersMin,
        passengersMax,
        notes,
      } = req.body;

      if (!serviceType || !tripType || !zoneFrom || !zoneTo || !vehicleClass || !basePriceCents) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      const rule = await pricingService.createPricingRule({
        active,
        serviceType: serviceType as ServiceType,
        tripType: tripType as TripType,
        zoneFrom,
        zoneTo,
        vehicleClass: vehicleClass as VehicleClass,
        basePriceCents: parseInt(basePriceCents),
        currency,
        passengersMin: passengersMin ? parseInt(passengersMin) : undefined,
        passengersMax: passengersMax ? parseInt(passengersMax) : undefined,
        notes,
      });

      // Audit log
      const userId = req.headers['x-user-id'] as string | undefined;
      const userEmail = req.headers['x-user-email'] as string | undefined;

      await createAuditLog({
        action: 'CREATE',
        entityType: 'PricingRule',
        entityId: rule.id,
        userId,
        userEmail,
        description: `Created pricing rule: ${zoneFrom} → ${zoneTo} (${vehicleClass}, ${tripType}) - $${basePriceCents / 100}`,
      });

      res.status(201).json({
        success: true,
        data: rule,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: getErrorMessage(error, ),
      });
    }
  }

  /**
   * PUT /api/admin/pricing/rules/:id
   * Update pricing rule
   */
  async updateRule(req: Request, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) {
        return res.status(400).json({ error: 'Rule ID is required' });
      }

      const {
        active,
        serviceType,
        tripType,
        zoneFrom,
        zoneTo,
        vehicleClass,
        basePriceCents,
        currency,
        passengersMin,
        passengersMax,
        notes,
      } = req.body;

      const rule = await pricingService.updatePricingRule(id, {
        active,
        serviceType: serviceType as ServiceType,
        tripType: tripType as TripType,
        zoneFrom,
        zoneTo,
        vehicleClass: vehicleClass as VehicleClass,
        basePriceCents: basePriceCents ? parseInt(basePriceCents) : undefined,
        currency,
        passengersMin: passengersMin ? parseInt(passengersMin) : undefined,
        passengersMax: passengersMax ? parseInt(passengersMax) : undefined,
        notes,
      });

      // Audit log
      const userId = req.headers['x-user-id'] as string | undefined;
      const userEmail = req.headers['x-user-email'] as string | undefined;

      await createAuditLog({
        action: 'UPDATE',
        entityType: 'PricingRule',
        entityId: id,
        userId,
        userEmail,
        description: `Updated pricing rule: ${rule.zoneFrom} → ${rule.zoneTo}`,
      });

      res.json({
        success: true,
        data: rule,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: getErrorMessage(error, ),
      });
    }
  }

  /**
   * DELETE /api/admin/pricing/rules/:id
   * Delete pricing rule (soft delete)
   */
  async deleteRule(req: Request, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) {
        return res.status(400).json({ error: 'Rule ID is required' });
      }

      const rule = await pricingService.deletePricingRule(id);

      // Audit log
      const userId = req.headers['x-user-id'] as string | undefined;
      const userEmail = req.headers['x-user-email'] as string | undefined;

      await createAuditLog({
        action: 'DELETE',
        entityType: 'PricingRule',
        entityId: id,
        userId,
        userEmail,
        description: `Deleted pricing rule: ${rule.zoneFrom} → ${rule.zoneTo}`,
      });

      res.json({
        success: true,
        data: rule,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: getErrorMessage(error, ),
      });
    }
  }

  /**
   * GET /api/admin/pricing/extras
   * List pricing extras
   */
  async listExtras(req: Request, res: Response) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const extras = await pricingService.getPricingExtras(includeInactive);

      res.json({
        success: true,
        data: extras,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: getErrorMessage(error, ),
      });
    }
  }

  /**
   * POST /api/admin/pricing/extras
   * Create pricing extra
   */
  async createExtra(req: Request, res: Response) {
    try {
      const {
        active,
        code,
        label,
        priceCents,
        pricingMode,
        maxQty,
        description,
      } = req.body;

      if (!code || !label || !priceCents || !pricingMode) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: code, label, priceCents, pricingMode',
        });
      }

      const extra = await pricingService.createPricingExtra({
        active,
        code: code as ExtraCode,
        label,
        priceCents: parseInt(priceCents),
        pricingMode: pricingMode as PricingMode,
        maxQty: maxQty ? parseInt(maxQty) : undefined,
        description,
      });

      // Audit log
      const userId = req.headers['x-user-id'] as string | undefined;
      const userEmail = req.headers['x-user-email'] as string | undefined;

      await createAuditLog({
        action: 'CREATE',
        entityType: 'PricingExtra',
        entityId: extra.id,
        userId,
        userEmail,
        description: `Created pricing extra: ${label} (${code}) - $${priceCents / 100}`,
      });

      res.status(201).json({
        success: true,
        data: extra,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: getErrorMessage(error, ),
      });
    }
  }

  /**
   * PUT /api/admin/pricing/extras/:id
   * Update pricing extra
   */
  async updateExtra(req: Request, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) {
        return res.status(400).json({ error: 'Extra ID is required' });
      }

      const {
        active,
        code,
        label,
        priceCents,
        pricingMode,
        maxQty,
        description,
      } = req.body;

      const extra = await pricingService.updatePricingExtra(id, {
        active,
        code: code as ExtraCode,
        label,
        priceCents: priceCents ? parseInt(priceCents) : undefined,
        pricingMode: pricingMode as PricingMode,
        maxQty: maxQty ? parseInt(maxQty) : undefined,
        description,
      });

      // Audit log
      const userId = req.headers['x-user-id'] as string | undefined;
      const userEmail = req.headers['x-user-email'] as string | undefined;

      await createAuditLog({
        action: 'UPDATE',
        entityType: 'PricingExtra',
        entityId: id,
        userId,
        userEmail,
        description: `Updated pricing extra: ${extra.label}`,
      });

      res.json({
        success: true,
        data: extra,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: getErrorMessage(error, ),
      });
    }
  }

  /**
   * DELETE /api/admin/pricing/extras/:id
   * Delete pricing extra (soft delete)
   */
  async deleteExtra(req: Request, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) {
        return res.status(400).json({ error: 'Extra ID is required' });
      }

      const extra = await pricingService.deletePricingExtra(id);

      // Audit log
      const userId = req.headers['x-user-id'] as string | undefined;
      const userEmail = req.headers['x-user-email'] as string | undefined;

      await createAuditLog({
        action: 'DELETE',
        entityType: 'PricingExtra',
        entityId: id,
        userId,
        userEmail,
        description: `Deleted pricing extra: ${extra.label}`,
      });

      res.json({
        success: true,
        data: extra,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: getErrorMessage(error, ),
      });
    }
  }

  /**
   * GET /api/admin/pricing/areas
   * List areas (includeInactive=true for admin)
   */
  async listAreas(req: Request, res: Response) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const areas = await pricingService.listAreas(!includeInactive);
      res.json({ success: true, data: areas });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: getErrorMessage(error, ),
      });
    }
  }

  /**
   * POST /api/admin/pricing/areas
   */
  async createArea(req: Request, res: Response) {
    try {
      const { name, oneWayPriceCents, roundTripPriceCents, sprinterOneWayPriceCents, sprinterRoundTripPriceCents, isActive } = req.body;
      if (!name || oneWayPriceCents == null || roundTripPriceCents == null) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, oneWayPriceCents, roundTripPriceCents',
        });
      }
      const area = await pricingService.createArea({
        name: String(name).trim(),
        oneWayPriceCents: parseInt(oneWayPriceCents, 10),
        roundTripPriceCents: parseInt(roundTripPriceCents, 10),
        sprinterOneWayPriceCents: sprinterOneWayPriceCents != null ? parseInt(sprinterOneWayPriceCents, 10) : 0,
        sprinterRoundTripPriceCents: sprinterRoundTripPriceCents != null ? parseInt(sprinterRoundTripPriceCents, 10) : 0,
        isActive: isActive !== false,
      });
      await createAuditLog({
        action: 'CREATE',
        entityType: 'Area',
        entityId: area.id,
        userEmail: req.adminEmail,
        description: `Created area: ${area.name}`,
      });
      res.status(201).json({ success: true, data: area });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: getErrorMessage(error, ),
      });
    }
  }

  /**
   * PUT /api/admin/pricing/areas/:id
   */
  async updateArea(req: Request, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) return res.status(400).json({ success: false, error: 'Area ID is required' });
      const { name, oneWayPriceCents, roundTripPriceCents, sprinterOneWayPriceCents, sprinterRoundTripPriceCents, isActive } = req.body;
      const area = await pricingService.updateArea(id, {
        ...(name != null && { name: String(name).trim() }),
        ...(oneWayPriceCents != null && { oneWayPriceCents: parseInt(oneWayPriceCents, 10) }),
        ...(roundTripPriceCents != null && { roundTripPriceCents: parseInt(roundTripPriceCents, 10) }),
        ...(sprinterOneWayPriceCents != null && { sprinterOneWayPriceCents: parseInt(sprinterOneWayPriceCents, 10) }),
        ...(sprinterRoundTripPriceCents != null && { sprinterRoundTripPriceCents: parseInt(sprinterRoundTripPriceCents, 10) }),
        ...(typeof isActive === 'boolean' && { isActive }),
      });
      await createAuditLog({
        action: 'UPDATE',
        entityType: 'Area',
        entityId: id,
        userEmail: req.adminEmail,
        description: `Updated area: ${area.name}`,
      });
      res.json({ success: true, data: area });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: getErrorMessage(error, ),
      });
    }
  }

  /**
   * DELETE /api/admin/pricing/areas/:id - deactivate area
   */
  async deactivateArea(req: Request, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) return res.status(400).json({ success: false, error: 'Area ID is required' });
      const area = await pricingService.deactivateArea(id);
      await createAuditLog({
        action: 'DELETE',
        entityType: 'Area',
        entityId: id,
        userEmail: req.adminEmail,
        description: `Deactivated area: ${area.name}`,
      });
      res.json({ success: true, data: area });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: getErrorMessage(error, ),
      });
    }
  }

  // ── Hotel CRUD (admin) ──

  async listHotels(req: Request, res: Response) {
    try {
      const hotels = await prisma.hotel.findMany({
        orderBy: [{ zone: 'asc' }, { name: 'asc' }],
      });
      res.json({ success: true, data: hotels });
    } catch (error) {
      res.status(500).json({ success: false, error: getErrorMessage(error, ) });
    }
  }

  async createHotel(req: Request, res: Response) {
    try {
      const { name, zone, isActive } = req.body;
      if (!name || !zone) return res.status(400).json({ success: false, error: 'name and zone are required' });
      const hotel = await prisma.hotel.create({ data: { name, zone, isActive: isActive ?? true } });
      await createAuditLog({
        action: 'CREATE',
        entityType: 'Hotel',
        entityId: hotel.id,
        userEmail: req.adminEmail,
        description: `Created hotel: ${hotel.name} (${hotel.zone})`,
      });
      res.status(201).json({ success: true, data: hotel });
    } catch (error) {
      res.status(400).json({ success: false, error: getErrorMessage(error, ) });
    }
  }

  async updateHotel(req: Request, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) return res.status(400).json({ success: false, error: 'Hotel ID is required' });
      const { name, zone, isActive } = req.body;
      const hotel = await prisma.hotel.update({
        where: { id },
        data: { ...(name !== undefined && { name }), ...(zone !== undefined && { zone }), ...(isActive !== undefined && { isActive }) },
      });
      await createAuditLog({
        action: 'UPDATE',
        entityType: 'Hotel',
        entityId: id,
        userEmail: req.adminEmail,
        description: `Updated hotel: ${hotel.name}`,
      });
      res.json({ success: true, data: hotel });
    } catch (error) {
      res.status(400).json({ success: false, error: getErrorMessage(error, ) });
    }
  }

  async deleteHotel(req: Request, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) return res.status(400).json({ success: false, error: 'Hotel ID is required' });
      const hotel = await prisma.hotel.update({ where: { id }, data: { isActive: false } });
      await createAuditLog({
        action: 'DELETE',
        entityType: 'Hotel',
        entityId: id,
        userEmail: req.adminEmail,
        description: `Deactivated hotel: ${hotel.name}`,
      });
      res.json({ success: true, data: hotel });
    } catch (error) {
      res.status(400).json({ success: false, error: getErrorMessage(error, ) });
    }
  }
}


