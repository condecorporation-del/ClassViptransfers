-- RLS Policies: mínimas y seguras
-- Ref: https://supabase.com/docs/guides/auth/row-level-security
-- Ejecutar en Supabase SQL Editor después de enable_rls.sql

-- IMPORTANTE: El backend (Prisma + postgres) BYPASEA RLS. Estas políticas solo aplican
-- a conexiones vía Supabase client (anon/authenticated). Sin Supabase Auth, auth.uid()
-- es null, por lo que nadie con anon/authenticated tendrá acceso. Esto bloquea acceso público.

BEGIN;

-- Helper: rol admin en JWT (app_metadata.role). Usar (select ...) para rendimiento.
-- Si no usas Supabase Auth, auth.jwt() está vacío = nadie cumple = sin acceso (correcto).

-- =============================================================================
-- GRUPO 1: Solo usuarios autenticados (auth.uid() IS NOT NULL)
-- Customer, Booking, BookingItem, Payment - CRUD completo
-- =============================================================================

-- Customer
DROP POLICY IF EXISTS "Customer: no anon access" ON "Customer";
CREATE POLICY "Customer: authenticated full access" ON "Customer"
  FOR ALL TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Booking
DROP POLICY IF EXISTS "Booking: no anon access" ON "Booking";
CREATE POLICY "Booking: authenticated full access" ON "Booking"
  FOR ALL TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- BookingItem
DROP POLICY IF EXISTS "BookingItem: no anon access" ON "BookingItem";
CREATE POLICY "BookingItem: authenticated full access" ON "BookingItem"
  FOR ALL TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Payment
DROP POLICY IF EXISTS "Payment: no anon access" ON "Payment";
CREATE POLICY "Payment: authenticated full access" ON "Payment"
  FOR ALL TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- =============================================================================
-- GRUPO 2: Solo rol admin (auth.jwt()->'app_metadata'->>'role' = 'admin')
-- AdminUser, AdminAuditLog, PricingRule, PricingExtra, Hotel, Area,
-- Driver, Vehicle, PricingOverride, BookingAssignment, EmailLog, AIConversation
-- =============================================================================

-- AdminUser (muy sensible)
DROP POLICY IF EXISTS "AdminUser: no anon access" ON "AdminUser";
CREATE POLICY "AdminUser: admin only" ON "AdminUser"
  FOR ALL TO authenticated
  USING ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

-- AdminAuditLog
DROP POLICY IF EXISTS "AdminAuditLog: no anon access" ON "AdminAuditLog";
CREATE POLICY "AdminAuditLog: admin only" ON "AdminAuditLog"
  FOR ALL TO authenticated
  USING ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

-- PricingRule
DROP POLICY IF EXISTS "PricingRule: no anon access" ON "PricingRule";
CREATE POLICY "PricingRule: admin only" ON "PricingRule"
  FOR ALL TO authenticated
  USING ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

-- PricingExtra
DROP POLICY IF EXISTS "PricingExtra: no anon access" ON "PricingExtra";
CREATE POLICY "PricingExtra: admin only" ON "PricingExtra"
  FOR ALL TO authenticated
  USING ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

-- Hotel
DROP POLICY IF EXISTS "Hotel: no anon access" ON "Hotel";
CREATE POLICY "Hotel: admin only" ON "Hotel"
  FOR ALL TO authenticated
  USING ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

-- Area
DROP POLICY IF EXISTS "Area: no anon access" ON "Area";
CREATE POLICY "Area: admin only" ON "Area"
  FOR ALL TO authenticated
  USING ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

-- Driver
DROP POLICY IF EXISTS "Driver: no anon access" ON "Driver";
CREATE POLICY "Driver: admin only" ON "Driver"
  FOR ALL TO authenticated
  USING ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

-- Vehicle
DROP POLICY IF EXISTS "Vehicle: no anon access" ON "Vehicle";
CREATE POLICY "Vehicle: admin only" ON "Vehicle"
  FOR ALL TO authenticated
  USING ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

-- PricingOverride
DROP POLICY IF EXISTS "PricingOverride: no anon access" ON "PricingOverride";
CREATE POLICY "PricingOverride: admin only" ON "PricingOverride"
  FOR ALL TO authenticated
  USING ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

-- BookingAssignment
DROP POLICY IF EXISTS "BookingAssignment: no anon access" ON "BookingAssignment";
CREATE POLICY "BookingAssignment: admin only" ON "BookingAssignment"
  FOR ALL TO authenticated
  USING ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

-- EmailLog
DROP POLICY IF EXISTS "EmailLog: no anon access" ON "EmailLog";
CREATE POLICY "EmailLog: admin only" ON "EmailLog"
  FOR ALL TO authenticated
  USING ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

-- AIConversation
DROP POLICY IF EXISTS "AIConversation: no anon access" ON "AIConversation";
CREATE POLICY "AIConversation: admin only" ON "AIConversation"
  FOR ALL TO authenticated
  USING ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
  WITH CHECK ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

COMMIT;

-- Resumen:
-- - anon: SIN acceso a ninguna tabla (no hay políticas TO anon)
-- - authenticated: Customer, Booking, BookingItem, Payment (CRUD)
-- - admin (app_metadata.role='admin'): AdminUser, AdminAuditLog, PricingRule, etc. (CRUD)
-- - backend (postgres): BYPASEA RLS = acceso completo
