import nodemailer, { Transporter } from 'nodemailer';
import { Resend } from 'resend';
import { prisma } from '../lib/prisma';
import { EmailType, EmailStatus } from '@prisma/client';
import { Booking, Customer, BookingItem } from '@prisma/client';
import { centsToDollars } from '../lib/validation';
import { readFileSync } from 'fs';
import { join } from 'path';
import Handlebars from 'handlebars';
import { PdfService } from './pdf.service';

interface BookingWithRelations extends Booking {
  customer: Customer;
  items: BookingItem[];
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
    const companyEmailRaw = process.env.COMPANY_BOOKINGS_EMAIL || process.env.EMAIL_COMPANY_TO || 'condecorporation@gmail.com';
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
    this.logoUrl = process.env.EMAIL_LOGO_URL || 'https://res.cloudinary.com/dpmozdkfh/image/upload/v1772074422/Gemini_Generated_Image_zbgk2uzbgk2uzbgk_jnj3n2.png';
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
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      const stack = error?.stack ? `\n${error.stack}` : '';
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
  /**
   * Send "Booking Received / Pending Payment" to customer and company
   */
  async sendBookingReceived(booking: BookingWithRelations): Promise<{ customerSent: boolean; companySent: boolean }> {
    const data = this.formatBookingData(booking);
    const subject = `Booking Received - Pending Payment - ${data.bookingIdShort}`;
    const html = this.renderTemplate('customer-pending', data);

    const emailLog = await this.createEmailLog(
      booking.id,
      EmailType.BOOKING_RECEIVED,
      booking.customer.email,
      subject
    );

    let customerSent = false;
    console.log(`[Email] Sending booking received to ${booking.customer.email}...`);
    const customerResult = await this.sendMail({
      to: booking.customer.email,
      subject,
      html,
      context: 'booking-received-customer',
    });
    if (customerResult.success) {
      await this.updateEmailLog(emailLog.id, EmailStatus.SENT, customerResult.messageId);
      customerSent = true;
    } else {
      await this.updateEmailLog(emailLog.id, EmailStatus.FAILED, undefined, customerResult.error);
    }

    let companySent = false;
    if (this.companyEmails.length > 0) {
      try {
        companySent = await this.sendCompanyNotificationForType(
          booking,
          EmailType.BOOKING_RECEIVED,
          true
        );
      } catch (err: any) {
        console.error(`❌ Company copy failed (booking not affected):`, err.message);
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
    isPending: boolean
  ): Promise<boolean> {
    const data = this.formatBookingData(booking);
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
    const logPromises = companyRecipients.map((email) =>
      this.createEmailLog(booking.id, type, email, subject)
    );
    const logs = await Promise.all(logPromises);

    const result = await this.sendMail({
      to: companyRecipients,
      subject,
      html,
      context: 'company-notification',
    });
    if (result.success) {
      for (const log of logs) {
        await this.updateEmailLog(log.id, EmailStatus.SENT, result.messageId);
      }
      return true;
    }
    for (const log of logs) {
      await this.updateEmailLog(log.id, EmailStatus.FAILED, undefined, result.error);
    }
    throw new Error(result.error);
  }

  /**
   * Send cancellation email to customer and company
   */
  async sendCancellation(booking: BookingWithRelations, reason?: string): Promise<{ customerSent: boolean; companySent: boolean }> {
    const data = this.formatBookingData(booking);
    (data as any).cancellationReason = reason || null;
    const subject = `Booking Cancelled - ${data.bookingIdShort}`;
    const html = this.renderTemplate('customer-cancelled', data);

    const emailLog = await this.createEmailLog(
      booking.id,
      EmailType.CANCELLED,
      booking.customer.email,
      subject
    );

    let customerSent = false;
    const customerResult = await this.sendMail({
      to: booking.customer.email,
      subject,
      html,
      context: 'cancellation-customer',
    });
    if (customerResult.success) {
      await this.updateEmailLog(emailLog.id, EmailStatus.SENT, customerResult.messageId);
      customerSent = true;
    } else {
      await this.updateEmailLog(emailLog.id, EmailStatus.FAILED, undefined, customerResult.error);
    }

    let companySent = false;
    if (this.companyEmails.length > 0) {
      try {
        companySent = await this.sendCompanyCancellationNotification(booking, reason);
      } catch (err: any) {
        console.error(`❌ Company cancellation copy failed:`, err.message);
      }
    }

    return { customerSent, companySent };
  }

  private async sendCompanyCancellationNotification(booking: BookingWithRelations, reason?: string): Promise<boolean> {
    const data = this.formatBookingData(booking);
    (data as any).companyEmailTitle = 'Booking Cancelled';
    (data as any).companyStatusBadge = 'CANCELLED';
    (data as any).companyStatusBadgeColor = '#EF4444';
    (data as any).companyPaymentStatusText = 'Cancelled';
    (data as any).companyPaymentStatusColor = '#EF4444';
    (data as any).cancellationReason = reason || null;
    const subject = `Booking Cancelled - ${booking.type} - ${data.customerName}`;
    const html = this.renderTemplate('company-confirmed', data);

    const companyRecipients = [...this.companyEmails];
    const logs = await Promise.all(
      companyRecipients.map((email) =>
        this.createEmailLog(booking.id, EmailType.CANCELLED, email, subject)
      )
    );

    const result = await this.sendMail({
      to: companyRecipients,
      subject,
      html,
      context: 'cancellation-company',
    });
    if (result.success) {
      for (const log of logs) {
        await this.updateEmailLog(log.id, EmailStatus.SENT, result.messageId);
      }
      return true;
    }
    for (const log of logs) {
      await this.updateEmailLog(log.id, EmailStatus.FAILED, undefined, result.error);
    }
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
      join(process.cwd(), 'src', 'templates', `${templateName}.html`),
      join(process.cwd(), 'backend', 'src', 'templates', `${templateName}.html`),
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
  private renderTemplate(templateName: string, data: any): string {
    try {
      Handlebars.registerHelper('zebraBg', (index: number) => ((index ?? 0) % 2 === 0 ? '#ffffff' : '#f9fafb'));
      const source = this.loadTemplate(templateName);
      const template = Handlebars.compile(source, { noEscape: true });
      const rendered = template(data);
      if (rendered.includes('Email template not found')) {
        throw new Error('Template file not found');
      }
      return rendered;
    } catch (error: any) {
      console.error(`[Email] Template rendering error (${templateName}):`, error?.message || error, error?.stack || '');
      return '<html><body><p>Template rendering error</p></body></html>';
    }
  }

  /**
   * Get formatted booking data for templates (email or PDF). Public for PDF service.
   */
  getFormatBookingData(booking: BookingWithRelations) {
    return this.formatBookingData(booking);
  }

  /**
   * Render confirmation email HTML with given template data (for preview).
   */
  renderConfirmationEmail(data: Record<string, unknown>): string {
    return this.renderTemplate('customer-confirmed', data);
  }

  /**
   * Format booking data for email
   */
  private formatBookingData(booking: BookingWithRelations) {
    const totalDollars = centsToDollars(booking.totalAmount);
    const formattedDate = new Date(booking.bookingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Group items by type
    const activityItems = booking.items.filter(item =>
      item.type === 'ACTIVITY' || item.type === 'COMBO' || item.type === 'CRAZY_COMBO'
    );
    const parkFees = booking.items.filter(item => item.type === 'PARK_ENTRANCE');
    const transportationItems = booking.items.filter(item => item.type === 'TRANSPORTATION');

    // Transportation: detailed list (never mixed with activities)
    const transportationForTemplate = transportationItems.map(item => ({
      name: item.name,
      qty: 1,
      priceText: `$${centsToDollars(item.totalPrice).toFixed(2)}`,
      metaText: 'Transportation',
    }));

    // Activities only: tours, ATV, excursions (NO transportation)
    const activityItemsForTemplate = activityItems.map(item => ({
      name: item.name,
      qty: item.quantity,
      priceText: `$${centsToDollars(item.totalPrice).toFixed(2)}`,
      metaText: `${item.type} • ${item.quantity} passenger${item.quantity > 1 ? 's' : ''}`,
    }));

    // Park fees as activities
    parkFees.forEach(item => {
      activityItemsForTemplate.push({
        name: item.name || 'Park Entrance Fee',
        qty: item.quantity,
        priceText: `$${centsToDollars(item.totalPrice).toFixed(2)}`,
        metaText: `${item.quantity} person${item.quantity > 1 ? 's' : ''}`,
      });
    });

    // Included items (from transportation metadata or default)
    const transportItem = transportationItems[0];
    const meta = transportItem?.metadata as { included?: Array<{ code?: string; label?: string }> } | undefined;
    const includedRaw = meta?.included || [];
    const includedItems = includedRaw.length > 0
      ? includedRaw.map((x: any) => x.label || x.code || 'Included').filter(Boolean)
      : ['Basic kit (beers + water)'];

    // Extras with prices - detailed (from ADDON items or transportation metadata.extras)
    const addons = booking.items.filter(item => item.type === 'ADDON');
    const extrasWithPrices = addons.length > 0
      ? addons.map(a => ({
          label: a.name,
          qty: a.quantity,
          priceText: `$${centsToDollars(a.totalPrice).toFixed(2)}`,
          unitPriceText: a.quantity > 0 ? `$${(centsToDollars(a.totalPrice) / a.quantity).toFixed(2)}` : null,
        }))
      : (() => {
          const extrasMeta = (meta as { extras?: Array<{ label?: string; qty?: number; priceCents?: number }> })?.extras;
          if (!extrasMeta?.length) return [];
          return extrasMeta.map((e: any) => ({
            label: e.label || '',
            qty: e.qty || 1,
            priceText: `$${((e.priceCents || 0) / 100).toFixed(2)}`,
            unitPriceText: (e.qty || 1) > 0 ? `$${(((e.priceCents || 0) / 100) / (e.qty || 1)).toFixed(2)}` : null,
          }));
        })();

    // Reservation breakdown (desglose) - all line items for payment section
    const reservationBreakdown: Array<{ label: string; qty: number; priceText: string }> = [];
    booking.items.forEach(item => {
      const qty = item.quantity || 1;
      const priceText = `$${centsToDollars(item.totalPrice).toFixed(2)}`;
      const label = qty > 1 ? `${item.name} (×${qty})` : item.name;
      reservationBreakdown.push({ label, qty, priceText });
    });

    // Format flight information
    const hasArrivalFlight = !!(booking.flightNumber || booking.arrivalTime || (booking as any).arrivalAirline);
    const hasDepartureFlight = !!(booking.departureFlightNumber || booking.departureTime || (booking as any).departureAirline);
    
    const flightDetails = (hasArrivalFlight || hasDepartureFlight) ? {
      arrival: hasArrivalFlight ? {
        airline: (booking as any).arrivalAirline || null,
        flightNumber: booking.flightNumber || null,
        time: booking.arrivalTime || null,
        displayText: [
          (booking as any).arrivalAirline,
          booking.flightNumber,
          booking.arrivalTime ? `Arrival: ${booking.arrivalTime}` : null
        ].filter(Boolean).join(' • ') || null,
      } : null,
      departure: hasDepartureFlight ? {
        airline: (booking as any).departureAirline || null,
        flightNumber: booking.departureFlightNumber || null,
        time: booking.departureTime || null,
        displayText: [
          (booking as any).departureAirline,
          booking.departureFlightNumber,
          booking.departureTime ? `Departure: ${booking.departureTime}` : null
        ].filter(Boolean).join(' • ') || null,
      } : null,
    } : null;

    // Pickup time (use pickupTime if available, otherwise bookingTime)
    const pickupTime = (booking as any).pickupTime || booking.bookingTime || 'TBD';

    // Departure transfer: pick time = 3 hours before departure flight (for private transfers)
    const departurePickupTime = (() => {
      const depTime = booking.departureTime;
      if (!depTime || typeof depTime !== 'string') return null;
      const s = depTime.trim();
      const match = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i) || s.match(/^(\d{1,2})(?:\.|:)?(\d{2})?\s*(AM|PM)?$/i);
      if (!match) return null;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2] || '0', 10);
      const ampm = (match[3] || '').toUpperCase();
      if (ampm !== 'AM' && ampm !== 'PM') {
        if (h <= 23) { /* 24h */ } else if (h >= 12) { h -= 12; }
      } else if (ampm === 'PM' && h < 12) h += 12;
      else if (ampm === 'AM' && h === 12) h = 0;
      let mins = h * 60 + m - 3 * 60;
      if (mins < 0) mins += 24 * 60;
      const outH = Math.floor(mins / 60) % 24;
      const outM = mins % 60;
      if (outH === 0) return `12:${String(outM).padStart(2, '0')} AM`;
      if (outH === 12) return `12:${String(outM).padStart(2, '0')} PM`;
      if (outH < 12) return `${outH}:${String(outM).padStart(2, '0')} AM`;
      return `${outH - 12}:${String(outM).padStart(2, '0')} PM`;
    })();

    // Park fee and vehicle protection texts (EXACT strings as requested)
    const parkFeeText = activityItems.length > 0 
      ? "Park entry fee: $25 USD per person (paid at check-in)"
      : null;
    
    const vehicleProtectionText = activityItems.length > 0
      ? "Vehicle protection is optional. If declined, a $1,000 USD credit card hold may be required and released after the tour if no damages."
      : null;

    // Cancellation policy (array of bullets)
    const cancellationPolicy = [
      "Free cancellation up to 24 hours before your scheduled time.",
      "Within 24 hours: non-refundable.",
      "No-show: 100% charge."
    ];

    // Logo URL - use frontend logo if EMAIL_LOGO_URL not set
    const logoUrl = this.logoUrl || `${this.frontendUrl}/logo.png`;

    return {
      bookingId: booking.id,
      bookingIdShort: booking.id.substring(0, 8).toUpperCase(),
      customerName: booking.customer.name,
      customerEmail: booking.customer.email,
      customerPhone: booking.customer.phone,
      bookingType: booking.type,
      formattedDate,
      bookingTime: booking.bookingTime || 'TBD',
      pickupTime: pickupTime,
      pickupLocation: booking.pickupLocation || null,
      dropoffLocation: booking.dropoffLocation || null,
      passengers: booking.passengers,
      passengersLabel: booking.passengers === 1 ? '1 guest' : `${booking.passengers} guests`,
      // Transportation (never in activities)
      transportationItems: transportationForTemplate,
      // Activities only: tours, excursions (NO transportation)
      activityItems: activityItemsForTemplate,
      // Flight details
      flightDetails: flightDetails,
      hasArrivalFlight: hasArrivalFlight,
      hasDepartureFlight: hasDepartureFlight,
      departurePickupTime: departurePickupTime,
      // Totals
      totalDollars: totalDollars.toFixed(2),
      totalPaidText: `$${totalDollars.toFixed(2)} USD`,
      // Notes
      notes: booking.notes,
      internalNotes: (booking as any).internalNotes || null,
      // Flags
      hasActivities: activityItems.length > 0,
      // Included & Extras for templates
      includedItems,
      extrasWithPrices,
      // Reservation breakdown (desglose for payment section)
      reservationBreakdown,
      // Texts (EXACT as requested)
      parkFeeText: parkFeeText,
      vehicleProtectionText: vehicleProtectionText,
      cancellationPolicy: cancellationPolicy,
      // Branding
      logoUrl: this.logoUrl,
      watermarkLogoUrl: this.watermarkLogoUrl,
      brandName: this.brandName,
      paymentUrl: `${this.frontendUrl}/checkout?bookingId=${booking.id}`,
      paymentMethodText: '✓ Paid via PayPal',
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

    const data = this.formatBookingData(booking);
    (data as any).paymentMethodText = options?.manualConfirm ? '✓ Paid offline (confirmed)' : '✓ Paid via PayPal';
    const backendUrl = process.env.BACKEND_URL || process.env.FRONTEND_URL || 'http://localhost:3001';
    const pdfService = new PdfService();
    (data as any).pdfToken = pdfService.createPdfToken(booking.id);
    (data as any).confirmationPdfUrl = `${backendUrl}/api/bookings/${booking.id}/confirmation-pdf?token=${(data as any).pdfToken}`;
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

    const data = this.formatBookingData(booking);
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

    // Check idempotency for all emails
    if (!forceResend) {
      const allSent = await Promise.all(
        companyRecipients.map(email =>
          prisma.emailLog.findFirst({
            where: {
              bookingId: booking.id,
              type: EmailType.COMPANY_NOTIFICATION,
              to: email,
              status: EmailStatus.SENT,
            },
          })
        )
      );

      if (allSent.every(log => log !== null)) {
        console.log(`Company notification already sent to all recipients for booking ${booking.id}`);
        return true;
      }
    }

    const result = await this.sendMail({
      to: companyRecipients,
      subject,
      html,
      context: 'company-notification',
    });

    if (result.success) {
      await Promise.all(
        companyRecipients.map(email =>
          this.createEmailLog(
            booking.id,
            EmailType.COMPANY_NOTIFICATION,
            email,
            subject
          ).then(log =>
            this.updateEmailLog(log.id, EmailStatus.SENT, result.messageId)
          )
        )
      );
      return true;
    }

    await Promise.all(
      companyRecipients.map(email =>
        this.createEmailLog(
          booking.id,
          EmailType.COMPANY_NOTIFICATION,
          email,
          subject
        ).then(log =>
          this.updateEmailLog(log.id, EmailStatus.FAILED, undefined, result.error)
        )
      )
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
    } catch (err: any) {
      console.error(`❌ Company copy failed (booking not affected):`, err.message);
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
    const mockBooking: any = {
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
      totalAmount: 8500, // $85.00 in cents
      notes: 'Test booking',
      items: [
        {
          type: 'TRANSPORTATION',
          name: 'Private Transfer',
          quantity: 1,
          totalPrice: 8500,
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
      } catch (error: any) {
        customerResult = { success: false, error: error.message };
      }

      // Send company email
      let companyResult: { success: boolean; error?: string; emails?: string[] } | undefined;
      try {
        const companySent = await this.sendCompanyNotification(mockBooking, true);
        companyResult = { 
          success: companySent, 
          emails: this.companyEmails.length > 0 ? this.companyEmails : undefined 
        };
      } catch (error: any) {
        companyResult = { 
          success: false, 
          error: error.message,
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

