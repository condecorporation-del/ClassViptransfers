const ADMIN_TOKEN_KEY = 'admin_token';

export function readAdminToken() {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeAdminToken(token: string) {
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    // Ignore storage failures in restricted browsing contexts.
  }
}

export function clearAdminToken() {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // Ignore storage failures in restricted browsing contexts.
  }
}
