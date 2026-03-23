# API Examples

## Create Transportation Booking

```bash
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TRANSPORTATION",
    "customer": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "country": "US",
      "language": "en"
    },
    "bookingDate": "2024-12-25T10:00:00Z",
    "bookingTime": "10:00",
    "pickupLocation": "Los Cabos Airport",
    "dropoffLocation": "Hotel Zone",
    "passengers": 2,
    "serviceType": "private",
    "tripType": "oneway",
    "route": "airport-hotel",
    "items": [
      {
        "type": "TRANSPORTATION",
        "name": "Private Transfer",
        "quantity": 1,
        "unitPrice": 85
      }
    ]
  }'
```

## Create Activity Booking with Crazy Combo

```bash
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CRAZY_COMBO",
    "customer": {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+1234567891",
      "language": "en"
    },
    "bookingDate": "2024-12-26T14:00:00Z",
    "bookingTime": "14:00",
    "passengers": 2,
    "items": [
      {
        "type": "CRAZY_COMBO",
        "name": "Crazy Combo",
        "slug": "crazy-combo",
        "quantity": 2,
        "unitPrice": 125,
        "metadata": {
          "activities": ["camel-ride", "atv", "horseback-riding"]
        }
      },
      {
        "type": "PARK_ENTRANCE",
        "name": "Park Entrance Fee",
        "quantity": 2,
        "unitPrice": 25
      }
    ]
  }'
```

## Get Booking

```bash
curl http://localhost:3001/api/bookings/{booking-id}
```

## Confirm Booking (Admin)

```bash
curl -X POST http://localhost:3001/api/bookings/{booking-id}/confirm \
  -H "Content-Type: application/json" \
  -H "X-User-Id: admin-123" \
  -H "X-User-Email: admin@example.com" \
  -d '{
    "notes": "Confirmed via phone call"
  }'
```

## Cancel Booking

```bash
curl -X POST http://localhost:3001/api/bookings/{booking-id}/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Customer requested cancellation"
  }'
```

## Assign Driver/Vehicle

```bash
curl -X POST http://localhost:3001/api/bookings/{booking-id}/assign \
  -H "Content-Type: application/json" \
  -H "X-User-Id: admin-123" \
  -d '{
    "driverId": "driver-id-here",
    "vehicleId": "vehicle-id-here",
    "notes": "Assigned to morning shift"
  }'
```

## List Bookings (Admin)

```bash
# Get bookings for a specific date
curl "http://localhost:3001/api/admin/bookings?date=2024-12-25&status=CONFIRMED&page=1&limit=50"

# Get all pending bookings
curl "http://localhost:3001/api/admin/bookings?status=PENDING_PAYMENT"
```

## Export Bookings (Admin)

```bash
# Export as CSV
curl "http://localhost:3001/api/admin/bookings/export?date=2024-12-25&format=csv" -o bookings.csv

# Export as JSON
curl "http://localhost:3001/api/admin/bookings/export?date=2024-12-25&format=json" -o bookings.json
```

## PayPal Payments

### Create PayPal Order

```bash
curl -X POST http://localhost:3001/api/paypal/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "clxxx..."
  }'
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

**Next steps:**
1. Open `approvalUrl` in browser
2. Approve payment with PayPal sandbox account
3. User redirected to return URL
4. Call capture-order endpoint

### Capture PayPal Payment

```bash
curl -X POST http://localhost:3001/api/paypal/capture-order \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "clxxx...",
    "orderId": "5O190127TN364715T"
  }'
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
- Payment captured from PayPal
- Booking status: `PAID` → `CONFIRMED` (auto)
- Payment record updated with capture ID
- Audit log created

### PayPal Webhook (Called by PayPal)

```bash
# This endpoint is called by PayPal, not directly
# Configure webhook URL in PayPal dashboard:
# https://yourdomain.com/api/paypal/webhook
```

**Events handled:**
- `PAYMENT.CAPTURE.COMPLETED` - Payment captured
- `CHECKOUT.ORDER.APPROVED` - Order approved

**Note:** Webhook processing is idempotent - won't double-process if already completed.

## Email Confirmations

### Resend Confirmation Emails (Admin)

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

**What happens:**
- Resends customer confirmation email
- Resends company notification email
- Creates audit log entry
- Forces resend (bypasses idempotency)

### Test Email (Dev Only)

```bash
# Test customer email template
curl -X POST http://localhost:3001/api/admin/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "type": "customer"
  }'

# Test company email template
curl -X POST http://localhost:3001/api/admin/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "type": "company"
  }'
```

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

**Note:** Only works in development mode (`NODE_ENV !== 'production'`)

**Automatic Email Flow:**
- When booking is confirmed (via PayPal capture or webhook)
- Customer confirmation email sent automatically
- Company notification email sent automatically
- Emails logged in EmailLog table
- Idempotent (won't send duplicates)

## Admin Operations

### List Bookings with Filters

```bash
# Get bookings for a date
curl "http://localhost:3001/api/admin/bookings?date=2024-12-25"

# Filter by status
curl "http://localhost:3001/api/admin/bookings?date=2024-12-25&status=CONFIRMED"

# Search for customer
curl "http://localhost:3001/api/admin/bookings?q=john@example.com"

# Grouped by time
curl "http://localhost:3001/api/admin/bookings?date=2024-12-25&groupedByTime=true"
```

### Daily Manifest Export

```bash
# Export CSV
curl "http://localhost:3001/api/admin/bookings/export?date=2024-12-25&format=csv" -o manifest.csv

# Export JSON
curl "http://localhost:3001/api/admin/bookings/export?date=2024-12-25&format=json" -o manifest.json
```

### Price Override

```bash
# Apply price override
curl -X POST http://localhost:3001/api/admin/bookings/{id}/price-override \
  -H "Content-Type: application/json" \
  -H "X-User-Id: admin-123" \
  -d '{
    "newTotalCents": 7500,
    "reason": "Group discount negotiated"
  }'

# Remove override
curl -X DELETE http://localhost:3001/api/admin/bookings/{id}/price-override \
  -H "X-User-Id: admin-123"
```

### Assign Driver/Vehicle

```bash
# Assign
curl -X POST http://localhost:3001/api/admin/bookings/{id}/assign \
  -H "Content-Type: application/json" \
  -H "X-User-Id: admin-123" \
  -d '{
    "driverId": "driver-id",
    "vehicleId": "vehicle-id",
    "pickupTime": "10:00",
    "internalNotes": "English-speaking driver preferred"
  }'

# Unassign driver
curl -X POST http://localhost:3001/api/admin/bookings/{id}/assign \
  -H "Content-Type: application/json" \
  -d '{"driverId": null}'
```

### Driver Management

```bash
# List drivers
curl http://localhost:3001/api/admin/drivers

# Create driver
curl -X POST http://localhost:3001/api/admin/drivers \
  -H "Content-Type: application/json" \
  -H "X-User-Id: admin-123" \
  -d '{
    "name": "Juan Perez",
    "phone": "+526241234567",
    "email": "juan@example.com",
    "licenseNumber": "ABC123456"
  }'
```

### Vehicle Management

```bash
# List vehicles
curl http://localhost:3001/api/admin/vehicles

# Create vehicle
curl -X POST http://localhost:3001/api/admin/vehicles \
  -H "Content-Type: application/json" \
  -H "X-User-Id: admin-123" \
  -d '{
    "make": "Toyota",
    "model": "Sienna",
    "year": 2023,
    "licensePlate": "ABC-123",
    "capacity": 7
  }'
```

### Manual Booking

```bash
curl -X POST http://localhost:3001/api/admin/bookings/manual \
  -H "Content-Type: application/json" \
  -H "X-User-Id: admin-123" \
  -d '{
    "type": "TRANSPORTATION",
    "customer": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "bookingDate": "2024-12-25T10:00:00Z",
    "bookingTime": "10:00",
    "pickupLocation": "Airport",
    "dropoffLocation": "Hotel",
    "passengers": 2,
    "items": [{
      "type": "TRANSPORTATION",
      "name": "Private Transfer",
      "quantity": 1,
      "unitPrice": 85
    }],
    "status": "OFFLINE_HOLD",
    "sendConfirmation": false
  }'
```

## Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

Error responses:

```json
{
  "error": "Error message",
  "details": [
    // Validation errors (if applicable)
  ]
}
```

