# Admin Authentication Setup

## Overview

Admin authentication system using JWT tokens stored in httpOnly cookies. All admin routes and API endpoints are protected.

## Quick Setup

### 1. Generate Password Hash

Use Node.js to generate a bcrypt hash for your password:

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your-password-here', 10).then(hash => console.log(hash));"
```

Or create a script:

```bash
# Create script
cat > scripts/hash-password.js << 'EOF'
import bcrypt from 'bcrypt';

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.js <password>');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);
console.log('Password hash:', hash);
EOF

# Run it
node scripts/hash-password.js "your-secure-password"
```

### 2. Generate JWT Secret

Generate a secure random string (minimum 32 characters):

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using openssl
openssl rand -hex 32
```

### 3. Update .env

Add to your `.env` file:

```env
ADMIN_EMAIL=admin@caboviptransfers.com
ADMIN_PASSWORD_HASH=$2b$10$your_bcrypt_hash_here
ADMIN_JWT_SECRET=your_secure_jwt_secret_min_32_chars
ADMIN_AUTH_DISABLED=false
```

**Important:**
- `ADMIN_PASSWORD_HASH` - Use the hash from step 1
- `ADMIN_JWT_SECRET` - Use the secret from step 2
- `ADMIN_AUTH_DISABLED` - Set to `true` only for development

## Development Bypass

For development, you can disable authentication:

```env
ADMIN_AUTH_DISABLED=true
```

**⚠️ WARNING:** Never set this to `true` in production!

## API Endpoints

### POST /api/admin/auth/login

Login endpoint.

**Request:**
```json
{
  "email": "admin@caboviptransfers.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "email": "admin@caboviptransfers.com"
  }
}
```

**Cookie:** Sets `admin_token` httpOnly cookie (7 days expiry)

### POST /api/admin/auth/logout

Logout endpoint.

**Response:**
```json
{
  "success": true,
  "data": {
    "authenticated": false
  }
}
```

**Cookie:** Clears `admin_token` cookie

### GET /api/admin/auth/me

Check authentication status.

**Response:**
```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "email": "admin@caboviptransfers.com"
  }
}
```

## Protected Routes

All `/api/admin/*` routes (except `/api/admin/auth/*`) require authentication:

- `GET /api/admin/bookings`
- `POST /api/admin/bookings/manual`
- `POST /api/admin/bookings/:id/price-override`
- `POST /api/admin/bookings/:id/assign`
- `GET /api/admin/drivers`
- `POST /api/admin/drivers`
- `GET /api/admin/vehicles`
- `POST /api/admin/vehicles`
- ... and all other admin endpoints

## Frontend Protection

### Admin Pages

- `/admin` - Protected (requires login)
- `/admin/login` - Login page (public)

### Route Guard

The `AdminRoute` component automatically:
- Checks authentication status
- Redirects to `/admin/login` if not authenticated
- Shows loading state while checking

## Security Features

✅ **JWT Tokens** - Secure token-based authentication
✅ **httpOnly Cookies** - Prevents XSS attacks
✅ **Secure Cookies** - HTTPS only in production
✅ **Rate Limiting** - 5 login attempts per 15 minutes
✅ **Audit Logging** - All login/logout attempts logged
✅ **Password Hashing** - bcrypt with salt rounds
✅ **Token Expiry** - 7 days (configurable)

## Cookie Settings

**Development:**
- `httpOnly: true`
- `secure: false` (HTTP allowed)
- `sameSite: 'lax'`
- `maxAge: 7 days`

**Production:**
- `httpOnly: true`
- `secure: true` (HTTPS only)
- `sameSite: 'none'` (allows cross-site if needed)
- `maxAge: 7 days`

## CORS Configuration

Ensure CORS is configured for credentials:

```env
CORS_ORIGIN=http://localhost:8080
# Or for production:
CORS_ORIGIN=https://your-frontend-domain.com
```

Backend must have:
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true, // Important!
}));
```

## Testing

### 1. Test Login

```bash
curl -X POST http://localhost:3001/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "admin@caboviptransfers.com",
    "password": "your-password"
  }'
```

### 2. Test Protected Route

```bash
curl -X GET http://localhost:3001/api/admin/bookings \
  -b cookies.txt
```

### 3. Test Logout

```bash
curl -X POST http://localhost:3001/api/admin/auth/logout \
  -b cookies.txt
```

### 4. Test Frontend

1. Navigate to `/admin`
2. Should redirect to `/admin/login`
3. Enter credentials
4. Should redirect to `/admin`
5. Should see admin dashboard

## Troubleshooting

**Login fails:**
- Check password hash is correct
- Verify email matches `ADMIN_EMAIL`
- Check server logs for errors

**Cookie not set:**
- Verify CORS credentials enabled
- Check cookie settings (secure, sameSite)
- Verify frontend and backend domains match

**401 Unauthorized:**
- Check token in cookie or Authorization header
- Verify `ADMIN_JWT_SECRET` matches
- Check token hasn't expired

**CORS errors:**
- Verify `CORS_ORIGIN` matches frontend URL
- Ensure `credentials: true` in CORS config
- Check browser console for specific errors

## Production Checklist

- [ ] `ADMIN_AUTH_DISABLED=false`
- [ ] Strong password set
- [ ] Secure JWT secret (32+ chars)
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Cookie secure flag enabled
- [ ] Rate limiting active
- [ ] Audit logging working
- [ ] Test login/logout flow
- [ ] Test protected routes

## Security Best Practices

1. **Never commit `.env` file** - Use `.env.example` only
2. **Use strong passwords** - Minimum 12 characters
3. **Rotate JWT secret** - If compromised
4. **Monitor audit logs** - Watch for failed login attempts
5. **Use HTTPS** - Always in production
6. **Limit login attempts** - Rate limiting prevents brute force
7. **Keep dependencies updated** - Security patches

## Next Steps

- [ ] Add multi-factor authentication (future)
- [ ] Add session management UI
- [ ] Add password reset flow
- [ ] Add multiple admin users (database model)
- [ ] Add role-based permissions

