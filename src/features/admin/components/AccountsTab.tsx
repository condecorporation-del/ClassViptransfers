import { useEffect, useMemo, useState } from 'react';
import { Banknote, CalendarDays, CreditCard, FileText, Loader2, Phone, PlusCircle, ReceiptText, UserRound, Wallet } from 'lucide-react';
import { useAdminAuth } from '@/features/admin/hooks/useAdminAuth';
import { getApiBaseUrl } from '@/shared/lib/api';

const apiUrl = (path: string) => {
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
};

type ChargeStatus = 'PENDING' | 'INVOICED' | 'PAID' | 'VOID';

type AccountSummary = {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  status: string;
  balanceCents: number;
  chargeCount: number;
  paymentCount: number;
};

type AccountDetail = AccountSummary & {
  notes?: string | null;
  creditLimitCents?: number | null;
  totals?: {
    chargesCents: number;
    paymentsCents: number;
  };
  charges: Array<{
    id: string;
    description: string;
    amountCents: number;
    status: ChargeStatus;
    notes?: string | null;
    serviceDate?: string | null;
    booking?: {
      id: string;
      confirmationCode?: string | null;
      bookingDate?: string | null;
      bookingTime?: string | null;
      pickupLocation?: string | null;
      dropoffLocation?: string | null;
      notes?: string | null;
      customer?: { name?: string | null } | null;
    } | null;
  }>;
  payments: Array<{
    id: string;
    amountCents: number;
    method: string;
    reference?: string | null;
    receivedAt: string;
  }>;
};

const chargeStatusLabels: Record<ChargeStatus, string> = {
  PENDING: 'Por pagar',
  INVOICED: 'Facturado',
  PAID: 'Pagado',
  VOID: 'Anulado',
};

function usd(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function chargeStatusClass(status: ChargeStatus) {
  if (status === 'PAID') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (status === 'INVOICED') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (status === 'VOID') return 'bg-slate-100 text-slate-600 border-slate-200';
  return 'bg-amber-100 text-amber-800 border-amber-200';
}

function accountStatusClass(status: string) {
  if (status === 'SETTLED') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (status === 'ON_HOLD') return 'bg-amber-100 text-amber-800 border-amber-200';
  if (status === 'CLOSED') return 'bg-slate-100 text-slate-700 border-slate-200';
  return 'bg-blue-100 text-blue-700 border-blue-200';
}

function formatDate(value?: string | null) {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(date?: string | null, time?: string | null) {
  const base = formatDate(date);
  return time ? `${base} · ${time}` : base;
}

export function AccountsTab({ onDataChange }: { onDataChange?: () => Promise<void> | void }) {
  const { getAuthHeaders } = useAdminAuth();
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState({ name: '', company: '', email: '', phone: '', notes: '' });
  const [chargeForm, setChargeForm] = useState({ description: '', amountUsd: '', bookingId: '' });
  const [paymentForm, setPaymentForm] = useState({ amountUsd: '', method: 'MANUAL', reference: '' });

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedId) || null,
    [accounts, selectedId]
  );

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/admin/accounts'), {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      const nextAccounts = json.success ? json.data : [];
      setAccounts(nextAccounts);
      if (!selectedId && nextAccounts.length > 0) {
        setSelectedId(nextAccounts[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (id: string) => {
    setBusy('detail');
    try {
      const res = await fetch(apiUrl(`/api/admin/accounts/${id}`), {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      setDetail(json.success ? json.data : null);
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    void fetchAccounts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedId) {
      void fetchDetail(selectedId);
    } else {
      setDetail(null);
    }
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const postJson = async (path: string, body: unknown, method = 'POST') => {
    const response = await fetch(apiUrl(path), {
      method,
      credentials: 'include',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return response.json();
  };

  const refreshSelected = async (accountId: string) => {
    await fetchAccounts();
    await fetchDetail(accountId);
    await onDataChange?.();
  };

  const createAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy('create-account');
    try {
      const json = await postJson('/api/admin/accounts', {
        name: accountForm.name,
        company: accountForm.company || null,
        email: accountForm.email || null,
        phone: accountForm.phone || null,
        notes: accountForm.notes || null,
      });
      if (json.success) {
        setAccountForm({ name: '', company: '', email: '', phone: '', notes: '' });
        await fetchAccounts();
        setSelectedId(json.data.id);
        await onDataChange?.();
      }
    } finally {
      setBusy(null);
    }
  };

  const addCharge = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId) return;
    setBusy('charge');
    try {
      const json = chargeForm.bookingId.trim()
        ? await postJson(`/api/admin/accounts/${selectedId}/bookings`, { bookingId: chargeForm.bookingId.trim() })
        : await postJson(`/api/admin/accounts/${selectedId}/charges`, {
            description: chargeForm.description,
            amountCents: Math.round((parseFloat(chargeForm.amountUsd) || 0) * 100),
            status: 'PENDING',
          });

      if (json.success) {
        setChargeForm({ description: '', amountUsd: '', bookingId: '' });
        await refreshSelected(selectedId);
      }
    } finally {
      setBusy(null);
    }
  };

  const addPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId) return;
    setBusy('payment');
    try {
      const json = await postJson(`/api/admin/accounts/${selectedId}/payments`, {
        amountCents: Math.round((parseFloat(paymentForm.amountUsd) || 0) * 100),
        method: paymentForm.method,
        reference: paymentForm.reference || null,
      });
      if (json.success) {
        setPaymentForm({ amountUsd: '', method: 'MANUAL', reference: '' });
        await refreshSelected(selectedId);
      }
    } finally {
      setBusy(null);
    }
  };

  const updateChargeStatus = async (chargeId: string, status: ChargeStatus) => {
    if (!selectedId) return;
    setBusy(`charge-status-${chargeId}`);
    try {
      const json = await postJson(`/api/admin/accounts/${selectedId}/charges/${chargeId}`, { status }, 'PATCH');
      if (json.success) {
        await refreshSelected(selectedId);
      }
    } finally {
      setBusy(null);
    }
  };

  const outstandingCharges = detail?.charges.filter((charge) => charge.status === 'PENDING' || charge.status === 'INVOICED') ?? [];
  const statusSummary = useMemo(() => {
    if (!detail) {
      return { pending: 0, invoiced: 0, paid: 0, voided: 0 };
    }
    return detail.charges.reduce(
      (acc, charge) => {
        if (charge.status === 'PENDING') acc.pending += 1;
        else if (charge.status === 'INVOICED') acc.invoiced += 1;
        else if (charge.status === 'PAID') acc.paid += 1;
        else if (charge.status === 'VOID') acc.voided += 1;
        return acc;
      },
      { pending: 0, invoiced: 0, paid: 0, voided: 0 }
    );
  }, [detail]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Client Credit</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Open Accounts</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Lleva el control de servicios, cargos y liquidaciones en una sola vista, con mejor lectura para operacion y cobranza.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <form onSubmit={createAccount} className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-gold/10 p-3 text-gold">
                <PlusCircle size={18} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Nueva cuenta</p>
                <h2 className="font-display text-xl font-bold text-foreground">Abrir credito</h2>
              </div>
            </div>
            <input value={accountForm.name} onChange={(e) => setAccountForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nombre del cliente o villa" className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
            <input value={accountForm.company} onChange={(e) => setAccountForm((p) => ({ ...p, company: e.target.value }))} placeholder="Empresa o propiedad" className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
            <input value={accountForm.email} onChange={(e) => setAccountForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
            <input value={accountForm.phone} onChange={(e) => setAccountForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Telefono" className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
            <textarea value={accountForm.notes} onChange={(e) => setAccountForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Notas operativas" rows={4} className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
            <button disabled={busy === 'create-account'} className="w-full rounded-2xl bg-[hsl(var(--navy))] px-4 py-3.5 text-sm font-bold text-gold disabled:opacity-50">
              {busy === 'create-account' ? 'Creando...' : 'Crear cuenta'}
            </button>
          </form>

          <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                <Wallet size={18} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Cuentas</p>
                <h2 className="font-display text-xl font-bold text-foreground">Expedientes abiertos</h2>
              </div>
            </div>

            {loading ? (
              <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-gold" size={22} /></div>
            ) : (
              <div className="space-y-3">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => setSelectedId(account.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${
                      selectedId === account.id ? 'border-gold bg-gold/5 shadow-sm' : 'border-border/70 bg-background hover:border-gold/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-semibold text-foreground">{account.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{account.company || account.email || 'Cuenta directa'}</p>
                      </div>
                      <div className="text-right">
                        <span className="block text-sm font-display font-bold text-foreground">{usd(account.balanceCents)}</span>
                        <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${accountStatusClass(account.status)}`}>
                          {account.status}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
                {accounts.length === 0 && <p className="py-5 text-sm text-muted-foreground">No hay cuentas abiertas todavia.</p>}
              </div>
            )}
          </div>
        </aside>

        <section className="space-y-6">
          {!selectedAccount && (
            <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
              Selecciona una cuenta para ver servicios, pagos y saldo pendiente.
            </div>
          )}

          {selectedAccount && detail && (
            <>
              <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-3xl font-bold text-foreground">{detail.name}</h2>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase ${accountStatusClass(detail.status)}`}>
                        {detail.status}
                      </span>
                    </div>
                    <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                      <div className="flex items-center gap-2"><UserRound size={14} />{detail.company || 'Cliente directo'}</div>
                      <div className="flex items-center gap-2"><Phone size={14} />{detail.phone || detail.email || 'Sin contacto'}</div>
                    </div>
                    {detail.notes && <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{detail.notes}</p>}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3 xl:min-w-[460px]">
                    {[
                      { label: 'Saldo actual', value: usd(detail.balanceCents), accent: 'text-foreground' },
                      { label: 'Por cobrar', value: usd(outstandingCharges.reduce((sum, charge) => sum + charge.amountCents, 0)), accent: 'text-amber-700' },
                      { label: 'Pagos aplicados', value: usd(detail.totals?.paymentsCents ?? 0), accent: 'text-emerald-700' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-border/70 bg-background p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{item.label}</p>
                        <p className={`mt-3 text-2xl font-display font-bold ${item.accent}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.25fr)_380px]">
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-4">
                    {[
                      { label: 'Por pagar', value: statusSummary.pending, tone: 'bg-amber-50 text-amber-800 border-amber-200' },
                      { label: 'Facturado', value: statusSummary.invoiced, tone: 'bg-blue-50 text-blue-800 border-blue-200' },
                      { label: 'Pagado', value: statusSummary.paid, tone: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                      { label: 'Anulado', value: statusSummary.voided, tone: 'bg-slate-50 text-slate-700 border-slate-200' },
                    ].map((item) => (
                      <div key={item.label} className={`rounded-2xl border p-4 ${item.tone}`}>
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em]">{item.label}</p>
                        <p className="mt-3 text-2xl font-display font-bold">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Servicios y cargos</p>
                        <h3 className="font-display text-xl font-bold text-foreground">Detalle completo de la cuenta</h3>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {detail.charges.map((charge) => (
                        <div key={charge.id} className="rounded-2xl border border-border/70 bg-background p-4 md:p-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-foreground">{charge.description}</p>
                                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${chargeStatusClass(charge.status)}`}>
                                  {chargeStatusLabels[charge.status]}
                                </span>
                              </div>

                              <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                                <div className="flex items-center gap-2">
                                  <CalendarDays size={13} />
                                  {charge.booking
                                    ? formatDateTime(charge.booking.bookingDate, charge.booking.bookingTime)
                                    : formatDate(charge.serviceDate)}
                                </div>
                                <div className="flex items-center gap-2">
                                  <CreditCard size={13} />
                                  {charge.booking?.confirmationCode ? `Reserva ${charge.booking.confirmationCode}` : 'Cargo manual'}
                                </div>
                              </div>

                              {charge.booking && (
                                <div className="rounded-2xl bg-card p-3 text-xs text-muted-foreground">
                                  <div className="grid gap-2 md:grid-cols-2">
                                    <p><span className="font-semibold text-foreground">Cliente:</span> {charge.booking.customer?.name || detail.name}</p>
                                    <p><span className="font-semibold text-foreground">Ruta:</span> {charge.booking.pickupLocation || 'Origen'} {'->'} {charge.booking.dropoffLocation || 'Destino'}</p>
                                    {charge.booking.notes && (
                                      <p className="md:col-span-2"><span className="font-semibold text-foreground">Notas:</span> {charge.booking.notes}</p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                              <div className="flex flex-col gap-3 lg:min-w-[200px] lg:items-end">
                                <div className="text-right">
                                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Monto</p>
                                  <p className="text-xl font-display font-bold text-foreground">{usd(charge.amountCents)}</p>
                                </div>
                                <select
                                value={charge.status}
                                onChange={(e) => void updateChargeStatus(charge.id, e.target.value as ChargeStatus)}
                                disabled={busy === `charge-status-${charge.id}`}
                                className="rounded-2xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground"
                              >
                                <option value="PENDING">Por pagar</option>
                                <option value="INVOICED">Facturado</option>
                                <option value="PAID">Pagado</option>
                                <option value="VOID">Anulado</option>
                              </select>
                              </div>
                          </div>
                        </div>
                      ))}
                      {detail.charges.length === 0 && <p className="text-sm text-muted-foreground">Todavia no hay servicios cargados en esta cuenta.</p>}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                        <Banknote size={18} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Pagos registrados</p>
                        <h3 className="font-display text-xl font-bold text-foreground">Ledger ejecutivo de pagos</h3>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {detail.payments.map((payment) => (
                        <div key={payment.id} className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-background p-4 md:flex-row md:items-center md:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{payment.method.replace('_', ' ')}</p>
                              <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                                Aplicado
                              </span>
                            </div>
                            <div className="grid gap-1 text-xs text-muted-foreground">
                              <p>{formatDate(payment.receivedAt)}</p>
                              {payment.reference && <p>Referencia: {payment.reference}</p>}
                            </div>
                          </div>
                          <span className="text-lg font-display font-bold text-emerald-700">{usd(payment.amountCents)}</span>
                        </div>
                      ))}
                      {detail.payments.length === 0 && <p className="text-sm text-muted-foreground">No hay pagos registrados todavia.</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <form onSubmit={addCharge} className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-gold/10 p-3 text-gold">
                        <ReceiptText size={18} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Nuevo cargo</p>
                        <h3 className="font-display text-xl font-bold text-foreground">Agregar servicio</h3>
                      </div>
                    </div>
                    <input value={chargeForm.bookingId} onChange={(e) => setChargeForm((p) => ({ ...p, bookingId: e.target.value }))} placeholder="ID de reserva existente (opcional)" className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
                    <input value={chargeForm.description} onChange={(e) => setChargeForm((p) => ({ ...p, description: e.target.value }))} placeholder="Descripcion del cargo" className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
                    <input value={chargeForm.amountUsd} onChange={(e) => setChargeForm((p) => ({ ...p, amountUsd: e.target.value }))} placeholder="Monto USD" type="number" min="0" step="0.01" className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
                    <button disabled={busy === 'charge'} className="w-full rounded-2xl bg-[hsl(var(--navy))] px-4 py-3.5 text-sm font-bold text-gold disabled:opacity-50">
                      {busy === 'charge' ? 'Guardando...' : 'Agregar cargo'}
                    </button>
                  </form>

                  <form onSubmit={addPayment} className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                        <Banknote size={18} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Nuevo pago</p>
                        <h3 className="font-display text-xl font-bold text-foreground">Aplicar abono</h3>
                      </div>
                    </div>
                    <input value={paymentForm.amountUsd} onChange={(e) => setPaymentForm((p) => ({ ...p, amountUsd: e.target.value }))} placeholder="Monto USD" type="number" min="0" step="0.01" className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
                    <select value={paymentForm.method} onChange={(e) => setPaymentForm((p) => ({ ...p, method: e.target.value }))} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm">
                      <option value="MANUAL">Manual</option>
                      <option value="CASH">Efectivo</option>
                      <option value="BANK_TRANSFER">Transferencia</option>
                      <option value="CARD">Tarjeta</option>
                    </select>
                    <input value={paymentForm.reference} onChange={(e) => setPaymentForm((p) => ({ ...p, reference: e.target.value }))} placeholder="Referencia o folio" className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
                    <button disabled={busy === 'payment'} className="w-full rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white disabled:opacity-50">
                      {busy === 'payment' ? 'Guardando...' : 'Registrar pago'}
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
