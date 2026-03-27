import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiBaseUrl } from '@/lib/api';

interface AuthState {
  authenticated: boolean;
  email: string | null;
  loading: boolean;
}

export const useAdminAuth = () => {
  const [auth, setAuth] = useState<AuthState>({
    authenticated: false,
    email: null,
    loading: true,
  });
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Read localStorage safely (Safari private mode can throw)
    let localToken: string | null = null;
    try { localToken = localStorage.getItem('admin_token'); } catch { /* ignore */ }

    try {
      const base = getApiBaseUrl();
      const url = base ? `${base}/api/admin/auth/me` : '/api/admin/auth/me';
      const headers: Record<string, string> = {};
      if (localToken) headers['Authorization'] = `Bearer ${localToken}`;
      const response = await fetch(url, { credentials: 'include', headers });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.authenticated) {
          setAuth({ authenticated: true, email: data.data.email, loading: false });
        } else {
          // Server says not authenticated — clear stale token
          try { localStorage.removeItem('admin_token'); } catch { /* ignore */ }
          setAuth({ authenticated: false, email: null, loading: false });
        }
      } else {
        // If we have a fresh local token but the network call failed (e.g. cross-origin
        // cookie issue on mobile Safari), trust the token for this session instead of
        // immediately logging the user out.
        if (localToken) {
          // Decode payload without verifying signature — just check expiry
          try {
            const payload = JSON.parse(atob(localToken.split('.')[1]));
            if (payload.exp && payload.exp * 1000 > Date.now()) {
              setAuth({ authenticated: true, email: payload.email || null, loading: false });
              return;
            }
          } catch { /* invalid token format */ }
        }
        setAuth({ authenticated: false, email: null, loading: false });
      }
    } catch {
      // Network error — if we have a valid (non-expired) local token, keep user logged in
      if (localToken) {
        try {
          const payload = JSON.parse(atob(localToken.split('.')[1]));
          if (payload.exp && payload.exp * 1000 > Date.now()) {
            setAuth({ authenticated: true, email: payload.email || null, loading: false });
            return;
          }
        } catch { /* invalid token */ }
      }
      // In local development, bypass auth when backend is unreachable
      if (import.meta.env.DEV) {
        setAuth({ authenticated: true, email: 'dev@local', loading: false });
      } else {
        setAuth({ authenticated: false, email: null, loading: false });
      }
    }
  };

  const logout = async () => {
    try {
      const base = getApiBaseUrl();
      const url = base ? `${base}/api/admin/auth/logout` : '/api/admin/auth/logout';
      const localToken = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {};
      if (localToken) headers['Authorization'] = `Bearer ${localToken}`;
      await fetch(url, { method: 'POST', credentials: 'include', headers });
      localStorage.removeItem('admin_token');
      setAuth({ authenticated: false, email: null, loading: false });
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getAuthHeaders = () => {
    const localToken = localStorage.getItem('admin_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (localToken) headers['Authorization'] = `Bearer ${localToken}`;
    return headers;
  };

  return { ...auth, checkAuth, logout, getAuthHeaders };
};

