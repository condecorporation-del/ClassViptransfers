import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { validate, asyncHandler } from '../middleware/validation';
import { requireAdminAuth } from '../middleware/auth';
import {
  listBookingsSchema,
  exportBookingsSchema,
  priceOverrideSchema,
  assignBookingSchemaExtended,
  createDriverSchema,
  createVehicleSchema,
  manualBookingSchema,
} from '../lib/validation';

const router = Router();
const adminController = new AdminController();

// Apply auth middleware to all routes (except auth routes which are in separate file)
router.use(requireAdminAuth);

// GET /api/admin/bookings - List bookings with filters
router.get(
  '/bookings',
  validate(listBookingsSchema, 'query'),
  asyncHandler((req, res) => adminController.listBookings(req, res))
);

// GET /api/admin/bookings/export - Export bookings
router.get(
  '/bookings/export',
  validate(exportBookingsSchema, 'query'),
  asyncHandler((req, res) => adminController.exportBookings(req, res))
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

export default router;

