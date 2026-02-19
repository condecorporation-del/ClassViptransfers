import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { validate, asyncHandler } from '../middleware/validation';
import {
  createBookingSchema,
  confirmBookingSchema,
  cancelBookingSchema,
  assignBookingSchema,
  updateCustomerSchema,
} from '../lib/validation';

const router = Router();
const bookingController = new BookingController();

// POST /api/bookings - Create draft booking
router.post(
  '/',
  validate(createBookingSchema),
  asyncHandler((req, res) => bookingController.createBooking(req, res))
);

// Routes with specific paths must come before /:id
// POST /api/bookings/:id/confirm - Admin confirm booking
router.post(
  '/:id/confirm',
  validate(confirmBookingSchema, 'body'),
  asyncHandler((req, res) => bookingController.confirmBooking(req, res))
);

// POST /api/bookings/:id/cancel - Cancel booking
router.post(
  '/:id/cancel',
  validate(cancelBookingSchema, 'body'),
  asyncHandler((req, res) => bookingController.cancelBooking(req, res))
);

// POST /api/bookings/:id/assign - Assign driver/vehicle
router.post(
  '/:id/assign',
  validate(assignBookingSchema, 'body'),
  asyncHandler((req, res) => bookingController.assignBooking(req, res))
);

// PATCH /api/bookings/:id/customer - Update customer information
router.patch(
  '/:id/customer',
  validate(updateCustomerSchema, 'body'),
  asyncHandler((req, res) => bookingController.updateCustomer(req, res))
);

// GET /api/bookings/:id - Get booking details (must be last)
router.get(
  '/:id',
  asyncHandler((req, res) => bookingController.getBooking(req, res))
);

export default router;

