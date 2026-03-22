import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, Mail } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getApiBaseUrl } from '@/lib/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if already authenticated
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const base = getApiBaseUrl();
      const url = base ? `${base}/api/admin/auth/me` : '/api/admin/auth/me';
      const response = await fetch(url, { credentials: 'include' });
      if (response.ok) {
        navigate('/admin');
      }
    } catch (err) {
      console.debug('[AdminLogin] checkAuth error:', err);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const base = getApiBaseUrl();
      const url = base ? `${base}/api/admin/auth/login` : '/api/admin/auth/login';
      console.debug('[AdminLogin] POST', url, { email });
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const text = await response.text();
      let data: { success?: boolean; error?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError(`Invalid response (${response.status})`);
        return;
      }
      console.debug('[AdminLogin] Response', response.status, data);

      if (data.success) {
        navigate('/admin');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err: any) {
      console.error('[AdminLogin] Request error:', err);
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || err.name === 'TypeError') {
        const base = getApiBaseUrl();
        setError(
          lang === 'es'
            ? `No se pudo conectar al servidor${base ? ` (${base})` : ''}. Verifica que el backend esté corriendo.`
            : `Could not connect to server${base ? ` (${base})` : ''}. Verify backend is running.`
        );
      } else {
        setError(err.message || 'Network error');
      }
    } finally {
      setLoading(false);
    }
  };

  const navyBg = { background: 'linear-gradient(135deg, #080f1e 0%, #0d1f3c 60%, #080f1e 100%)' };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={navyBg}>
        <div className="text-center">
          <img
            src="/logo.png"
            alt="Class VIP Transfers"
            className="h-16 mx-auto mb-6 drop-shadow-[0_4px_20px_rgba(212,175,55,0.4)] opacity-80"
          />
          <Loader2 size={32} className="animate-spin text-gold mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4" style={navyBg}>
      {/* Ambient glow accents */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gold/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gold/5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.03)_0%,transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Class VIP Transfers"
            className="h-20 mx-auto drop-shadow-[0_6px_24px_rgba(212,175,55,0.5)]"
          />
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 shadow-2xl"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(212,175,55,0.15)',
          }}
        >
          {/* Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
              style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2">
                {lang === 'es' ? 'Correo Electrónico' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.border = '1px solid rgba(212,175,55,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.08)'; }}
                  onBlur={(e) => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                  placeholder="admin@classviptransfers.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2">
                {lang === 'es' ? 'Contraseña' : 'Password'}
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold/50" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.border = '1px solid rgba(212,175,55,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.08)'; }}
                  onBlur={(e) => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
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

          <div className="mt-6 pt-5 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <p className="text-[11px] text-white/25">
              {lang === 'es'
                ? 'Solo personal autorizado · Class VIP Transfers'
                : 'Authorized personnel only · Class VIP Transfers'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

