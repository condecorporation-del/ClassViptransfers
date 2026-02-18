# Admin Operations System

Complete admin system for day-to-day business operations.

## Features

✅ **Advanced booking filters** - Search, status, type, date
✅ **Daily manifest export** - CSV with all booking details
✅ **Price negotiation** - Override prices with audit trail
✅ **Driver/Vehicle management** - CRUD operations
✅ **Assignment system** - Assign drivers/vehicles to bookings
✅ **Manual bookings** - Create offline/direct bookings
✅ **Complete audit logging** - All admin actions tracked

## Timezone Handling

**Business Timezone:** `America/Mazatlan` (MST/MDT - same as Los Cabos)

- All dates stored in UTC (ISO format)
- Display dates in business timezone when needed
- Booking dates/times are stored as provided (assumed to be in business timezone)
- Server timestamps are always UTC

## API Endpoints

### A) List Bookings with Filters

**GET /api/admin/bookings**

**Query Parameters:**
- `date` (optional): `YYYY-MM-DD` - Filter by booking date
- `status` (optional): `DRAFT|PENDING_PAYMENT|PAID|CONFIRMED|CANCELLED|COMPLETED|OFFLINE_HOLD`
- `type` (optional): `TRANSPORTATION|ACTIVITY|COMBO|CRAZY_COMBO`
- `q` (optional): Search query (searches name, email, phone, bookingId)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50, max: 100)
- `groupedByTime` (optional): `true` - Group results by booking time

**Example:**
```bash
# Get confirmed bookings for today
curl "http://localhost:3001/api/admin/bookings?date=2024-12-25&status=CONFIRMED"

# Search for customer
curl "http://localhost:3001/api/admin/bookings?q=john@example.com"

# Grouped by time
curl "http://localhost:3001/api/admin/bookings?date=2024-12-25&groupedByTime=true"
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "total": 25,
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "totalPages": 1
  },
  "groupedByTime": {
    "10:00": [...],
    "14:00": [...]
  }
}
```

### B) Daily Manifest Export

**GET /api/admin/bookings/export**

**Query Parameters:**
- `date` (required): `YYYY-MM-DD`
- `format` (optional): `csv|json` (default: csv)

**CSV Columns:**
- bookingId
- status
- type
- scheduledDate
- scheduledTime
- customerName
- email
- phone
- pickup
- dropoff
- flightNumber
- itemsSummary
- parkFees
- totalCents
- currency
- paymentStatus
- paypalOrderId
- createdAt
- notes

**Example:**
```bash
# Export CSV
curl "http://localhost:3001/api/admin/bookings/export?date=2024-12-25&format=csv" -o manifest.csv

# Export JSON
curl "http://localhost:3001/api/admin/bookings/export?date=2024-12-25&format=json" -o manifest.json
```

### C) Price Override

**POST /api/admin/bookings/:id/price-override**

Apply price override for negotiation.

**Rules:**
- Only allowed if booking status is `DRAFT` or `PENDING_PAYMENT`
- Cannot override if booking is `PAID` or `CONFIRMED`
- Creates `PricingOverride` record
- Updates booking total immediately
- Logs to `AdminAuditLog`

**Request:**
```json
{
  "newTotalCents": 7500,
  "reason": "Customer negotiated discount for group booking"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "totalAmount": 7500,
    ...
  }
}
```

**Remove Override:**

**DELETE /api/admin/bookings/:id/price-override**

Reverts to computed total from items.

**Example:**
```bash
curl -X DELETE http://localhost:3001/api/admin/bookings/{id}/price-override
```

### D) Assign Driver/Vehicle

**POST /api/admin/bookings/:id/assign**

Assign driver and/or vehicle to booking.

**Request:**
```json
{
  "driverId": "driver-id",
  "vehicleId": "vehicle-id",
  "pickupTime": "10:00",
  "internalNotes": "Customer prefers English-speaking driver"
}
```

**Unassign:**
Set `driverId: null` or `vehicleId: null` to unassign.

**Example:**
```bash
# Assign
curl -X POST http://localhost:3001/api/admin/bookings/{id}/assign \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "driver-id",
    "vehicleId": "vehicle-id",
    "pickupTime": "10:00"
  }'

# Unassign driver
curl -X POST http://localhost:3001/api/admin/bookings/{id}/assign \
  -H "Content-Type: application/json" \
  -d '{"driverId": null}'
```

### E) Driver Management

**GET /api/admin/drivers**

List all drivers (active only by default).

**Query:**
- `includeInactive=true` - Include inactive drivers

**POST /api/admin/drivers**

Create new driver.

**Request:**
```json
{
  "name": "Juan Perez",
  "phone": "+526241234567",
  "email": "juan@example.com",
  "licenseNumber": "ABC123456",
  "isActive": true
}
```

**Example:**
```bash
# List drivers
curl http://localhost:3001/api/admin/drivers

# Create driver
curl -X POST http://localhost:3001/api/admin/drivers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Perez",
    "phone": "+526241234567",
    "licenseNumber": "ABC123456"
  }'
```

### F) Vehicle Management

**GET /api/admin/vehicles**

List all vehicles (active only by default).

**POST /api/admin/vehicles**

Create new vehicle.

**Request:**
```json
{
  "make": "Toyota",
  "model": "Sienna",
  "year": 2023,
  "licensePlate": "ABC-123",
  "capacity": 7,
  "isActive": true
}
```

**Example:**
```bash
# List vehicles
curl http://localhost:3001/api/admin/vehicles

# Create vehicle
curl -X POST http://localhost:3001/api/admin/vehicles \
  -H "Content-Type: application/json" \
  -d '{
    "make": "Toyota",
    "model": "Sienna",
    "licensePlate": "ABC-123",
    "capacity": 7
  }'
```

### G) Manual/Offline Bookings

**POST /api/admin/bookings/manual**

Create booking directly (for phone/WhatsApp bookings).

**Request:**
```json
{
  "type": "TRANSPORTATION",
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "language": "en"
  },
  "bookingDate": "2024-12-25T10:00:00Z",
  "bookingTime": "10:00",
  "pickupLocation": "Airport",
  "dropoffLocation": "Hotel",
  "passengers": 2,
  "items": [
    {
      "type": "TRANSPORTATION",
      "name": "Private Transfer",
      "quantity": 1,
      "unitPrice": 85
    }
  ],
  "status": "OFFLINE_HOLD",
  "totalAmount": 8500,
  "sendConfirmation": true
}
```

**Status Options:**
- `OFFLINE_HOLD` - Manual booking, not yet confirmed
- `CONFIRMED` - Directly confirmed (skip payment)

**Example:**
```bash
curl -X POST http://localhost:3001/api/admin/bookings/manual \
  -H "Content-Type: application/json" \
  -d @manual-booking.json
```

## Audit Logging

All admin operations create audit log entries:

- **Action types:** CREATE, UPDATE, DELETE, ASSIGN, PRICING_OVERRIDE
- **Entity types:** Booking, Driver, Vehicle, Payment
- **Includes:** userId, userEmail, description, changes (before/after)
- **Timestamp:** Automatic

**Query audit logs:**
```sql
SELECT * FROM "AdminAuditLog" 
WHERE "entityType" = 'Booking' 
ORDER BY "createdAt" DESC;
```

## Search Functionality

The `q` parameter searches across:
- Booking ID (partial match)
- Customer name (case-insensitive)
- Customer email (case-insensitive)
- Customer phone (partial match)

**Example:**
```bash
# Search by email
curl "http://localhost:3001/api/admin/bookings?q=john@example.com"

# Search by phone
curl "http://localhost:3001/api/admin/bookings?q=1234567890"

# Search by booking ID
curl "http://localhost:3001/api/admin/bookings?q=clxxx"
```

## Daily Operations Workflow

### Morning Routine

1. **Export daily manifest:**
   ```bash
   GET /api/admin/bookings/export?date=YYYY-MM-DD
   ```

2. **Review bookings:**
   ```bash
   GET /api/admin/bookings?date=YYYY-MM-DD&status=CONFIRMED&groupedByTime=true
   ```

3. **Assign drivers/vehicles:**
   ```bash
   POST /api/admin/bookings/:id/assign
   ```

### During Day

- **Handle price negotiations:**
  ```bash
  POST /api/admin/bookings/:id/price-override
  ```

- **Create manual bookings:**
  ```bash
  POST /api/admin/bookings/manual
  ```

- **Search for bookings:**
  ```bash
  GET /api/admin/bookings?q=search-term
  ```

## Validation

All endpoints use Zod validation:
- Input validation on all admin endpoints
- Type-safe request/response
- Clear error messages

## Security

- All mutations require audit logging
- Price overrides only allowed for unpaid bookings
- Assignment changes tracked
- Manual bookings marked with `source: ADMIN`

## Next Steps

- [ ] Add driver/vehicle update/delete endpoints
- [ ] Add booking status bulk updates
- [ ] Add schedule board view endpoint
- [ ] Add timezone conversion utilities
- [ ] Add PDF export (if needed)

