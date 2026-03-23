# Email Confirmation System Setup

## Overview

Premium HTML email confirmations are automatically sent when bookings transition to `PAID` and `CONFIRMED` status. The system uses Resend for reliable email delivery.

## Features

✅ **Automatic emails** on payment success
✅ **Idempotent** - emails sent once per booking
✅ **Premium HTML templates** - mobile-friendly, luxury concierge style
✅ **Dual recipients** - Customer + Company
✅ **Admin resend** - resend emails manually if needed
✅ **Email logging** - all emails tracked in database

## Setup

### 1. Get Resend API Key

1. Go to: https://resend.com
2. Sign up or sign in
3. Go to API Keys section
4. Create new API key
5. Copy the key (starts with `re_`)

### 2. Configure Domain (Production)

For production, you need to:
1. Add your domain in Resend dashboard
2. Verify DNS records
3. Use verified domain in `EMAIL_FROM`

For development/testing:
- You can use Resend's test domain
- Or use a verified domain

### 3. Update .env

```env
# Email Configuration
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM="Class VIP Transfers <no-reply@classviptransfers.com>"
EMAIL_COMPANY_TO=Armando@caboviptransfers.com
FRONTEND_URL=http://localhost:8080
```

**Note:** For multiple company recipients, use comma-separated:
```env
EMAIL_COMPANY_TO=Armando@caboviptransfers.com,ops@caboviptransfers.com
```

## Email Flow

### Automatic Trigger

Emails are automatically sent when:
1. PayPal payment is captured (`POST /api/paypal/capture-order`)
2. PayPal webhook confirms payment (`POST /api/paypal/webhook`)

**Flow:**
```
Payment Captured
  ↓
Booking Status: PAID → CONFIRMED
  ↓
Send Customer Confirmation Email
Send Company Notification Email
  ↓
Log emails in EmailLog table
```

### Idempotency

- Emails are checked before sending
- If already sent, won't send again (unless forced)
- Prevents duplicate emails

## Email Templates

### Customer Confirmation Email

**Includes:**
- Booking confirmation badge
- Booking details (ID, date, time, type)
- Location & flight information
- Activities list (if applicable)
- Park fees (if applicable)
- Total paid amount
- Next steps
- Important policies
- Contact information

**Subject:** `Your Reservation is Confirmed - Booking {ID}`

### Company Notification Email

**Includes:**
- Ops summary format
- Customer information
- Service details
- Activities & transportation breakdown
- Total amount
- Action items checklist
- Quick flags (payment confirmed, etc.)

**Subject:** `New Booking Confirmed - {Type} - {Customer Name}`

## API Endpoints

### POST /api/admin/bookings/:id/resend-confirmation

Resend confirmation emails for a booking.

**Request:**
```bash
curl -X POST http://localhost:3001/api/admin/bookings/{booking-id}/resend-confirmation \
  -H "X-User-Id: admin-123" \
  -H "X-User-Email: admin@example.com"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "customerEmailSent": true,
    "companyEmailSent": true
  }
}
```

### POST /api/admin/test-email (Dev Only)

Send a test email to verify templates.

**Request:**
```bash
curl -X POST http://localhost:3001/api/admin/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "type": "customer"
  }'
```

**Types:** `customer` or `company`

**Response:**
```json
{
  "success": true,
  "data": {
    "sent": true,
    "message": "Test customer email sent to your-email@example.com"
  }
}
```

## Testing

### 1. Test Email Templates

```bash
# Test customer template
curl -X POST http://localhost:3001/api/admin/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "type": "customer"
  }'

# Test company template
curl -X POST http://localhost:3001/api/admin/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "type": "company"
  }'
```

### 2. Test Full Flow

1. Create a booking
2. Create PayPal order
3. Capture payment
4. Check email logs in database
5. Verify emails received

### 3. Check Email Logs

```bash
# Query EmailLog table in Supabase
SELECT * FROM "EmailLog" WHERE "bookingId" = 'your-booking-id';
```

## Email Log Schema

The `EmailLog` table tracks all emails:

- `id` - Email log ID
- `bookingId` - Related booking
- `type` - CUSTOMER_CONFIRMATION | COMPANY_NOTIFICATION | ADMIN_RESEND
- `status` - PENDING | SENT | FAILED
- `to` - Recipient email
- `from` - Sender email
- `subject` - Email subject
- `providerId` - Resend email ID
- `provider` - "resend"
- `error` - Error message if failed
- `sentAt` - Timestamp when sent
- `createdAt` - Log created timestamp

## Troubleshooting

**Emails not sending:**
- Check `RESEND_API_KEY` is set in `.env`
- Verify API key is valid in Resend dashboard
- Check server logs for errors
- Verify `EMAIL_FROM` domain is verified (production)

**Template not loading:**
- Check `src/templates/` directory exists
- Verify template files are present
- Check file permissions

**Email already sent:**
- This is expected (idempotency)
- Use resend endpoint to force resend
- Check `EmailLog` table for status

**Test email fails:**
- Only works in development mode
- Check `NODE_ENV` is not "production"
- Verify Resend API key

## Production Checklist

- [ ] Resend API key configured
- [ ] Domain verified in Resend
- [ ] `EMAIL_FROM` uses verified domain
- [ ] `EMAIL_COMPANY_TO` set correctly
- [ ] `FRONTEND_URL` set to production domain
- [ ] Test emails sent and received
- [ ] Email logs working correctly

## Next Steps

- [ ] Add email retry logic
- [ ] Add email templates for cancellations
- [ ] Add reminder emails (24h before)
- [ ] Add email preferences per customer

