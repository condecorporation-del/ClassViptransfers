# Class VIP Transfers

Frontend and backend for the isolated Class VIP Transfers rebuild: website, booking flow, admin dashboard, and supporting API.

## Stack

- Frontend: Vite + React + TypeScript + Tailwind
- Backend: Express + TypeScript + Prisma
- Payments: Stripe
- Email: Resend or Gmail SMTP
- Database: PostgreSQL via Prisma

## Project structure

```text
src/
  features/
    admin/           Admin pages, hooks, and operational components
    booking/         Booking, checkout, and pricing UI
    marketing/       Public website pages, chat, SEO, and content
  shared/
    components/      App-wide wrappers and boundaries
    hooks/           Shared hooks
    lib/             Shared frontend helpers
    pages/           Shared route screens
    providers/       Global providers (language, etc.)
    ui/              Reusable UI primitives
  assets/            Local optimized brand assets
  i18n/              Translation catalog
  test/              Frontend test utilities

backend/
  src/
    app.ts           Express app assembly
    server.ts        Local server bootstrap
    features/        Admin, auth, booking, pricing, AI domains
    shared/          Shared backend libs, middleware, types, tests
  prisma/            Prisma schema and seed
  scripts/           Database and setup utilities
  data/              Hotel and pricing seed sources

public/              Static public assets
scripts/             Root utility scripts for icons/assets
```

## Frontend commands

```bash
npm install
npm run dev
npm run lint
npm run build
npm run test
```

The frontend typically runs on `http://127.0.0.1:5173` or `http://127.0.0.1:5174`, depending on the active dev session.

## Backend commands

```bash
cd backend
npm install
npm run dev
npm run build
npm run test
```

## Environment

### Frontend

Use the root `.env.example` as reference.

Main variables:

- `VITE_STRIPE_PUBLIC_KEY`
- `VITE_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Backend

The backend expects its own `.env` inside `backend/`.

Main variables used by the API:

- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_JWT_SECRET`
- `BOOKING_LOOKUP_SECRET`
- `RESEND_API_KEY` or `GMAIL_USER` + `GMAIL_APP_PASSWORD`
- `FRONTEND_URL`
- `BACKEND_URL`
- `ALLOWED_ORIGINS`
- `OPENAI_API_KEY` for chat/voice features

## Current deployment direction

- Frontend is designed for Vercel
- Public catalog data can fall back to Supabase directly from the frontend:
  - hotels
  - areas
  - zones
  - pricing extras
- Sensitive flows still belong on a backend API:
  - booking creation
  - Stripe payment intent / confirmation
  - Stripe webhooks
  - admin auth and admin mutations
  - PDFs and email delivery

That means the current professional deployment shape is:

- Vercel for the frontend SPA
- Supabase for PostgreSQL
- backend API either:
  - Vercel Functions after a Vercel-first refactor, or
  - a dedicated backend host while the API remains Express-based

## Recommended Vercel-first architecture

If the goal is to run the whole product cleanly on Vercel over time, the next refactor should move the sensitive backend into smaller serverless endpoints instead of one large Express runtime.

Recommended split:

- Direct frontend reads from Supabase for public data
- Vercel Functions for:
  - /api/bookings
  - /api/bookings/:id
  - /api/stripe/create-payment-intent
  - /api/stripe/confirm-payment
  - /api/admin/auth/*
  - /api/admin/bookings/*
  - /api/admin/pricing/*

This keeps the public site fast and cheap while leaving secure operations server-side.

## Notes

- PayPal legacy runtime code has been removed; Stripe is the active payment path.
- This repo has already gone through cleanup to remove dead pages, unused UI scaffolding, and old assets.
- The new Supabase database currently contains a validated public hotel catalog of `252` active hotels.
- Keep new work aligned with the current live site behavior unless a change is intentional.

