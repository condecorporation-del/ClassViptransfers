# Deploy Guide

This project is being prepared for **Vercel-only** deployment.

That means:

- frontend on Vercel
- backend API on Vercel Functions
- Stripe webhook on Vercel

## Current Vercel-only shape

The repo already has the basic pieces needed for a Vercel-only setup:

- `api/[...path].ts`
- `backend/src/app.ts`
- `backend/src/server.ts`
- `vercel.json`

Current serverless entry:

- `api/[...path].ts` exports the Express app from `backend/src/app.ts`

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

- `api/[...path].ts`

The frontend SPA is still served from:

- `dist`

`vercel.json` already preserves filesystem routes first, so `/api/*` should resolve before SPA fallback.

## Environment variables for Vercel

Set these in the Vercel project.

### Frontend

- `VITE_API_BASE_URL=https://your-vercel-domain.vercel.app`
- `VITE_STRIPE_PUBLIC_KEY=pk_live_or_test_here`

### Core backend

- `NODE_ENV=production`
- `DATABASE_URL=...`
- `PORT=3001`
- `FRONTEND_URL=https://your-vercel-domain.vercel.app`
- `BACKEND_URL=https://your-vercel-domain.vercel.app`

### CORS / preview

- `ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app,https://www.classviptransfers.com,https://classviptransfers.com`
- `FRONTEND_PREVIEW_URLS=`
- `ALLOW_VERCEL_PREVIEW_ORIGINS=true`

Recommended:

- use `ALLOW_VERCEL_PREVIEW_ORIGINS=true` while testing preview deployments
- once the final production domain is stable, you can tighten this if desired

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

## What is still open

Even with Vercel-only chosen, this is not "done" until:

- staging smoke test passes
- mobile QA passes
- admin QA passes
- booking QA passes
- email QA passes
- webhook QA passes
- final visual pass passes
