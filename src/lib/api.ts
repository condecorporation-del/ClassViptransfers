/**
 * API base URL for fetch calls.
 * In development: use '' so requests go to same origin and Vite proxy forwards to backend.
 * In production: use VITE_API_BASE_URL from env.
 */
export const getApiBaseUrl = () =>
  import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || '');
