# Los Cabos Luxe Transfers - Backend API

Backend API for the booking system, built with Express.js, TypeScript, Prisma ORM, and PostgreSQL.

## Features

- ✅ Complete booking system (transportation, activities, combos)
- ✅ Customer management
- ✅ Payment tracking (PayPal integration ready)
- ✅ Admin operations (confirm, cancel, assign, export)
- ✅ Audit logging
- ✅ Money handling in cents (no floating point errors)
- ✅ Server-side validation with Zod
- ✅ TypeScript for type safety

## Tech Stack

- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL (Supabase compatible)
- **Validation**: Zod
- **Testing**: Vitest

## Prerequisites

- Node.js 18+ 
- PostgreSQL database (or Supabase account)
- npm or yarn

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Database Setup (Supabase Recommended)

**📖 For detailed Supabase setup, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

#### Quick Setup:

1. **Create Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Save your database password

2. **Get Connection String:**
   - Settings (⚙️) → Database
   - Scroll to "Connection string"
   - Click "URI" tab
   - Copy the connection string

3. **Configure .env:**
   ```bash
   cp env.example.txt .env
   ```
   
   Edit `.env` and set:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
   ```
   
   Replace:
   - `YOUR_PASSWORD` with your actual Supabase password
   - `xxxxx` with your project reference

#### Alternative: Local PostgreSQL

1. Create a PostgreSQL database:
```bash
createdb los_cabos_luxe
```

2. Update `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/los_cabos_luxe?schema=public"
```

### 3. Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="postgresql://..."

# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:8080
```

### 4. Test Database Connection

Before pushing schema, test the connection:

```bash
npm run db:test
```

This will verify your DATABASE_URL is correct.

### 5. Database Migration

Push schema to create tables:

```bash
npm run db:push
```

This creates all tables in your Supabase database.

**Verify tables were created:**
```bash
npm run db:test
```

Or check in Supabase dashboard: Table Editor → should show all tables.

### 5. Start Development Server

```bash
npm run dev
```

The server will run on `http://localhost:3001`

## API Endpoints

### Bookings

#### Create Draft Booking
```
POST /api/bookings
Content-Type: application/json

{
  "type": "TRANSPORTATION" | "ACTIVITY" | "COMBO" | "CRAZY_COMBO",
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "country": "US",
    "language": "en"
  },
  "bookingDate": "2024-12-25T10:00:00Z",
  "bookingTime": "10:00",
  "pickupLocation": "Airport",
  "dropoffLocation": "Hotel Zone",
  "passengers": 2,
  "serviceType": "private",
  "tripType": "oneway",
  "items": [
    {
      "type": "TRANSPORTATION",
      "name": "Private Transfer",
      "quantity": 1,
      "unitPrice": 85
    }
  ]
}
```

#### Get Booking
```
GET /api/bookings/:id
```

#### Confirm Booking (Admin)
```
POST /api/bookings/:id/confirm
Content-Type: application/json

{
  "notes": "Confirmed via phone"
}
```

#### Cancel Booking
```
POST /api/bookings/:id/cancel
Content-Type: application/json

{
  "reason": "Customer requested cancellation"
}
```

#### Assign Driver/Vehicle
```
POST /api/bookings/:id/assign
Content-Type: application/json

{
  "driverId": "driver-id",
  "vehicleId": "vehicle-id",
  "notes": "Assigned to driver"
}
```

### Admin

#### List Bookings
```
GET /api/admin/bookings?date=2024-12-25&status=CONFIRMED&page=1&limit=50
```

#### Export Bookings
```
GET /api/admin/bookings/export?date=2024-12-25&format=csv
```

## Booking Types

- `TRANSPORTATION` - Airport/hotel transfers
- `ACTIVITY` - Single activity booking
- `COMBO` - 2 activities combo
- `CRAZY_COMBO` - 3 activities combo

## Booking Statuses

- `DRAFT` - Initial state, not yet submitted
- `PENDING_PAYMENT` - Awaiting payment
- `PAID` - Payment received
- `CONFIRMED` - Admin confirmed
- `CANCELLED` - Cancelled
- `COMPLETED` - Service completed
- `OFFLINE_HOLD` - Manual/offline booking on hold

## Money Handling

All money amounts are stored in **cents** to avoid floating-point errors:

- Input: `unitPrice: 85` (dollars)
- Storage: `8500` (cents)
- Output: Convert back to dollars when needed

## Database Schema

Key models:
- `Customer` - Customer information
- `Booking` - Main booking record
- `BookingItem` - Individual items in a booking
- `Payment` - Payment records
- `PricingOverride` - Admin price overrides
- `AdminAuditLog` - Audit trail
- `Driver` - Driver information (scaffold)
- `Vehicle` - Vehicle information (scaffold)

## Testing

Run tests:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

## Development

### Database Studio

View and edit data with Prisma Studio:

```bash
npm run db:studio
```

### Type Generation

After schema changes:

```bash
npm run db:generate
```

## Production Deployment

1. Build the project:
```bash
npm run build
```

2. Set production environment variables

3. Run migrations:
```bash
npm run db:migrate
```

4. Start server:
```bash
npm start
```

## Notes

- All timestamps are in UTC
- IDs use CUID for better distribution
- Audit logs track all admin actions
- Money is always stored in cents (integers)
- Validation happens at the API layer with Zod

## Next Steps

- [ ] Add authentication/authorization
- [ ] Integrate PayPal payment webhooks
- [ ] Add email notifications
- [ ] Implement driver/vehicle management
- [ ] Add booking search and filters
- [ ] Set up rate limiting

