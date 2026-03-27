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
      const localToken = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {};
      if (localToken) headers['Authorization'] = `Bearer ${localToken}`;
      const response = await fetch(url, { credentials: 'include', headers });

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

