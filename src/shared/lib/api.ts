/**
 * API base URL for fetch calls.
 * In development: use '' so requests go to same origin and Vite proxy forwards to backend.
 * In production:
 * - use VITE_API_BASE_URL when the API lives on another host
 * - use '' for same-origin Vercel Functions
 */
export const getApiBaseUrl = () => {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim() || '';
  if (!configured) return '';
  return configured.replace(/\/+$/, '');
};
