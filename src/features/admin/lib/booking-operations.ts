export type AdminOperationBooking = {
  bookingDate: string;
  bookingTime?: string | null;
  arrivalTime?: string | null;
  departureTime?: string | null;
  pickupLocation?: string | null;
  dropoffLocation?: string | null;
  flightNumber?: string | null;
  departureFlightNumber?: string | null;
  route?: string | null;
  tripType?: string | null;
  notes?: string | null;
};

export type OperationType = 'arrival' | 'departure' | 'roundtrip' | 'other';

export function getOperationType(booking: AdminOperationBooking): OperationType {
  if (booking.tripType === 'roundtrip') return 'roundtrip';
  if (booking.route === 'airport-hotel') return 'arrival';
  if (booking.route === 'hotel-airport') return 'departure';
  return 'other';
}

export function getOperationBadge(booking: AdminOperationBooking) {
  const type = getOperationType(booking);
  if (type === 'arrival') return { label: 'LLEGADA', className: 'bg-blue-100 text-blue-700' };
  if (type === 'departure') return { label: 'SALIDA', className: 'bg-orange-100 text-orange-700' };
  if (type === 'roundtrip') return { label: 'REDONDO', className: 'bg-purple-100 text-purple-700' };
  return { label: 'SERVICIO', className: 'bg-slate-100 text-slate-700' };
}

export function getOperationHotel(booking: AdminOperationBooking) {
  return getOperationType(booking) === 'departure'
    ? booking.pickupLocation || 'Pickup pending'
    : booking.dropoffLocation || 'Destination pending';
}

export function getOperationFlight(booking: AdminOperationBooking) {
  return booking.flightNumber || booking.departureFlightNumber || '---';
}

export function getOperationTime(booking: AdminOperationBooking) {
  return booking.bookingTime || booking.arrivalTime || booking.departureTime || '99:99';
}

function operationPriority(booking: AdminOperationBooking) {
  const type = getOperationType(booking);
  if (type === 'arrival') return 0;
  if (type === 'departure') return 1;
  if (type === 'roundtrip') return 2;
  return 3;
}

export function compareOperationBookings<T extends AdminOperationBooking>(a: T, b: T) {
  const dateDiff = a.bookingDate.slice(0, 10).localeCompare(b.bookingDate.slice(0, 10));
  if (dateDiff !== 0) return dateDiff;

  const opDiff = operationPriority(a) - operationPriority(b);
  if (opDiff !== 0) return opDiff;

  return getOperationTime(a).localeCompare(getOperationTime(b));
}
