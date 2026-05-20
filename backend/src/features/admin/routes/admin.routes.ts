import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { PricingController } from '../../pricing/controllers/pricing.controller';
import { validate, asyncHandler } from '../../../shared/middleware/validation';
import { requireAdminAuth } from '../../../shared/middleware/auth';
import {
  listBookingsSchema,
  exportBookingsSchema,
  priceOverrideSchema,
  assignBookingSchemaExtended,
  createDriverSchema,
  createVehicleSchema,
  createClientAccountSchema,
  createAccountChargeSchema,
  createAccountPaymentSchema,
  manualBookingSchema,
  updateAccountChargeSchema,
} from '../../../shared/lib/validation';

const router = Router();
const adminController = new AdminController();
const pricingController = new PricingController();

// Apply auth middleware to all routes (except auth routes which are in separate file)
router.use(requireAdminAuth);

// GET /api/admin/stats - Dashboard stats (emails today, bookings today, etc.)
router.get(
  '/stats',
  asyncHandler((req, res) => adminController.getStats(req, res))
);

// GET /api/admin/dashboard - Full dashboard with bookings
router.get(
  '/dashboard',
  asyncHandler((req, res) => adminController.getDashboard(req, res))
);

// GET /api/admin/bookings - List bookings with filters
router.get(
  '/bookings',
  validate(listBookingsSchema, 'query'),
  asyncHandler((req, res) => adminController.listBookings(req, res))
);

// GET /api/admin/bookings/export - Export bookings (must be before /:id)
router.get(
  '/bookings/export',
  validate(exportBookingsSchema, 'query'),
  asyncHandler((req, res) => adminController.exportBookings(req, res))
);

// GET /api/admin/bookings/:id - Get single booking with email logs
router.get(
  '/bookings/:id',
  asyncHandler((req, res) => adminController.getBooking(req, res))
);

// GET /api/admin/bookings/:id/confirmation-pdf - Download confirmation PDF
router.get(
  '/bookings/:id/confirmation-pdf',
  asyncHandler((req, res) => adminController.getConfirmationPdf(req, res))
);

// POST /api/admin/bookings/:id/confirm - Mark as paid offline
router.post(
  '/bookings/:id/confirm',
  asyncHandler((req, res) => adminController.confirmBooking(req, res))
);

// POST /api/admin/bookings/:id/resend-confirmation - Resend confirmation emails
router.post(
  '/bookings/:id/resend-confirmation',
  asyncHandler((req, res) => adminController.resendConfirmation(req, res))
);

// POST /api/admin/test-email - Send test email (dev only)
router.post(
  '/test-email',
  asyncHandler((req, res) => adminController.testEmail(req, res))
);

// GET /api/admin/preview-email - Preview email template (dev only)
router.get(
  '/preview-email',
  asyncHandler((req, res) => adminController.previewEmail(req, res))
);

// POST /api/admin/bookings/:id/price-override - Apply price override
router.post(
  '/bookings/:id/price-override',
  validate(priceOverrideSchema, 'body'),
  asyncHandler((req, res) => adminController.priceOverride(req, res))
);

// DELETE /api/admin/bookings/:id/price-override - Remove price override
router.delete(
  '/bookings/:id/price-override',
  asyncHandler((req, res) => adminController.removePriceOverride(req, res))
);

// PATCH /api/admin/bookings/:id - Update booking fields
router.patch(
  '/bookings/:id',
  asyncHandler((req, res) => adminController.updateBooking(req, res))
);

// POST /api/admin/bookings/:id/cancel - Cancel booking
router.post(
  '/bookings/:id/cancel',
  asyncHandler((req, res) => adminController.cancelBooking(req, res))
);

// POST /api/admin/bookings/:id/assign - Assign driver/vehicle (extended)
router.post(
  '/bookings/:id/assign',
  validate(assignBookingSchemaExtended, 'body'),
  asyncHandler((req, res) => adminController.assignBooking(req, res))
);

// POST /api/admin/bookings/manual - Create manual/offline booking
router.post(
  '/bookings/manual',
  validate(manualBookingSchema, 'body'),
  asyncHandler((req, res) => adminController.createManualBooking(req, res))
);

// GET /api/admin/drivers - List drivers
router.get(
  '/drivers',
  asyncHandler((req, res) => adminController.listDrivers(req, res))
);

// POST /api/admin/drivers - Create driver
router.post(
  '/drivers',
  validate(createDriverSchema, 'body'),
  asyncHandler((req, res) => adminController.createDriver(req, res))
);

// GET /api/admin/vehicles - List vehicles
router.get(
  '/vehicles',
  asyncHandler((req, res) => adminController.listVehicles(req, res))
);

// POST /api/admin/vehicles - Create vehicle
router.post(
  '/vehicles',
  validate(createVehicleSchema, 'body'),
  asyncHandler((req, res) => adminController.createVehicle(req, res))
);

// Client Accounts
router.get(
  '/accounts',
  asyncHandler((req, res) => adminController.listClientAccounts(req, res))
);

router.post(
  '/accounts',
  validate(createClientAccountSchema, 'body'),
  asyncHandler((req, res) => adminController.createClientAccount(req, res))
);

router.get(
  '/accounts/:id',
  asyncHandler((req, res) => adminController.getClientAccount(req, res))
);

router.post(
  '/accounts/:id/charges',
  validate(createAccountChargeSchema, 'body'),
  asyncHandler((req, res) => adminController.createAccountCharge(req, res))
);

router.post(
  '/accounts/:id/bookings',
  asyncHandler((req, res) => adminController.attachBookingToAccount(req, res))
);

router.post(
  '/accounts/:id/payments',
  validate(createAccountPaymentSchema, 'body'),
  asyncHandler((req, res) => adminController.createAccountPayment(req, res))
);

router.patch(
  '/accounts/:id/charges/:chargeId',
  validate(updateAccountChargeSchema, 'body'),
  asyncHandler((req, res) => adminController.updateAccountCharge(req, res))
);

// Pricing Rules
router.get(
  '/pricing/rules',
  asyncHandler((req, res) => pricingController.listRules(req, res))
);

router.post(
  '/pricing/rules',
  asyncHandler((req, res) => pricingController.createRule(req, res))
);

router.put(
  '/pricing/rules/:id',
  asyncHandler((req, res) => pricingController.updateRule(req, res))
);

router.delete(
  '/pricing/rules/:id',
  asyncHandler((req, res) => pricingController.deleteRule(req, res))
);

// Pricing Extras
router.get(
  '/pricing/extras',
  asyncHandler((req, res) => pricingController.listExtras(req, res))
);

router.post(
  '/pricing/extras',
  asyncHandler((req, res) => pricingController.createExtra(req, res))
);

router.put(
  '/pricing/extras/:id',
  asyncHandler((req, res) => pricingController.updateExtra(req, res))
);

router.delete(
  '/pricing/extras/:id',
  asyncHandler((req, res) => pricingController.deleteExtra(req, res))
);

// Pricing Areas (admin CRUD)
router.get(
  '/pricing/areas',
  asyncHandler((req, res) => pricingController.listAreas(req, res))
);
router.post(
  '/pricing/areas',
  asyncHandler((req, res) => pricingController.createArea(req, res))
);
router.put(
  '/pricing/areas/:id',
  asyncHandler((req, res) => pricingController.updateArea(req, res))
);
router.delete(
  '/pricing/areas/:id',
  asyncHandler((req, res) => pricingController.deactivateArea(req, res))
);

// Hotels (admin CRUD)
router.get(
  '/pricing/hotels',
  asyncHandler((req, res) => pricingController.listHotels(req, res))
);
router.post(
  '/pricing/hotels',
  asyncHandler((req, res) => pricingController.createHotel(req, res))
);
router.put(
  '/pricing/hotels/:id',
  asyncHandler((req, res) => pricingController.updateHotel(req, res))
);
router.delete(
  '/pricing/hotels/:id',
  asyncHandler((req, res) => pricingController.deleteHotel(req, res))
);

export default router;

