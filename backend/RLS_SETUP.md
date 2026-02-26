# Row Level Security (RLS) en Supabase

## Objetivo

Habilitar RLS en todas las tablas públicas y definir políticas mínimas y seguras según roles:
- **anon**: sin acceso a ninguna tabla
- **authenticated**: CRUD en Customer, Booking, BookingItem, Payment
- **admin** (app_metadata.role='admin'): CRUD en tablas sensibles (AdminUser, AdminAuditLog, PricingRule, etc.)
- **backend** (postgres): bypassa RLS = acceso completo

## Orden de ejecución

1. **enable_rls.sql** – Habilita RLS en todas las tablas
2. **rls_policies_secure.sql** – Define políticas por rol

## Cómo ejecutar

1. Entra a **[Supabase Dashboard](https://supabase.com/dashboard)** y abre el proyecto **los-cabos-luxe**.
2. Ve a **SQL Editor**.
3. Ejecuta primero `prisma/migrations/enable_rls.sql`.
4. Ejecuta después `prisma/migrations/rls_policies_secure.sql`.

## Políticas definidas

| Tablas | Rol | Acceso |
|--------|-----|--------|
| Customer, Booking, BookingItem, Payment | authenticated | SELECT, INSERT, UPDATE, DELETE |
| AdminUser, AdminAuditLog, PricingRule, PricingExtra, Hotel, Area, Driver, Vehicle, PricingOverride, BookingAssignment, EmailLog, AIConversation | admin (app_metadata.role='admin') | SELECT, INSERT, UPDATE, DELETE |
| anon | — | Ninguno |

## Supabase Auth

Estas políticas usan `auth.uid()` y `auth.jwt()->'app_metadata'->>'role'` de Supabase Auth. Si tu app **no usa Supabase Auth** (solo Prisma + API Express), el Supabase client siempre se conecta como anon y no cumple ninguna política = **ningún acceso directo**, que es lo deseado. El backend (Prisma con postgres) sigue funcionando porque bypassa RLS.

Si en el futuro usas Supabase Auth, configura `app_metadata.role = 'admin'` para usuarios admin.

## Verificación

```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
```

## Referencias

- [Supabase: Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase: Database Linter - RLS](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)
