import { describe, expect, it } from 'vitest';
import { manualBookingSchema } from '../lib/validation';

const baseManualBooking = {
  type: 'TRANSPORTATION' as const,
  customer: {
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '+1234567890',
    language: 'en' as const,
  },
  bookingDate: new Date('2026-05-15T12:00:00.000Z').toISOString(),
  passengers: 2,
  items: [
    {
      type: 'TRANSPORTATION' as const,
      name: 'Private Transfer',
      quantity: 1,
      unitPrice: 100,
    },
  ],
  status: 'OFFLINE_HOLD' as const,
  sendConfirmation: false,
  sendPaymentLink: false,
};

describe('manualBookingSchema', () => {
  it('accepts a pending offline-hold booking with payment link', () => {
    const result = manualBookingSchema.safeParse({
      ...baseManualBooking,
      sendPaymentLink: true,
    });

    expect(result.success).toBe(true);
  });

  it('rejects sending confirmation and payment link together', () => {
    const result = manualBookingSchema.safeParse({
      ...baseManualBooking,
      sendConfirmation: true,
      sendPaymentLink: true,
      status: 'CONFIRMED',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.message.includes('Choose either confirmation or payment link'))).toBe(true);
  });

  it('rejects confirmation emails for non-confirmed manual bookings', () => {
    const result = manualBookingSchema.safeParse({
      ...baseManualBooking,
      sendConfirmation: true,
      status: 'OFFLINE_HOLD',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.message.includes('Confirmation emails require a confirmed booking'))).toBe(true);
  });

  it('rejects payment links for already confirmed manual bookings', () => {
    const result = manualBookingSchema.safeParse({
      ...baseManualBooking,
      status: 'CONFIRMED',
      sendPaymentLink: true,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.message.includes('Payment links require the booking to remain on hold'))).toBe(true);
  });
});
