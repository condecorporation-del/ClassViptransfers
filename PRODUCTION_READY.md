# Production readiness

## Done

- **Reservations:** Booking flow (service → trip → area → route → date → locations → extras → upsell → review) works end-to-end. Stepper and area step label fixed; defensive checks avoid crashes on missing data.
- **Pricing:** Transport and extras loaded from backend (areas, extras, combos). No hardcoded prices in the flow.
- **PayPal:** Create order, capture, and webhook update booking status to PAID → CONFIRMED. Confirmation emails triggered on capture.
- **Emails:** Premium HTML templates; sent when booking becomes PAID/CONFIRMED (Resend). Admin notification included.
- **AI agent:** Chat widget can create draft bookings and redirect to checkout. Data extraction and error handling in place.
- **UX/UI:** EN/ES translations for booking steps and copy. Step counter shows 9 steps. No test data displayed in UI (draft uses placeholder customer; real data collected at Checkout).

## Before going live

1. **Domain**
   - Set `VITE_API_BASE_URL` (frontend) to your production backend URL.
   - Set `CORS_ORIGIN` and `FRONTEND_URL` (backend) to your production frontend URL.

2. **Official emails**
   - Set `EMAIL_FROM` to your official sender (e.g. `"Los Cabos Luxe <reservas@tudominio.com>"`).
   - Set `EMAIL_COMPANY_TO` to the inbox that receives admin notifications.

3. **PayPal**
   - Switch `PAYPAL_ENV` to `live` and use live credentials and webhook URL.

4. **Optional**
   - Replace input placeholders (e.g. `admin@example.com`, `john@example.com`) in code if you want different hint text; they are not sent as data.

See **ENV_CHECKLIST.md** for the full list of environment variables.
