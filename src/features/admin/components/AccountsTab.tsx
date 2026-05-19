import { useEffect, useMemo, useState } from 'react';
import { Banknote, Landmark, Loader2, PlusCircle, ReceiptText, Wallet } from 'lucide-react';
import { useAdminAuth } from '@/features/admin/hooks/useAdminAuth';
import { getApiBaseUrl } from '@/shared/lib/api';

const apiUrl = (path: string) => {
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
};

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
  charges: Array<{
    id: string;
    description: string;
    amountCents: number;
    status: string;
    serviceDate?: string | null;
    booking?: { confirmationCode?: string | null } | null;
  }>;
  payments: Array<{
    id: string;
    amountCents: number;
    method: string;
    reference?: string | null;
    receivedAt: string;
  }>;
};

function usd(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AccountsTab() {
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
      setAccounts(json.success ? json.data : []);
      if (!selectedId && json.success && json.data.length > 0) {
        setSelectedId(json.data[0].id);
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

  const postJson = async (path: string, body: unknown) => {
    const response = await fetch(apiUrl(path), {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return response.json();
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
          });

      if (json.success) {
        setChargeForm({ description: '', amountUsd: '', bookingId: '' });
        await fetchAccounts();
        await fetchDetail(selectedId);
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
        await fetchAccounts();
        await fetchDetail(selectedId);
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold mb-1">Client Credit</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Open Accounts</h1>
        <p className="text-sm text-muted-foreground mt-1">Track running balances, ad hoc charges, and final settlement for repeat guests.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-5">
        <div className="space-y-5">
          <form onSubmit={createAccount} className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <PlusCircle size={16} className="text-gold" />
              <h2 className="font-display text-xl font-bold text-foreground">New Account</h2>
            </div>
            <input value={accountForm.name} onChange={(e) => setAccountForm((p) => ({ ...p, name: e.target.value }))} placeholder="Guest or villa account name" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
            <input value={accountForm.company} onChange={(e) => setAccountForm((p) => ({ ...p, company: e.target.value }))} placeholder="Company / villa (optional)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
            <input value={accountForm.email} onChange={(e) => setAccountForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
            <input value={accountForm.phone} onChange={(e) => setAccountForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
            <textarea value={accountForm.notes} onChange={(e) => setAccountForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Operational notes" rows={3} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none" />
            <button disabled={busy === 'create-account'} className="w-full rounded-xl bg-[hsl(var(--navy))] px-4 py-3 text-sm font-bold text-gold disabled:opacity-50">
              {busy === 'create-account' ? 'Creating…' : 'Create account'}
            </button>
          </form>

          <div className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Wallet size={16} className="text-blue-600" />
              <h2 className="font-display text-lg font-bold text-foreground">Accounts</h2>
            </div>
            {loading ? (
              <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-gold" size={20} /></div>
            ) : (
              <div className="space-y-2">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => setSelectedId(account.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition-all ${
                      selectedId === account.id ? 'border-gold bg-gold/5' : 'border-border/70 bg-background hover:border-gold/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{account.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{account.company || account.email || 'Direct client account'}</p>
                      </div>
                      <span className="text-sm font-display font-bold text-foreground">{usd(account.balanceCents)}</span>
                    </div>
                  </button>
                ))}
                {accounts.length === 0 && <p className="text-sm text-muted-foreground py-4">No open accounts yet.</p>}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          {!selectedAccount && (
            <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
              Select an account to manage charges and payments.
            </div>
          )}

          {selectedAccount && detail && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold mb-2">Balance</p>
                  <p className="text-3xl font-display font-bold text-foreground">{usd(detail.balanceCents)}</p>
                </div>
                <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold mb-2">Charges</p>
                  <p className="text-3xl font-display font-bold text-foreground">{detail.charges.length}</p>
                </div>
                <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold mb-2">Payments</p>
                  <p className="text-3xl font-display font-bold text-foreground">{detail.payments.length}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <form onSubmit={addCharge} className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <ReceiptText size={16} className="text-gold" />
                    <h2 className="font-display text-xl font-bold text-foreground">Add Charge</h2>
                  </div>
                  <input value={chargeForm.bookingId} onChange={(e) => setChargeForm((p) => ({ ...p, bookingId: e.target.value }))} placeholder="Attach existing booking ID (optional)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
                  <input value={chargeForm.description} onChange={(e) => setChargeForm((p) => ({ ...p, description: e.target.value }))} placeholder="Manual charge description" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
                  <input value={chargeForm.amountUsd} onChange={(e) => setChargeForm((p) => ({ ...p, amountUsd: e.target.value }))} placeholder="Amount USD" type="number" min="0" step="0.01" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
                  <button disabled={busy === 'charge'} className="w-full rounded-xl bg-[hsl(var(--navy))] px-4 py-3 text-sm font-bold text-gold disabled:opacity-50">
                    {busy === 'charge' ? 'Saving…' : 'Add charge'}
                  </button>
                </form>

                <form onSubmit={addPayment} className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <Banknote size={16} className="text-emerald-600" />
                    <h2 className="font-display text-xl font-bold text-foreground">Record Payment</h2>
                  </div>
                  <input value={paymentForm.amountUsd} onChange={(e) => setPaymentForm((p) => ({ ...p, amountUsd: e.target.value }))} placeholder="Amount USD" type="number" min="0" step="0.01" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
                  <select value={paymentForm.method} onChange={(e) => setPaymentForm((p) => ({ ...p, method: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
                    <option value="MANUAL">Manual</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank transfer</option>
                    <option value="CARD">Card</option>
                  </select>
                  <input value={paymentForm.reference} onChange={(e) => setPaymentForm((p) => ({ ...p, reference: e.target.value }))} placeholder="Reference / folio" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
                  <button disabled={busy === 'payment'} className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
                    {busy === 'payment' ? 'Saving…' : 'Record payment'}
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
                  <h3 className="font-display text-xl font-bold text-foreground mb-4">Charges Ledger</h3>
                  <div className="space-y-3">
                    {detail.charges.map((charge) => (
                      <div key={charge.id} className="rounded-2xl bg-muted/35 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">{charge.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {charge.booking?.confirmationCode ? `Booking ${charge.booking.confirmationCode}` : 'Manual charge'}
                              {charge.serviceDate ? ` · ${new Date(charge.serviceDate).toLocaleDateString('en-US')}` : ''}
                            </p>
                          </div>
                          <span className="text-sm font-display font-bold text-foreground">{usd(charge.amountCents)}</span>
                        </div>
                      </div>
                    ))}
                    {detail.charges.length === 0 && <p className="text-sm text-muted-foreground">No charges yet.</p>}
                  </div>
                </div>

                <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
                  <h3 className="font-display text-xl font-bold text-foreground mb-4">Payments Ledger</h3>
                  <div className="space-y-3">
                    {detail.payments.map((payment) => (
                      <div key={payment.id} className="rounded-2xl bg-muted/35 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{payment.method.replace('_', ' ')}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(payment.receivedAt).toLocaleDateString('en-US')}
                              {payment.reference ? ` · ${payment.reference}` : ''}
                            </p>
                          </div>
                          <span className="text-sm font-display font-bold text-emerald-600">{usd(payment.amountCents)}</span>
                        </div>
                      </div>
                    ))}
                    {detail.payments.length === 0 && <p className="text-sm text-muted-foreground">No payments recorded yet.</p>}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
