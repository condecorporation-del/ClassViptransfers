import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Truck, Plus, AlertCircle, Loader2, CheckCircle2, X, Phone, Mail, CarFront } from 'lucide-react';
import { useAdminAuth } from '@/features/admin/hooks/useAdminAuth';
import { getApiBaseUrl } from '@/shared/lib/api';

const apiUrl = (path: string) => {
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
};

type Driver = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  active: boolean;
  createdAt: string;
};

type Vehicle = {
  id: string;
  make: string;
  model: string;
  plate: string;
  capacity: number;
  active: boolean;
  createdAt: string;
};

const GOLD = '#D9AE5F';

// ─── Shared sub-components ────────────────────────────────────────────────────

function ActiveDot({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-400' : 'bg-slate-500'}`}
        style={active ? { boxShadow: '0 0 6px rgba(52,211,153,0.7)' } : undefined} />
      <span className={`text-[10px] font-bold uppercase tracking-wide ${active ? 'text-emerald-400' : 'text-slate-500'}`}>
        {active ? 'Activo' : 'Inactivo'}
      </span>
    </div>
  );
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(' ');
  const letters = parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm"
      style={{
        background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.06))',
        border: '1px solid rgba(212,175,55,0.25)',
        color: GOLD,
        letterSpacing: '0.05em',
      }}>
      {letters.toUpperCase()}
    </div>
  );
}

function FieldInput({ label, value, onChange, type = 'text', placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-[0.18em] mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none transition-all"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
        onFocus={(e) => { e.currentTarget.style.border = '1px solid rgba(212,175,55,0.4)'; e.currentTarget.style.background = 'rgba(212,175,55,0.04)'; }}
        onBlur={(e)  => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
      />
    </div>
  );
}

function Toast({ message, type, onDismiss }: { message: string; type: 'success' | 'error'; onDismiss: () => void }) {
  const isOk = type === 'success';
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold"
      style={{
        background: isOk ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
        border: `1px solid ${isOk ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
        color: isOk ? '#34d399' : '#f87171',
      }}
    >
      <div className="flex items-center gap-2">
        {isOk ? <CheckCircle2 size={14} className="shrink-0" /> : <AlertCircle size={14} className="shrink-0" />}
        {message}
      </div>
      <button onClick={onDismiss} className="shrink-0 hover:opacity-70 transition-opacity"><X size={13} /></button>
    </motion.div>
  );
}

// ─── Drivers column ───────────────────────────────────────────────────────────

function DriversColumn({ getAuthHeaders }: { getAuthHeaders: () => Record<string, string> }) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formName, setFormName]   = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');

  const fetchDrivers = useCallback(async () => {
    setLoading(true); setLoadError(null);
    try {
      const res = await fetch(apiUrl('/api/admin/drivers'), { credentials: 'include', headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success && json.data) setDrivers(json.data as Driver[]);
      else setLoadError('No se pudo cargar la lista de conductores.');
    } catch { setLoadError('No se pudo cargar la lista de conductores.'); }
    finally { setLoading(false); }
  }, [getAuthHeaders]);

  useEffect(() => { void fetchDrivers(); }, [fetchDrivers]);

  const resetForm = () => { setFormName(''); setFormPhone(''); setFormEmail(''); setShowForm(false); };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true); setResult(null);
    try {
      const res = await fetch(apiUrl('/api/admin/drivers'), {
        method: 'POST', credentials: 'include',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), phone: formPhone.trim() || undefined, email: formEmail.trim() || undefined }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setResult({ message: 'Conductor agregado correctamente.', type: 'success' });
        resetForm(); await fetchDrivers();
      } else {
        setResult({ message: json.error || 'No se pudo agregar el conductor.', type: 'error' });
      }
    } catch { setResult({ message: 'Error de conexión.', type: 'error' }); }
    finally { setSaving(false); }
  };

  const activeCount = drivers.filter((d) => d.active).length;

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(180deg, #060f1e 0%, #080f20 100%)', border: '1px solid rgba(212,175,55,0.15)', boxShadow: '0 16px 50px rgba(0,0,0,0.22)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
            <Users size={17} style={{ color: GOLD }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm">Conductores</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black" style={{ background: 'rgba(212,175,55,0.1)', color: GOLD }}>{drivers.length}</span>
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {activeCount} activo{activeCount !== 1 ? 's' : ''} de {drivers.length}
            </p>
          </div>
        </div>
        <button onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-navy transition-all hover:brightness-110 hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #c9a227, #f0c040)', boxShadow: '0 4px 12px rgba(212,175,55,0.3)' }}>
          <Plus size={13} /> Agregar
        </button>
      </div>

      <div className="p-5 flex flex-col gap-4 flex-1">
        <AnimatePresence>
          {result && <Toast message={result.message} type={result.type} onDismiss={() => setResult(null)} />}
        </AnimatePresence>

        {/* Add form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: 'rgba(212,175,55,0.5)' }}>Nuevo Conductor</p>
                <FieldInput label="Nombre" value={formName} onChange={setFormName} placeholder="Nombre completo" required />
                <FieldInput label="Teléfono" type="tel" value={formPhone} onChange={setFormPhone} placeholder="+52 624 000 0000" />
                <FieldInput label="Email" type="email" value={formEmail} onChange={setFormEmail} placeholder="conductor@ejemplo.com" />
                <div className="flex items-center gap-2 pt-1">
                  <button onClick={() => void handleSave()} disabled={saving || !formName.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-black text-navy disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, #c9a227, #f0c040)' }}>
                    {saving && <Loader2 size={12} className="animate-spin" />}
                    Guardar
                  </button>
                  <button onClick={resetForm} disabled={saving}
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        {loading ? (
          <div className="flex justify-center items-center py-14"><Loader2 size={20} className="animate-spin text-gold" /></div>
        ) : loadError ? (
          <div className="flex items-start gap-2 p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            <AlertCircle size={14} className="shrink-0 mt-0.5" /> {loadError}
          </div>
        ) : drivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Users size={22} style={{ color: 'rgba(255,255,255,0.2)' }} />
            </div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No hay conductores registrados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {drivers.map((driver, i) => (
              <motion.div key={driver.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="flex items-center gap-3 p-3 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.04)'; e.currentTarget.style.border = '1px solid rgba(212,175,55,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)'; }}
              >
                <Initials name={driver.name} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white leading-tight truncate">{driver.name}</p>
                  <div className="flex flex-wrap gap-3 mt-0.5">
                    {driver.phone && (
                      <span className="flex items-center gap-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        <Phone size={9} /> {driver.phone}
                      </span>
                    )}
                    {driver.email && (
                      <span className="flex items-center gap-1 text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        <Mail size={9} /> {driver.email}
                      </span>
                    )}
                  </div>
                </div>
                <ActiveDot active={driver.active} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Vehicles column ──────────────────────────────────────────────────────────

function VehiclesColumn({ getAuthHeaders }: { getAuthHeaders: () => Record<string, string> }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formMake, setFormMake]       = useState('');
  const [formModel, setFormModel]     = useState('');
  const [formPlate, setFormPlate]     = useState('');
  const [formCapacity, setFormCapacity] = useState('14');

  const fetchVehicles = useCallback(async () => {
    setLoading(true); setLoadError(null);
    try {
      const res = await fetch(apiUrl('/api/admin/vehicles'), { credentials: 'include', headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success && json.data) setVehicles(json.data as Vehicle[]);
      else setLoadError('No se pudo cargar la lista de vehículos.');
    } catch { setLoadError('No se pudo cargar la lista de vehículos.'); }
    finally { setLoading(false); }
  }, [getAuthHeaders]);

  useEffect(() => { void fetchVehicles(); }, [fetchVehicles]);

  const resetForm = () => { setFormMake(''); setFormModel(''); setFormPlate(''); setFormCapacity('14'); setShowForm(false); };

  const handleSave = async () => {
    if (!formMake.trim() || !formModel.trim() || !formPlate.trim()) return;
    setSaving(true); setResult(null);
    try {
      const res = await fetch(apiUrl('/api/admin/vehicles'), {
        method: 'POST', credentials: 'include',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ make: formMake.trim(), model: formModel.trim(), plate: formPlate.trim().toUpperCase(), capacity: parseInt(formCapacity, 10) || 14 }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setResult({ message: 'Vehículo agregado correctamente.', type: 'success' });
        resetForm(); await fetchVehicles();
      } else {
        setResult({ message: json.error || 'No se pudo agregar el vehículo.', type: 'error' });
      }
    } catch { setResult({ message: 'Error de conexión.', type: 'error' }); }
    finally { setSaving(false); }
  };

  const activeCount = vehicles.filter((v) => v.active).length;
  const formValid = formMake.trim() && formModel.trim() && formPlate.trim();

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(180deg, #060f1e 0%, #080f20 100%)', border: '1px solid rgba(212,175,55,0.15)', boxShadow: '0 16px 50px rgba(0,0,0,0.22)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)' }}>
            <Truck size={17} style={{ color: '#60a5fa' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm">Vehículos</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black" style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>{vehicles.length}</span>
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {activeCount} activo{activeCount !== 1 ? 's' : ''} de {vehicles.length}
            </p>
          </div>
        </div>
        <button onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-navy transition-all hover:brightness-110 hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #c9a227, #f0c040)', boxShadow: '0 4px 12px rgba(212,175,55,0.3)' }}>
          <Plus size={13} /> Agregar
        </button>
      </div>

      <div className="p-5 flex flex-col gap-4 flex-1">
        <AnimatePresence>
          {result && <Toast message={result.message} type={result.type} onDismiss={() => setResult(null)} />}
        </AnimatePresence>

        {/* Add form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: 'rgba(212,175,55,0.5)' }}>Nuevo Vehículo</p>
                <div className="grid grid-cols-2 gap-3">
                  <FieldInput label="Marca" value={formMake} onChange={setFormMake} placeholder="Mercedes" required />
                  <FieldInput label="Modelo" value={formModel} onChange={setFormModel} placeholder="Sprinter" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldInput label="Placa" value={formPlate} onChange={(v) => setFormPlate(v.toUpperCase())} placeholder="ABC-1234" required />
                  <FieldInput label="Capacidad (pax)" type="number" value={formCapacity} onChange={setFormCapacity} placeholder="14" />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button onClick={() => void handleSave()} disabled={saving || !formValid}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-black text-navy disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, #c9a227, #f0c040)' }}>
                    {saving && <Loader2 size={12} className="animate-spin" />}
                    Guardar
                  </button>
                  <button onClick={resetForm} disabled={saving}
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        {loading ? (
          <div className="flex justify-center items-center py-14"><Loader2 size={20} className="animate-spin text-gold" /></div>
        ) : loadError ? (
          <div className="flex items-start gap-2 p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            <AlertCircle size={14} className="shrink-0 mt-0.5" /> {loadError}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Truck size={22} style={{ color: 'rgba(255,255,255,0.2)' }} />
            </div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No hay vehículos registrados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {vehicles.map((vehicle, i) => (
              <motion.div key={vehicle.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="flex items-center gap-3 p-3 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(96,165,250,0.04)'; e.currentTarget.style.border = '1px solid rgba(96,165,250,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)'; }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)' }}>
                  <CarFront size={16} style={{ color: '#60a5fa' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-white leading-tight">{vehicle.make} {vehicle.model}</p>
                    <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-md"
                      style={{ background: 'rgba(212,175,55,0.1)', color: GOLD, border: '1px solid rgba(212,175,55,0.2)' }}>
                      {vehicle.plate}
                    </span>
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {vehicle.capacity} pax
                  </p>
                </div>
                <ActiveDot active={vehicle.active} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function RRHHTab() {
  const { getAuthHeaders } = useAdminAuth();

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl overflow-hidden px-6 py-5 md:px-8 md:py-6"
        style={{
          background: 'linear-gradient(135deg, #060f1e 0%, #0c1829 60%, #050d1a 100%)',
          border: '1px solid rgba(212,175,55,0.18)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.22), inset 0 1px 0 rgba(212,175,55,0.06)',
        }}
      >
        <div className="absolute -top-16 right-0 w-64 h-64 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 65%)' }} />
        <div className="relative">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-2" style={{ color: 'rgba(212,175,55,0.45)' }}>
            Class VIP · RRHH
          </p>
          <p className="font-display font-black text-white mb-1" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)' }}>
            Recursos Humanos
          </p>
          <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Gestión de conductores y flota vehicular
          </p>
        </div>
      </motion.div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <DriversColumn getAuthHeaders={getAuthHeaders} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.18 }}>
          <VehiclesColumn getAuthHeaders={getAuthHeaders} />
        </motion.div>
      </div>
    </div>
  );
}
