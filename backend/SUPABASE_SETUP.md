# Supabase Database Setup Guide

## 📋 Step-by-Step Instructions

### A) Where to Create Supabase Project

1. **Visit Supabase:**
   - Go to: **https://supabase.com**
   - Click **"Start your project"** (or sign in if you have an account)
   - If new, sign up with GitHub, Google, or email (free tier available)

2. **Create New Project:**
   - Click **"New Project"** button (top right or in dashboard)
   - Fill in project details:
     - **Name:** `los-cabos-luxe-transfers` (or your preferred name)
     - **Database Password:** ⚠️ **Create a strong password and SAVE IT** - you'll need this!
     - **Region:** Choose closest to you (e.g., `US West`, `US East`, `Europe West`)
   - Click **"Create new project"**
   - ⏳ Wait 2-3 minutes for provisioning

### B) Where to Find Connection String

1. **Navigate to Database Settings:**
   - In your Supabase project dashboard
   - Click the **⚙️ Settings icon** (gear) in the left sidebar
   - Click **"Database"** from the settings menu

2. **Get Connection String:**
   - Scroll down to **"Connection string"** section
   - You'll see multiple tabs: `URI`, `Golang`, `JDBC`, `Python`, etc.
   - Click on the **"URI"** tab
   - You'll see a connection string like:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
     ```

3. **Copy the Connection String:**
   - The string will have `[YOUR-PASSWORD]` placeholder
   - Replace `[YOUR-PASSWORD]` with the **actual password** you created in step A
   - Example result:
     ```
     postgresql://postgres:MySecurePassword123@db.abcdefghijk.supabase.co:5432/postgres
     ```

### C) Configure .env File

1. **Create .env file:**
   ```bash
   cd backend
   cp env.example.txt .env
   ```

2. **Edit .env file:**
   Open `.env` in your editor and set `DATABASE_URL`:

   ```env
   DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
   ```

   **Important:** 
   - Replace `YOUR_ACTUAL_PASSWORD` with your real password
   - Replace `xxxxx` with your actual project reference
   - Keep the `?pgbouncer=true&connection_limit=1` parameters (for connection pooling)

3. **Complete .env example:**
   ```env
   DATABASE_URL="postgresql://postgres:MySecurePassword123@db.abcdefghijk.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
   PORT=3001
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:8080
   ADMIN_USER_ID=admin
   ```

## 🔒 Security Notes

⚠️ **IMPORTANT:**
- ✅ Use **Database connection string** (what we're using)
- ❌ Do NOT use **Service Role Key** (has admin access)
- ❌ Do NOT commit `.env` to git (already in `.gitignore`)
- ❌ Do NOT share your password publicly

## ✅ Next Steps

After configuring `.env`, run these commands:

```bash
# 1. Test connection
npm run db:test

# 2. Push schema to Supabase (creates tables)
npm run db:push

# 3. Verify tables were created
npm run db:test

# 4. Start server
npm run dev
```

## 🧪 Testing Connection

Run the connection test:
```bash
npm run db:test
```

Expected output:
```
🔌 Testing database connection...
✅ Connected to database successfully!
✅ Database query successful: [ { test: 1 } ]

📊 Tables in database:
   ✅ Customer
   ✅ Booking
   ✅ BookingItem
   ...
```

## 📸 Visual Guide

**Finding Connection String:**
1. Dashboard → ⚙️ Settings → Database
2. Scroll to "Connection string"
3. Click "URI" tab
4. Copy the string (replace `[YOUR-PASSWORD]`)

**Connection String Format:**
```
postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
```

Add parameters for Supabase:
```
postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
```
