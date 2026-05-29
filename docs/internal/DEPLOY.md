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

## Production cutover

When the code is approved and you are ready to switch from test credentials to the client's real production setup, change variables in this order:

1. Domain variables
2. Admin credentials
3. Stripe live keys
4. Resend sender domain
5. Final webhook secret

This avoids mixing test and live systems during rollout.

### Frontend

- `VITE_STRIPE_PUBLIC_KEY=pk_live_or_test_here`
- `VITE_SUPABASE_URL=https://your-project-ref.supabase.co`
- `VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`

Optional:

- `VITE_API_BASE_URL=https://your-vercel-domain.vercel.app`

Notes:

- Leave `VITE_API_BASE_URL` empty or unset when frontend and API share the same Vercel deployment.
- Set `VITE_API_BASE_URL` only if the frontend must temporarily call another backend host.
- For this project, the preferred production setup is same-origin on Vercel, so `VITE_API_BASE_URL` should stay empty.

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

For the final Class VIP domain, these are the intended production values:

- `FRONTEND_URL=https://www.classviptransfers.com`
- `BACKEND_URL=https://www.classviptransfers.com`
- `ALLOWED_ORIGINS=https://www.classviptransfers.com,https://classviptransfers.com`

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

Resend testing mode before the domain is verified:

- `EMAIL_FROM=Class VIP Transfers <onboarding@resend.dev>`

Resend production mode after the client domain is verified in Resend:

- `EMAIL_FROM=Class VIP Transfers <reservations@classviptransfers.com>`
- `COMPANY_BOOKINGS_EMAIL=reservations@classviptransfers.com`

If you want internal copies during rollout, you can temporarily set:

- `COMPANY_BOOKINGS_EMAIL=condecorporation@gmail.com`

### Optional AI

- `OPENAI_API_KEY=...`
- `OPENAI_MODEL=gpt-4o`
- `OPENAI_WHISPER_MODEL=whisper-1`
- `OPENAI_TEMPERATURE=0.3`
- `OPENAI_MAX_TOKENS=400`

## Database notes

The current production database already supports:

- bookings
- admin auth
- client accounts / open accounts
- account charges
- account payments

Important:

- the app runtime uses the Supabase pooler connection in `DATABASE_URL`
- Prisma schema push through the pooler can hang
- for future schema changes, prefer a direct migration connection instead of relying on the pooler

That means the project is ready to run on the current database, but future schema edits should use a safer migration path.

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

## Final launch checklist

Before switching the public DNS to `www.classviptransfers.com`, confirm all of these:

1. Admin login works with the final `ADMIN_EMAIL`
2. Create an open account from admin and confirm it appears in `Finanzas > Cuentas Abiertas`
3. Create a reservation from admin
4. Edit the reservation from admin
5. Reservation appears ordered correctly in operational views
6. `PDF operacional` prints with logo and watermark
7. Stripe card field loads with the live publishable key
8. A live payment reaches success and updates the booking
9. Resend sends from `onboarding@resend.dev` or the final verified domain
10. Webhook events reach `/api/stripe/webhook`
11. Frontend and admin both work on the final domain without CORS errors

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
