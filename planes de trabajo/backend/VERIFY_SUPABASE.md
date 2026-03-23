# Supabase Connection Verification Checklist

Follow these steps to verify your Supabase connection is working:

## Step 1: Create .env File

```bash
cd backend
cp env.example.txt .env
```

## Step 2: Get Supabase Connection String

1. Go to https://supabase.com
2. Select your project
3. Settings (⚙️) → Database
4. Scroll to "Connection string"
5. Click "URI" tab
6. Copy the string and replace `[YOUR-PASSWORD]` with your actual password

## Step 3: Configure .env

Edit `.env` and set:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

## Step 4: Test Connection

```bash
npm run db:test
```

**Expected:** ✅ Connected successfully

## Step 5: Push Schema

```bash
npm run db:push
```

**Expected:** ✅ Tables created

## Step 6: Verify Tables

```bash
npm run db:test
```

**Expected:** List of tables (Customer, Booking, etc.)

## Step 7: Test API Endpoints

### Create Booking:
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

**Expected:** `{"success":true,"data":{"id":"...","status":"DRAFT",...}}`

### List Bookings:
```bash
curl "http://localhost:3001/api/admin/bookings?date=2024-12-25"
```

**Expected:** `{"success":true,"data":[...],"pagination":{...}}`

## Final Checklist

- [ ] Supabase project created
- [ ] Connection string copied from Supabase dashboard
- [ ] .env file created with DATABASE_URL
- [ ] Connection test passes (`npm run db:test`)
- [ ] Schema pushed (`npm run db:push`)
- [ ] Tables visible in Supabase dashboard
- [ ] Server connects successfully
- [ ] POST /api/bookings creates record
- [ ] GET /api/admin/bookings returns data
- [ ] Money stored in cents (check totalAmount in DB)

## Verify in Supabase Dashboard

1. Go to Supabase project
2. Click "Table Editor" in left sidebar
3. You should see:
   - Customer
   - Booking
   - BookingItem
   - Payment
   - PricingOverride
   - AdminAuditLog
   - Driver
   - Vehicle
   - BookingAssignment

## Troubleshooting

**Connection fails:**
- Check password in DATABASE_URL
- Verify connection string format
- Ensure `?pgbouncer=true&connection_limit=1` is included

**Tables not created:**
- Run `npm run db:push` again
- Check for error messages
- Verify DATABASE_URL is correct

**API returns errors:**
- Ensure server is running: `npm run dev`
- Check server logs for errors
- Verify database connection: `npm run db:test`

