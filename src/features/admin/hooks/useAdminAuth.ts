import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiBaseUrl } from '@/shared/lib/api';
import { clearAdminToken } from '@/features/admin/lib/adminSession';

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

  const checkAuth = useCallback(async () => {
    try {
      const base = getApiBaseUrl();
      const url = base ? `${base}/api/admin/auth/me` : '/api/admin/auth/me';
      const response = await fetch(url, { credentials: 'include' });

      if (!response.ok) {
        clearAdminToken();
        setAuth({ authenticated: false, email: null, loading: false });
        return;
      }

      const data = await response.json();

      if (data.success && data.data.authenticated) {
        setAuth({ authenticated: true, email: data.data.email, loading: false });
        return;
      }

      clearAdminToken();
      setAuth({ authenticated: false, email: null, loading: false });
    } catch {
      clearAdminToken();
      setAuth({ authenticated: false, email: null, loading: false });
    }
  }, []);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      const base = getApiBaseUrl();
      const url = base ? `${base}/api/admin/auth/logout` : '/api/admin/auth/logout';
      await fetch(url, { method: 'POST', credentials: 'include' });
    } finally {
      clearAdminToken();
      setAuth({ authenticated: false, email: null, loading: false });
      navigate('/admin/login');
    }
  }, [navigate]);

  const getAuthHeaders = useCallback(() => {
    return { 'Content-Type': 'application/json' };
  }, []);

  return { ...auth, checkAuth, logout, getAuthHeaders };
};
