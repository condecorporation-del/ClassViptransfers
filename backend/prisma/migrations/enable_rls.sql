-- Enable Row Level Security (RLS) on all public tables
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public
-- Run this in Supabase SQL Editor: los-cabos-luxe project

-- IMPORTANT: Your backend uses Prisma with DATABASE_URL (postgres/service role).
-- The postgres role BYPASSES RLS by default, so the backend will continue to work.
-- RLS restricts direct access via Supabase client (anon key) and other non-privileged connections.

BEGIN;

-- 1. Enable RLS on all tables
ALTER TABLE "AdminUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BookingItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PricingOverride" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BookingAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Driver" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Vehicle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminAuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PricingRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PricingExtra" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Hotel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Area" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AIConversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AccountCharge" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AccountPayment" ENABLE ROW LEVEL SECURITY;

-- 2. Create RESTRICTIVE policies: No access for anon/authenticated by default.
--    The backend (postgres/service_role) bypasses RLS.
--    This blocks any direct Supabase client access with anon key.
--    (DROP IF EXISTS makes this script safe to re-run.)

DROP POLICY IF EXISTS "AdminUser: no anon access" ON "AdminUser";
CREATE POLICY "AdminUser: no anon access" ON "AdminUser"
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Customer: no anon access" ON "Customer";
CREATE POLICY "Customer: no anon access" ON "Customer"
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Booking: no anon access" ON "Booking";
CREATE POLICY "Booking: no anon access" ON "Booking"
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "BookingItem: no anon access" ON "BookingItem";
CREATE POLICY "BookingItem: no anon access" ON "BookingItem"
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Payment: no anon access" ON "Payment";
CREATE POLICY "Payment: no anon access" ON "Payment"
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "PricingOverride: no anon access" ON "PricingOverride";
CREATE POLICY "PricingOverride: no anon access" ON "PricingOverride"
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "BookingAssignment: no anon access" ON "BookingAssignment";
CREATE POLICY "BookingAssignment: no anon access" ON "BookingAssignment"
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Driver: no anon access" ON "Driver";
CREATE POLICY "Driver: no anon access" ON "Driver"
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Vehicle: no anon access" ON "Vehicle";
CREATE POLICY "Vehicle: no anon access" ON "Vehicle"
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "AdminAuditLog: no anon access" ON "AdminAuditLog";
CREATE POLICY "AdminAuditLog: no anon access" ON "AdminAuditLog"
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "PricingRule: no anon access" ON "PricingRule";
CREATE POLICY "PricingRule: no anon access" ON "PricingRule"
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "PricingExtra: no anon access" ON "PricingExtra";
CREATE POLICY "PricingExtra: no anon access" ON "PricingExtra"
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Hotel: no anon access" ON "Hotel";
CREATE POLICY "Hotel: no anon access" ON "Hotel"
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Area: no anon access" ON "Area";
CREATE POLICY "Area: no anon access" ON "Area"
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "EmailLog: no anon access" ON "EmailLog";
CREATE POLICY "EmailLog: no anon access" ON "EmailLog"
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "AIConversation: no anon access" ON "AIConversation";
CREATE POLICY "AIConversation: no anon access" ON "AIConversation"
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "ClientAccount: no anon access" ON "ClientAccount";
CREATE POLICY "ClientAccount: no anon access" ON "ClientAccount"
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "AccountCharge: no anon access" ON "AccountCharge";
CREATE POLICY "AccountCharge: no anon access" ON "AccountCharge"
  FOR ALL USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "AccountPayment: no anon access" ON "AccountPayment";
CREATE POLICY "AccountPayment: no anon access" ON "AccountPayment"
  FOR ALL USING (false) WITH CHECK (false);

COMMIT;

-- Verify: Run "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';" to confirm RLS is ON.
-- Your backend (Prisma + postgres) will continue to work; only direct Supabase client access is blocked.
