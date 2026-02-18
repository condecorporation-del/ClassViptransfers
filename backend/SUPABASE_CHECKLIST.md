# Supabase Connection Checklist

## 📋 Step-by-Step Instructions

### A) Where to Create Supabase Project

**Location:** https://supabase.com

**Steps:**
1. Visit https://supabase.com
2. Click "Start your project" or sign in
3. Click "New Project"
4. Enter:
   - **Name:** `los-cabos-luxe-transfers`
   - **Database Password:** (create and save this!)
   - **Region:** Choose closest to you
5. Click "Create new project"
6. Wait 2-3 minutes for provisioning

### B) Where to Find Connection String

**Location:** Supabase Dashboard → Settings → Database

**Steps:**
1. In your Supabase project dashboard
2. Click **⚙️ Settings** (gear icon) in left sidebar
3. Click **"Database"** from settings menu
4. Scroll down to **"Connection string"** section
5. Click **"URI"** tab
6. You'll see: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`
7. **Copy this string**

### C) Configure .env File

**File:** `backend/.env`

**Steps:**
1. ```bash
   cd backend
   cp env.example.txt .env
   ```

2. Edit `.env` and set:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
   ```

3. Replace:
   - `YOUR_ACTUAL_PASSWORD` → Your Supabase database password
   - `xxxxx` → Your project reference from the connection string
   - Keep `?pgbouncer=true&connection_limit=1` at the end

**Example:**
```env
DATABASE_URL="postgresql://postgres:MyPassword123@db.abcdefghijk.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

## ✅ Verification Steps

### 1. Test Connection
```bash
npm run db:test
```
**Expected:** ✅ Connected successfully

### 2. Push Schema
```bash
npm run db:push
```
**Expected:** ✅ Tables created

### 3. Verify Tables
```bash
npm run db:test
```
**Expected:** List of all tables

### 4. Test Booking Creation
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
**Expected:** `{"success":true,"data":{"id":"...","totalAmount":8500,...}}`

**Verify in Supabase:**
- Go to Table Editor → Booking table
- Should see new record with `totalAmount: 8500` (cents)

### 5. Test List Bookings
```bash
curl "http://localhost:3001/api/admin/bookings?date=2024-12-25"
```
**Expected:** `{"success":true,"data":[...],"pagination":{...}}`

## 🔒 Security Checklist

- ✅ Using database connection string (not service role key)
- ✅ `.env` file in `.gitignore` (not committed)
- ✅ Password not exposed in code
- ✅ SSL connection enabled (via connection string)

## 📊 Final Checklist

- [ ] **Supabase connected** ✅ / ❌
  - Test: `npm run db:test` returns success
  
- [ ] **Prisma synced** ✅ / ❌
  - Test: `npm run db:push` completes without errors
  
- [ ] **Tables live** ✅ / ❌
  - Test: `npm run db:test` lists all tables
  - Or check Supabase dashboard → Table Editor
  
- [ ] **Booking creation working** ✅ / ❌
  - Test: POST /api/bookings creates record
  - Verify: Record appears in Supabase Booking table
  - Verify: `totalAmount` stored in cents (e.g., 8500 for $85.00)

## 🐛 Troubleshooting

**Connection fails:**
- Verify password in DATABASE_URL matches Supabase password
- Check connection string format
- Ensure `?pgbouncer=true&connection_limit=1` is included

**Tables not created:**
- Run `npm run db:push` again
- Check error messages
- Verify DATABASE_URL is correct

**API errors:**
- Ensure server running: `npm run dev`
- Check server logs
- Test connection: `npm run db:test`

## 📚 Additional Resources

- **Detailed Setup:** See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **Verification Guide:** See [VERIFY_SUPABASE.md](./VERIFY_SUPABASE.md)
- **API Examples:** See [API_EXAMPLES.md](./API_EXAMPLES.md)

