import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BookingService } from '../../features/booking/services/booking.service';
import { prisma } from '../lib/prisma';
import { CreateBookingInput } from '../lib/validation';

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;
const DB_TEST_TIMEOUT_MS = 20000;

describeIfDatabase('BookingService', () => {
  const bookingService = new BookingService();
  let createdBookingId: string;
  let createdCustomerId: string;

  beforeAll(async () => {
    // Clean up any test data
    await prisma.booking.deleteMany({
      where: {
        customer: {
          email: 'test@example.com',
        },
      },
    });
    await prisma.customer.deleteMany({
      where: {
        email: 'test@example.com',
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (createdBookingId) {
      await prisma.booking.delete({
        where: { id: createdBookingId },
      });
    }
    if (createdCustomerId) {
      await prisma.customer.delete({
        where: { id: createdCustomerId },
      });
    }
    await prisma.$disconnect();
  });

  it('should create a draft transportation booking', async () => {
    const input: CreateBookingInput = {
      type: 'TRANSPORTATION',
      customer: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        country: 'US',
        language: 'en',
      },
      bookingDate: new Date('2024-12-25'),
      bookingTime: '10:00',
      pickupLocation: 'Airport',
      dropoffLocation: 'Hotel Zone',
      passengers: 2,
      serviceType: 'private',
      tripType: 'oneway',
      route: 'airport-hotel',
      items: [
        {
          type: 'TRANSPORTATION',
          name: 'Private Transfer',
          quantity: 1,
          unitPrice: 85,
        },
      ],
    };

    const booking = await bookingService.createDraftBooking(input);

    createdBookingId = booking.id;
    createdCustomerId = booking.customerId;

    expect(booking).toBeDefined();
    expect(booking.status).toBe('DRAFT');
    expect(booking.type).toBe('TRANSPORTATION');
    expect(booking.totalAmount).toBe(9860); // $85 subtotal + 16% IVA
    expect(booking.customer.email).toBe('test@example.com');
    expect(booking.items).toHaveLength(1);
    expect(booking.items[0].unitPrice).toBe(8500); // $85 in cents
  }, DB_TEST_TIMEOUT_MS);

  it('should create a draft activity booking with combo', async () => {
    const input: CreateBookingInput = {
      type: 'CRAZY_COMBO',
      customer: {
        name: 'Test User 2',
        email: 'test2@example.com',
        phone: '+1234567891',
        language: 'en',
      },
      bookingDate: new Date('2024-12-26'),
      bookingTime: '14:00',
      passengers: 2,
      items: [
        {
          type: 'CRAZY_COMBO',
          name: 'Crazy Combo',
          quantity: 2,
          unitPrice: 125,
          metadata: {
            activities: ['camel', 'atv', 'horseback'],
          },
        },
        {
          type: 'PARK_ENTRANCE',
          name: 'Park Entrance Fee',
          quantity: 2,
          unitPrice: 25,
        },
      ],
    };

    const booking = await bookingService.createDraftBooking(input);

    expect(booking).toBeDefined();
    expect(booking.status).toBe('DRAFT');
    expect(booking.type).toBe('CRAZY_COMBO');
    expect(booking.totalAmount).toBe(34800); // $300 subtotal + 16% IVA
    expect(booking.items).toHaveLength(2);

    // Clean up
    await prisma.booking.delete({ where: { id: booking.id } });
    await prisma.customer.delete({ where: { id: booking.customerId } });
  }, DB_TEST_TIMEOUT_MS);

  it('should get booking by ID', async () => {
    if (!createdBookingId) {
      throw new Error('No booking created');
    }

    const booking = await bookingService.getBookingById(createdBookingId);

    expect(booking).toBeDefined();
    expect(booking.id).toBe(createdBookingId);
    expect(booking.customer).toBeDefined();
    expect(booking.items).toBeDefined();
  }, DB_TEST_TIMEOUT_MS);

  it('should confirm a booking', async () => {
    if (!createdBookingId) {
      throw new Error('No booking created');
    }

    const booking = await bookingService.confirmBooking(
      createdBookingId,
      'admin-user-id',
      'admin@example.com',
      'Confirmed via test'
    );

    expect(booking.status).toBe('CONFIRMED');
    expect(booking.confirmedAt).toBeDefined();
  }, DB_TEST_TIMEOUT_MS);

  it('should list bookings by date', async () => {
    const result = await bookingService.listBookings({
      date: '2024-12-25',
      page: 1,
      limit: 10,
    });

    expect(result.bookings).toBeDefined();
    expect(Array.isArray(result.bookings)).toBe(true);
    expect(result.pagination).toBeDefined();
    expect(result.pagination.total).toBeGreaterThanOrEqual(0);
  }, DB_TEST_TIMEOUT_MS);

  it('should export bookings to CSV', async () => {
    const csv = await bookingService.exportBookingsToCSV('2024-12-25');

    expect(csv).toBeDefined();
    expect(csv.includes('bookingId')).toBe(true);
    expect(csv.includes('customerName')).toBe(true);
  }, 15000);

  it('should cancel a booking', async () => {
    if (!createdBookingId) {
      throw new Error('No booking created');
    }

    // First, reset to a cancellable status
    await prisma.booking.update({
      where: { id: createdBookingId },
      data: { status: 'DRAFT' },
    });

    const booking = await bookingService.cancelBooking(
      createdBookingId,
      'Test cancellation',
      'admin-user-id',
      'admin@example.com'
    );

    expect(booking.status).toBe('CANCELLED');
    expect(booking.cancelledAt).toBeDefined();
  }, DB_TEST_TIMEOUT_MS);

  it('should create a completed MANUAL payment for confirmed manual bookings', async () => {
    const booking = await bookingService.createManualBooking(
      {
        type: 'TRANSPORTATION',
        customer: {
          name: 'Manual Paid User',
          email: 'manual-paid@example.com',
          phone: '+1234567892',
          language: 'en',
        },
        bookingDate: new Date('2024-12-27'),
        bookingTime: '15:00',
        pickupLocation: 'Airport',
        dropoffLocation: 'Hotel',
        passengers: 2,
        serviceType: 'private',
        tripType: 'oneway',
        route: 'airport-hotel',
        items: [
          {
            type: 'TRANSPORTATION',
            name: 'Private Transfer',
            quantity: 1,
            unitPrice: 120,
          },
        ],
      },
      'CONFIRMED'
    );

    const payment = await prisma.payment.findFirst({
      where: { bookingId: booking.id, provider: 'MANUAL', status: 'COMPLETED' },
    });

    expect(booking.status).toBe('CONFIRMED');
    expect(payment).toBeTruthy();
    expect(payment?.amount).toBe(booking.totalAmount);

    await prisma.booking.delete({ where: { id: booking.id } });
    await prisma.customer.delete({ where: { id: booking.customerId } });
  }, 15000);
});

