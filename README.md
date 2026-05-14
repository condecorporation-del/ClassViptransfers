# Class VIP Transfers

Frontend and backend for the current Class VIP Transfers website, booking flow, and admin dashboard.

## Stack

- Frontend: Vite + React + TypeScript + Tailwind
- Backend: Express + TypeScript + Prisma
- Payments: Stripe
- Email: Resend or Gmail SMTP
- Database: PostgreSQL via Prisma

## Project structure

```text
src/                 Frontend app
  components/        Shared UI and feature components
  pages/             Route-level screens
  hooks/             Frontend hooks
  lib/               Frontend helpers
  data/              Static frontend content

backend/
  src/               Express API
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

The frontend runs on `http://127.0.0.1:5173` by default and proxies `/api` to the backend on port `3001`.

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
- `VITE_COMMIT_REF`
- `VITE_CONTEXT`

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

- Frontend prepared to deploy on Vercel
- Backend still lives as a separate Express app
- `vercel.json` is included for clean frontend routing and asset caching

## Notes

- PayPal legacy runtime code has been removed; Stripe is the active payment path.
- This repo has already gone through cleanup to remove dead pages, unused UI scaffolding, and old assets.
- Keep new work aligned with the current live site behavior unless a change is intentional.
