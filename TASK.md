# Class VIP Transfers - Task Plan

## Project Goal

Build a professional, production-ready version of Class VIP Transfers on a safe isolated stack:

- clean code
- organized structure
- strong UX
- polished design
- secure admin flow
- stable booking + Stripe flow
- deployable on Vercel

This project is being improved in:

`C:\Users\conde\Documents\classvip-live-correct2`

New isolated repo:

`https://github.com/condecorporation-del/ClassViptransfers.git`

We are **not** working directly on production.

---

## What We Have Already Done

### Repo / Architecture

- [x] Moved work to the correct isolated repo
- [x] Created new GitHub repo for safe development
- [x] Added backend `.env.example` for safe configuration handoff
- [x] Reorganized frontend by domain:
  - `src/features/admin`
  - `src/features/booking`
  - `src/features/marketing`
  - `src/shared`
- [x] Reorganized backend by domain:
  - `backend/src/features/admin`
  - `backend/src/features/ai`
  - `backend/src/features/auth`
  - `backend/src/features/booking`
  - `backend/src/features/pricing`
  - `backend/src/shared`
- [x] Removed a large amount of dead code, duplicate files, and unused UI pieces
- [x] Cleaned repo documentation and left useful base docs

### Code Quality

- [x] Cleaned lint issues
- [x] Cleaned major TypeScript issues
- [x] Got frontend build passing
- [x] Got backend build passing
- [x] Added a real handoff file for other agents
- [x] Added backend tests for booking + manual booking validation

### Performance

- [x] Added lazy loading
- [x] Split bundle into healthier chunks
- [x] Reduced main bundle size significantly
- [x] Optimized main logo usage

### Payments / Booking / Admin

- [x] Removed active PayPal runtime flow from frontend/backend
- [x] Verified Stripe payment intent creation
- [x] Verified real booking creation against the new database
- [x] Verified admin auth by API
- [x] Verified admin stats/bookings endpoints by API
- [x] Fixed booking flow so successful booking now redirects to checkout
- [x] Removed duplicate mobile booking nav controls
- [x] Hardened admin auth so it fails closed on backend/network issues

### New Isolated Database

- [x] Connected project to a new Supabase database
- [x] Ran schema push successfully
- [x] Ran seed successfully
- [x] Verified database connection successfully
- [x] Confirmed pricing endpoints work against the new DB

### UI Cleanup / Polish Already Done

- [x] Cleaned footer structure and removed noisy debug/build badge
- [x] Removed exposed admin footer link
- [x] Corrected a visible portion of broken text/i18n strings

---

## Current Priorities

These are the next important blocks to finish before calling the project truly professional.

### 1. Functional Verification

- [x] Complete full visual booking flow from `/book` to `/checkout`
- [~] Confirm Stripe renders consistently in checkout
- [x] Confirm success / cancel flows visually
- [x] Log into `/admin/login` visually in browser
- [x] Review `/admin` dashboard modules visually
- [x] Verify admin bookings table visually
- [~] Verify quick reservation flow visually
- [x] Verify resend confirmation / cancel / confirm actions

### 2. i18n Cleanup

- [x] Fully clean `src/i18n/translations.ts`
- [x] Remove remaining mojibake / broken accented text
- [x] Normalize English copy
- [x] Normalize Spanish copy
- [x] Make UI text feel premium and consistent
- [x] Remove awkward legacy labels and stale wording
- [x] Fix missing accents in admin sidebar labels (Configuración, Más)

### 3. Booking UX Polish

- [~] Improve spacing and visual rhythm in booking flow
- [x] Improve step transitions and review clarity
- [x] Improve mobile bottom summary behavior
- [x] Improve validation clarity by step
- [x] Improve review step layout and call-to-action emphasis
- [x] Make checkout feel more premium and trustworthy
- [x] Improve empty, loading, and error states
- [x] Route successful checkout into the dedicated success page with booking context
- [x] Fix price formatting in sidebar summary (Math.round for consistent integer display)
- [x] Fix CheckoutSuccess: ES accent fixes, cleaner reference display (code not UUID), mapped status labels
- [x] Fix Confirmation: ES accent fixes, correct Pickup label in ES, mapped status labels

### 4. Admin UX Polish

- [x] Polish admin login screen
- [x] Polish dashboard hierarchy and card spacing
- [x] Polish booking rows and action density
- [x] Improve admin loading states
- [x] Improve empty states and error states
- [x] Review consistency of buttons, badges, labels, filters, and forms
- [x] Make admin feel more like a serious operations tool than a prototype

### 5. Product Hardening

- [x] Review admin auth/session lifecycle carefully
- [x] Review protected routes and token handling
- [x] Review booking lookup token flow
- [x] Review booking confirmation flow
- [x] Review Stripe confirmation flow
- [x] Review Resend/email flow end-to-end
- [x] Review logging and audit behavior
- [~] Review edge cases for broken/incomplete bookings

### 6. Data / Pricing / Admin Operations

- [x] Review hotels data quality
- [ ] Export the real hotel catalog from the old Class VIP database
- [ ] Compare old production hotel catalog vs current new database hotel catalog
- [ ] Compare old production hotel catalog vs `backend/data/hotels-enriched.json`
- [x] Normalize hotel names and zone labels
- [x] Deduplicate hotels cleanly
- [x] Import the full validated hotel catalog into the new Supabase database
- [x] Verify hotel counts by zone after import
- [x] Verify booking hotel search shows the complete imported hotel catalog
- [x] Review zones data quality
- [x] Review extras data quality
- [x] Review pricing manager functionality
- [x] Review quick reservation pricing behavior
- [x] Review manual booking flow for admin
- [ ] Review exports/reporting if still needed

### 7. Infrastructure / Vercel

- [x] Decide final deployment architecture
  - frontend on Vercel
  - backend API + webhook on Vercel
    - RISK: `api/[...path].ts` imports TS from `backend/src/app` directly; full staging verification is still required for Prisma, cookies, and Stripe webhook behavior in serverless
- [x] Document the Vercel-only deployment path clearly
- [x] Add a concrete deploy checklist for Vercel-only deployment
- [x] Prepare frontend for Vercel production deploy
- [x] Prepare backend deployment strategy
- [x] Clean production env variables
- [x] Configure Vercel project settings
- [ ] Configure Stripe envs and webhook target
- [x] Configure Resend envs (or GMAIL_USER + GMAIL_APP_PASSWORD + COMPANY_BOOKINGS_EMAIL)
- [x] Verify CORS and allowed origins for deployed domains
- [ ] Create stable preview/staging environment

### 8. Final Production Readiness

- [~] Full smoke test on deployed environment
- [ ] Mobile QA
- [ ] Desktop QA
- [~] Admin QA
- [~] Booking QA
- [x] Email QA
- [ ] Final visual pass for consistency
- [ ] Final cleanup of leftover temporary/debug code
- [x] Decide whether to replace official site with this version

---

## Suggested Execution Order

Recommended order so we do not create rework:

1. [ ] Finish functional visual verification
2. [ ] Finish full `translations.ts` cleanup
3. [ ] Polish booking UX + checkout UX
4. [ ] Polish admin login + dashboard UX
5. [ ] Harden auth / booking / Stripe / email edge cases
6. [ ] Review pricing / hotels / zones / admin operations
7. [ ] Prepare Vercel deployment
8. [ ] Run final QA and production-readiness pass

---

## Definition of Done

We can call this project professionally ready when:

- [ ] repo is clean and maintainable
- [ ] frontend and backend builds pass cleanly
- [~] critical flows work visually and by API
- [ ] booking flow feels polished
- [ ] admin feels production-grade
- [ ] i18n is clean in English and Spanish
- [ ] Stripe works correctly
- [x] email confirmations work correctly
- [~] Vercel deployment is configured and stable
- [ ] no visible debug/dev noise remains

---

## Notes

- Current handoff file:
  - `C:\Users\conde\Documents\classvip-live-correct2\AGENT_HANDOFF.md`
- Frontend env vars:
  - `C:\Users\conde\Documents\classvip-live-correct2\.env.example`
  - local browser QA found that checkout currently loads Stripe with an empty publishable key if `VITE_STRIPE_PUBLIC_KEY` is not set
- Stripe sandbox QA completed in this pass:
  - local `.env` now includes `VITE_STRIPE_PUBLIC_KEY` for sandbox testing
  - backend local `.env` was aligned to the matching Stripe sandbox secret key
  - checkout now uses `CardElement` instead of `PaymentElement` for a more stable card-only sandbox/staging flow
  - `/api/stripe/create-payment-intent` was updated to request `payment_method_types: ['card']`
  - a real sandbox payment intent was created and confirmed with Stripe test card rails for booking `CLASS2026010`
  - `/api/stripe/confirm-payment` successfully transitioned that booking to `CONFIRMED`
  - `/checkout/success` was verified visually after the confirmed sandbox payment
  - browser automation still cannot reliably introspect the secure Stripe iframe itself, so the remaining Stripe work is mainly human visual QA plus staging deploy verification
- Hotel data sources currently present in the repo:
  - `backend/prisma/seed.ts` -> smaller starter hotel list
  - `backend/data/hotels-enriched.json` -> larger hotel catalog (`181` records found)
  - `backend/scripts/import-hotels.ts` -> import path for loading a validated hotel catalog into Prisma/Supabase
- Current imported hotel counts in the new Supabase database:
  - `252` active hotels total
  - `Cabo Pacific Area: 12`
  - `Cabo San Lucas: 87`
  - `Pacific & East Cape: 36`
  - `Port Los Cabos: 14`
  - `San Jose del Cabo: 51`
  - `Tourist Corridor: 52`
- Public verification already completed:
  - `/api/pricing/hotels` returns `252` hotels
  - `/api/hotels` returns `252` hotels with slugs
- Official domain cutover completed (2026-05-21):
  - `classviptransfers.com` and `www.classviptransfers.com` now point to the Vercel deployment
  - SSL is active and the browser reports the production domain as a secure connection
  - production booking flow creates reservations successfully on the official domain
  - production email notifications are confirmed reaching both the customer recipient and the company recipient
  - production reservations are visible in the admin after creation
- Backend deployment prep already completed:
  - Express app extracted into `backend/src/app.ts`
  - `backend/src/server.ts` now only owns local startup concerns
  - this reduces risk for a later Vercel/serverless adapter
- Additional deploy prep completed in this pass:
  - `.vercelignore` now excludes only local planning/docs and keeps `api/` + `backend/` available for Vercel Functions
  - `DEPLOY.md` now reflects Vercel-only as the canonical deployment plan
  - backend CORS now supports a tighter production setup using:
    - `ALLOWED_ORIGINS`
    - `FRONTEND_URL`
    - `FRONTEND_PREVIEW_URLS`
    - `ALLOW_VERCEL_PREVIEW_ORIGINS`
  - `backend/.env.example` was updated to document those deploy-time env vars
- Additional Vercel prep completed in this pass:
  - added `api/[...path].ts` as the serverless entrypoint that exports the Express app
  - updated `vercel.json` to use filesystem routing first so API functions are not swallowed by the SPA fallback
  - added `/api/health` alongside `/health` for easier hosted health checks
- Admin auth hardening already completed:
  - frontend admin hook now fails closed if the backend auth check fails
  - login controller no longer emits noisy per-step debug logs during normal auth flow
- Additional auth/session cleanup completed:
  - admin token storage centralized in `src/features/admin/lib/adminSession.ts`
  - `AdminRoute` now redirects with `Navigate` and preserves the intended destination
  - `AdminLogin` now clears stale tokens, reuses the shared session helpers, and redirects back to the protected destination after successful login
- Booking route hardening completed in this pass:
  - sensitive booking mutation routes now require admin auth:
    - `POST /api/bookings/:id/confirm`
    - `POST /api/bookings/:id/cancel`
    - `POST /api/bookings/:id/assign`
    - `PATCH /api/bookings/:id/customer`
  - booking controller now uses `req.adminEmail` from auth middleware instead of trusting ad-hoc request headers for admin actions
- Checkout / confirmation cleanup completed in this pass:
  - successful Stripe payment now redirects into `/checkout/success` with booking context instead of relying on a local transient success screen
  - `src/features/booking/pages/Confirmation.tsx` was rebuilt cleanly and now prefers the real confirmation code when available
  - `src/features/booking/pages/CheckoutSuccess.tsx` was rebuilt to align with the dedicated success route and clean visible copy
- Booking token / Stripe hardening completed in this pass:
  - `/api/stripe/create-payment-intent` now requires either admin auth or a valid booking lookup token
  - `/api/stripe/confirm-payment` now requires either admin auth or a valid booking lookup token
  - Stripe confirmation now verifies that the `paymentIntent.metadata.bookingId` matches the requested booking
  - completed Stripe payments are now synchronized more defensively in both direct confirmation and webhook paths
  - frontend checkout now sends the booking token when creating and confirming Stripe intents
- Email flow hardening completed in this pass:
  - booking received emails now support idempotent resend behavior and avoid duplicating customer/company delivery logs by default
  - company notification sends now target only recipients that still need the email instead of re-sending to everyone
  - cancellation emails now follow the same idempotent delivery behavior for both customer and company recipients
  - admin-side audit/logging now prefers `req.adminEmail` over ad-hoc request headers in the admin controller paths touched in this pass
  - admin confirm flow now behaves idempotently when a booking is already confirmed instead of rewriting the confirmation state again
  - Stripe confirmation paths now create payment audit entries when a booking transitions into `CONFIRMED`
  - admin resend-confirmation now preserves the correct email mode (`manualConfirm` vs Stripe-based confirmation) based on the booking's payment history
- Manual booking / incomplete-booking hardening completed in this pass:
  - manual booking validation now blocks contradictory quick-booking combinations such as sending both a confirmation and a payment link
  - payment-link mode now requires `OFFLINE_HOLD`
  - confirmation-email mode now requires `CONFIRMED`
  - confirmed offline/manual bookings now create a completed `MANUAL` payment record
  - admin confirm-booking now creates a completed `MANUAL` payment record when confirming an unpaid booking offline
  - Stripe payment-intent creation now fails fast for bookings with no payable balance
  - backend tests now cover manual booking validation rules and manual-payment creation behavior
- i18n cleanup already completed in this pass:
  - fixed visible copy issues in `src/i18n/translations.ts`
  - corrected broken passenger ranges (`1-5`, `6-10`)
  - cleaned route labels and key activity copy
  - cleaned the WhatsApp booking template text
  - normalized several separators and punctuation in testimonials, story, and activity descriptions
- Browser QA findings from the latest pass:
  - `/admin/login` now renders and logs in correctly after restarting the backend process cleanly
  - `useAdminAuth` previously recreated `getAuthHeaders` on every render, which kept `AdminBookings` stuck in a loading loop; this was fixed by memoizing auth helpers
  - `/admin` dashboard, bookings tab, booking detail actions, and quick-booking form now render visibly in browser
  - `/admin` bookings table now loads rows correctly in browser after the auth-hook fix
  - `/checkout` renders booking summary correctly for a real booking, but browser logs show Stripe is being initialized with an empty publishable key when `VITE_STRIPE_PUBLIC_KEY` is missing
  - `/checkout/success` and `/checkout/cancel` both render cleanly
  - admin `confirm`, `resend-confirmation`, and `cancel` actions were verified functionally by API during this pass
  - quick-booking UI is visible, but full browser submission still needs one final pass after sorting out browser/date-input automation and confirming Stripe-link UX end-to-end
- Admin final UI/UX polish pass completed (2026-05-16):
  - `Admin.tsx`: "Today Services" → "Today's Services"; service cards redesigned with colored ARR/DEP badge + monospaced time + truncated labels; Today's Services panel header improved with date subtitle and close button; Quick Booking widened to `max-w-3xl`; service type toggle refined; price field made full-width; Stripe + zero-price warning added; open service description fixed
  - `AdminBookings.tsx`: added `STATUS_LABELS` map; all status badge displays now show human-readable labels (e.g. "Pending Payment", "Hold") instead of raw enum strings; status filter options reordered by frequency and labeled consistently
  - Quick Booking "disabled" root cause documented in `AGENT_HANDOFF.md`
- Admin analytics tab copy cleanup completed in this pass:
  - `FinanzasTab.tsx`: fixed `'información'`, `'Últimos 30 días'`, `'Distribución'`, `'60 días'`, `'últimos 60 días'`
  - `MarketingTab.tsx`: fixed `'Análisis'`, `'Últimas'`, `'Conversión'`, `'Miércoles'`, `'Sábado'`, `'reservación'`, `'Geográfico'`, `'más'`, `'Día'`, `'información'`
  - `RRHHTab.tsx`: fixed `'Gestión'`, `'Vehículos'` (header, form, empty state, error messages), `'Teléfono'`, `'conexión'`
  - All fixes validated: `npm run lint` → clean, `npm run build` → ✓ built in 19s
- Admin QA + dead code cleanup pass completed (2026-05-16):
  - `Admin.tsx`: removed dead `formatOperationalTime` function (unused after ARR/DEP card redesign), removed unused `DollarSign` import, removed unused `useLanguage` import + `const { t }` destructure from Admin shell
  - `PricingManager.tsx`: reviewed, clean — no changes needed
  - All other admin files reviewed and confirmed clean
  - `npm run lint` → clean, `npm run build` → ✓ 15.95s
- Vercel-only final readiness pass completed (2026-05-16):
  - root `package.json` now runs `npm --workspace backend run db:generate` on `postinstall`, so Prisma client generation is explicit from the repo root for Vercel installs
  - root `.env.example` now points `VITE_API_BASE_URL` at the Vercel app domain instead of a separate backend host
  - `DEPLOY.md` and `README.md` were aligned to a Vercel-only deployment path
  - verified again: `npm run lint`, `npm run build`, `npm run test`, `cd backend && npm run build`, and `cd backend && npm run test` all pass
  - `npx vercel build` still requires real Vercel project settings (`vercel pull --yes --environment preview`) before it can run locally; this is now a staging/deploy step, not a code-fix blocker
  - remaining non-blocking note: frontend build still warns about a large vendor chunk and manual chunk circularity; treat this as performance debt, not a deploy blocker
- This file should be updated as tasks are completed.
- Prefer checking boxes only after validation, not just after code changes.
