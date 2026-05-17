import nodemailer, { Transporter } from 'nodemailer';
import { Resend } from 'resend';
import { prisma } from '../../../shared/lib/prisma';
import { EmailType, EmailStatus } from '@prisma/client';
import { Booking, BookingItem, Payment, Prisma } from '@prisma/client';
import { centsToDollars } from '../../../shared/lib/validation';
import { getErrorMessage } from '../../../shared/lib/errors';
import { readFileSync } from 'fs';
import { join } from 'path';
import Handlebars from 'handlebars';
import { PdfService } from './pdf.service';
import { generateBookingToken } from '../../../shared/lib/booking-token';

/** Single brand logo for all reservation emails (override with EMAIL_LOGO_URL if needed) */
const CLASS_VIP_EMAIL_LOGO =
  'https://res.cloudinary.com/dt9iyiorn/image/upload/v1775026128/LOGO_CLASS_TIO_hzcxdc.png';
const STRIPE_BADGE_IMG_URL =
  'https://res.cloudinary.com/dt9iyiorn/image/upload/v1775031157/stripe_logo_kzjdiz.png';

function subtractThreeHoursFromDepartureTime(depTime: string): string | null {
  if (!depTime || typeof depTime !== 'string') return null;
  const s = depTime.trim();
  const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const h = parseInt(m24[1], 10);
    const min = parseInt(m24[2], 10);
    if (h > 23 || min > 59) return null;
    let mins = h * 60 + min - 180;
    if (mins < 0) mins += 24 * 60;
    const outH = Math.floor(mins / 60) % 24;
    const outM = mins % 60;
    return `${String(outH).padStart(2, '0')}:${String(outM).padStart(2, '0')}`;
  }
  const match =
    s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i) || s.match(/^(\d{1,2})(?:\.|:)?(\d{2})?\s*(AM|PM)?$/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2] || '0', 10);
  const ampm = (match[3] || '').toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  if (!ampm && (h > 23 || m > 59)) return null;
  let mins = h * 60 + m - 180;
  if (mins < 0) mins += 24 * 60;
  const outH = Math.floor(mins / 60) % 24;
  const outM = mins % 60;
  if (outH === 0) return `12:${String(outM).padStart(2, '0')} AM`;
  if (outH === 12) return `12:${String(outM).padStart(2, '0')} PM`;
  if (outH < 12) return `${outH}:${String(outM).padStart(2, '0')} AM`;
  return `${outH - 12}:${String(outM).padStart(2, '0')} PM`;
}

function formatDepartureDateDisplay(raw: string | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s) return null;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  return s;
}

function tripTypeToLabel(tripType: string | null | undefined): string | null {
  if (!tripType) return null;
  const t = tripType.toLowerCase();
  if (t === 'roundtrip') return 'Round trip';
  if (t === 'oneway') return 'One way';
  return tripType;
}

function routeToLabel(route: string | null | undefined): string | null {
  if (!route) return null;
  return route.replace(/-/g, ' → ');
}

type BookingEmailCustomer = {
  name: string;
  email: string;
  phone: string;
};

type BookingEmailItem = Pick<BookingItem, 'type' | 'name' | 'quantity' | 'totalPrice'> & {
  metadata?: BookingItem['metadata'];
};

type BookingEmailPayment = Pick<Payment, 'provider' | 'status'>;

export type BookingWithRelations = {
  id: Booking['id'];
  type: Booking['type'];
  status: Booking['status'];
  bookingDate: Booking['bookingDate'];
  bookingTime: Booking['bookingTime'];
  pickupLocation: Booking['pickupLocation'];
  dropoffLocation: Booking['dropoffLocation'];
  flightNumber?: Booking['flightNumber'];
  arrivalTime?: Booking['arrivalTime'];
  departureFlightNumber?: Booking['departureFlightNumber'];
  departureTime?: Booking['departureTime'];
  pickupTime?: Booking['pickupTime'];
  passengers: Booking['passengers'];
  totalAmount: Booking['totalAmount'];
  subtotalAmount: Booking['subtotalAmount'];
  taxAmount?: Booking['taxAmount'];
  metadata?: Booking['metadata'];
  tripType?: Booking['tripType'];
  route?: Booking['route'];
  confirmationCode?: Booking['confirmationCode'];
  notes?: Booking['notes'];
  internalNotes?: Booking['internalNotes'];
  customer: BookingEmailCustomer;
  items: BookingEmailItem[];
  payments?: BookingEmailPayment[];
  arrivalAirline?: string | null;
  departureAirline?: string | null;
};

type FormatBookingOptions = {
  manualConfirm?: boolean;
  pendingPayment?: boolean;
};

function resolvePaymentFields(
  booking: BookingWithRelations & { payments?: BookingEmailPayment[] },
  opts: FormatBookingOptions
): { paymentMethodText: string; showStripeIcon: boolean } {
  if (opts.pendingPayment) {
    return { paymentMethodText: 'Payment pending — secure card checkout (Stripe)', showStripeIcon: true };
  }
  if (opts.manualConfirm) {
    return { paymentMethodText: 'Confirmed offline by Class VIP (no card charge)', showStripeIcon: false };
  }
  const payments = booking.payments || [];
  const completed = payments.find((p) => p.status === 'COMPLETED');
  if (completed?.provider === 'STRIPE') {
    return { paymentMethodText: 'Paid securely with card (Stripe)', showStripeIcon: true };
  }
  if (completed?.provider === 'CASH' || completed?.provider === 'BANK_TRANSFER' || completed?.provider === 'MANUAL') {
    return { paymentMethodText: 'Recorded payment (offline)', showStripeIcon: false };
  }
  const pendingStripe = payments.find((p) => p.status === 'PENDING' && p.provider === 'STRIPE');
  if (pendingStripe) {
    return { paymentMethodText: 'Card payment in progress (Stripe)', showStripeIcon: true };
  }
  return { paymentMethodText: 'Payment received', showStripeIcon: false };
}

type EmailProvider = 'nodemailer' | 'resend' | null;

export class EmailService {
  private nodemailerTransport: Transporter | null = null;
  private resend: Resend | null = null;
  private provider: EmailProvider = null;
  private fromEmail: string;
  private companyEmails: string[];
  private frontendUrl: string;
  private logoUrl: string | null;
  private watermarkLogoUrl: string | null;
  private brandName: string;
  private primaryColor: string;
  private accentColor: string;
  private bgColor: string;

  constructor() {
    const companyEmailRaw = process.env.COMPANY_BOOKINGS_EMAIL || process.env.EMAIL_COMPANY_TO || '';
    if (!companyEmailRaw) {
      console.warn('[Email] COMPANY_BOOKINGS_EMAIL is not set. Company notifications will be skipped.');
    }
    this.companyEmails = companyEmailRaw.split(',').map(e => e.trim()).filter(Boolean);

    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (gmailUser && gmailAppPassword) {
      this.provider = 'nodemailer';
      this.fromEmail = gmailUser;
      this.nodemailerTransport = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: gmailUser,
          pass: gmailAppPassword,
        },
      });
      console.log('[Email] Nodemailer Gmail SMTP configured. From:', this.fromEmail, '| Company:', this.companyEmails.join(', '));
    } else {
      const apiKey = process.env.RESEND_API_KEY;
      this.fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
      if (apiKey) {
        this.provider = 'resend';
        this.resend = new Resend(apiKey);
        console.log('[Email] Resend OK (fallback). From:', this.fromEmail, '| Company:', this.companyEmails.join(', '));
      } else {
        console.warn('[Email] No email provider configured. Set GMAIL_USER + GMAIL_APP_PASSWORD, or RESEND_API_KEY.');
      }
    }

    if (this.companyEmails.length === 0) {
      console.warn('[Email] No company emails configured');
    }

    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    this.logoUrl = process.env.EMAIL_LOGO_URL || CLASS_VIP_EMAIL_LOGO;
    this.watermarkLogoUrl = process.env.EMAIL_WATERMARK_LOGO_URL || null;
    this.brandName = process.env.EMAIL_BRAND_NAME || 'Class VIP Transfers';
    this.primaryColor = process.env.EMAIL_PRIMARY_COLOR || '#071A2B';
    this.accentColor = process.env.EMAIL_ACCENT_COLOR || '#D9AE5F';
    this.bgColor = process.env.EMAIL_BG_COLOR || '#F7FAFF';
  }

  /**
   * Internal: send email via configured provider with full error logging
   */
  private async sendMail(options: {
    to: string | string[];
    subject: string;
    html: string;
    context?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const toList = Array.isArray(options.to) ? options.to : [options.to];
    const context = options.context || 'email';

    if (!this.provider) {
      const err = 'No email provider configured (GMAIL_USER+GMAIL_APP_PASSWORD or RESEND_API_KEY)';
      console.error(`[Email] sendMail FAILED (${context}):`, err, '| to:', toList.join(', '));
      return { success: false, error: err };
    }

    try {
      if (this.provider === 'nodemailer' && this.nodemailerTransport) {
        const info = await this.nodemailerTransport.sendMail({
          from: this.fromEmail,
          to: toList.join(', '),
          subject: options.subject,
          html: options.html,
        });
        console.log(`[Email] Nodemailer sent (${context}) | messageId:`, info.messageId, '| to:', toList.join(', '));
        return { success: true, messageId: info.messageId };
      }

      if (this.provider === 'resend' && this.resend) {
        const result = await this.resend.emails.send({
          from: this.fromEmail,
          to: toList.length === 1 ? toList[0] : toList,
          subject: options.subject,
          html: options.html,
        });
        if (result.error) {
          const errMsg = result.error.message || JSON.stringify(result.error);
          console.error(`[Email] Resend API error (${context}):`, errMsg, '| to:', toList.join(', '));
          return { success: false, error: errMsg };
        }
        console.log(`[Email] Resend sent (${context}) | id:`, result.data?.id, '| to:', toList.join(', '));
        return { success: true, messageId: result.data?.id };
      }

      const err = 'Email transport not available';
      console.error(`[Email] sendMail FAILED (${context}):`, err);
      return { success: false, error: err };
    } catch (error) {
      const errMsg = getErrorMessage(error, 'Unknown email delivery error');
      const stack =
        typeof error === 'object' && error !== null && 'stack' in error && typeof error.stack === 'string'
          ? `\n${error.stack}`
          : '';
      console.error(`[Email] sendMail EXCEPTION (${context}):`, errMsg, stack, '| to:', toList.join(', '));
      return { success: false, error: errMsg };
    }
  }

  /** Check if email is configured and can send */
  isConfigured(): boolean {
    return this.provider !== null;
  }

  /** Send startup test email - use for verifying config. Never throws. */
  async sendStartupTest(to: string): Promise<{ success: boolean; error?: string }> {
    const result = await this.sendMail({
      to,
      subject: `[${this.brandName}] Email config OK`,
      html: `<p>Server started at ${new Date().toISOString()}. Email system is operational.</p>`,
      context: 'startup-test',
    });
    return { success: result.success, error: result.error };
  }

  /**
   * Check if email was already sent (idempotency)
   */
  private async wasEmailSentToRecipient(
    bookingId: string,
    type: EmailType,
    to: string
  ): Promise<boolean> {
    const existing = await prisma.emailLog.findFirst({
      where: {
        bookingId,
        type,
        to,
        status: EmailStatus.SENT,
      },
    });

    return !!existing;
  }

  private async getRecipientsNeedingEmail(
    bookingId: string,
    type: EmailType,
    recipients: string[],
    forceResend: boolean
  ): Promise<string[]> {
    if (forceResend) {
      return recipients;
    }

    const checks = await Promise.all(
      recipients.map(async (recipient) => ({
        recipient,
        alreadySent: await this.wasEmailSentToRecipient(bookingId, type, recipient),
      }))
    );

    return checks.filter((entry) => !entry.alreadySent).map((entry) => entry.recipient);
  }

  private async logEmailResultForRecipients(
    bookingId: string,
    type: EmailType,
    recipients: string[],
    subject: string,
    status: EmailStatus,
    providerId?: string,
    error?: string
  ): Promise<void> {
    await Promise.all(
      recipients.map(async (recipient) => {
        const log = await this.createEmailLog(bookingId, type, recipient, subject);
        await this.updateEmailLog(log.id, status, providerId, error);
      })
    );
  }

  /**
   * Send "Booking Received / Pending Payment" to customer and company
   */
  async sendBookingReceived(
    booking: BookingWithRelations,
    forceResend: boolean = false
  ): Promise<{ customerSent: boolean; companySent: boolean }> {
    const full = await this.ensureBookingForEmail(booking);
    const data = this.formatBookingData(full, { pendingPayment: true });
    const subject = `Booking Received - Pending Payment - ${data.bookingIdShort}`;
    const html = this.renderTemplate('customer-pending', data);

    let customerSent = false;
    const shouldSendCustomer =
      forceResend ||
      !(await this.wasEmailSentToRecipient(
        booking.id,
        EmailType.BOOKING_RECEIVED,
        booking.customer.email
      ));

    if (shouldSendCustomer) {
      console.log(`[Email] Sending booking received to ${booking.customer.email}...`);
      const customerResult = await this.sendMail({
        to: booking.customer.email,
        subject,
        html,
        context: 'booking-received-customer',
      });
      if (customerResult.success) {
        await this.logEmailResultForRecipients(
          booking.id,
          EmailType.BOOKING_RECEIVED,
          [booking.customer.email],
          subject,
          EmailStatus.SENT,
          customerResult.messageId
        );
        customerSent = true;
      } else {
        await this.logEmailResultForRecipients(
          booking.id,
          EmailType.BOOKING_RECEIVED,
          [booking.customer.email],
          subject,
          EmailStatus.FAILED,
          undefined,
          customerResult.error
        );
      }
    } else {
      console.log(`[Email] Booking received email already sent to ${booking.customer.email}`);
    }

    let companySent = false;
    if (this.companyEmails.length > 0) {
      try {
        companySent = await this.sendCompanyNotificationForType(
          booking,
          EmailType.BOOKING_RECEIVED,
          true,
          forceResend
        );
      } catch (err) {
        console.error(`❌ Company copy failed (booking not affected):`, getErrorMessage(err));
      }
    }

    return { customerSent, companySent };
  }

  /**
   * Internal: send company notification for a specific EmailType (e.g. BOOKING_RECEIVED)
   */
  private async sendCompanyNotificationForType(
    booking: BookingWithRelations,
    type: EmailType,
    isPending: boolean,
    forceResend: boolean = false
  ): Promise<boolean> {
    const full = await this.ensureBookingForEmail(booking);
    const data = this.formatBookingData(full, isPending ? { pendingPayment: true } : {});
    Object.assign(data, {
      companyEmailTitle: isPending ? 'New Booking Received (Pending Payment)' : 'New Booking Confirmed',
      companyStatusBadge: isPending ? 'PENDING PAYMENT' : 'CONFIRMED',
      companyStatusBadgeColor: isPending ? '#F59E0B' : '#10B981',
      companyPaymentStatusText: isPending ? '⏳ Pending' : '✓ Confirmed',
      companyPaymentStatusColor: isPending ? '#F59E0B' : '#10B981',
    });
    const subject = isPending
      ? `New Booking Received (Pending) - ${booking.type} - ${data.customerName}`
      : `New Booking Confirmed - ${booking.type} - ${data.customerName}`;
    const html = this.renderTemplate('company-confirmed', data);

    const companyRecipients = [...this.companyEmails];
    const pendingRecipients = await this.getRecipientsNeedingEmail(
      booking.id,
      type,
      companyRecipients,
      forceResend
    );

    if (pendingRecipients.length === 0) {
      console.log(`[Email] Company ${type} email already sent to all recipients for booking ${booking.id}`);
      return true;
    }

    const result = await this.sendMail({
      to: pendingRecipients,
      subject,
      html,
      context: 'company-notification',
    });
    if (result.success) {
      await this.logEmailResultForRecipients(
        booking.id,
        type,
        pendingRecipients,
        subject,
        EmailStatus.SENT,
        result.messageId
      );
      return true;
    }
    await this.logEmailResultForRecipients(
      booking.id,
      type,
      pendingRecipients,
      subject,
      EmailStatus.FAILED,
      undefined,
      result.error
    );
    throw new Error(result.error);
  }

  /**
   * Send cancellation email to customer and company
   */
  async sendCancellation(
    booking: BookingWithRelations,
    reason?: string,
    forceResend: boolean = false
  ): Promise<{ customerSent: boolean; companySent: boolean }> {
    const full = await this.ensureBookingForEmail(booking);
    const data = this.formatBookingData(full, {});
    const cancellationData = data as typeof data & { cancellationReason?: string | null };
    cancellationData.cancellationReason = reason || null;
    const subject = `Booking Cancelled - ${data.bookingIdShort}`;
    const html = this.renderTemplate('customer-cancelled', data);

    let customerSent = false;
    const shouldSendCustomer =
      forceResend ||
      !(await this.wasEmailSentToRecipient(booking.id, EmailType.CANCELLED, booking.customer.email));

    if (shouldSendCustomer) {
      const customerResult = await this.sendMail({
        to: booking.customer.email,
        subject,
        html,
        context: 'cancellation-customer',
      });
      if (customerResult.success) {
        await this.logEmailResultForRecipients(
          booking.id,
          EmailType.CANCELLED,
          [booking.customer.email],
          subject,
          EmailStatus.SENT,
          customerResult.messageId
        );
        customerSent = true;
      } else {
        await this.logEmailResultForRecipients(
          booking.id,
          EmailType.CANCELLED,
          [booking.customer.email],
          subject,
          EmailStatus.FAILED,
          undefined,
          customerResult.error
        );
      }
    } else {
      console.log(`[Email] Cancellation email already sent to ${booking.customer.email}`);
    }

    let companySent = false;
    if (this.companyEmails.length > 0) {
      try {
        companySent = await this.sendCompanyCancellationNotification(booking, reason, forceResend);
      } catch (err) {
        console.error(`❌ Company cancellation copy failed:`, getErrorMessage(err));
      }
    }

    return { customerSent, companySent };
  }

  private async sendCompanyCancellationNotification(
    booking: BookingWithRelations,
    reason?: string,
    forceResend: boolean = false
  ): Promise<boolean> {
    const full = await this.ensureBookingForEmail(booking);
    const data = this.formatBookingData(full, {});
    const companyCancellationData = data as typeof data & {
      companyEmailTitle?: string;
      companyStatusBadge?: string;
      companyStatusBadgeColor?: string;
      companyPaymentStatusText?: string;
      companyPaymentStatusColor?: string;
      cancellationReason?: string | null;
    };
    companyCancellationData.companyEmailTitle = 'Booking Cancelled';
    companyCancellationData.companyStatusBadge = 'CANCELLED';
    companyCancellationData.companyStatusBadgeColor = '#EF4444';
    companyCancellationData.companyPaymentStatusText = 'Cancelled';
    companyCancellationData.companyPaymentStatusColor = '#EF4444';
    companyCancellationData.cancellationReason = reason || null;
    const subject = `Booking Cancelled - ${booking.type} - ${data.customerName}`;
    const html = this.renderTemplate('company-confirmed', data);

    const companyRecipients = [...this.companyEmails];
    const pendingRecipients = await this.getRecipientsNeedingEmail(
      booking.id,
      EmailType.CANCELLED,
      companyRecipients,
      forceResend
    );

    if (pendingRecipients.length === 0) {
      console.log(`[Email] Company cancellation email already sent to all recipients for booking ${booking.id}`);
      return true;
    }

    const result = await this.sendMail({
      to: pendingRecipients,
      subject,
      html,
      context: 'cancellation-company',
    });
    if (result.success) {
      await this.logEmailResultForRecipients(
        booking.id,
        EmailType.CANCELLED,
        pendingRecipients,
        subject,
        EmailStatus.SENT,
        result.messageId
      );
      return true;
    }
    await this.logEmailResultForRecipients(
      booking.id,
      EmailType.CANCELLED,
      pendingRecipients,
      subject,
      EmailStatus.FAILED,
      undefined,
      result.error
    );
    throw new Error(result.error);
  }

  private async wasEmailSent(bookingId: string, type: EmailType): Promise<boolean> {
    const existing = await prisma.emailLog.findFirst({
      where: {
        bookingId,
        type,
        status: EmailStatus.SENT,
      },
    });

    return !!existing;
  }

  /**
   * Create email log entry
   */
  private async createEmailLog(
    bookingId: string,
    type: EmailType,
    to: string,
    subject: string,
    bcc?: string
  ) {
    return await prisma.emailLog.create({
      data: {
        bookingId,
        type,
        to,
        bcc: bcc || null,
        from: this.fromEmail,
        subject,
        status: EmailStatus.PENDING,
        provider: this.provider || 'resend',
      },
    });
  }

  /**
   * Update email log with result
   */
  private async updateEmailLog(
    logId: string,
    status: EmailStatus,
    providerId?: string,
    error?: string
  ) {
    await prisma.emailLog.update({
      where: { id: logId },
      data: {
        status,
        providerId,
        error,
        sentAt: status === EmailStatus.SENT ? new Date() : null,
      },
    });
  }

  /**
   * Load email template
   */
  private loadTemplate(templateName: string): string {
    const candidates = [
      join(process.cwd(), 'src', 'features', 'booking', 'templates', `${templateName}.html`),
      join(process.cwd(), 'backend', 'src', 'features', 'booking', 'templates', `${templateName}.html`),
    ];
    for (const templatePath of candidates) {
      try {
        return readFileSync(templatePath, 'utf-8');
      } catch {
        continue;
      }
    }
    console.error(`[Email] Template not found: ${templateName}.html (tried: ${candidates.join(', ')})`);
    return '<html><body><p>Email template not found</p></body></html>';
  }

  /**
   * Render template with Handlebars
   */
  private renderTemplate(templateName: string, data: Record<string, unknown>): string {
    try {
      Handlebars.registerHelper('zebraBg', (index: number) => ((index ?? 0) % 2 === 0 ? '#ffffff' : '#f9fafb'));
      const source = this.loadTemplate(templateName);
      const template = Handlebars.compile(source, { noEscape: true });
      const rendered = template(data);
      if (rendered.includes('Email template not found')) {
        throw new Error('Template file not found');
      }
      return rendered;
    } catch (error) {
      const stack =
        typeof error === 'object' && error !== null && 'stack' in error && typeof error.stack === 'string'
          ? error.stack
          : '';
      console.error(`[Email] Template rendering error (${templateName}):`, getErrorMessage(error), stack);
      return '<html><body><p>Template rendering error</p></body></html>';
    }
  }

  /**
   * Reload booking with payments when not already included (e.g. email payloads).
   */
  private async ensureBookingForEmail(
    booking: BookingWithRelations
  ): Promise<BookingWithRelations & { payments: BookingEmailPayment[] }> {
    if (Array.isArray(booking.payments)) {
      return booking as BookingWithRelations & { payments: BookingEmailPayment[] };
    }
    const full = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: {
        customer: true,
        items: true,
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (full) return full as BookingWithRelations & { payments: BookingEmailPayment[] };
    return { ...booking, payments: [] };
  }

  /**
   * Get formatted booking data for templates (email or PDF). Public for PDF service.
   */
  getFormatBookingData(booking: BookingWithRelations, formatOptions?: FormatBookingOptions) {
    return this.formatBookingData(booking, formatOptions);
  }

  /**
   * Render confirmation email HTML with given template data (for preview).
   */
  renderConfirmationEmail(data: Record<string, unknown>): string {
    return this.renderTemplate('customer-confirmed', data);
  }

  /** Render any named email template (for admin previews). */
  renderEmailTemplate(templateName: string, data: Record<string, unknown>): string {
    return this.renderTemplate(templateName, data);
  }

  /**
   * Format booking data for email / PDF
   */
  private formatBookingData(booking: BookingWithRelations, formatOptions: FormatBookingOptions = {}) {
    const totalDollars = centsToDollars(booking.totalAmount);
    const formattedDate = new Date(booking.bookingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const bookingMeta = (booking.metadata as Record<string, unknown> | null | undefined) || {};
    const departureDateRaw =
      typeof bookingMeta.departureDate === 'string' ? bookingMeta.departureDate : undefined;
    const departureDateFormatted = formatDepartureDateDisplay(departureDateRaw);

    const tripTypeLabel = tripTypeToLabel(booking.tripType);
    const routeLabel = routeToLabel(booking.route);

    const issueDateFormatted = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const { paymentMethodText, showStripeIcon } = resolvePaymentFields(booking, formatOptions);

    const taxCents = booking.taxAmount ?? 0;
    const subCents = booking.subtotalAmount;
    const hasTaxBreakdown = taxCents > 0 && subCents != null && subCents >= 0;
    const subtotalDollarsNum =
      hasTaxBreakdown && subCents != null ? centsToDollars(subCents) : totalDollars;
    const taxDollarsNum = hasTaxBreakdown ? centsToDollars(taxCents) : 0;

    // Group items by type
    const activityItems = booking.items.filter(
      item =>
        item.type === 'ACTIVITY' || item.type === 'COMBO' || item.type === 'CRAZY_COMBO'
    );
    const parkFees = booking.items.filter(item => item.type === 'PARK_ENTRANCE');
    const transportationItems = booking.items.filter(item => item.type === 'TRANSPORTATION');

    const transportationForTemplate = transportationItems.map(item => ({
      name: item.name,
      qty: 1,
      priceText: `$${centsToDollars(item.totalPrice).toFixed(2)}`,
      metaText: 'Transportation',
    }));

    const activityItemsForTemplate = activityItems.map(item => ({
      name: item.name,
      qty: item.quantity,
      priceText: `$${centsToDollars(item.totalPrice).toFixed(2)}`,
      metaText: `${item.type} • ${item.quantity} passenger${item.quantity > 1 ? 's' : ''}`,
    }));

    parkFees.forEach(item => {
      activityItemsForTemplate.push({
        name: item.name || 'Park Entrance Fee',
        qty: item.quantity,
        priceText: `$${centsToDollars(item.totalPrice).toFixed(2)}`,
        metaText: `${item.quantity} person${item.quantity > 1 ? 's' : ''}`,
      });
    });

    const transportItem = transportationItems[0];
    const meta = transportItem?.metadata as
      | { included?: Array<{ code?: string; label?: string }> }
      | undefined;
    const includedRaw = meta?.included || [];
    const includedItems =
      includedRaw.length > 0
        ? includedRaw.map((x: { label?: string; code?: string }) => x.label || x.code || 'Included').filter(Boolean)
        : ['Basic kit (beers + water)'];

    const addons = booking.items.filter(item => item.type === 'ADDON');
    const extrasWithPrices =
      addons.length > 0
        ? addons.map(a => ({
            label: a.name,
            qty: a.quantity,
            priceText: `$${centsToDollars(a.totalPrice).toFixed(2)}`,
            unitPriceText:
              a.quantity > 0 ? `$${(centsToDollars(a.totalPrice) / a.quantity).toFixed(2)}` : null,
          }))
        : (() => {
            const extrasMeta = (
              meta as { extras?: Array<{ label?: string; qty?: number; priceCents?: number }> }
            )?.extras;
            if (!extrasMeta?.length) return [];
            return extrasMeta.map((e: { label?: string; qty?: number; priceCents?: number }) => ({
              label: e.label || '',
              qty: e.qty || 1,
              priceText: `$${((e.priceCents || 0) / 100).toFixed(2)}`,
              unitPriceText:
                (e.qty || 1) > 0
                  ? `$${(((e.priceCents || 0) / 100) / (e.qty || 1)).toFixed(2)}`
                  : null,
            }));
          })();

    const reservationBreakdown: Array<{ label: string; qty: number; priceText: string }> = [];
    booking.items.forEach(item => {
      const qty = item.quantity || 1;
      const priceText = `$${centsToDollars(item.totalPrice).toFixed(2)}`;
      const label = qty > 1 ? `${item.name} (×${qty})` : item.name;
      reservationBreakdown.push({ label, qty, priceText });
    });

    const servicesPurchased: Array<{ category: string; lines: string[] }> = [];
    if (transportationForTemplate.length) {
      servicesPurchased.push({
        category: 'Transportation',
        lines: transportationForTemplate.map(t => `${t.name} — ${t.priceText}`),
      });
    }
    if (activityItemsForTemplate.length) {
      servicesPurchased.push({
        category: 'Activities & tours',
        lines: activityItemsForTemplate.map(a => `${a.name} — ${a.qty} pax — ${a.priceText}`),
      });
    }
    if (extrasWithPrices.length) {
      servicesPurchased.push({
        category: 'Add-ons & packages',
        lines: extrasWithPrices.map(e => `${e.label} × ${e.qty} — ${e.priceText}`),
      });
    }
    const hasServicesPurchased = servicesPurchased.length > 0;

    const hasArrivalFlight = !!(
      booking.flightNumber ||
      booking.arrivalTime ||
      booking.arrivalAirline
    );
    const hasDepartureFlight = !!(
      booking.departureFlightNumber ||
      booking.departureTime ||
      booking.departureAirline
    );

    const flightDetails =
      hasArrivalFlight || hasDepartureFlight
        ? {
            arrival: hasArrivalFlight
              ? {
                  airline: booking.arrivalAirline || null,
                  flightNumber: booking.flightNumber || null,
                  time: booking.arrivalTime || null,
                  displayText:
                    [
                      booking.arrivalAirline,
                      booking.flightNumber,
                      booking.arrivalTime ? `Arrival: ${booking.arrivalTime}` : null,
                    ]
                      .filter(Boolean)
                      .join(' • ') || null,
                }
              : null,
            departure: hasDepartureFlight
              ? {
                  airline: booking.departureAirline || null,
                  flightNumber: booking.departureFlightNumber || null,
                  time: booking.departureTime || null,
                  displayText:
                    [
                      booking.departureAirline,
                      booking.departureFlightNumber,
                      booking.departureTime ? `Departure: ${booking.departureTime}` : null,
                    ]
                      .filter(Boolean)
                      .join(' • ') || null,
                }
              : null,
          }
        : null;

    const pickupTime = booking.pickupTime || booking.bookingTime || 'TBD';

    const departurePickupTime = booking.departureTime
      ? subtractThreeHoursFromDepartureTime(booking.departureTime)
      : null;

    const parkFeeText =
      activityItems.length > 0
        ? 'Park entry fee: $25 USD per person (paid at check-in)'
        : null;

    const vehicleProtectionText =
      activityItems.length > 0
        ? 'Vehicle protection is optional. If declined, a $1,000 USD credit card hold may be required and released after the tour if no damages.'
        : null;

    const cancellationPolicy = [
      'Free cancellation up to 24 hours before your scheduled time.',
      'Within 24 hours: non-refundable.',
      'No-show: 100% charge.',
    ];

    const logoUrl = this.logoUrl || CLASS_VIP_EMAIL_LOGO;

    return {
      bookingId: booking.id,
      bookingIdShort: booking.id.substring(0, 8).toUpperCase(),
      confirmationCode: booking.confirmationCode || null,
      customerName: booking.customer.name,
      customerEmail: booking.customer.email,
      customerPhone: booking.customer.phone,
      bookingType: booking.type,
      formattedDate,
      bookingTime: booking.bookingTime || 'TBD',
      pickupTime,
      pickupLocation: booking.pickupLocation || null,
      dropoffLocation: booking.dropoffLocation || null,
      passengers: booking.passengers,
      passengersLabel: booking.passengers === 1 ? '1 guest' : `${booking.passengers} guests`,
      tripTypeLabel,
      routeLabel,
      hasTripMeta: !!(tripTypeLabel || routeLabel),
      departureDateFormatted,
      hasDepartureDay: !!departureDateFormatted,
      issueDateFormatted,
      transportationItems: transportationForTemplate,
      activityItems: activityItemsForTemplate,
      flightDetails,
      hasArrivalFlight,
      hasDepartureFlight,
      departurePickupTime,
      totalDollars: totalDollars.toFixed(2),
      totalPaidText: `$${totalDollars.toFixed(2)} USD`,
      hasTaxBreakdown,
      subtotalBeforeTaxText: hasTaxBreakdown ? `$${subtotalDollarsNum.toFixed(2)} USD` : null,
      taxIvaText: hasTaxBreakdown ? `$${taxDollarsNum.toFixed(2)} USD` : null,
      notes: booking.notes,
      internalNotes: booking.internalNotes || null,
      hasActivities: activityItems.length > 0,
      includedItems,
      extrasWithPrices,
      reservationBreakdown,
      servicesPurchased,
      hasServicesPurchased,
      parkFeeText,
      vehicleProtectionText,
      cancellationPolicy,
      logoUrl,
      watermarkLogoUrl: this.watermarkLogoUrl || logoUrl,
      brandName: this.brandName,
      paymentUrl: `${this.frontendUrl}/checkout?bookingId=${booking.id}&bt=${generateBookingToken(booking.id)}`,
      paymentMethodText,
      showStripeIcon,
      stripeBadgeUrl: STRIPE_BADGE_IMG_URL,
      primaryColor: this.primaryColor,
      accentColor: this.accentColor,
      bgColor: this.bgColor,
      frontendUrl: this.frontendUrl,
    };
  }

  /**
   * Send customer confirmation email (payment confirmed or manual confirm)
   */
  async sendCustomerConfirmation(
    booking: BookingWithRelations,
    forceResend: boolean = false,
    options?: { manualConfirm?: boolean }
  ): Promise<boolean> {
    const emailType = options?.manualConfirm ? EmailType.MANUAL_CONFIRMED : EmailType.CUSTOMER_CONFIRMATION;
    if (!forceResend && (await this.wasEmailSent(booking.id, emailType))) {
      console.log(`Customer confirmation (${emailType}) already sent for booking ${booking.id}`);
      return false;
    }

    const full = await this.ensureBookingForEmail(booking);
    const data = this.formatBookingData(full, {
      manualConfirm: options?.manualConfirm,
    });
    const backendUrl = process.env.BACKEND_URL || process.env.FRONTEND_URL || 'http://localhost:3001';
    const pdfService = new PdfService();
    const confirmationData = data as typeof data & { pdfToken?: string; confirmationPdfUrl?: string };
    confirmationData.pdfToken = pdfService.createPdfToken(booking.id);
    confirmationData.confirmationPdfUrl = `${backendUrl}/api/bookings/${booking.id}/confirmation-pdf?token=${confirmationData.pdfToken}`;
    const subject = options?.manualConfirm
      ? `Your Reservation is Confirmed - Booking ${booking.id.substring(0, 8).toUpperCase()}`
      : `Your Reservation is Confirmed - Booking ${booking.id.substring(0, 8).toUpperCase()}`;

    const html = this.renderTemplate('customer-confirmed', data);

    console.log(`📧 Preparing to send customer confirmation:`, {
      bookingId: booking.id,
      customerTo: booking.customer.email,
      type: emailType,
    });

    const emailLog = await this.createEmailLog(
      booking.id,
      emailType,
      booking.customer.email,
      subject
    );

    const result = await this.sendMail({
      to: booking.customer.email,
      subject,
      html,
      context: 'customer-confirmation',
    });

    if (result.success) {
      await this.updateEmailLog(emailLog.id, EmailStatus.SENT, result.messageId);
      return true;
    }
    await this.updateEmailLog(emailLog.id, EmailStatus.FAILED, undefined, result.error);
    return false;
  }

  /**
   * Send company notification email
   * Sends to all company emails. If isPending=true, uses PENDING badge/text.
   */
  async sendCompanyNotification(
    booking: BookingWithRelations,
    forceResend: boolean = false,
    isPending: boolean = false
  ): Promise<boolean> {
    if (this.companyEmails.length === 0) {
      console.warn(`⚠️ COMPANY_BOOKINGS_EMAIL/EMAIL_COMPANY_TO not configured - skipping company notification for booking ${booking.id}`);
      return false;
    }

    const full = await this.ensureBookingForEmail(booking);
    const data = this.formatBookingData(full, isPending ? { pendingPayment: true } : {});
    Object.assign(data, {
      companyEmailTitle: isPending ? 'New Booking Received (Pending Payment)' : 'New Booking Confirmed',
      companyStatusBadge: isPending ? 'PENDING PAYMENT' : 'CONFIRMED',
      companyStatusBadgeColor: isPending ? '#F59E0B' : '#10B981',
      companyPaymentStatusText: isPending ? '⏳ Pending' : '✓ Confirmed',
      companyPaymentStatusColor: isPending ? '#F59E0B' : '#10B981',
    });
    const subject = isPending
      ? `New Booking Received (Pending) - ${booking.type} - ${data.customerName}`
      : `New Booking Confirmed - ${booking.type} - ${data.customerName}`;

    const html = this.renderTemplate('company-confirmed', data);

    // Parse company recipients (support comma-separated)
    const companyRecipients = this.companyEmails
      .flatMap(email => email.split(','))
      .map(s => s.trim())
      .filter(Boolean);

    // Logging before sending
    console.log(`📧 Preparing to send company notification:`, {
      bookingId: booking.id,
      companyTo: companyRecipients.join(', '),
      from: this.fromEmail,
      subject,
    });

    const pendingRecipients = await this.getRecipientsNeedingEmail(
      booking.id,
      EmailType.COMPANY_NOTIFICATION,
      companyRecipients,
      forceResend
    );

    if (pendingRecipients.length === 0) {
      console.log(`Company notification already sent to all recipients for booking ${booking.id}`);
      return true;
    }

    const result = await this.sendMail({
      to: pendingRecipients,
      subject,
      html,
      context: 'company-notification',
    });

    if (result.success) {
      await this.logEmailResultForRecipients(
        booking.id,
        EmailType.COMPANY_NOTIFICATION,
        pendingRecipients,
        subject,
        EmailStatus.SENT,
        result.messageId
      );
      return true;
    }

    await this.logEmailResultForRecipients(
      booking.id,
      EmailType.COMPANY_NOTIFICATION,
      pendingRecipients,
      subject,
      EmailStatus.FAILED,
      undefined,
      result.error
    );
    return false;
  }

  /**
   * Send both confirmation emails
   * ALWAYS sends to both customer and company (if configured).
   * If company send fails, logs error but does NOT throw.
   */
  async sendConfirmationEmails(
    booking: BookingWithRelations,
    forceResend: boolean = false,
    options?: { manualConfirm?: boolean }
  ): Promise<{ customerSent: boolean; companySent: boolean }> {
    console.log(`📧 Sending confirmation emails for booking ${booking.id}:`, {
      customerTo: booking.customer.email,
      companyTo: this.companyEmails.length > 0 ? this.companyEmails.join(', ') : 'NOT CONFIGURED',
      manualConfirm: options?.manualConfirm,
    });

    const customerSent = await this.sendCustomerConfirmation(booking, forceResend, options);

    let companySent = false;
    try {
      companySent = await this.sendCompanyNotification(booking, forceResend, false);
    } catch (err) {
      console.error(`❌ Company copy failed (booking not affected):`, getErrorMessage(err));
    }

    // Log summary
    console.log(`📊 Confirmation emails summary for booking ${booking.id}:`, {
      customerSent,
      companySent,
      companyEmailsCount: this.companyEmails.length,
    });

    return { customerSent, companySent };
  }


  /**
   * Send test email (dev only)
   * Sends both customer and company templates for testing
   */
  async sendTestEmail(customerEmail: string, companyEmail?: string): Promise<{
    customerSent: boolean;
    companySent: boolean;
    details: {
      customer?: { success: boolean; error?: string };
      company?: { success: boolean; error?: string; emails?: string[] };
    };
  }> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Test emails disabled in production');
    }

    // Create mock booking data
    const mockBooking: BookingWithRelations = {
      id: 'test-booking-id',
      type: 'TRANSPORTATION',
      status: 'CONFIRMED',
      customer: {
        name: 'Test Customer',
        email: customerEmail,
        phone: '+1234567890',
      },
      bookingDate: new Date(),
      bookingTime: '10:00',
      pickupLocation: 'Los Cabos Airport',
      dropoffLocation: 'Hotel Zone',
      flightNumber: 'AA1234',
      arrivalTime: '10:30',
      passengers: 2,
      totalAmount: 8500,
      subtotalAmount: 7328,
      taxAmount: 1172,
      metadata: { departureDate: '2026-05-01T12:00:00.000Z' } as Prisma.JsonObject,
      tripType: 'oneway',
      route: 'airport-hotel',
      confirmationCode: 'CLASS-TEST01',
      payments: [{ provider: 'STRIPE', status: 'COMPLETED' }],
      notes: 'Test booking',
      items: [
        {
          type: 'TRANSPORTATION',
          name: 'Private Transfer',
          quantity: 1,
          totalPrice: 7328,
        },
      ],
    };

    // Temporarily override company emails if provided
    const originalCompanyEmails = this.companyEmails;
    if (companyEmail) {
      this.companyEmails = companyEmail.split(',').map(e => e.trim()).filter(Boolean);
    }

    try {
      // Send customer email
      let customerResult: { success: boolean; error?: string } | undefined;
      try {
        const customerSent = await this.sendCustomerConfirmation(mockBooking, true);
        customerResult = { success: customerSent };
      } catch (error) {
        customerResult = { success: false, error: getErrorMessage(error) };
      }

      // Send company email
      let companyResult: { success: boolean; error?: string; emails?: string[] } | undefined;
      try {
        const companySent = await this.sendCompanyNotification(mockBooking, true);
        companyResult = { 
          success: companySent, 
          emails: this.companyEmails.length > 0 ? this.companyEmails : undefined 
        };
      } catch (error) {
        companyResult = { 
          success: false, 
          error: getErrorMessage(error),
          emails: this.companyEmails.length > 0 ? this.companyEmails : undefined 
        };
      }

      return {
        customerSent: customerResult?.success || false,
        companySent: companyResult?.success || false,
        details: {
          customer: customerResult,
          company: companyResult,
        },
      };
    } finally {
      // Restore original company emails
      this.companyEmails = originalCompanyEmails;
    }
  }
}

