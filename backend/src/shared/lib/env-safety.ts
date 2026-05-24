function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/+$/, '');
}

function parseOrigins(value?: string) {
  return value
    ? value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];
}

function isLocalOrigin(origin: string) {
  return /:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

function isWeakSecret(secret?: string) {
  if (!secret) return true;
  const trimmed = secret.trim();
  if (trimmed.length < 24) return true;
  return /replace|changeme|example|your_|test/i.test(trimmed);
}

export function assertSafeRuntimeConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  const issues: string[] = [];

  const frontendUrl = process.env.FRONTEND_URL?.trim();
  const backendUrl = process.env.BACKEND_URL?.trim();
  const allowedOrigins = parseOrigins(process.env.ALLOWED_ORIGINS).map(normalizeOrigin);

  if (process.env.ADMIN_EMAIL && !process.env.ADMIN_PASSWORD_HASH) {
    issues.push('ADMIN_PASSWORD_HASH must be set when ADMIN_EMAIL is configured.');
  }

  if (process.env.ADMIN_PASSWORD_HASH && !process.env.ADMIN_EMAIL) {
    issues.push('ADMIN_EMAIL must be set when ADMIN_PASSWORD_HASH is configured.');
  }

  if (!isProduction) {
    return;
  }

  if (process.env.ADMIN_AUTH_DISABLED === 'true') {
    issues.push('ADMIN_AUTH_DISABLED cannot be true in production.');
  }

  if (!process.env.DATABASE_URL) {
    issues.push('DATABASE_URL is required in production.');
  }

  if (isWeakSecret(process.env.ADMIN_JWT_SECRET)) {
    issues.push('ADMIN_JWT_SECRET is missing or too weak for production.');
  }

  if (isWeakSecret(process.env.JWT_SECRET) && !process.env.BOOKING_LOOKUP_SECRET) {
    issues.push('JWT_SECRET or BOOKING_LOOKUP_SECRET must be configured securely in production.');
  }

  if (frontendUrl && isLocalOrigin(normalizeOrigin(frontendUrl))) {
    issues.push(`FRONTEND_URL cannot point to localhost in production: ${frontendUrl}`);
  }

  if (backendUrl && isLocalOrigin(normalizeOrigin(backendUrl))) {
    issues.push(`BACKEND_URL cannot point to localhost in production: ${backendUrl}`);
  }

  const localAllowedOrigins = allowedOrigins.filter(isLocalOrigin);
  if (localAllowedOrigins.length > 0) {
    issues.push(`ALLOWED_ORIGINS contains localhost entries in production: ${localAllowedOrigins.join(', ')}`);
  }

  if (issues.length > 0) {
    throw new Error(`[EnvSafety] Invalid production configuration:\n- ${issues.join('\n- ')}`);
  }
}
