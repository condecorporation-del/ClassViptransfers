# Environment Variables Checklist

## Frontend (.env)

Create `.env` file in the **root** directory (same level as `package.json`):

```env
VITE_API_BASE_URL=http://localhost:3001
```

**Production:**
```env
VITE_API_BASE_URL=https://your-backend-domain.com
```

## Backend (.env)

Create `.env` file in the `backend/` directory:

### Required Variables

```env
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1

# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:8080

# Frontend URL
FRONTEND_URL=http://localhost:8080

# PayPal
PAYPAL_CLIENT_ID=[YOUR_CLIENT_ID]
PAYPAL_CLIENT_SECRET=[YOUR_CLIENT_SECRET]
PAYPAL_WEBHOOK_ID=[YOUR_WEBHOOK_ID]
PAYPAL_ENV=sandbox

# Email (Resend)
RESEND_API_KEY=[YOUR_RESEND_API_KEY]
EMAIL_FROM="Class VIP Transfers <no-reply@classviptransfers.com>"
EMAIL_COMPANY_TO=Armando@caboviptransfers.com

# OpenAI
OPENAI_API_KEY=[YOUR_OPENAI_API_KEY]
OPENAI_MODEL=gpt-4o-mini
OPENAI_WHISPER_MODEL=whisper-1

# Admin Auth
ADMIN_EMAIL=[YOUR_ADMIN_EMAIL]
ADMIN_PASSWORD_HASH=[YOUR_BCRYPT_HASH]
ADMIN_JWT_SECRET=[YOUR_JWT_SECRET]
ADMIN_AUTH_DISABLED=false
```

## Quick Setup Checklist

### Frontend
- [ ] `VITE_API_BASE_URL` - Backend API URL

### Backend - Database
- [ ] `DATABASE_URL` - Supabase PostgreSQL connection string

### Backend - Server
- [ ] `PORT` - Server port (default: 3001)
- [ ] `NODE_ENV` - development or production
- [ ] `CORS_ORIGIN` - Frontend URL
- [ ] `FRONTEND_URL` - Frontend URL (for redirects)

### Backend - PayPal
- [ ] `PAYPAL_CLIENT_ID`
- [ ] `PAYPAL_CLIENT_SECRET`
- [ ] `PAYPAL_WEBHOOK_ID`
- [ ] `PAYPAL_ENV` - sandbox or live

### Backend - Email
- [ ] `RESEND_API_KEY`
- [ ] `EMAIL_FROM`
- [ ] `EMAIL_COMPANY_TO`
- [ ] `EMAIL_LOGO_URL` – URL del logo en el **header** de los correos (opcional; si no se define se usa FRONTEND_URL/logo.png)

### Backend - OpenAI
- [ ] `OPENAI_API_KEY`
- [ ] `OPENAI_MODEL` - Optional (default: gpt-4o-mini)
- [ ] `OPENAI_WHISPER_MODEL` - Optional (default: whisper-1)

### Backend - Admin Auth
- [ ] `ADMIN_EMAIL`
- [ ] `ADMIN_PASSWORD_HASH` - Generate with: `node backend/scripts/hash-password.js "password"`
- [ ] `ADMIN_JWT_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] `ADMIN_AUTH_DISABLED` - Set to `false` in production

## Variable Names Only (No Secrets)

**Frontend:**
- VITE_API_BASE_URL

**Backend:**
- DATABASE_URL
- PORT
- NODE_ENV
- CORS_ORIGIN
- FRONTEND_URL
- PAYPAL_CLIENT_ID
- PAYPAL_CLIENT_SECRET
- PAYPAL_WEBHOOK_ID
- PAYPAL_ENV
- RESEND_API_KEY
- EMAIL_FROM
- EMAIL_COMPANY_TO
- EMAIL_LOGO_URL
- OPENAI_API_KEY
- OPENAI_MODEL
- OPENAI_WHISPER_MODEL
- ADMIN_EMAIL
- ADMIN_PASSWORD_HASH
- ADMIN_JWT_SECRET
- ADMIN_AUTH_DISABLED

## Notes

- All frontend variables must start with `VITE_` to be exposed to the browser
- Never commit `.env` files (they're in `.gitignore`)
- Use `.env.example` files as templates
- Generate secure secrets for production
- Test all integrations after setting up env vars

