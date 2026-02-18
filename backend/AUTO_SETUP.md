# 🚀 Automated Supabase Setup

## One-Command Setup

Run this single command to automate everything:

```bash
cd backend
npm run setup:supabase
```

The script will:
1. ✅ Prompt for Supabase project reference
2. ✅ Prompt for database password
3. ✅ Create `.env` file automatically
4. ✅ Generate Prisma client
5. ✅ Test database connection
6. ✅ Push schema to Supabase
7. ✅ Verify tables created
8. ✅ Test booking creation
9. ✅ Clean up test data

## What You Need

**Before running the script, you need:**

1. **Supabase Project** (if not created yet):
   - Go to: https://supabase.com
   - Click "New Project"
   - Create project and **save your database password**
   - Wait 2-3 minutes for provisioning

2. **Project Reference:**
   - In Supabase dashboard: Settings (⚙️) → Database
   - Look at connection string: `db.XXXXX.supabase.co`
   - The `XXXXX` part is your project reference

3. **Database Password:**
   - The password you set when creating the project

## Running the Setup

```bash
cd backend
npm run setup:supabase
```

**Example interaction:**
```
🚀 Automated Supabase Setup

Enter your Supabase project reference (e.g., abcdefghijk): abcdefghijk
Enter your Supabase database password: ********

📝 Creating .env file...
✅ .env file created

🔧 Generating Prisma client...
✅ Prisma client generated

🔌 Testing database connection...
✅ Connected to Supabase successfully!

📊 Pushing schema to Supabase...
✅ Schema pushed successfully!

📋 Verifying tables...
✅ Found 9 tables:
   - AdminAuditLog
   - Booking
   - BookingAssignment
   - BookingItem
   - Customer
   - Driver
   - Payment
   - PricingOverride
   - Vehicle

🧪 Testing booking creation...
✅ Test booking created successfully!
   Booking ID: clxxx...
   Total Amount: $85.00 (8500 cents)
🧹 Test data cleaned up

🎉 Setup Complete!

✅ Supabase connected
✅ Prisma synced
✅ Tables created
✅ Test booking inserted
```

## Alternative: Manual Setup

If you prefer to set up manually, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

## Troubleshooting

**Connection fails:**
- Verify project reference is correct
- Verify password is correct
- Ensure project is fully provisioned (wait 2-3 minutes)

**Schema push fails:**
- Check connection first: `npm run db:test`
- Verify DATABASE_URL in `.env` is correct

**Tables not created:**
- Run `npm run db:push` manually
- Check Supabase dashboard → Table Editor

## Next Steps

After setup completes:

```bash
# Start server
npm run dev

# Test endpoints
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d @test-booking.json
```

