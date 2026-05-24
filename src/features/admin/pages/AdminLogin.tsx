import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Lock, Mail } from 'lucide-react';
import { useLanguage } from '@/shared/providers/LanguageContext';
import { getApiBaseUrl } from '@/shared/lib/api';
import { cloudinaryAssets } from '@/shared/lib/cloudinary-assets';
import { getErrorMessage } from '@/shared/lib/errors';
import { clearAdminToken } from '@/features/admin/lib/adminSession';
import { invalidateAdminAuthCache } from '@/features/admin/hooks/useAdminAuth';

type AdminLoginResponse = {
  success?: boolean;
  error?: string;
};

type RouteState = {
  from?: {
    pathname?: string;
  };
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const routeState = location.state as RouteState | null;
  const redirectTarget = routeState?.from?.pathname || '/admin';

  const checkAuth = useCallback(async () => {
    try {
      const base = getApiBaseUrl();
      const url = base ? `${base}/api/admin/auth/me` : '/api/admin/auth/me';
      const response = await fetch(url, { credentials: 'include' });

      if (!response.ok) {
        clearAdminToken();
        return;
      }

      const data = await response.json().catch(() => null);

      if (data?.success && data?.data?.authenticated) {
        invalidateAdminAuthCache();
        navigate(redirectTarget, { replace: true });
        return;
      }

      invalidateAdminAuthCache();
      clearAdminToken();
    } catch {
      invalidateAdminAuthCache();
      clearAdminToken();
    } finally {
      setCheckingAuth(false);
    }
  }, [navigate, redirectTarget]);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const base = getApiBaseUrl();
      const url = base ? `${base}/api/admin/auth/login` : '/api/admin/auth/login';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const text = await response.text();
      let data: AdminLoginResponse = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError(`Invalid response (${response.status})`);
        return;
      }

      if (data.success) {
        invalidateAdminAuthCache();
        navigate(redirectTarget, { replace: true });
        return;
      }

      invalidateAdminAuthCache();
      clearAdminToken();
      setError(data.error || 'Login failed');
    } catch (caughtError) {
      const message = getErrorMessage(caughtError, 'Network error');

      if (message.includes('Failed to fetch') || caughtError instanceof TypeError) {
        const base = getApiBaseUrl();
        setError(
          lang === 'es'
            ? `No se pudo conectar al servidor${base ? ` (${base})` : ''}.`
            : `Could not connect to server${base ? ` (${base})` : ''}.`
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const navyBackground = {
    background: 'linear-gradient(135deg, #080f1e 0%, #0d1f3c 60%, #080f1e 100%)',
  };

  if (checkingAuth) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={navyBackground}>
        <div className="text-center">
          <img
            src={cloudinaryAssets.logo}
            alt="Class VIP Transfers"
            className="h-16 mx-auto mb-6 drop-shadow-[0_4px_20px_rgba(212,175,55,0.4)] opacity-80"
          />
          <Loader2 size={32} className="animate-spin text-gold mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center relative overflow-hidden px-4 py-6"
      style={{
        ...navyBackground,
        paddingTop: 'max(env(safe-area-inset-top, 0px), 1rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1rem)',
      }}
    >
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gold/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gold/5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-7">
          <img
            src={cloudinaryAssets.logo}
            alt="Class VIP Transfers"
            className="h-32 md:h-36 mx-auto drop-shadow-[0_8px_28px_rgba(212,175,55,0.55)]"
          />
        </div>

        <div
          className="rounded-3xl p-6 md:p-8 shadow-2xl"
          style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(22px)',
            border: '1px solid rgba(212,175,55,0.18)',
          }}
        >
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
              style={{
                background: 'rgba(212,175,55,0.1)',
                border: '1px solid rgba(212,175,55,0.2)',
              }}
            >
              <Lock size={11} className="text-gold" />
              <span className="text-gold text-[10px] font-bold uppercase tracking-[0.2em]">
                {lang === 'es' ? 'Panel de Control' : 'Control Panel'}
              </span>
            </div>
            <h1 className="text-2xl font-display text-white mb-1">
              {lang === 'es' ? 'Bienvenido' : 'Welcome Back'}
            </h1>
            <p className="text-white/40 text-sm">
              {lang === 'es'
                ? 'Ingresa tus credenciales para acceder'
                : 'Enter your credentials to access'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2">
                {lang === 'es' ? 'Correo Electronico' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  onFocus={(event) => {
                    event.currentTarget.style.border = '1px solid rgba(212,175,55,0.5)';
                    event.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.08)';
                  }}
                  onBlur={(event) => {
                    event.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)';
                    event.currentTarget.style.boxShadow = 'none';
                  }}
                  placeholder="admin@classviptransfers.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2">
                {lang === 'es' ? 'Contrasena' : 'Password'}
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold/50" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  onFocus={(event) => {
                    event.currentTarget.style.border = '1px solid rgba(212,175,55,0.5)';
                    event.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.08)';
                  }}
                  onBlur={(event) => {
                    event.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)';
                    event.currentTarget.style.boxShadow = 'none';
                  }}
                  placeholder="********"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div
                className="rounded-xl p-3"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full gold-gradient text-secondary-foreground py-3.5 rounded-xl text-sm font-bold tracking-wide hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 gold-glow"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {lang === 'es' ? 'Verificando...' : 'Verifying...'}
                </>
              ) : (
                lang === 'es' ? 'Acceder al Panel' : 'Access Panel'
              )}
            </button>
          </form>

          <div
            className="mt-6 pt-5 border-t text-center"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <p className="text-[11px] text-white/25">
              {lang === 'es'
                ? 'Solo personal autorizado | Class VIP Transfers'
                : 'Authorized personnel only | Class VIP Transfers'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
