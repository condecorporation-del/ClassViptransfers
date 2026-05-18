# Deploy Guide

This project is prepared for **Vercel-only** deployment.

That means:

- frontend on Vercel
- backend API on Vercel Functions
- Stripe webhook on Vercel
- public catalog reads directly from Supabase when appropriate

## Current Vercel-only shape

The repo already has the core pieces needed for a Vercel-only setup:

- `api/index.ts`
- `backend/src/app.ts`
- `backend/src/server.ts`
- `vercel.json`

Current serverless entry:

- `api/index.ts` exports the Express app from `backend/src/app.ts`

That is the path we are committing to.

## Important reality check

Vercel-only is possible here, but it still needs staging validation because the risky parts are:

- Prisma behavior in serverless/runtime reuse
- Stripe webhook reliability
- cookie/auth behavior across Vercel domains
- cold starts
- ensuring backend routes are not swallowed by SPA fallback

So the plan is:

1. deploy to Vercel
2. test all critical flows in staging
3. only then treat it as client-ready

## Vercel project setup

Use one Vercel project from this repo root.

### Build settings

- Framework preset: `Vite`
- Root directory: repo root
- Build command: `npm run build`
- Output directory: `dist`

### API routing

The backend API is served by:

- `api/index.ts`

The frontend SPA is still served from:

- `dist`

`vercel.json` already preserves filesystem routes first, so `/api/*` resolves before the SPA fallback.

## Environment variables for Vercel

Set these in the Vercel project.

### Frontend

- `VITE_STRIPE_PUBLIC_KEY=pk_live_or_test_here`
- `VITE_SUPABASE_URL=https://your-project-ref.supabase.co`
- `VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`

Optional:

- `VITE_API_BASE_URL=https://your-vercel-domain.vercel.app`

Notes:

- Leave `VITE_API_BASE_URL` empty or unset when frontend and API share the same Vercel deployment.
- Set `VITE_API_BASE_URL` only if the frontend must temporarily call another backend host.

### Core backend

- `NODE_ENV=production`
- `DATABASE_URL=...`
- `FRONTEND_URL=https://your-vercel-domain.vercel.app`
- `BACKEND_URL=https://your-vercel-domain.vercel.app`

### CORS / preview

- `ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app,https://www.classviptransfers.com,https://classviptransfers.com`
- `FRONTEND_PREVIEW_URLS=`
- `ALLOW_VERCEL_PREVIEW_ORIGINS=true`

Recommended:

- use `ALLOW_VERCEL_PREVIEW_ORIGINS=true` while testing preview deployments
- once the final production domain is stable, tighten this if you want stricter CORS

### Admin auth

- `ADMIN_EMAIL=...`
- `ADMIN_PASSWORD_HASH=...`
- `ADMIN_JWT_SECRET=...`
- `ADMIN_AUTH_DISABLED=false`

### Booking / secure links

- `JWT_SECRET=...`
- `BOOKING_LOOKUP_SECRET=...`
- `BOOKING_PDF_SECRET=...`

### Stripe

- `STRIPE_SECRET_KEY=...`
- `STRIPE_WEBHOOK_SECRET=...`

### Email

Choose one provider:

- `RESEND_API_KEY=...`

or

- `GMAIL_USER=...`
- `GMAIL_APP_PASSWORD=...`

Recommended email vars:

- `COMPANY_BOOKINGS_EMAIL=...`
- `EMAIL_COMPANY_TO=...`
- `EMAIL_FROM=Class VIP Transfers <reservations@yourdomain.com>`

### Optional AI

- `OPENAI_API_KEY=...`

## Stripe webhook on Vercel

Configure Stripe to send webhooks to:

- `https://your-vercel-domain.vercel.app/api/stripe/webhook`

Listen for at least:

- `payment_intent.succeeded`

Then paste the resulting secret into:

- `STRIPE_WEBHOOK_SECRET`

## Cookie / auth behavior

Admin auth uses an HTTP-only cookie:

- `admin_token`

In production:

- `secure: true`
- `sameSite: 'none'`

That means:

- Vercel deployment must be HTTPS
- `FRONTEND_URL` must match the deployed site
- `ALLOWED_ORIGINS` must include the deployed site

## Staging verification checklist

After the first Vercel deploy, verify:

1. `/`
2. `/book`
3. hotel search
4. booking creation
5. `/checkout`
6. Stripe card field visible
7. sandbox payment reaches `/checkout/success`
8. `/checkout/cancel`
9. `/admin/login`
10. `/admin`
11. bookings table
12. quick booking
13. confirm / resend / cancel
14. confirmation emails
15. Stripe webhook confirmation path

## Final architecture target

For a clean Vercel-first production setup:

- public reads:
  - hotels
  - areas
  - zones
  - extras
  come from Supabase-friendly frontend reads

- sensitive writes and operations:
  - booking creation
  - payment intent creation
  - payment confirmation
  - admin auth
  - admin mutations
  - email / PDF / webhook handling
  stay server-side
