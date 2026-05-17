import crypto from 'crypto';

const BOOKING_HMAC_SECRET = process.env.BOOKING_LOOKUP_SECRET || process.env.JWT_SECRET || 'change-me-in-production';

export function generateBookingToken(bookingId: string): string {
  return crypto.createHmac('sha256', BOOKING_HMAC_SECRET).update(bookingId).digest('hex').slice(0, 32);
}

export function verifyBookingToken(bookingId: string, token: string): boolean {
  const expected = generateBookingToken(bookingId);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}
