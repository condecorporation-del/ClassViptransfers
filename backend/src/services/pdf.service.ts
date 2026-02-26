import { readFileSync } from 'fs';
import { join } from 'path';
import Handlebars from 'handlebars';
import jwt from 'jsonwebtoken';
import { BookingService } from './booking.service';
import { EmailService } from './email.service';
import type { Booking, Customer, BookingItem } from '@prisma/client';

const BOOKING_PDF_TOKEN_SECRET = process.env.BOOKING_PDF_SECRET || process.env.JWT_SECRET || 'pdf-booking-secret-change-in-production';
const TOKEN_EXPIRY = '7d';

interface BookingWithRelations extends Booking {
  customer: Customer;
  items: BookingItem[];
}

export class PdfService {
  private bookingService: BookingService;
  private emailService: EmailService;

  constructor() {
    this.bookingService = new BookingService();
    this.emailService = new EmailService();
  }

  /**
   * Create a signed token for PDF download (for email link - no auth required)
   */
  createPdfToken(bookingId: string): string {
    return jwt.sign(
      { bookingId, purpose: 'confirmation-pdf' },
      BOOKING_PDF_TOKEN_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
  }

  /**
   * Verify token and return bookingId or null
   */
  verifyPdfToken(token: string): string | null {
    try {
      const decoded = jwt.verify(token, BOOKING_PDF_TOKEN_SECRET) as { bookingId?: string; purpose?: string };
      if (decoded?.bookingId && decoded?.purpose === 'confirmation-pdf') {
        return decoded.bookingId;
      }
    } catch {
      // invalid or expired
    }
    return null;
  }

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
    throw new Error(`PDF template not found: ${templateName}.html`);
  }

  private renderPdfTemplate(data: Record<string, unknown>): string {
    const source = this.loadTemplate('booking-confirmation-pdf');
    const template = Handlebars.compile(source, { noEscape: true });
    return template(data);
  }

  /**
   * Generate booking confirmation PDF buffer (same design as email + watermark)
   */
  async generateBookingConfirmationPdf(bookingId: string): Promise<Buffer> {
    const booking = (await this.bookingService.getBookingById(bookingId)) as BookingWithRelations;
    const data = this.emailService.getFormatBookingData(booking);
    // Ensure payment method text for PDF (default confirmed)
    (data as any).paymentMethodText = (data as any).paymentMethodText || '✓ Paid via PayPal';

    const html = this.renderPdfTemplate(data);

    // Dynamic import so app can start even if puppeteer is not installed yet
    const puppeteer = await import('puppeteer').catch(() => null);
    if (!puppeteer) {
      throw new Error('puppeteer is not installed. Run: npm install puppeteer');
    }

    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 15000,
      });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' },
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
