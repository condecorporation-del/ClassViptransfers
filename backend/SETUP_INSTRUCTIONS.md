# Quick Setup Instructions

## Step 1: Create .env File

```bash
cd backend
cp env.example.txt .env
```

## Step 2: Configure Database URL

Edit `.env` and set your `DATABASE_URL`:

### Option A: Local PostgreSQL
```env
DATABASE_URL="postgresql://username:password@localhost:5432/los_cabos_luxe?schema=public"
```

### Option B: Supabase
1. Go to https://supabase.com
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your actual password

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

## Step 3: Run Database Migrations

```bash
npm run db:push
```

This will create all tables in your database.

## Step 4: Verify Setup

```bash
# Start server
npm run dev

# In another terminal, test health endpoint
curl http://localhost:3001/health

# Should return: {"status":"ok","timestamp":"..."}
```

## Step 5: Test Booking Creation

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
    ]
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "status": "DRAFT",
    "totalAmount": 8500,
    ...
  }
}
```

**Note:** `totalAmount` is in cents (8500 = $85.00)

