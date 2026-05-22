import crypto from 'crypto';

function getBookingHmacSecret(): string {
  const configured = process.env.BOOKING_LOOKUP_SECRET || process.env.JWT_SECRET;
  if (configured) return configured;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('BOOKING_LOOKUP_SECRET or JWT_SECRET must be set in production');
  }

  return 'dev-only-booking-secret';
}

export function generateBookingToken(bookingId: string): string {
  return crypto.createHmac('sha256', getBookingHmacSecret()).update(bookingId).digest('hex').slice(0, 32);
}

export function verifyBookingToken(bookingId: string, token: string): boolean {
  const expected = generateBookingToken(bookingId);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}
