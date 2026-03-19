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

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={48} className="animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-gold/20 rounded-xl shadow-2xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mb-4">
              <Lock size={32} className="text-gold" />
            </div>
            <h1 className="text-3xl font-display text-foreground mb-2">
              {lang === 'es' ? 'Acceso Admin' : 'Admin Access'}
            </h1>
            <p className="text-muted-foreground">
              {lang === 'es'
                ? 'Ingresa tus credenciales para continuar'
                : 'Enter your credentials to continue'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {lang === 'es' ? 'Email' : 'Email'}
              </label>
              <div className="relative">
                <Mail
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 bg-background border border-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                  placeholder={lang === 'es' ? 'admin@ejemplo.com' : 'admin@example.com'}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {lang === 'es' ? 'Contraseña' : 'Password'}
              </label>
              <div className="relative">
                <Lock
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 bg-background border border-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-navy px-6 py-3 rounded-lg font-semibold hover:bg-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {lang === 'es' ? 'Iniciando sesión...' : 'Signing in...'}
                </>
              ) : (
                lang === 'es' ? 'Iniciar Sesión' : 'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gold/20">
            <p className="text-xs text-muted-foreground">
              {lang === 'es'
                ? 'Solo personal autorizado'
                : 'Authorized personnel only'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

