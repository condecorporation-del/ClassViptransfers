import { AccountChargeStatus, AccountPaymentMethod, ClientAccountStatus, Prisma } from '@prisma/client';
import { prisma } from '../../../shared/lib/prisma';
import {
  CreateAccountChargeInput,
  CreateAccountPaymentInput,
  CreateClientAccountInput,
  UpdateAccountChargeInput,
} from '../../../shared/lib/validation';

function buildBalanceCents(charges: { amountCents: number; status: AccountChargeStatus }[], payments: { amountCents: number }[]) {
  const chargeTotal = charges
    .filter((charge) => charge.status !== 'VOID')
    .reduce((sum, charge) => sum + charge.amountCents, 0);
  const paymentTotal = payments.reduce((sum, payment) => sum + payment.amountCents, 0);
  return chargeTotal - paymentTotal;
}

export class ClientAccountsService {
  async listAccounts() {
    const accounts = await prisma.clientAccount.findMany({
      include: {
        customer: true,
        charges: true,
        payments: true,
      },
      orderBy: [
        { status: 'asc' },
        { updatedAt: 'desc' },
      ],
    });

    return accounts.map((account) => {
      const balanceCents = buildBalanceCents(account.charges, account.payments);
      return {
        ...account,
        balanceCents,
        chargeCount: account.charges.filter((charge) => charge.status !== 'VOID').length,
        paymentCount: account.payments.length,
      };
    });
  }

  async getAccountById(id: string) {
    const account = await prisma.clientAccount.findUnique({
      where: { id },
      include: {
        customer: true,
        charges: {
          include: {
            booking: {
              include: {
                customer: true,
              },
            },
          },
          orderBy: [{ serviceDate: 'desc' }, { createdAt: 'desc' }],
        },
        payments: {
          orderBy: { receivedAt: 'desc' },
        },
      },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const balanceCents = buildBalanceCents(account.charges, account.payments);

    return {
      ...account,
      balanceCents,
      totals: {
        chargesCents: account.charges
          .filter((charge) => charge.status !== 'VOID')
          .reduce((sum, charge) => sum + charge.amountCents, 0),
        paymentsCents: account.payments.reduce((sum, payment) => sum + payment.amountCents, 0),
      },
    };
  }

  async createAccount(input: CreateClientAccountInput, createdBy?: string) {
    const account = await prisma.clientAccount.create({
      data: {
        customerId: input.customerId || null,
        name: input.name.trim(),
        company: input.company || null,
        email: input.email?.toLowerCase().trim() || null,
        phone: input.phone || null,
        currency: input.currency || 'USD',
        status: input.status as ClientAccountStatus,
        creditLimitCents: input.creditLimitCents ?? null,
        notes: input.notes || null,
      },
    });

    return account;
  }

  async addCharge(accountId: string, input: CreateAccountChargeInput, createdBy?: string) {
    const account = await prisma.clientAccount.findUnique({
      where: { id: accountId },
      include: {
        charges: true,
        payments: true,
      },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    if (input.bookingId) {
      const booking = await prisma.booking.findUnique({ where: { id: input.bookingId }, select: { id: true } });
      if (!booking) {
        throw new Error('Booking not found');
      }
    }

    const created = await prisma.accountCharge.create({
      data: {
        accountId,
        bookingId: input.bookingId || null,
        description: input.description.trim(),
        serviceDate: input.serviceDate ? new Date(input.serviceDate) : null,
        amountCents: input.amountCents,
        status: input.status as AccountChargeStatus,
        notes: input.notes || null,
        createdBy: createdBy || null,
      },
    });

    const balanceCents = buildBalanceCents([...account.charges, created], account.payments);
    await prisma.clientAccount.update({
      where: { id: accountId },
      data: {
        balanceCents,
        status: balanceCents <= 0 ? 'SETTLED' : account.status === 'CLOSED' ? 'OPEN' : account.status,
      },
    });

    return created;
  }

  async addPayment(accountId: string, input: CreateAccountPaymentInput, createdBy?: string) {
    const account = await prisma.clientAccount.findUnique({
      where: { id: accountId },
      include: {
        charges: true,
        payments: true,
      },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const payment = await prisma.accountPayment.create({
      data: {
        accountId,
        amountCents: input.amountCents,
        method: input.method as AccountPaymentMethod,
        reference: input.reference || null,
        notes: input.notes || null,
        receivedAt: input.receivedAt ? new Date(input.receivedAt) : new Date(),
        createdBy: createdBy || null,
      },
    });

    const balanceCents = buildBalanceCents(account.charges, [...account.payments, payment]);
    await prisma.clientAccount.update({
      where: { id: accountId },
      data: {
        balanceCents,
        status: balanceCents <= 0 ? 'SETTLED' : 'OPEN',
      },
    });

    return payment;
  }

  async updateCharge(accountId: string, chargeId: string, input: UpdateAccountChargeInput, updatedBy?: string) {
    const account = await prisma.clientAccount.findUnique({
      where: { id: accountId },
      include: {
        charges: true,
        payments: true,
      },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const existingCharge = account.charges.find((charge) => charge.id === chargeId);
    if (!existingCharge) {
      throw new Error('Charge not found');
    }

    const updatedCharge = await prisma.accountCharge.update({
      where: { id: chargeId },
      data: {
        status: input.status,
        notes: input.notes === undefined ? existingCharge.notes : input.notes,
        createdBy: updatedBy || existingCharge.createdBy,
      },
    });

    const recomputedCharges = account.charges.map((charge) => (charge.id === chargeId ? updatedCharge : charge));
    const balanceCents = buildBalanceCents(recomputedCharges, account.payments);

    await prisma.clientAccount.update({
      where: { id: accountId },
      data: {
        balanceCents,
        status: balanceCents <= 0 ? 'SETTLED' : 'OPEN',
      },
    });

    return updatedCharge;
  }

  async attachBooking(accountId: string, bookingId: string, createdBy?: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        bookingDate: true,
        totalAmount: true,
        confirmationCode: true,
        dropoffLocation: true,
        pickupLocation: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    return this.addCharge(
      accountId,
      {
        bookingId,
        description: `Booking ${booking.confirmationCode || booking.id.slice(0, 8).toUpperCase()} · ${booking.pickupLocation || 'Service'} → ${booking.dropoffLocation || 'Destination'}`,
        serviceDate: booking.bookingDate.toISOString(),
        amountCents: booking.totalAmount,
        status: 'PENDING',
        notes: null,
      },
      createdBy
    );
  }

  async getAccountsSummary() {
    const accounts = await prisma.clientAccount.findMany({
      include: {
        charges: true,
        payments: true,
      },
    });

    const normalized = accounts.map((account) => ({
      ...account,
      balanceCents: buildBalanceCents(account.charges, account.payments),
    }));

    const openAccounts = normalized.filter((account) => account.status === 'OPEN' || account.status === 'ON_HOLD');

    return {
      totalAccounts: normalized.length,
      openAccounts: openAccounts.length,
      outstandingBalanceCents: openAccounts.reduce((sum, account) => sum + Math.max(0, account.balanceCents), 0),
      settledAccounts: normalized.filter((account) => account.status === 'SETTLED').length,
    };
  }
}
