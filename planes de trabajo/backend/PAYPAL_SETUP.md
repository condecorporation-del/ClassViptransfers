# PayPal Payments Setup Guide

## Overview

This implementation uses PayPal Orders API v2 with server-side order creation and capture. Payments are secure, idempotent, and automatically confirm bookings upon successful payment.

## Flow

1. **User creates booking** → Status: `DRAFT` or `PENDING_PAYMENT`
2. **User initiates PayPal payment** → `POST /api/paypal/create-order`
3. **User approves payment on PayPal** → Redirected back to site
4. **Server captures payment** → `POST /api/paypal/capture-order`
5. **Booking auto-confirmed** → Status: `PAID` → `CONFIRMED`
6. **Webhook received** → Additional verification (idempotent)

## Configuration

### 1. Get PayPal Credentials

#### Sandbox (Testing):
1. Go to: https://developer.paypal.com
2. Sign in or create account
3. Dashboard → Apps & Credentials
4. Create app (Sandbox)
5. Copy:
   - **Client ID**
   - **Client Secret**

#### Production (Live):
1. Dashboard → Apps & Credentials
2. Switch to "Live" mode
3. Create app
4. Copy credentials

### 2. Configure Webhook

#### For Local Development (ngrok):
1. Install ngrok: `brew install ngrok` or download from ngrok.com
2. Start ngrok: `ngrok http 3001`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. In PayPal Dashboard → Webhooks:
   - Add webhook URL: `https://abc123.ngrok.io/api/paypal/webhook`
   - Select events: `PAYMENT.CAPTURE.COMPLETED`, `CHECKOUT.ORDER.APPROVED`
   - Copy **Webhook ID**

#### For Production:
1. Use your production domain: `https://yourdomain.com/api/paypal/webhook`
2. Configure in PayPal Dashboard → Webhooks
3. Copy **Webhook ID**

### 3. Update .env

```env
# PayPal Configuration
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_client_secret_here
PAYPAL_WEBHOOK_ID=your_webhook_id_here
PAYPAL_ENV=sandbox
# Options: sandbox | live

# Frontend URL (for PayPal return URLs)
FRONTEND_URL=http://localhost:8080
# Production: https://yourdomain.com
```

## API Endpoints

### POST /api/paypal/create-order

Creates a PayPal order for a booking.

**Request:**
```json
{
  "bookingId": "clxxx..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "5O190127TN364715T",
    "approvalUrl": "https://www.sandbox.paypal.com/checkoutnow?token=..."
  }
}
```

**What happens:**
- Loads booking from database
- Computes total server-side (from BookingItems)
- Creates PayPal order
- Stores payment record (status: PENDING)
- Updates booking status to PENDING_PAYMENT
- Returns approval URL for user

### POST /api/paypal/capture-order

Captures the PayPal payment after user approval.

**Request:**
```json
{
  "bookingId": "clxxx...",
  "orderId": "5O190127TN364715T"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "captureId": "8F9149322X687835L",
    "status": "COMPLETED"
  }
}
```

**What happens:**
- Captures payment from PayPal
- Verifies amount matches booking total
- Updates payment record (status: COMPLETED)
- Updates booking: PAID → CONFIRMED (auto)
- Creates audit log
- Idempotent: won't double-confirm if already paid

### POST /api/paypal/webhook

Handles PayPal webhook events (called by PayPal).

**Events handled:**
- `PAYMENT.CAPTURE.COMPLETED` - Payment captured
- `CHECKOUT.ORDER.APPROVED` - Order approved (tracking)

**What happens:**
- Verifies webhook signature (basic check)
- Processes event idempotently
- Updates payment and booking if needed
- Always returns 200 to PayPal

## Security Features

✅ **Server-side total calculation** - Never trust client amounts
✅ **Amount verification** - Verifies captured amount matches booking
✅ **Idempotency** - Prevents double captures/confirmations
✅ **Status checks** - Won't process if already paid/confirmed
✅ **Audit logging** - All payment actions logged

## Testing

### 1. Create Test Booking

```bash
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TRANSPORTATION",
    "customer": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "+1234567890",
      "language": "en"
    },
    "bookingDate": "2024-12-25T10:00:00Z",
    "passengers": 2,
    "items": [{
      "type": "TRANSPORTATION",
      "name": "Private Transfer",
      "quantity": 1,
      "unitPrice": 85
    }]
  }'
```

Save the `bookingId` from response.

### 2. Create PayPal Order

```bash
curl -X POST http://localhost:3001/api/paypal/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "YOUR_BOOKING_ID"
  }'
```

Copy the `approvalUrl` and open in browser.

### 3. Approve Payment

- Use PayPal sandbox test account
- Approve the payment
- You'll be redirected to return URL

### 4. Capture Payment

```bash
curl -X POST http://localhost:3001/api/paypal/capture-order \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "YOUR_BOOKING_ID",
    "orderId": "PAYPAL_ORDER_ID"
  }'
```

### 5. Verify Booking

```bash
curl http://localhost:3001/api/bookings/YOUR_BOOKING_ID
```

Should show:
- `status: "CONFIRMED"`
- Payment record with `status: "COMPLETED"`

## Testing Webhooks Locally

### Using ngrok:

1. **Start ngrok:**
   ```bash
   ngrok http 3001
   ```

2. **Copy HTTPS URL:**
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:3001
   ```

3. **Configure in PayPal:**
   - Dashboard → Webhooks
   - Add webhook: `https://abc123.ngrok.io/api/paypal/webhook`
   - Events: `PAYMENT.CAPTURE.COMPLETED`
   - Copy Webhook ID to `.env`

4. **Test webhook:**
   - Complete a payment
   - Check server logs for webhook received
   - Verify booking status updated

## Production Checklist

- [ ] Switch `PAYPAL_ENV=live`
- [ ] Update `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` (live credentials)
- [ ] Configure webhook with production URL
- [ ] Update `FRONTEND_URL` to production domain
- [ ] Test complete flow in sandbox first
- [ ] Implement full webhook signature verification
- [ ] Set up email notifications (next step)

## Troubleshooting

**"PayPal credentials not configured"**
- Check `.env` has `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`

**"Amount mismatch"**
- Server calculates from BookingItems
- Check booking total matches PayPal amount

**"Payment already completed"**
- This is expected (idempotency)
- Booking is already confirmed

**Webhook not received**
- Check ngrok is running (for local)
- Verify webhook URL in PayPal dashboard
- Check server logs for errors

## Next Steps

- [ ] Email notifications (confirmation emails)
- [ ] Full webhook signature verification
- [ ] Payment retry logic
- [ ] Refund handling

