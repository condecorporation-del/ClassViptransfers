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
    try {
      const base = getApiBaseUrl();
      const url = base ? `${base}/api/admin/auth/me` : '/api/admin/auth/me';
      const response = await fetch(url, { credentials: 'include' });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.authenticated) {
          setAuth({
            authenticated: true,
            email: data.data.email,
            loading: false,
          });
        } else {
          setAuth({ authenticated: false, email: null, loading: false });
        }
      } else {
        setAuth({ authenticated: false, email: null, loading: false });
      }
    } catch {
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
      await fetch(url, {
        method: 'POST',
        credentials: 'include',
      });
      setAuth({ authenticated: false, email: null, loading: false });
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
    };
  };

  return { ...auth, checkAuth, logout, getAuthHeaders };
};

