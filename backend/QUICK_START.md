# 🚀 Quick Start - Automated Supabase Setup

## Option 1: Interactive Setup (Recommended)

```bash
cd backend
npm run setup:supabase
```

The script will prompt you for:
- Supabase project reference
- Database password

Then it automates everything else!

## Option 2: Non-Interactive Setup

If you have the credentials ready:

```bash
cd backend
SUPABASE_PROJECT_REF=your-ref SUPABASE_PASSWORD=your-pass npx tsx scripts/setup-with-env.ts
```

## What You Need First

**If you don't have a Supabase project yet:**

1. Go to: **https://supabase.com**
2. Click **"New Project"**
3. Fill in:
   - Name: `los-cabos-luxe-transfers`
   - Password: (save this!)
   - Region: (choose closest)
4. Click **"Create new project"**
5. Wait 2-3 minutes

**Then get your project reference:**
- Settings (⚙️) → Database
- Connection string shows: `db.XXXXX.supabase.co`
- `XXXXX` is your project reference

## After Setup

```bash
# Start server
npm run dev

# Test it works
curl http://localhost:3001/health
```

## Full Checklist

After running setup, verify:

- [x] Supabase connected ✅
- [x] Prisma synced ✅
- [x] Tables created ✅
- [x] Test booking inserted ✅
