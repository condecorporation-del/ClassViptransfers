# Class VIP Transfers - Agent Handoff

## Working Repo

All current work is in:

`C:\Users\conde\Documents\classvip-live-correct2`

GitHub repo for this new isolated project:

`https://github.com/condecorporation-del/ClassViptransfers.git`

This is the correct repo/version we have been cleaning and improving.

Local app:

`http://127.0.0.1:5174/`

## Current Goal

We are **not** touching production.

This is now an **isolated project** with:

- its own GitHub repo
- its own Supabase database
- the same business structure/data model as the original system
- freedom to improve without risking `classviptransfers.com`

We cleaned and hardened the existing codebase so it becomes:

- cleaner
- more professional
- easier to maintain
- safer to improve
- ready for future UI/UX and platform work

Main constraints:

- keep current branding
- do not break booking
- do not break Stripe flow
- remove legacy/dead code
- leave the repo organized and professional

## What Has Been Done

### 1. Frontend cleanup

- Removed dead pages/components/assets that were no longer used
- Removed old PayPal references from active frontend flow/texts
- Cleaned translations and stale UI references
- Removed junk files and leftover placeholder/demo files

### 2. Frontend performance

- Added route lazy loading
- Split the large frontend bundle into healthier chunks
- Reduced main chunk from about `~532 kB` to about `~336 kB`
- Optimized the main logo usage

### 3. Frontend structure reorganization

Frontend was reorganized by domain.

Current `src/` shape:

- `src/features/admin`
- `src/features/booking`
- `src/features/marketing`
- `src/shared`
- `src/assets`
- `src/i18n`
- `src/test`

Shared code was consolidated into:

- `src/shared/components`
- `src/shared/ui`
- `src/shared/lib`
- `src/shared/hooks`
- `src/shared/pages`
- `src/shared/providers`

### 4. Repo hygiene

- Removed many unused UI primitives/components
- Removed old assets and duplicate local files that were not referenced
- Removed old docs/noisy files that were not useful
- Added a real `README.md`
- Updated `.env.example`
- Added `backend/.env.example`
- Replaced placeholder test with a real test

### 5. Quality checks on frontend/root

These were already passing after cleanup/reorg:

- `npm run lint`
- `npm run build`
- `npm run test`

### 6. New isolated infrastructure

- New GitHub repo created and pushed:
  - `https://github.com/condecorporation-del/ClassViptransfers.git`
- New Supabase database connected successfully
- Backend `.env` updated to point to the new Supabase project
- Prisma schema pushed successfully with:
  - `npm run db:push`
- Seed executed successfully with:
  - `npm run db:seed`
- Database connection verified with:
  - `npm run db:test`

## Backend Reorganization

Backend was reorganized by domain as well.

Current `backend/src/` shape:

- `features/admin`
- `features/ai`
- `features/auth`
- `features/booking`
- `features/pricing`
- `shared`
- `server.ts`

Shared backend code now lives in:

- `backend/src/shared/lib`
- `backend/src/shared/middleware`
- `backend/src/shared/types`
- `backend/src/shared/test`

## Backend Cleanup Already Done

- Removed active PayPal backend runtime files/routes
- Updated imports after backend reorg
- Fixed test setup so backend tests do not explode when `DATABASE_URL` is missing
- Audit logging typing was improved
- Booking/admin preview typing was cleaned up
- Booking service typing was improved
- Email service typing was made more honest and less coupled to full Prisma objects

## Important TypeScript Progress

We specifically worked on backend TypeScript cleanup **by domain**, starting with:

- `booking`
- `admin`

Those areas were cleaned enough that they no longer show up as the current blocking TypeScript build errors.

## Current Status

### Frontend / root

Passing:

- `npm run lint`
- `npm run build`
- `npm run test`

### Backend

Passing:

- `cd backend && npm run build`
- `cd backend && npm run db:test`
- `cd backend && npm run db:seed`
- `cd backend && npm run test`

Backend dev server is currently expected at:

- `http://127.0.0.1:3001`

Pricing endpoints verified against the new Supabase DB:

- `/api/pricing/zones`
- `/api/pricing/areas`
- `/api/pricing/extras`
- `/api/pricing/hotels`
- `/api/hotels`

## Booking / Admin Verification

### Booking API

A real test booking was created successfully against the new database.

Observed result:

- booking created in `DRAFT`
- confirmation code generated: `CLASS2026001`
- transport pricing calculated correctly
- booking appears in admin bookings list

Test booking example created:

- customer: `test.booking@example.com`
- route: `SJD -> Cabo San Lucas`
- hotel/dropoff: `Riu Palace Cabo San Lucas`
- total: `12760` cents

### Stripe

Stripe payment intent creation was verified successfully for the test booking using:

- `/api/stripe/create-payment-intent`

This returned a valid `clientSecret`.

### Admin auth

Admin login was verified successfully via API:

- endpoint: `/api/admin/auth/login`
- seeded admin email: `condecorporation@gmail.com`
- seeded password from seed file: `1234`

Admin-protected endpoints were also verified:

- `/api/admin/bookings`
- `/api/admin/stats`

### Browser/UI notes

- Homepage still loads
- Booking UI still loads
- Admin login page still loads
- Browser automation in the Codex in-app browser is a bit flaky on `input[type=email]` fields, so API verification was more reliable than UI automation for login submission

## Hotels / Catalog Status

The new isolated database no longer has just the small starter catalog.

What was done:

- audited `backend/prisma/seed.ts` vs `backend/data/hotels-enriched.json`
- updated `backend/scripts/import-hotels.ts` to be safer and more maintainable
- imported the enriched hotel catalog into the new Supabase database
- verified the public hotel endpoints after import

Current verified hotel counts in the new database:

- total active hotels: `252`
- `Cabo Pacific Area`: `12`
- `Cabo San Lucas`: `87`
- `Pacific & East Cape`: `36`
- `Port Los Cabos`: `14`
- `San Jose del Cabo`: `51`
- `Tourist Corridor`: `52`

Import summary observed:

- source records: `181`
- inserted new: `166`
- already present / reactivated: `15`

Public endpoint verification after import:

- `/api/pricing/hotels` returns `252` active hotels
- `/api/hotels` returns `252` hotels with slugs

Important remaining gap:

- we still have **not** compared this catalog against the old production database directly
- if the owner wants a perfect 1:1 carryover, the next step is exporting the old `Hotel` table and diffing it against the new `252`-hotel catalog

## Remaining Work / Next Best Steps

1. Verify the booking flow visually from the frontend UI all the way into checkout now that the new Supabase DB is live
2. Review admin dashboard UI after successful login and confirm booking rows/stats render correctly in-browser
3. Start actual product improvements without risk to production:
   - booking UX
   - admin UX
   - visual polish
   - Vercel deployment setup

## Latest Changes In This Pass

These changes are local and validated with build/lint:

- Fixed the booking wizard so a successful booking creation now redirects to checkout instead of stopping after the API call
  - file: `C:\Users\conde\Documents\classvip-live-correct2\src\features\booking\pages\Book.tsx`
- Removed duplicate mobile navigation controls in the booking wizard by making the inline nav desktop-only
  - file: `C:\Users\conde\Documents\classvip-live-correct2\src\features\booking\pages\Book.tsx`
- Hardened admin auth so network failures in development no longer auto-authenticate users
  - file: `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\hooks\useAdminAuth.ts`
- Rebuilt the footer to be cleaner and more production-like:
  - removed the exposed admin footer link
  - removed the visible build/context debug badge
  - cleaned footer/legal copy and location copy
  - file: `C:\Users\conde\Documents\classvip-live-correct2\src\features\marketing\components\Footer.tsx`
- Cleaned a visible slice of `translations.ts`:
  - restored several broken accented strings
  - restored the `1–5` / `6–10` passenger ranges
  - normalized several activity labels and review strings
  - file: `C:\Users\conde\Documents\classvip-live-correct2\src\i18n\translations.ts`
- Reworked checkout UX in:
  - `C:\Users\conde\Documents\classvip-live-correct2\src\features\booking\pages\Checkout.tsx`
  - added stronger loading state
  - added stronger error state with retry/back-to-booking
  - cleaned success state copy
  - added better payment/support framing
  - localized visible checkout copy more cleanly
- Reworked admin session handling and route protection:
  - centralized token storage helpers in:
    - `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\lib\adminSession.ts`
  - updated `AdminRoute` to use `Navigate` with redirect state instead of effect-based redirecting
  - rebuilt `AdminLogin.tsx` so it:
    - clears stale tokens when `/api/admin/auth/me` fails
    - redirects back to the protected destination after successful login
    - uses the shared token helpers instead of direct `localStorage` access
    - fixes visible admin login copy/placeholder mojibake
- Added a reusable text normalization helper in:
  - `C:\Users\conde\Documents\classvip-live-correct2\src\shared\lib\text.ts`
- Made hotel search more forgiving in booking/admin:
  - accent-insensitive hotel matching in `Book.tsx`
  - accent-insensitive hotel/zone matching in `PricingManager.tsx`
- Hardened admin session behavior in:
  - `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\hooks\useAdminAuth.ts`
  - frontend now fails closed if `/api/admin/auth/me` fails
  - stale local tokens are cleared instead of being trusted on backend/network failure
- Reduced auth controller noise in:
  - `C:\Users\conde\Documents\classvip-live-correct2\backend\src\features\auth\controllers\auth.controller.ts`
  - removed chatty step-by-step login debug logs that did not belong in normal production flow
- Split Express app setup from server startup:
  - `C:\Users\conde\Documents\classvip-live-correct2\backend\src\app.ts`
  - `C:\Users\conde\Documents\classvip-live-correct2\backend\src\server.ts`
  - this is an intentional prep step for a later Vercel/serverless adapter
- Added the first Vercel backend adapter pieces:
  - `C:\Users\conde\Documents\classvip-live-correct2\api\[...path].ts` now exports the Express app for serverless routing
  - `C:\Users\conde\Documents\classvip-live-correct2\vercel.json` now prioritizes filesystem routes before the SPA fallback so `/api/*` is preserved
  - `backend/src/app.ts` now serves both `/health` and `/api/health`
- Hardened booking security boundaries:
  - `backend/src/features/booking/routes/bookings.routes.ts` now requires admin auth for sensitive mutation routes (`confirm`, `cancel`, `assign`, `customer`)
  - `backend/src/features/booking/controllers/booking.controller.ts` now uses `req.adminEmail` from middleware instead of trusting ad-hoc request headers for admin-side booking mutations
- Checkout flow cleanup completed:
  - `src/features/booking/pages/Checkout.tsx` no longer relies on an in-memory paid state after Stripe success
  - successful payment now redirects to `/checkout/success?bookingId=...&bt=...` so the success state is recoverable on refresh/navigation
  - `src/features/booking/pages/Confirmation.tsx` was rebuilt cleanly and now prefers the real `confirmationCode` when available, while also handling `totalAmount` fallback
  - `src/features/booking/pages/CheckoutSuccess.tsx` was rebuilt cleanly so the dedicated success screen matches the new redirect flow and no longer shows broken visible copy
- Hardened booking lookup and Stripe access:
  - `backend/src/features/booking/controllers/booking.controller.ts` now exports `verifyBookingToken`
  - `backend/src/features/booking/routes/stripe.routes.ts` now requires either admin auth or a valid booking lookup token for:
    - `POST /api/stripe/create-payment-intent`
    - `POST /api/stripe/confirm-payment`
  - Stripe confirmation now verifies that the payment intent metadata belongs to the requested booking
  - completed Stripe payments are now synchronized defensively in both direct confirm and webhook flows
  - `src/features/booking/pages/Checkout.tsx` now sends the booking token in both create-intent and confirm-payment calls
- Hardened email delivery behavior:
  - `backend/src/features/booking/services/email.service.ts` now avoids duplicate customer/company logs and duplicate deliveries for:
    - booking received emails
    - company notifications
    - cancellation emails
  - company notification sends now target only the recipients who still need the email instead of re-sending to all recipients on partial resend scenarios
  - cancellation flow now supports the same idempotent resend behavior pattern as confirmation flow
  - `backend/src/features/admin/controllers/admin.controller.ts` now prefers `req.adminEmail` instead of ad-hoc `x-user-email` headers in the admin paths touched during this pass
- Hardened confirmation/audit behavior:
  - `backend/src/features/booking/services/booking.service.ts` now returns early when an admin tries to confirm an already confirmed booking instead of rewriting the status and timestamps again
  - `backend/src/features/booking/routes/stripe.routes.ts` now writes audit entries when Stripe confirmation or Stripe webhook transitions a booking into `CONFIRMED`
  - `backend/src/features/admin/controllers/admin.controller.ts` now preserves the correct confirmation-email mode when an admin resends a confirmation (offline/manual vs Stripe-paid)
- Rebuilt the hotel import script in:
  - `C:\Users\conde\Documents\classvip-live-correct2\backend\scripts\import-hotels.ts`
  - added normalization
  - added safer dedupe behavior
  - added clearer import summary
  - validated by import + endpoint verification

## Validation After Latest Changes

Passing:

- `npm run lint`
- `npm run build`
- `cd backend && npm run build`

## Circular Dependency Fix — Backend (2026-05-15)

### Bug fixed (CRITICAL — server would not start)

`email.service.ts` imported `generateBookingToken` from `booking.controller.ts`, and `booking.controller.ts` imported `EmailService` from `email.service.ts`. Node.js circular dependency: when `booking.controller.ts` executed `new EmailService()` at module-load time, `EmailService` was undefined because `email.service.ts` hadn't finished loading.

**Fix:**
- Created `backend/src/shared/lib/booking-token.ts` with `generateBookingToken` and `verifyBookingToken`
- Updated `booking.controller.ts` to import from the shared lib (re-exports for any existing callers)
- Updated `email.service.ts` to import from the shared lib (1-line change, logic unchanged)
- Backend now starts cleanly: `Server running on http://localhost:3001`

### Build status
- `cd backend && npm run build` ✅ (TypeScript compile clean)
- Backend starts without error ✅

### Files touched
- `backend/src/shared/lib/booking-token.ts` (new)
- `backend/src/features/booking/controllers/booking.controller.ts` (import refactor)
- `backend/src/features/booking/services/email.service.ts` (import path change only)

---

## Pricing / Data / Env Review Pass (2026-05-14)

### What was reviewed and fixed

**`backend/src/features/pricing/controllers/pricing.controller.ts`**

- **Bug fix (audit log consistency):** `createRule`, `updateRule`, `deleteRule`, `createExtra`, `updateExtra`, `deleteExtra` were reading admin identity from ad-hoc request headers (`x-user-id`, `x-user-email`) instead of `req.adminEmail` (which is set by `requireAdminAuth` middleware and is the authoritative value). Fixed all 6 to use `req.adminEmail`. This matches the pattern already used in the area and hotel CRUD methods.
- **Bug fix (extra CRUD missing fields):** `createExtra` and `updateExtra` were not accepting `included` or `labelEs` from the request body, making it impossible for the admin UI to set the "included" flag or Spanish label for extras. Both fields added to the body destructuring and passed through to the service.

**`backend/prisma/seed.ts`**

- **Bug fix (Sprinter prices not seeded):** `DEFAULT_AREAS` was only seeding `oneWayPriceCents` and `roundTripPriceCents` from the `SUV` prices. The `SPRINTER` prices defined in `PRICES_ONE_WAY` were ignored. This meant all 6+ passenger bookings fell back to SUV pricing since `sprinterOneWayPriceCents` was 0. Fixed: `sprinterOneWayPriceCents` and `sprinterRoundTripPriceCents` now use the `PRICES_ONE_WAY[zone].SPRINTER` values with the same 1.8× round-trip multiplier.
- **Action required:** Run `cd backend && npm run db:seed` to apply Sprinter prices to the Supabase database. Or update manually via the admin Pricing → Areas tab.

**`backend/.env.example`** (new file)

- Created a complete production env var reference with comments explaining each variable, how to generate secrets, and which vars are required vs optional.
- Key production checklist from this file:
  - `BOOKING_LOOKUP_SECRET` and `JWT_SECRET` MUST be set — empty values silently fall back to `'change-me-in-production'` which is insecure
  - Either `GMAIL_USER` + `GMAIL_APP_PASSWORD` OR `RESEND_API_KEY` must be configured
  - `COMPANY_BOOKINGS_EMAIL` must be set for company notification copies
  - `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` must be production keys
  - `ALLOWED_ORIGINS` must include the production frontend URL

### What was reviewed (no code changes needed)

- **Zones data quality:** 6 zones defined in seed (`San Jose del Cabo`, `Port Los Cabos`, `Tourist Corridor`, `Cabo San Lucas`, `Cabo Pacific Area`, `Pacific & East Cape`). These match the Area records and hotel zones in the DB. Zone names are consistent between Areas and Hotels tables. No cleanup needed.
- **Extras data quality:** 15 extras seeded — 1 included (Basic Kit), 14 paid. Codes, labels, labelEs, pricing modes, and maxQty all look correct. `MEET_GREET` is in the enum but intentionally excluded from the public extras endpoint. `LUXURY_WELCOME` has a special upsert guard for legacy DB compatibility. Clean.
- **Pricing manager (PricingManager.tsx):** Full CRUD for Areas, Pricing Rules, Extras, Hotels — all 4 tabs. All mutations send `getAuthHeaders()`. All destructuring on the Areas form correctly handles SUV + Sprinter one-way and round-trip prices. Clean, functional.
- **Quick reservation flow:** `QuickBookingTab` in `Admin.tsx` — 3 service types (One Way, Round Trip, Open Service), 3 payment modes (Stripe link, Cash/confirm, Save only). Validation guards all required fields. Payload correctly maps to `/api/admin/bookings/manual`. Result banner shows email send status. Clean, no issues found.
- **CORS configuration:** `backend/src/app.ts` — `ALLOWED_ORIGINS` env var drives the allowed list. Hardcoded production origins include `classviptransfers.com`. All `*.vercel.app` origins are allowed. Dev origins hard-coded for local. Production: set `ALLOWED_ORIGINS` to include your deployed frontend URL.
- **Empty `.env` secrets:** `JWT_SECRET`, `BOOKING_LOOKUP_SECRET`, `BOOKING_PDF_SECRET` are empty locally — safe for dev (falls back to `'change-me-in-production'` / `'dev-only-pdf-secret'`). Must be set before production deploy.

### Build status
- `npm run lint` ✅
- `npm run build` (frontend) ✅
- `cd backend && npm run build` ✅

### Files touched
- `backend/src/features/pricing/controllers/pricing.controller.ts`
- `backend/prisma/seed.ts`
- `backend/.env.example` (new)
- `TASK.md`
- `AGENT_HANDOFF.md`

### Pending for next pass
- Run `cd backend && npm run db:seed` to apply Sprinter prices to Supabase (if needed)
- Visual QA in browser (Section 1 still all `[ ]`)
- Vercel deployment: configure project settings, Stripe envs, webhook target
- Review exports/reporting (Section 6 last item)

---

## Book.tsx Validation Pass (2026-05-14)

### What was changed

**`src/features/booking/pages/Book.tsx`**

- **Step 0 inline validation:** Added `step0Attempted` state and `handleNext()` guard on the Next button. Clicking Next from step 0 with missing fields now blocks navigation and shows inline error messages.
  - Required fields: Full name, Email, Phone, Trip type (one-way / round-trip), Transfer direction (Airport→Hotel / Hotel→Airport)
  - Each empty required contact input gets a red border + red icon tint + `"This field is required"` message below
  - Trip type and transfer direction show an error message below the card grid if not selected
  - All validation is `step0Attempted`-gated (no errors shown until user first tries to advance)
  - Uses `AlertCircle` (already imported) for error icons — no new dependencies added
- Both Next buttons (desktop sidebar + mobile sticky bar) now call `handleNext` instead of `next` directly

### Build status
- `npm run lint` ✅
- `npm run build` ✅ (Book.js 74.24 kB, same chunk structure as before)

### Files touched
- `src/features/booking/pages/Book.tsx`
- `TASK.md` (`Improve validation clarity by step` → `[x]`)
- `AGENT_HANDOFF.md`

### Pending for next pass
- Visual QA in browser: run `npm run dev` + `cd backend && npm run dev`, open `/book`, walk full flow to `/checkout`, then `/admin/login` → `/admin`
- Spacing/rhythm polish on `/book` still has room for improvement (needs browser view)
- Functional QA items in TASK.md Section 1 are all still `[ ]`

---

## Book.tsx Polish Pass (2026-05-14)

### What was changed

**`src/features/booking/pages/Book.tsx`**

- **Bug fix (critical mobile):** On the review step (step 4/4), the mobile bottom nav bar was hidden entirely — there was no way to go Back on mobile. Added a Back link at the top of the review step content (`lg:hidden`).
- **Price formatting:** `${total} USD` showed unformatted floats (e.g. `$127.5 USD`) in three places: the review total, the pay button amount, and the mobile summary bar. Changed to `$${Math.round(total)} USD` in all three.
- **Contact input icons:** `User`, `Mail`, `PhoneIcon` were imported but unused in the contact section. Added them as left-side prefix icons to Name, Email, and Phone inputs for visual clarity. Updated `px-4` to `pl-10 pr-4` on those inputs.
- **Review Edit button guard:** The "Edit" button in the "Your transfer" review card always showed even when no trip data was set. Now only renders when `tripType`, `route`, or `selectedHotel` has a value.
- **Mobile stepper hint:** Added next-step hint to mobile progress bar (`→ Extras`, `→ Review`) so users know what's coming. Reduced bar height from `h-2` to `h-1.5` for a cleaner look.

### Visual QA status
Browser QA (`/book`, `/checkout`, `/admin/login`, `/admin`) was **not completed** this pass — requires dev server + browser session. All code changes were validated via lint + build only.

### Files touched
- `src/features/booking/pages/Book.tsx`
- `TASK.md`
- `AGENT_HANDOFF.md`

### Pending for next pass
- Visual QA in browser: run `npm run dev` + `cd backend && npm run dev`, open `/book`, walk full flow to `/checkout`, then `/admin/login` → `/admin`
- `Book.tsx` spacing/rhythm polish — still has room for improvement in step transitions and mobile spacing, but needs browser review to judge correctly
- Step 0 → Step 1 validation: implemented in the Book.tsx Validation Pass above (`step0Attempted` + `handleNext` guard + inline errors). ✅
- Functional QA items in TASK.md Section 1 are all still `[ ]`

## Audit / Status Pass (2026-05-14)

No code changes this pass. Builds verified and two items reviewed:

- **Email service** (`backend/src/features/booking/services/email.service.ts`): solid. Dual-provider (Gmail SMTP primary, Resend fallback), idempotent per recipient, full DB logging, company copy isolated so customer email is never blocked by company failures. No code issues found. Needs env vars for production.
- **Audit logging** (`backend/src/shared/lib/audit.ts`): correct. Fire-and-forget, swallows its own errors so auditing never blocks the main operation.
- **`api/[...path].ts`**: confirmed exists and correctly re-exports the Express app. Vercel deployment risk documented in notes above.
- TASK.md updated: marked `Review logging and audit behavior` → `[x]`, added Vercel architecture risk note to Section 7.

## Important Notes For The Next Agent

- `src/i18n/translations.ts` is now fully clean — no more mojibake, double spaces, or broken accents. Do not run aggressive text cleanup on it again.
- Admin UI is now visually consistent across all three panels (Dashboard, Bookings, Pricing). Uses `rounded-2xl`, gold pill tabs, proper loading spinners, and empty states.
- `Book.tsx` UX polish is still pending — review in browser first before editing, as it is the most complex file.
- Next priority: visual QA in browser for `/book`, `/checkout`, and `/admin`.
- **Vercel deployment risk**: `api/[...path].ts` imports TypeScript directly from `backend/src/app`, so staging validation is still required for Prisma behavior, cookies, and Stripe webhook reliability on Vercel Functions.
- **Email env vars for production**: must set either `GMAIL_USER` + `GMAIL_APP_PASSWORD` (preferred) or `RESEND_API_KEY`, plus `COMPANY_BOOKINGS_EMAIL` for company notification copies.
- **Deploy docs**:
  - `DEPLOY.md` now documents the Vercel-only production shape:
    - frontend on Vercel
    - backend API + webhook on Vercel
  - it also includes env expectations, smoke-test checklist, and cookie/auth notes for Vercel HTTPS deployment
- **Manual booking hardening**:
  - `backend/src/shared/lib/validation.ts` now blocks invalid quick-booking combinations such as sending both confirmation and payment link, or sending a payment link for a confirmed booking
  - `backend/src/features/booking/services/booking.service.ts` now creates a completed `MANUAL` payment record when an admin creates a confirmed offline booking
  - `backend/src/features/booking/services/booking.service.ts` now also creates a completed `MANUAL` payment record when an admin confirms an existing unpaid booking offline
  - `backend/src/features/booking/routes/stripe.routes.ts` now rejects payment-intent creation for bookings with no payable balance
  - backend test coverage now includes:
    - `backend/src/shared/test/manual-booking-validation.test.ts`
    - updated `backend/src/shared/test/booking.test.ts`
  - these tests now pass and cover booking creation, confirm/cancel, CSV export, and manual-payment creation
  - TASK status should now be treated as partial progress for:
    - `Review manual booking flow for admin`
    - `Review edge cases for broken/incomplete bookings`
  - remaining work is mostly browser-level QA plus confirming that the quick-booking UX communicates gross-vs-net pricing clearly enough for admins

## Latest Changes In This Pass (i18n + Admin Polish)

### What was done

**i18n — `src/i18n/translations.ts`**
- Removed trailing spaces from `activity.camelKids`
- Removed variation selector characters (`️`) embedded in `activity.atv`, `activity.doubleMoto`, `activity.rzr`
- Fixed missing accent: `Cancelacion` → `Cancelación` in `whyChoose.4.desc` (ES)
- Fixed month range format: `NovApr` → `Nov–Apr`, `NovAbr` → `Nov–Abr` in `activity.camel.desc`
- Replaced double spaces with em dashes (`—`) in: `home.story.text` (ES), `testimonial.5.text` (ES), `activity.skyBikes.desc` (EN+ES), `activities.yatesMasajes` (EN+ES)

**Admin — `src/features/admin/components/AdminBookings.tsx`**
- Loading states: replaced plain text with `Loader2` spinner + label
- Empty state: `CalendarX` icon + contextual message
- Detail loading/error: proper styled cards instead of raw text
- Desktop table: uppercase tracking headers, `hover:bg-gold/5`, `rounded-full` status badges, gold chevron on hover
- Mobile cards: cleaner padding, time in mono pill, hover gold border
- Detail view: all `glass-card rounded-xl` → `rounded-2xl border bg-card shadow-sm`; customer card with better type hierarchy; action buttons `rounded-xl` with transitions
- Edit/Assign forms: consistent container style with gold border

**Admin — `src/features/admin/components/PricingManager.tsx`**
- Tab nav: replaced underline tabs with pill nav matching AdminBookings period style (`bg-gold text-navy`)
- Loading state: spinner + label
- Areas table: `rounded-2xl`, uppercase headers, `rounded-full` status badges, hover rows, cleaner action buttons
- Rules table: same improvements; `–` separators instead of `-`
- Extras table: same improvements; lowercase/capitalize display
- Hotels by zone: `rounded-2xl` cards, better price info line, active count, consistent action buttons
- All four forms (HotelForm, AreaForm, RuleForm, ExtraForm): `rounded-2xl border-gold/30 shadow-sm` containers with typed headers

### Files touched in this pass

- `src/i18n/translations.ts`
- `src/features/admin/components/AdminBookings.tsx`
- `src/features/admin/components/PricingManager.tsx`
- `TASK.md`
- `AGENT_HANDOFF.md`

### Pending

- `src/features/booking/pages/Book.tsx` — UX polish not done; needs browser review first
- Visual QA: `/book` → `/checkout` flow, admin login + dashboard in browser
- Backend, Stripe, auth — untouched and out of scope for this pass

## Files Most Recently Touched

### Frontend/root

- `C:\Users\conde\Documents\classvip-live-correct2\src\i18n\translations.ts`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\AdminBookings.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\PricingManager.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\pages\AdminLogin.tsx` (previous pass)
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\lib\adminSession.ts` (previous pass)
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\booking\pages\Book.tsx` (previous pass)
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\marketing\components\Footer.tsx` (previous pass)
- `C:\Users\conde\Documents\classvip-live-correct2\src\shared\lib\text.ts` (previous pass)

### Backend

- `C:\Users\conde\Documents\classvip-live-correct2\backend\src\server.ts`
- `C:\Users\conde\Documents\classvip-live-correct2\backend\src\app.ts`
- `C:\Users\conde\Documents\classvip-live-correct2\backend\src\features\booking\services\booking.service.ts`
- `C:\Users\conde\Documents\classvip-live-correct2\backend\src\features\booking\services\email.service.ts`
- `C:\Users\conde\Documents\classvip-live-correct2\backend\src\features\auth\controllers\auth.controller.ts`
- `C:\Users\conde\Documents\classvip-live-correct2\backend\src\features\booking\routes\preview.routes.ts`
- `C:\Users\conde\Documents\classvip-live-correct2\backend\src\features\admin\controllers\admin.controller.ts`
- `C:\Users\conde\Documents\classvip-live-correct2\backend\src\shared\lib\audit.ts`
- `C:\Users\conde\Documents\classvip-live-correct2\backend\prisma\seed.ts`
- `C:\Users\conde\Documents\classvip-live-correct2\backend\scripts\test-connection.ts`
- `C:\Users\conde\Documents\classvip-live-correct2\backend\scripts\import-hotels.ts`
- `C:\Users\conde\Documents\classvip-live-correct2\backend\scripts\setup-with-env.ts`
- `C:\Users\conde\Documents\classvip-live-correct2\backend\scripts\auto-setup-supabase.ts`
- `C:\Users\conde\Documents\classvip-live-correct2\backend\tsconfig.json`
- `C:\Users\conde\Documents\classvip-live-correct2\backend\vitest.config.ts`

---

## Admin Dashboard Expansion Pass (2026-05-14)

### What was done

Installed `recharts@3.8.1` and built three new tab components for the admin panel, then wired them into `Admin.tsx` with a fully restructured sidebar (grouped nav + mobile fix).

**New components created:**

- `src/features/admin/components/FinanzasTab.tsx` — Finance dashboard:
  - KPI cards: Ingresos Hoy, Ingresos del Mes, Cuentas por Cobrar (total of PENDING_PAYMENT + OFFLINE_HOLD bookings), Tasa de Cobro %
  - `AreaChart` (gold gradient): 30-day revenue trend, aggregated client-side from booking data
  - `PieChart` donut: booking status breakdown (CONFIRMED/green, PENDING_PAYMENT/amber, OFFLINE_HOLD/blue, CANCELLED/gray)
  - Table: Cuentas por Cobrar sorted oldest first, red text when pending >7 days
  - Staggered framer-motion entry animations, no emojis

- `src/features/admin/components/MarketingTab.tsx` — Marketing analytics:
  - KPI cards: Reservaciones Mes, Reservaciones Hoy, Tasa de Conversión, Valor Promedio
  - `BarChart`: 30-day bookings per day (gold bars)
  - Horizontal `BarChart` layout="vertical": bookings by zone
  - Grouped `BarChart`: Confirmadas vs Pendientes by last 3 months
  - Insights row: top day of week, top zone, peak hour

- `src/features/admin/components/RRHHTab.tsx` — Drivers & Vehicles:
  - Two columns: DriversColumn + VehiclesColumn
  - AnimatePresence slide-in forms for adding drivers/vehicles
  - POSTs to `/api/admin/drivers` and `/api/admin/vehicles`
  - Staggered list row animations

**`src/features/admin/pages/Admin.tsx` — Updated:**

- Added imports: `BarChart2, Megaphone, Users, Settings` from lucide-react
- Added component imports: `FinanzasTab`, `MarketingTab`, `RRHHTab`
- Updated `Tab` type to include `'finanzas' | 'marketing' | 'rrhh'`
- `sidebarItems` now has `group` property — three groups: `OPERACIONES`, `ANALYTICS`, `EQUIPO`
- Desktop sidebar nav now renders group headers with items grouped under each
- Content rendering section now includes the three new tab renders
- Mobile bottom nav now shows 5 fixed tabs (dashboard, bookings, new-booking, finanzas, rrhh) + More button — previously tried to show all 7 which was too wide

### Build status
- `npm run build` ✅ (clean, no TypeScript errors)

### Files touched
- `src/features/admin/components/FinanzasTab.tsx` (new)
- `src/features/admin/components/MarketingTab.tsx` (new)
- `src/features/admin/components/RRHHTab.tsx` (new)
- `src/features/admin/pages/Admin.tsx` (sidebar groups, content renders, mobile nav)
- `package.json` / `package-lock.json` (recharts added)
- `AGENT_HANDOFF.md`

### Pending
- Visual QA in browser: open `/admin` → verify all 7 tabs render correctly (charts animate, data loads)
- Run `cd backend && npm run db:seed` if Sprinter prices haven't been applied yet
- Vercel deployment setup (Section 7 in TASK.md)
- Section 8 (Final Production Readiness) — after deploy

---

## Frontend Polish Pass 2 (2026-05-15)

### What was done

**`src/features/booking/pages/CheckoutSuccess.tsx`**

- Added `STATUS_LABELS` map for human-friendly status display (CONFIRMED → "Confirmed" / "Confirmado", etc.)
- Fixed ES accent: `confirmacion` → `confirmación` in loading spinner text
- Fixed ES accents in success body: `recibiras` → `recibirás`, `confirmacion` → `confirmación`
- Replaced ugly raw UUID display with cleaner "Reference" row: shows `confirmationCode` when available, falls back to `#<shortId>` (8 chars). Removed redundant separate Confirmation row.
- Status now maps to human-friendly label in correct language, shown in emerald green (success context)

**`src/features/booking/pages/Confirmation.tsx`**

- Added `STATUS_LABELS` map (same structure as CheckoutSuccess)
- Fixed ES accent in error state: `mas informacion` → `más información`
- Fixed wrong Pickup label in ES: `lang === 'es' ? 'Pickup' : 'Pickup'` → `lang === 'es' ? 'Recogida' : 'Pickup'`
- Map raw `status` enum to human-friendly label in review card
- Fixed ES accents in empty-booking state: `Recibiras` → `Recibirás`, `confirmacion` → `confirmación`

### Build status

- `npm run lint` ✅ (clean)
- `npm run build` ✅ (clean, same chunk structure)

### Files touched

- `src/features/booking/pages/CheckoutSuccess.tsx`
- `src/features/booking/pages/Confirmation.tsx`
- `TASK.md`
- `AGENT_HANDOFF.md`

### Pending for next pass

- Visual QA in browser: all Section 1 items in TASK.md are still `[ ]` — highest priority
- Book.tsx spacing/rhythm polish (marked `[~]`) — needs browser review
- Vercel deployment (Section 7 TASK.md)

---

## Frontend Polish Pass (2026-05-15)

### What was done

**`src/features/admin/pages/Admin.tsx`**

- Fixed missing accent: `'Configuracion'` → `'Configuración'` in sidebar label and desktop nav group render
- Fixed missing accent: `'Mas'` → `'Más'` in mobile bottom nav "More" button label
- Fixed copy: `"Tap to view today services"` → `"Tap to view today's services"` in dashboard Bookings Today card

**`src/features/booking/pages/Book.tsx`**

- Fixed price formatting inconsistency in the desktop sticky sidebar summary:
  - `$${transferPrice}` → `$${Math.round(transferPrice)}` — was showing float like `$90.5`
  - `$${activitiesPrice}` → `$${Math.round(activitiesPrice)}` — defensive, always int but consistent
  - `$${total}` → `$${Math.round(total)}` — was showing float totals
  - Review step already showed `Math.round`, now sidebar is consistent

### Build status

- `npm run lint` ✅ (clean, no errors)
- `npm run build` ✅ (clean, same chunk structure)

### Files touched

- `src/features/admin/pages/Admin.tsx`
- `src/features/booking/pages/Book.tsx`
- `TASK.md`
- `AGENT_HANDOFF.md`

### Pending for next pass

- **Visual QA in browser**: All Section 1 items in TASK.md are still `[ ]` — requires `npm run dev` + `cd backend && npm run dev` + opening browser. This remains the highest-value remaining task.
- Spacing/rhythm polish in booking flow (still `[~]`) — needs browser review to judge which areas actually feel rough vs fine
- Vercel deployment: Section 7 in TASK.md (configure project settings, Stripe envs, webhook)
- Run `cd backend && npm run db:seed` if Sprinter prices haven't been applied yet

---

## Browser QA Pass (2026-05-16)

### What was done

- Restarted the backend cleanly after finding a stale process that answered `/health` but left DB-backed routes hanging.
- Verified browser routes and states:
  - `/admin/login` now renders correctly
  - `/admin` dashboard renders after successful login
  - `/admin` bookings tab renders rows correctly
  - `/admin` booking detail view exposes `Cancel`, `Assign Driver`, and `Resend`
  - `/admin` quick-booking form renders correctly
  - `/checkout` renders booking summary correctly for a real booking
  - `/checkout/success` renders cleanly
  - `/checkout/cancel` renders cleanly
- Verified admin actions by API during the same pass:
  - `confirm`
  - `resend-confirmation`
  - `cancel`

### Bug fixed in this pass

**`src/features/admin/hooks/useAdminAuth.ts`**

- `checkAuth`, `logout`, and `getAuthHeaders` are now wrapped in `useCallback`
- this fixed a real browser bug where `AdminBookings` stayed forever on `Loading bookings…`
- root cause: unstable `getAuthHeaders` changed `fetchBookings`, which retriggered the effect every render and kept resetting loading state

### New env helper

- Added frontend env template:
  - `C:\Users\conde\Documents\classvip-live-correct2\.env.example`
- Includes:
  - `VITE_STRIPE_PUBLIC_KEY`
  - `VITE_API_BASE_URL`

### Important findings

- The main admin action that was not “amarrando” in browser was the bookings tab loading loop. That is now fixed.
- Checkout still has a real local-env blocker:
  - browser logs show `IntegrationError: Please call Stripe() with your publishable key. You used an empty string.`
  - this means `/checkout` can render booking summary, but Stripe Elements cannot be considered fully verified until `VITE_STRIPE_PUBLIC_KEY` is set
- Quick-booking UI is visible and the backend/API path is already verified, but full browser submission is still pending one more pass. The remaining friction there is mostly browser automation around date/number inputs, not a proven backend failure.

### Validation

- `npm run lint` ✅
- `npm run build` ✅
- browser QA completed for login, dashboard, bookings, success, and cancel states ✅

---

## Stripe Sandbox Closure Pass (2026-05-16)

### What was done

- Added a local frontend sandbox env file:
  - `C:\Users\conde\Documents\classvip-live-correct2\.env`
  - includes `VITE_STRIPE_PUBLIC_KEY` and `VITE_API_BASE_URL`
- Updated local backend sandbox config so the Stripe secret key matches the same sandbox account as the publishable key
- Tightened the backend Stripe intent creation path in:
  - `backend/src/features/booking/routes/stripe.routes.ts`
  - changed PaymentIntent creation from automatic payment methods to `payment_method_types: ['card']`
- Reworked checkout to use a simpler card-only Stripe UI in:
  - `src/features/booking/pages/Checkout.tsx`
  - replaced `PaymentElement` with `CardElement`
  - this was done because the generic payment element was collapsing into an unusable/blank iframe in local browser QA

### What was verified

- Created a fresh website booking:
  - booking id: `cmp83h93x0002ui57bxrzoj72`
  - confirmation code: `CLASS2026010`
- Verified `/api/stripe/create-payment-intent` returns a valid client secret for that booking
- Confirmed the Stripe PaymentIntent directly in sandbox using Stripe test card rails (`pm_card_visa`)
- Verified `/api/stripe/confirm-payment` transitions the booking to `CONFIRMED`
- Verified the booking record after confirmation:
  - `status: CONFIRMED`
  - `confirmedAt` set
  - completed `STRIPE` payment recorded
- Verified `/checkout/success?bookingId=...&bt=...` visually after the confirmed sandbox payment

### Important nuance

- Browser automation still cannot reliably inspect or render the secure Stripe iframe contents in a trustworthy way
- That means the remaining Stripe work is **not** backend uncertainty anymore
- The remaining Stripe work is:
  - a human visual check of the card field in a normal browser session
  - staging deployment verification

### Validation

- `npm run lint` ✅
- `npm run build` ✅
- `cd backend && npm run build` ✅

---

## Deploy Prep Pass (2026-05-16)

### What was done

- Chose the deployment shape for this project:
  - frontend on Vercel
  - backend API + webhook on Vercel
- Added:
  - `C:\Users\conde\Documents\classvip-live-correct2\.vercelignore`
    - excludes only local planning/docs and keeps `backend/` + `api/` available for Vercel Functions
- Rewrote:
  - `C:\Users\conde\Documents\classvip-live-correct2\DEPLOY.md`
    - now acts as the canonical Vercel-only deployment runbook

### Security / config hardening

- Tightened backend CORS in:
  - `backend/src/app.ts`
- New CORS behavior:
  - exact origins from `ALLOWED_ORIGINS`
  - `FRONTEND_URL`
  - optional `FRONTEND_PREVIEW_URLS`
  - optional blanket Vercel preview allowance only when:
    - `ALLOW_VERCEL_PREVIEW_ORIGINS=true`
- This is more professional than always allowing any `.vercel.app` origin in production

### Env documentation updates

- Updated:
  - `C:\Users\conde\Documents\classvip-live-correct2\backend\.env.example`
- Added deploy-related vars:
  - `FRONTEND_PREVIEW_URLS`
  - `ALLOW_VERCEL_PREVIEW_ORIGINS`

### Validation

- `npm run lint` ✅
- `npm run build` ✅
- `cd backend && npm run build` ✅

### Remaining deploy tasks

- create the actual Vercel project
- set production env vars
- configure Stripe webhook to Vercel `/api/stripe/webhook`
- run full staging smoke test

---

---

## Admin Final UI/UX Polish Pass (2026-05-16)

### Quick Booking "disabled" — root cause

The Quick Booking submit button appears faded (opacity-40) on page load because the React `disabled` prop is active until all required fields are filled. **This is correct behavior, not a bug.** Specifically:

- Required always: customer name, email, phone
- Required for One Way / Round Trip: hotel/destination + arrival date
- Required for Open Service: service description
- The button is NOT truly "broken" — it enables as soon as the user fills the required fields

**Separate issue — Stripe link failing silently if price is $0:**
A previous backend hardening pass added a check that rejects payment intent creation for bookings with `totalAmountCents === 0`. This means:
- If an admin creates a booking via Quick Booking with `paymentMethod = 'stripe'` and leaves price empty (or enters 0), the booking IS created (OFFLINE_HOLD status), but the Stripe payment link email fails at the backend level
- The frontend now shows an amber warning callout when Stripe mode is selected and no price is entered, guiding the admin to enter a price before submitting
- This warning was added in this pass

**No backend changes needed** — the frontend warning is sufficient to guide the admin.

### What was changed

**`src/features/admin/pages/Admin.tsx`**

- Fixed: `"Today Services"` → `"Today's Services"` in the expandable panel header
- Redesigned today's services row cards:
  - Colored ARR/DEP badge pill (blue for ARR, amber for DEP) replaces the plain prefixed time text
  - Time shown in monospaced font separately from the kind badge
  - Customer name + service label + location cleanly stacked, truncated
  - Edit button is tighter ("Edit" instead of "Edit time")
- Improved Today's Services panel header: added date subtitle + styled close button with icon
- Improved empty/loading states in the services panel: spinner for loading, icon + message for empty
- Quick Booking container widened: `max-w-2xl` → `max-w-3xl` for better desktop readability
- Page subtitle copy improved: more accurate description of what each service type does
- Service type toggle: added `font-bold` (was `font-semibold`) and `bg-muted/30` background to the toggle container for cleaner visual grouping
- Price field (One Way mode): changed from half-grid to full-width for more prominent placement
- Added Stripe + zero-price warning callout in the Payment Method section

**`src/features/admin/components/AdminBookings.tsx`**

- Added `STATUS_LABELS` constant mapping enum → human-readable string
- Mobile booking cards: status badge now shows `"Pending Payment"`, `"Hold"`, etc. (was `"PENDING PAYMENT"`, `"OFFLINE HOLD"`)
- Desktop table rows: same improvement
- Booking detail view header: same improvement
- Status filter `<select>`: options reordered by operational frequency (Pending Payment, Confirmed, Hold first); options labeled consistently

### Build status
- `npm run lint` ✅ (clean)
- `npm run build` ✅ (16s, Admin chunk 144 kB, same structure)

### Files touched
- `src/features/admin/pages/Admin.tsx`
- `src/features/admin/components/AdminBookings.tsx`
- `TASK.md`
- `AGENT_HANDOFF.md`

### Pending for next pass
- Visual QA in browser: open `/admin` → verify service cards, status labels, Quick Booking price warning all render correctly
- Stripe + full booking flow QA: needs `VITE_STRIPE_PUBLIC_KEY` set in `.env`
- Vercel deployment (Section 7 in TASK.md)

---

## Admin Analytics Copy Cleanup Pass (2026-05-16)

### What was done

Targeted Spanish accent fixes across all three admin analytics/ops tab components. No logic changes — copy only.

**`src/features/admin/components/FinanzasTab.tsx`**
- `'informacion financiera'` → `'información financiera'`
- `'Ultimos 30 dias'` → `'Últimos 30 días'`
- `'Distribucion'` → `'Distribución'`
- `'60 dias'` → `'60 días'`
- `'los ultimos 60 dias'` → `'los últimos 60 días'`

**`src/features/admin/components/MarketingTab.tsx`**
- `DAY_NAMES_ES`: `'Miercoles'` → `'Miércoles'`, `'Sabado'` → `'Sábado'`
- Tooltip: `'reservacion'` → `'reservación'`
- `'informacion de marketing'` → `'información de marketing'`
- KPI label: `'Tasa de Conversion'` → `'Tasa de Conversión'`
- Header: `'Analisis de Demanda'` → `'Análisis de Demanda'`
- Subtitle: `'Ultimas 200 reservaciones'` → `'Últimas 200 reservaciones'`
- Chart title: `'Reservaciones por Dia — Ultimos 30 dias'` → `'...Día — Últimos 30 días'`
- Section label: `'Geografico'` → `'Geográfico'`
- Insight card: `'Dia de Mayor Demanda'` → `'Día de Mayor Demanda'`
- Insight card: `'Zona mas Reservada'` → `'Zona más Reservada'`

**`src/features/admin/components/RRHHTab.tsx`**
- Error message: `'Error de conexion.'` → `'Error de conexión.'` (drivers + vehicles)
- Form field: `'Telefono'` → `'Teléfono'`
- Error message: `'No se pudo cargar la lista de vehiculos.'` → `'...vehículos...'`
- Toast: `'Vehiculo agregado correctamente.'` → `'Vehículo...'`
- Toast: `'No se pudo agregar el vehiculo.'` → `'...vehículo...'`
- Header: `'Vehiculos'` → `'Vehículos'`
- Form heading: `'Nuevo Vehiculo'` → `'Nuevo Vehículo'`
- Empty state: `'No hay vehiculos registrados'` → `'...vehículos...'`
- Tab subtitle: `'Gestion de conductores'` → `'Gestión de conductores'`

### Build status
- `npm run lint` ✅ (clean)
- `npm run build` ✅ (19s, same chunk structure)

### Files touched
- `src/features/admin/components/FinanzasTab.tsx`
- `src/features/admin/components/MarketingTab.tsx`
- `src/features/admin/components/RRHHTab.tsx`
- `TASK.md`
- `AGENT_HANDOFF.md`

### Pending for next pass
- Visual QA in browser: open `/admin` → verify Finanzas, Marketing, and RRHH tabs render correctly with updated copy
- Book.tsx spacing/rhythm polish (`[~]`) — still needs browser review
- Vercel deployment (Section 7 in TASK.md)

---

## Admin QA + Dead Code Cleanup Pass (2026-05-16)

### What was done

Code-level QA scan of all 7 admin files. No logic or visual changes — cleanup only.

**`src/features/admin/pages/Admin.tsx`**

Three dead code items removed:

- Removed `formatOperationalTime` function (was lines 102–106). It was left over from the previous service card redesign — the new ARR/DEP card design calls `formatTimeForInput` directly and `formatOperationalTime` was never called after the redesign. Safe removal: no callers anywhere in the file.
- Removed `DollarSign` from the lucide-react import list. It appeared in the import but was never rendered in any component in the file.
- Removed `useLanguage` import and `const { t } = useLanguage()` from the Admin shell component. `t` was destructured but zero `t(...)` calls exist in Admin.tsx. The hook was only used in the Admin shell (not in DashboardTab or QuickBookingTab), so the import was also safe to remove entirely.

**`src/features/admin/components/PricingManager.tsx`** — reviewed, no changes needed.

- All 4 tabs (Areas, Rules, Extras, Hotels) are structurally clean.
- Table layouts, loading state, empty states, action buttons, and search logic are all correct.
- HotelForm/AreaForm/RuleForm/ExtraForm form containers use `rounded-2xl border-gold/30 shadow-sm` from a previous polish pass.
- No dead imports, no missing accents, no logic issues found.

**Other files reviewed** — no issues found:
- `AdminBookings.tsx`: STATUS_LABELS map in place, all status badge locations use it correctly, status filter correctly ordered. Clean.
- `FinanzasTab.tsx`, `MarketingTab.tsx`, `RRHHTab.tsx`: all accent fixes from the previous pass are in place. Clean.
- `AdminLogin.tsx`: polish from previous passes in place. Clean.

### Build status
- `npm run lint` ✅ (clean, zero output)
- `npm run build` ✅ (15.95s, Admin chunk 144.13 kB, same structure)

### Files touched
- `src/features/admin/pages/Admin.tsx` (dead code removed)
- `AGENT_HANDOFF.md`

### Pending for next pass
- Visual QA in browser: set `VITE_STRIPE_PUBLIC_KEY` in `.env`, run `npm run dev` + `cd backend && npm run dev`, open `/admin`, verify service cards ARR/DEP, status labels, Quick Booking price warning all render. Then test `/book` → `/checkout` → `/checkout/success`.
- Vercel deployment: Section 7 in TASK.md (configure project settings, Stripe envs, webhook target, CORS)
- Book.tsx spacing/rhythm polish (`[~]`) — still needs browser review

## Vercel-Only Readiness Closure (2026-05-16)

- Root install flow now explicitly generates Prisma client via `npm --workspace backend run db:generate` in the root `postinstall` script.
- Root `.env.example` now assumes the frontend and API live on the same Vercel domain.
- `DEPLOY.md` and `README.md` were aligned to a single-platform Vercel deployment path.
- Final verification pass completed successfully:
  - `npm run lint`
  - `npm run build`
  - `npm run test`
  - `cd backend && npm run build`
  - `cd backend && npm run test`
- `npx vercel build` is still blocked locally until real project settings are pulled with `vercel pull --yes --environment preview`; treat that as a deployment/staging step, not an unresolved code defect.
- Known non-blocking follow-up:
  - frontend build still reports a large vendor chunk plus a manual-chunk circularity warning; this is performance debt, not a deploy blocker
  - PDF confirmation generation still deserves staging verification on Vercel Functions because it relies on `puppeteer`

---

## Important Notes

- Do **not** switch back to `C:\Users\conde\Documents\los-cabos-luxe-transfers-main`
- The active repo is `C:\Users\conde\Documents\classvip-live-correct2`
- This is now tied to a **new** GitHub repo and a **new** Supabase DB
- Do **not** reintroduce PayPal
- Stripe is the active payment path
- Avoid changing visible branding unless explicitly requested
- Keep homepage/booking behavior stable while improving internals
- The production site is not the target environment for these tests
