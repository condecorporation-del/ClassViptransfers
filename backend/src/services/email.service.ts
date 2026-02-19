import { Resend } from 'resend';
import { prisma } from '../lib/prisma';
import { EmailType, EmailStatus } from '@prisma/client';
import { Booking, Customer, BookingItem } from '@prisma/client';
import { centsToDollars } from '../lib/validation';
import { readFileSync } from 'fs';
import { join } from 'path';

interface BookingWithRelations extends Booking {
  customer: Customer;
  items: BookingItem[];
}

export class EmailService {
  private resend: Resend | null = null;
  private fromEmail: string;
  private companyEmail: string;
  private frontendUrl: string;

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
    this.companyEmail = process.env.EMAIL_COMPANY_TO || 'condecorporation@gmail.com';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
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

    return {
      bookingId: booking.id,
      customerName: booking.customer.name,
      customerEmail: booking.customer.email,
      customerPhone: booking.customer.phone,
      bookingType: booking.type,
      formattedDate,
      bookingTime: booking.bookingTime || 'TBD',
      pickupLocation: booking.pickupLocation || 'TBD',
      dropoffLocation: booking.dropoffLocation || 'TBD',
      flightNumber: booking.flightNumber,
      arrivalTime: booking.arrivalTime,
      departureFlightNumber: booking.departureFlightNumber,
      departureTime: booking.departureTime,
      passengers: booking.passengers,
      activities,
      parkFees,
      transportation,
      totalDollars: totalDollars.toFixed(2),
      notes: booking.notes,
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
    
    // Load and render template
    let html = this.loadTemplate('customer-confirmed');
    html = this.replaceTemplateVariables(html, data);

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

      if (result.error) {
        throw new Error(result.error.message || 'Failed to send email');
      }

      await this.updateEmailLog(
        emailLog.id,
        EmailStatus.SENT,
        result.data?.id
      );

      console.log(`Customer confirmation sent to ${booking.customer.email}`);
      return true;
    } catch (error: any) {
      console.error('Failed to send customer confirmation:', error);
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
   */
  async sendCompanyNotification(booking: BookingWithRelations, forceResend: boolean = false): Promise<boolean> {
    // Idempotency check
    if (!forceResend && await this.wasEmailSent(booking.id, EmailType.COMPANY_NOTIFICATION)) {
      console.log(`Company notification already sent for booking ${booking.id}`);
      return false;
    }

    const data = this.formatBookingData(booking);
    const subject = `New Booking Confirmed - ${booking.type} - ${data.customerName}`;
    
    // Load and render template
    let html = this.loadTemplate('company-confirmed');
    html = this.replaceTemplateVariables(html, data);

    // Create email log
    const emailLog = await this.createEmailLog(
      booking.id,
      EmailType.COMPANY_NOTIFICATION,
      this.companyEmail,
      subject
    );

    try {
      if (!this.resend) {
        throw new Error('Resend not configured');
      }

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: this.companyEmail,
        subject,
        html,
      });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to send email');
      }

      await this.updateEmailLog(
        emailLog.id,
        EmailStatus.SENT,
        result.data?.id
      );

      console.log(`Company notification sent to ${this.companyEmail}`);
      return true;
    } catch (error: any) {
      console.error('Failed to send company notification:', error);
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
   * Send both confirmation emails
   */
  async sendConfirmationEmails(booking: BookingWithRelations, forceResend: boolean = false): Promise<{
    customerSent: boolean;
    companySent: boolean;
  }> {
    const [customerSent, companySent] = await Promise.all([
      this.sendCustomerConfirmation(booking, forceResend),
      this.sendCompanyNotification(booking, forceResend),
    ]);

    return { customerSent, companySent };
  }

  /**
   * Replace template variables
   */
  private replaceTemplateVariables(template: string, data: any): string {
    let html = template;
    
    // First, handle conditional sections
    const conditionalRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
    html = html.replace(conditionalRegex, (match, variable, content) => {
      const value = data[variable];
      if (value && value !== '' && value !== null && value !== undefined) {
        return content;
      }
      return '';
    });

    // Format activities list
    if (data.activities && Array.isArray(data.activities) && data.activities.length > 0) {
      const activitiesHtml = data.activities.map((item: any) => 
        `<li>${item.name} (${item.quantity}x) - $${centsToDollars(item.totalPrice).toFixed(2)}</li>`
      ).join('');
      html = html.replace(/{{activitiesList}}/g, activitiesHtml);
    } else {
      html = html.replace(/{{activitiesList}}/g, '');
    }

    // Format park fees
    if (data.parkFees && Array.isArray(data.parkFees) && data.parkFees.length > 0) {
      const parkFeesHtml = data.parkFees.map((item: any) => 
        `<li>Park Entrance Fee (${item.quantity}x) - $${centsToDollars(item.totalPrice).toFixed(2)}</li>`
      ).join('');
      html = html.replace(/{{parkFeesList}}/g, parkFeesHtml);
    } else {
      html = html.replace(/{{parkFeesList}}/g, '');
    }

    // Format transportation
    if (data.transportation && Array.isArray(data.transportation) && data.transportation.length > 0) {
      const transportHtml = data.transportation.map((item: any) => 
        `<li>${item.name} - $${centsToDollars(item.totalPrice).toFixed(2)}</li>`
      ).join('');
      html = html.replace(/{{transportationList}}/g, transportHtml);
    } else {
      html = html.replace(/{{transportationList}}/g, '');
    }
    
    // Replace all {{variable}} with data
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value !== null && value !== undefined) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          // Skip objects (already handled above)
          return;
        } else if (Array.isArray(value)) {
          // Skip arrays (already handled above)
          return;
        } else {
          html = html.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        }
      } else {
        html = html.replace(new RegExp(`{{${key}}}`, 'g'), '');
      }
    });

    return html;
  }

  /**
   * Send test email (dev only)
   */
  async sendTestEmail(to: string, templateType: 'customer' | 'company'): Promise<boolean> {
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
        email: to,
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

    if (templateType === 'customer') {
      return await this.sendCustomerConfirmation(mockBooking, true);
    } else {
      return await this.sendCompanyNotification(mockBooking, true);
    }
  }
}

