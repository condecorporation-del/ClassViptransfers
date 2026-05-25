export type EnvMap = NodeJS.ProcessEnv;

export function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/+$/, '');
}

export function parseOrigins(value?: string) {
  return value
    ? value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];
}

export function isLocalOrigin(origin: string) {
  return /:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

export function isWeakSecret(secret?: string) {
  if (!secret) return true;
  const trimmed = secret.trim();
  if (trimmed.length < 24) return true;
  return /replace|changeme|example|your_|test/i.test(trimmed);
}

export function hasPlaceholderDatabaseUrl(databaseUrl?: string) {
  if (!databaseUrl) return false;
  return (
    databaseUrl.includes('[YOUR-PASSWORD]') ||
    databaseUrl.includes('[YOUR-PROJECT-REF]') ||
    databaseUrl.includes('xxxxx')
  );
}

export function getEnvConfigIssues(env: EnvMap, { enforceProduction }: { enforceProduction?: boolean } = {}) {
  const isProduction = enforceProduction ?? env.NODE_ENV === 'production';
  const issues: string[] = [];

  const frontendUrl = env.FRONTEND_URL?.trim();
  const backendUrl = env.BACKEND_URL?.trim();
  const allowedOrigins = parseOrigins(env.ALLOWED_ORIGINS).map(normalizeOrigin);
  const bookingSecret = env.BOOKING_LOOKUP_SECRET?.trim();

  if (env.ADMIN_EMAIL && !env.ADMIN_PASSWORD_HASH) {
    issues.push('ADMIN_PASSWORD_HASH must be set when ADMIN_EMAIL is configured.');
  }

  if (env.ADMIN_PASSWORD_HASH && !env.ADMIN_EMAIL) {
    issues.push('ADMIN_EMAIL must be set when ADMIN_PASSWORD_HASH is configured.');
  }

  if (!isProduction) {
    return issues;
  }

  if (env.ADMIN_AUTH_DISABLED === 'true') {
    issues.push('ADMIN_AUTH_DISABLED cannot be true in production.');
  }

  if (!env.DATABASE_URL?.trim()) {
    issues.push('DATABASE_URL is required in production.');
  } else if (hasPlaceholderDatabaseUrl(env.DATABASE_URL)) {
    issues.push('DATABASE_URL still contains placeholder values.');
  }

  if (isWeakSecret(env.ADMIN_JWT_SECRET)) {
    issues.push('ADMIN_JWT_SECRET is missing or too weak for production.');
  }

  if (isWeakSecret(env.JWT_SECRET) && isWeakSecret(bookingSecret)) {
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

  return issues;
}

export function getEnvConfigWarnings(env: EnvMap) {
  const warnings: string[] = [];
  const databaseUrl = env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    warnings.push('DATABASE_URL is not set.');
    return warnings;
  }

  if (!databaseUrl.includes('supabase.co')) {
    warnings.push('DATABASE_URL does not look like a Supabase connection string.');
  }

  if (!databaseUrl.includes('?pgbouncer=true')) {
    warnings.push('DATABASE_URL is missing ?pgbouncer=true&connection_limit=1.');
  }

  if (!databaseUrl.includes('postgresql://postgres:')) {
    warnings.push('DATABASE_URL does not start with postgresql://postgres:.');
  }

  if (!databaseUrl.includes('@db.')) {
    warnings.push('DATABASE_URL does not contain @db.');
  }

  if (!databaseUrl.includes('.supabase.co')) {
    warnings.push('DATABASE_URL does not contain .supabase.co.');
  }

  if (!databaseUrl.includes(':5432')) {
    warnings.push('DATABASE_URL does not contain port :5432.');
  }

  return warnings;
}

export function formatEnvIssueReport(issues: string[]) {
  return issues.map((issue) => `- ${issue}`).join('\n');
}

export function assertSafeDeployConfig(env: EnvMap = process.env) {
  const issues = getEnvConfigIssues(env, { enforceProduction: true });

  if (issues.length > 0) {
    throw new Error(`[EnvSafety] Invalid deploy configuration:\n${formatEnvIssueReport(issues)}`);
  }
}
