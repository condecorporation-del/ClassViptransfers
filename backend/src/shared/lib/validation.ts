import { ExtraCode, PricingMode, ServiceType, TripType, VehicleClass } from '@prisma/client';
import { z } from 'zod';

// Money validation - convert dollars to cents
export const moneyToCents = (dollars: number): number => {
  return Math.round(dollars * 100);
};

export const centsToDollars = (cents: number): number => {
  return cents / 100;
};

// Booking schemas
export const createBookingSchema = z.object({
  type: z.enum(['TRANSPORTATION', 'ACTIVITY', 'COMBO', 'CRAZY_COMBO']),
  customer: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().min(1, 'Phone is required'),
    country: z.string().optional(),
    language: z.enum(['en', 'es']).default('en'),
  }),
  bookingDate: z.union([
    z.string().datetime(),
    z.date(),
    z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  ]),
  bookingTime: z.string().optional(),
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
  flightNumber: z.string().optional(),
  arrivalTime: z.string().optional(),
  departureFlightNumber: z.string().optional(),
  departureTime: z.string().optional(),
  pickupTime: z.string().optional(),
  /** Return leg date (round trip) — stored in booking.metadata.departureDate */
  departureDate: z.union([
    z.string().datetime(),
    z.date(),
    z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  ]).optional(),
  passengers: z.number().int().min(1).default(1),
  serviceType: z.literal('private').optional().default('private'),
  tripType: z.enum(['oneway', 'roundtrip']).optional(),
  areaId: z.string().cuid().optional(),
  route: z.string().optional(),
  items: z.array(z.object({
    type: z.enum(['TRANSPORTATION', 'ACTIVITY', 'ADDON', 'PARK_ENTRANCE', 'COMBO', 'CRAZY_COMBO']),
    name: z.string(),
    slug: z.string().optional(),
    quantity: z.number().int().min(1).default(1),
    unitPrice: z.number().nonnegative(), // In dollars
    metadata: z.record(z.any()).optional(),
  })).min(1, 'At least one item is required'),
  pricingData: z.object({
    tripType: z.enum(['oneway', 'roundtrip']),
    zoneFrom: z.string(),
    zoneTo: z.string(),
    vehicleClass: z.string(),
    extras: z.array(z.object({
      code: z.string(),
      qty: z.number().int().min(1),
    })).optional(),
  }).optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})
  .refine(
    (data) => {
      if (data.type !== 'TRANSPORTATION') return true;
      return !!(data.areaId && data.tripType) || !!data.pricingData;
    },
    { message: 'Transport bookings require areaId and tripType, or pricingData', path: ['areaId'] }
  )
  .refine(
    (data) => {
      const p = data.passengers ?? 1;
      if (data.type !== 'TRANSPORTATION') return true;
      return p >= 1 && p <= 14;
    },
    { message: 'Passengers must be between 1 and 14 for transport', path: ['passengers'] }
  );

export const confirmBookingSchema = z.object({
  notes: z.string().optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().optional(),
});

export const assignBookingSchema = z.object({
  driverId: z.string().cuid().optional(),
  vehicleId: z.string().cuid().optional(),
  notes: z.string().optional(),
}).refine(data => data.driverId || data.vehicleId, {
  message: "Either driverId or vehicleId must be provided",
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().min(1, 'Phone is required').optional(),
  country: z.string().optional(),
});

export const listBookingsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateFrom must be YYYY-MM-DD').optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateTo must be YYYY-MM-DD').optional(),
  status: z.enum(['DRAFT', 'PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'OFFLINE_HOLD']).optional(),
  type: z.enum(['TRANSPORTATION', 'ACTIVITY', 'COMBO', 'CRAZY_COMBO']).optional(),
  q: z.string().optional(), // Search query
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(50),
  groupedByTime: z.coerce.boolean().optional(),
});

export const updateBookingSchema = z.object({
  bookingDate: z.string().optional(),
  bookingTime: z.string().optional().nullable(),
  pickupTime: z.string().optional().nullable(),
  passengers: z.coerce.number().int().min(1).optional(),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  flightNumber: z.string().optional().nullable(),
  arrivalTime: z.string().optional().nullable(),
  departureFlightNumber: z.string().optional().nullable(),
  departureTime: z.string().optional().nullable(),
  pickupLocation: z.string().optional().nullable(),
  dropoffLocation: z.string().optional().nullable(),
});

export const priceOverrideSchema = z.object({
  newTotalCents: z.number().int().min(0, 'Amount must be non-negative'),
  reason: z.string().min(1, 'Reason is required'),
});

export const assignBookingSchemaExtended = z.object({
  driverId: z.string().cuid().optional().nullable(),
  vehicleId: z.string().cuid().optional().nullable(),
  pickupTime: z.string().optional(),
  internalNotes: z.string().optional(),
});

export const createDriverSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email').optional(),
  licenseNumber: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const createVehicleSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().int().min(1900).max(2100).optional(),
  licensePlate: z.string().min(1, 'License plate is required'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  isActive: z.boolean().default(true),
});

export const createClientAccountSchema = z.object({
  customerId: z.string().cuid().optional().nullable(),
  name: z.string().min(1, 'Account name is required'),
  company: z.string().optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable(),
  phone: z.string().optional().nullable(),
  currency: z.string().default('USD'),
  status: z.enum(['OPEN', 'ON_HOLD', 'SETTLED', 'CLOSED']).default('OPEN'),
  creditLimitCents: z.number().int().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const createAccountChargeSchema = z.object({
  bookingId: z.string().cuid().optional().nullable(),
  description: z.string().min(1, 'Description is required'),
  serviceDate: z.string().datetime().optional().nullable(),
  amountCents: z.number().int().min(0, 'Amount must be non-negative'),
  status: z.enum(['PENDING', 'INVOICED', 'PAID', 'VOID']).default('PENDING'),
  notes: z.string().optional().nullable(),
});

export const createAccountPaymentSchema = z.object({
  amountCents: z.number().int().positive('Amount must be greater than zero'),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'CARD', 'MANUAL']).default('MANUAL'),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  receivedAt: z.string().datetime().optional().nullable(),
});

export const updateAccountChargeSchema = z.object({
  status: z.enum(['PENDING', 'INVOICED', 'PAID', 'VOID']),
  notes: z.string().optional().nullable(),
});

const pricingTextField = z.string().trim().min(1);
const optionalPositiveInt = z.coerce.number().int().min(1).optional();

const pricingRuleShape = {
  active: z.boolean().optional(),
  serviceType: z.nativeEnum(ServiceType),
  tripType: z.nativeEnum(TripType),
  zoneFrom: pricingTextField.max(120),
  zoneTo: pricingTextField.max(120),
  vehicleClass: z.nativeEnum(VehicleClass),
  basePriceCents: z.coerce.number().int().min(0),
  currency: z.string().trim().min(3).max(8).optional(),
  passengersMin: optionalPositiveInt,
  passengersMax: optionalPositiveInt,
  notes: z.string().trim().max(1000).optional(),
};

export const createPricingRuleSchema = z.object(pricingRuleShape).superRefine((data, ctx) => {
  if (
    data.passengersMin !== undefined &&
    data.passengersMax !== undefined &&
    data.passengersMax < data.passengersMin
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'passengersMax must be greater than or equal to passengersMin',
      path: ['passengersMax'],
    });
  }
});

export const updatePricingRuleSchema = z.object(pricingRuleShape).partial().superRefine((data, ctx) => {
  if (Object.keys(data).length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one field is required',
      path: [],
    });
  }
  if (
    data.passengersMin !== undefined &&
    data.passengersMax !== undefined &&
    data.passengersMax < data.passengersMin
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'passengersMax must be greater than or equal to passengersMin',
      path: ['passengersMax'],
    });
  }
});

const pricingExtraShape = {
  active: z.boolean().optional(),
  included: z.boolean().optional(),
  code: z.nativeEnum(ExtraCode),
  label: pricingTextField.max(120),
  labelEs: z.string().trim().max(120).optional(),
  priceCents: z.coerce.number().int().min(0),
  pricingMode: z.nativeEnum(PricingMode),
  maxQty: optionalPositiveInt,
  description: z.string().trim().max(1000).optional(),
};

export const createPricingExtraSchema = z.object(pricingExtraShape);

export const updatePricingExtraSchema = z.object(pricingExtraShape).partial().superRefine((data, ctx) => {
  if (Object.keys(data).length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one field is required',
      path: [],
    });
  }
});

const areaShape = {
  name: pricingTextField.max(120),
  oneWayPriceCents: z.coerce.number().int().min(0),
  roundTripPriceCents: z.coerce.number().int().min(0),
  sprinterOneWayPriceCents: z.coerce.number().int().min(0).optional(),
  sprinterRoundTripPriceCents: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
};

export const createAreaSchema = z.object(areaShape);

export const updateAreaSchema = z.object(areaShape).partial().superRefine((data, ctx) => {
  if (Object.keys(data).length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one field is required',
      path: [],
    });
  }
});

const hotelShape = {
  name: pricingTextField.max(160),
  zone: pricingTextField.max(120),
  isActive: z.boolean().optional(),
};

export const createHotelSchema = z.object(hotelShape);

export const updateHotelSchema = z.object(hotelShape).partial().superRefine((data, ctx) => {
  if (Object.keys(data).length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one field is required',
      path: [],
    });
  }
});

export const manualBookingSchema = z
  .object({
    type: z.enum(['TRANSPORTATION', 'ACTIVITY', 'COMBO', 'CRAZY_COMBO']),
    customer: z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email'),
      phone: z.string().min(1, 'Phone is required'),
      country: z.string().optional(),
      language: z.enum(['en', 'es']).default('en'),
    }),
    bookingDate: z.union([
      z.string().datetime(),
      z.date(),
      z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
    ]),
    bookingTime: z.string().optional(),
    pickupLocation: z.string().optional(),
    dropoffLocation: z.string().optional(),
    flightNumber: z.string().optional(),
    arrivalTime: z.string().optional(),
    departureFlightNumber: z.string().optional(),
    departureTime: z.string().optional(),
    passengers: z.number().int().min(1).default(1),
    serviceType: z.literal('private').optional().default('private'),
    tripType: z.enum(['oneway', 'roundtrip']).optional(),
    route: z.string().optional(),
    items: z
      .array(
        z.object({
          type: z.enum([
            'TRANSPORTATION',
            'ACTIVITY',
            'ADDON',
            'PARK_ENTRANCE',
            'COMBO',
            'CRAZY_COMBO',
          ]),
          name: z.string(),
          slug: z.string().optional(),
          quantity: z.number().int().min(1).default(1),
          unitPrice: z.number().nonnegative(),
          metadata: z.record(z.any()).optional(),
        })
      )
      .min(1, 'At least one item is required'),
    totalAmount: z.number().int().min(0).optional(), // Override total in cents
    status: z.enum(['OFFLINE_HOLD', 'CONFIRMED']).default('OFFLINE_HOLD'),
    notes: z.string().optional(),
    sendConfirmation: z.boolean().default(false),
    sendPaymentLink: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.sendConfirmation && data.sendPaymentLink) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Choose either confirmation or payment link, not both.',
        path: ['sendConfirmation'],
      });
    }

    if (data.sendConfirmation && data.status !== 'CONFIRMED') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Confirmation emails require a confirmed booking.',
        path: ['status'],
      });
    }

    if (data.sendPaymentLink && data.status !== 'OFFLINE_HOLD') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Payment links require the booking to remain on hold.',
        path: ['status'],
      });
    }
  });

export const exportBookingsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  format: z.enum(['csv', 'json']).default('csv'),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type ConfirmBookingInput = z.infer<typeof confirmBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type AssignBookingInput = z.infer<typeof assignBookingSchema>;
export type ListBookingsInput = z.infer<typeof listBookingsSchema>;
export type ExportBookingsInput = z.infer<typeof exportBookingsSchema>;
export type PriceOverrideInput = z.infer<typeof priceOverrideSchema>;
export type AssignBookingExtendedInput = z.infer<typeof assignBookingSchemaExtended>;
export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type CreateClientAccountInput = z.infer<typeof createClientAccountSchema>;
export type CreateAccountChargeInput = z.infer<typeof createAccountChargeSchema>;
export type CreateAccountPaymentInput = z.infer<typeof createAccountPaymentSchema>;
export type UpdateAccountChargeInput = z.infer<typeof updateAccountChargeSchema>;
export type ManualBookingInput = z.infer<typeof manualBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type CreatePricingRuleInput = z.infer<typeof createPricingRuleSchema>;
export type UpdatePricingRuleInput = z.infer<typeof updatePricingRuleSchema>;
export type CreatePricingExtraInput = z.infer<typeof createPricingExtraSchema>;
export type UpdatePricingExtraInput = z.infer<typeof updatePricingExtraSchema>;
export type CreateAreaInput = z.infer<typeof createAreaSchema>;
export type UpdateAreaInput = z.infer<typeof updateAreaSchema>;
export type CreateHotelInput = z.infer<typeof createHotelSchema>;
export type UpdateHotelInput = z.infer<typeof updateHotelSchema>;

export const aiChatSchema = z.object({
  message: z.string().transform((s) => (s && typeof s === 'string' ? s.trim() : '')).pipe(z.string().min(1, 'Message is required')),
  bookingDraftId: z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .nullable()
    .transform((v) => (v && typeof v === 'string' && v.trim().length > 0 ? v.trim() : null)),
  locale: z.enum(['en', 'es']).default('en'),
  sessionId: z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .nullable()
    .transform((v) => (v && typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined)),
});

export type AIChatInput = z.infer<typeof aiChatSchema>;

