import { Resend } from 'resend';
import { prisma } from '../lib/prisma';
import { EmailType, EmailStatus } from '@prisma/client';
import { Booking, Customer, BookingItem } from '@prisma/client';
import { centsToDollars } from '../lib/validation';
import { readFileSync } from 'fs';
import { join } from 'path';
import Handlebars from 'handlebars';

interface BookingWithRelations extends Booking {
  customer: Customer;
  items: BookingItem[];
}

export class EmailService {
  private resend: Resend | null = null;
  private fromEmail: string;
  private companyEmails: string[];
  private frontendUrl: string;
  private logoUrl: string | null;
  private brandName: string;
  private primaryColor: string;
  private accentColor: string;
  private bgColor: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      console.warn('RESEND_API_KEY not set - emails will not be sent');
    }

    // Use Resend's default domain for testing, or configured domain
    // For production, you must verify your domain at https://resend.com/domains
    this.fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    
    // Parse EMAIL_COMPANY_TO - support multiple emails separated by comma
    const companyEmailRaw = process.env.EMAIL_COMPANY_TO || 'condecorporation@gmail.com';
    this.companyEmails = companyEmailRaw
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
    
    if (this.companyEmails.length === 0) {
      console.warn('⚠️ EMAIL_COMPANY_TO is empty after parsing - company notifications will not be sent');
    } else {
      console.log(`✅ Company emails configured: ${this.companyEmails.join(', ')}`);
    }
    
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    
    // Logo URL for email templates - use frontend logo if EMAIL_LOGO_URL not set
    this.logoUrl = process.env.EMAIL_LOGO_URL || `${this.frontendUrl}/logo.png`;

    // Branding variables
    this.brandName = process.env.EMAIL_BRAND_NAME || 'Class VIP Transfers';
    this.primaryColor = process.env.EMAIL_PRIMARY_COLOR || '#071A2B';
    this.accentColor = process.env.EMAIL_ACCENT_COLOR || '#D9AE5F';
    this.bgColor = process.env.EMAIL_BG_COLOR || '#F7FAFF';
  }

  /**
   * Check if email was already sent (idempotency)
   */
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
    subject: string
  ) {
    return await prisma.emailLog.create({
      data: {
        bookingId,
        type,
        to,
        from: this.fromEmail,
        subject,
        status: EmailStatus.PENDING,
        provider: 'resend',
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
    try {
      const templatePath = join(process.cwd(), 'src', 'templates', `${templateName}.html`);
      return readFileSync(templatePath, 'utf-8');
    } catch (error) {
      console.error(`Failed to load template ${templateName}:`, error);
      return '<html><body><p>Email template not found</p></body></html>';
    }
  }

  /**
   * Render template with Handlebars
   */
  private renderTemplate(templateName: string, data: any): string {
    try {
      const source = this.loadTemplate(templateName);
      const template = Handlebars.compile(source, { noEscape: true });
      return template(data);
    } catch (error: any) {
      console.error(`Failed to render template ${templateName}:`, error);
      return '<html><body><p>Template rendering error</p></body></html>';
    }
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
    const activities = booking.items.filter(item => 
      item.type === 'ACTIVITY' || item.type === 'COMBO' || item.type === 'CRAZY_COMBO'
    );
    const parkFees = booking.items.filter(item => item.type === 'PARK_ENTRANCE');
    const transportation = booking.items.filter(item => item.type === 'TRANSPORTATION');

    // Format all items into a single array ready for template
    const items: Array<{
      name: string;
      qty: number;
      priceText: string;
      metaText: string;
    }> = [];

    // Add activities
    activities.forEach(item => {
      items.push({
        name: item.name,
        qty: item.quantity,
        priceText: `$${centsToDollars(item.totalPrice).toFixed(2)}`,
        metaText: `${item.type} • ${item.quantity} passenger${item.quantity > 1 ? 's' : ''}`,
      });
    });

    // Add transportation
    transportation.forEach(item => {
      items.push({
        name: item.name,
        qty: 1,
        priceText: `$${centsToDollars(item.totalPrice).toFixed(2)}`,
        metaText: 'Transportation',
      });
    });

    // Add park fees
    parkFees.forEach(item => {
      items.push({
        name: item.name || 'Park Entrance Fee',
        qty: item.quantity,
        priceText: `$${centsToDollars(item.totalPrice).toFixed(2)}`,
        metaText: `${item.quantity} person${item.quantity > 1 ? 's' : ''}`,
      });
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

    // Park fee and vehicle protection texts (EXACT strings as requested)
    const parkFeeText = activities.length > 0 
      ? "Park entry fee: $25 USD per person (paid at check-in)"
      : null;
    
    const vehicleProtectionText = activities.length > 0
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
      // Items ready for template loop
      items: items,
      // Flight details
      flightDetails: flightDetails,
      hasArrivalFlight: hasArrivalFlight,
      hasDepartureFlight: hasDepartureFlight,
      // Totals
      totalDollars: totalDollars.toFixed(2),
      totalPaidText: `$${totalDollars.toFixed(2)} USD`,
      // Notes
      notes: booking.notes,
      internalNotes: (booking as any).internalNotes || null,
      // Flags
      hasActivities: activities.length > 0,
      // Texts (EXACT as requested)
      parkFeeText: parkFeeText,
      vehicleProtectionText: vehicleProtectionText,
      cancellationPolicy: cancellationPolicy,
      // Branding
      logoUrl: logoUrl,
      brandName: this.brandName,
      primaryColor: this.primaryColor,
      accentColor: this.accentColor,
      bgColor: this.bgColor,
      frontendUrl: this.frontendUrl,
    };
  }

  /**
   * Send customer confirmation email
   */
  async sendCustomerConfirmation(booking: BookingWithRelations, forceResend: boolean = false): Promise<boolean> {
    // Idempotency check
    if (!forceResend && await this.wasEmailSent(booking.id, EmailType.CUSTOMER_CONFIRMATION)) {
      console.log(`Customer confirmation already sent for booking ${booking.id}`);
      return false;
    }

    const data = this.formatBookingData(booking);
    const subject = `Your Reservation is Confirmed - Booking ${booking.id.substring(0, 8).toUpperCase()}`;
    
    // Render template with Handlebars
    const html = this.renderTemplate('customer-confirmed', data);

    // Logging before sending
    console.log(`📧 Preparing to send customer confirmation:`, {
      bookingId: booking.id,
      customerTo: booking.customer.email,
      from: this.fromEmail,
      subject,
    });

    // Create email log
    const emailLog = await this.createEmailLog(
      booking.id,
      EmailType.CUSTOMER_CONFIRMATION,
      booking.customer.email,
      subject
    );

    try {
      if (!this.resend) {
        throw new Error('Resend not configured');
      }

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: booking.customer.email,
        subject,
        html,
      });

      // Logging after sending
      if (result.error) {
        console.error(`❌ Customer confirmation failed:`, {
          bookingId: booking.id,
          customerTo: booking.customer.email,
          error: result.error.message,
          status: 'FAILED',
        });
        throw new Error(result.error.message || 'Failed to send email');
      }

      console.log(`✅ RESEND result: ${result.data?.id} to ${booking.customer.email}`);

      await this.updateEmailLog(
        emailLog.id,
        EmailStatus.SENT,
        result.data?.id
      );

      return true;
    } catch (error: any) {
      console.error('❌ Failed to send customer confirmation:', {
        bookingId: booking.id,
        customerTo: booking.customer.email,
        error: error.message,
        status: 'FAILED',
      });
      await this.updateEmailLog(
        emailLog.id,
        EmailStatus.FAILED,
        undefined,
        error.message
      );
      return false;
    }
  }

  /**
   * Send company notification email
   * Sends to all emails in EMAIL_COMPANY_TO (supports multiple emails separated by comma)
   */
  async sendCompanyNotification(booking: BookingWithRelations, forceResend: boolean = false): Promise<boolean> {
    // Check if company emails are configured
    if (this.companyEmails.length === 0) {
      console.warn(`⚠️ EMAIL_COMPANY_TO not configured - skipping company notification for booking ${booking.id}`);
      return false;
    }

    const data = this.formatBookingData(booking);
    const subject = `New Booking Confirmed - ${booking.type} - ${data.customerName}`;
    
    // Render template with Handlebars
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

    try {
      if (!this.resend) {
        throw new Error('Resend not configured');
      }

      // Send to all recipients at once
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: companyRecipients,
        subject,
        html,
      });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to send email');
      }

      // Create email logs for each recipient
      await Promise.all(
        companyRecipients.map(email =>
          this.createEmailLog(
            booking.id,
            EmailType.COMPANY_NOTIFICATION,
            email,
            subject
          ).then(log =>
            this.updateEmailLog(
              log.id,
              EmailStatus.SENT,
              result.data?.id
            )
          )
        )
      );

      console.log(`✅ RESEND result: ${result.data?.id} to ${companyRecipients.join(', ')}`);

      return true;
    } catch (error: any) {
      console.error(`❌ Failed to send company notification:`, {
        bookingId: booking.id,
        companyTo: companyRecipients.join(', '),
        error: error.message,
        status: 'FAILED',
      });

      // Create failed logs for each recipient
      await Promise.all(
        companyRecipients.map(email =>
          this.createEmailLog(
            booking.id,
            EmailType.COMPANY_NOTIFICATION,
            email,
            subject
          ).then(log =>
            this.updateEmailLog(
              log.id,
              EmailStatus.FAILED,
              undefined,
              error.message
            )
          )
        )
      );

      return false;
    }
  }

  /**
   * Send both confirmation emails
   * ALWAYS sends to both customer and company (if configured)
   */
  async sendConfirmationEmails(booking: BookingWithRelations, forceResend: boolean = false): Promise<{
    customerSent: boolean;
    companySent: boolean;
  }> {
    // Log before sending both
    console.log(`📧 Sending confirmation emails for booking ${booking.id}:`, {
      bookingId: booking.id,
      customerTo: booking.customer.email,
      companyTo: this.companyEmails.length > 0 ? this.companyEmails.join(', ') : 'NOT CONFIGURED',
      from: this.fromEmail,
    });

    // Send both emails in parallel
    const [customerSent, companySent] = await Promise.all([
      this.sendCustomerConfirmation(booking, forceResend),
      this.sendCompanyNotification(booking, forceResend),
    ]);

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

