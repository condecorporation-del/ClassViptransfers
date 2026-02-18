import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

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
      const response = await fetch(`${API_BASE_URL}/api/admin/auth/me`, {
        credentials: 'include',
      });

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
    } catch (error) {
      setAuth({ authenticated: false, email: null, loading: false });
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/admin/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      setAuth({ authenticated: false, email: null, loading: false });
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return { ...auth, checkAuth, logout };
};

