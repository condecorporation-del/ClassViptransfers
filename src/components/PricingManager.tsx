import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, Save, X } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getApiBaseUrl } from '@/lib/api';

const getAdminUrl = (path: string) => {
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
};

interface PricingRule {
  id: string;
  active: boolean;
  serviceType: string;
  tripType: string;
  zoneFrom: string;
  zoneTo: string;
  vehicleClass: string;
  basePriceCents: number;
  currency: string;
  passengersMin?: number;
  passengersMax?: number;
  notes?: string;
}

interface PricingExtra {
  id: string;
  active: boolean;
  code: string;
  label: string;
  priceCents: number;
  pricingMode: string;
  maxQty?: number;
  description?: string;
}

interface Area {
  id: string;
  name: string;
  oneWayPriceCents: number;
  roundTripPriceCents: number;
  isActive: boolean;
}

export function PricingManager() {
  const { getAuthHeaders } = useAdminAuth();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [extras, setExtras] = useState<PricingExtra[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rules' | 'extras' | 'areas'>('areas');
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [editingExtra, setEditingExtra] = useState<PricingExtra | null>(null);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [showAreaForm, setShowAreaForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesRes, extrasRes, areasRes] = await Promise.all([
        fetch(getAdminUrl('/api/admin/pricing/rules'), { credentials: 'include', headers: getAuthHeaders() }),
        fetch(getAdminUrl('/api/admin/pricing/extras'), { credentials: 'include', headers: getAuthHeaders() }),
        fetch(getAdminUrl('/api/admin/pricing/areas?includeInactive=true'), { credentials: 'include', headers: getAuthHeaders() }),
      ]);

      const rulesData = await rulesRes.json();
      const extrasData = await extrasRes.json();
      const areasData = await areasRes.json();

      if (rulesData.success) setRules(rulesData.data);
      if (extrasData.success) setExtras(extrasData.data);
      if (areasData.success) setAreas(areasData.data);
    } catch (error) {
      console.error('Failed to fetch pricing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const res = await fetch(getAdminUrl(`/api/admin/pricing/rules/${id}`), {
        credentials: 'include',
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const handleDeleteExtra = async (id: string) => {
    if (!confirm('Are you sure you want to delete this extra?')) return;

    try {
      const res = await fetch(getAdminUrl(`/api/admin/pricing/extras/${id}`), {
        credentials: 'include',
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to delete extra:', error);
    }
  };

  const handleSaveRule = async (rule: Partial<PricingRule>) => {
    try {
      const url = editingRule
        ? getAdminUrl(`/api/admin/pricing/rules/${editingRule.id}`)
        : getAdminUrl('/api/admin/pricing/rules');
      const method = editingRule ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });

      if (res.ok) {
        setShowRuleForm(false);
        setEditingRule(null);
        fetchData();
      }
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const handleSaveExtra = async (extra: Partial<PricingExtra>) => {
    try {
      const url = editingExtra
        ? getAdminUrl(`/api/admin/pricing/extras/${editingExtra.id}`)
        : getAdminUrl('/api/admin/pricing/extras');
      const method = editingExtra ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(extra),
      });

      if (res.ok) {
        setShowExtraForm(false);
        setEditingExtra(null);
        fetchData();
      }
    } catch (error) {
      console.error('Failed to save extra:', error);
    }
  };

  const handleSaveArea = async (area: { name?: string; oneWayPriceCents?: number; roundTripPriceCents?: number }) => {
    try {
      const url = editingArea
        ? getAdminUrl(`/api/admin/pricing/areas/${editingArea.id}`)
        : getAdminUrl('/api/admin/pricing/areas');
      const method = editingArea ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(area),
      });

      if (res.ok) {
        setShowAreaForm(false);
        setEditingArea(null);
        fetchData();
      }
    } catch (error) {
      console.error('Failed to save area:', error);
    }
  };

  const handleDeactivateArea = async (id: string) => {
    if (!confirm('Deactivate this area? It will no longer appear in the booking form.')) return;
    try {
      const res = await fetch(getAdminUrl(`/api/admin/pricing/areas/${id}`), {
        credentials: 'include',
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Failed to deactivate area:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('areas')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'areas'
              ? 'border-b-2 border-gold text-gold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Areas
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'rules'
              ? 'border-b-2 border-gold text-gold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Pricing Rules
        </button>
        <button
          onClick={() => setActiveTab('extras')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'extras'
              ? 'border-b-2 border-gold text-gold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Pricing Extras
        </button>
      </div>

      {/* Areas Tab */}
      {activeTab === 'areas' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Areas</h2>
            <button
              onClick={() => {
                setEditingArea(null);
                setShowAreaForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gold text-navy rounded-lg hover:bg-gold/90 transition-colors"
            >
              <Plus size={16} />
              Add Area
            </button>
          </div>

          {showAreaForm && (
            <AreaForm
              area={editingArea}
              onSave={handleSaveArea}
              onCancel={() => {
                setShowAreaForm(false);
                setEditingArea(null);
              }}
            />
          )}

          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">One-way (USD)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Round-trip (USD)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {areas.map((area) => (
                  <tr key={area.id} className={!area.isActive ? 'opacity-50' : ''}>
                    <td className="px-4 py-3 text-sm font-medium">{area.name}</td>
                    <td className="px-4 py-3 text-sm">${(area.oneWayPriceCents / 100).toFixed(0)}</td>
                    <td className="px-4 py-3 text-sm">${(area.roundTripPriceCents / 100).toFixed(0)}</td>
                    <td className="px-4 py-3 text-sm">{area.isActive ? 'Active' : 'Inactive'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingArea(area);
                            setShowAreaForm(true);
                          }}
                          className="p-1.5 rounded hover:bg-muted"
                        >
                          <Edit size={14} />
                        </button>
                        {area.isActive && (
                          <button
                            onClick={() => handleDeactivateArea(area.id)}
                            className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                            title="Deactivate"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Pricing Rules</h2>
            <button
              onClick={() => {
                setEditingRule(null);
                setShowRuleForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gold text-navy rounded-lg hover:bg-gold/90 transition-colors"
            >
              <Plus size={16} />
              Add Rule
            </button>
          </div>

          {showRuleForm && (
            <RuleForm
              rule={editingRule}
              onSave={handleSaveRule}
              onCancel={() => {
                setShowRuleForm(false);
                setEditingRule(null);
              }}
            />
          )}

          <div className="border rounded-lg overflow-x-auto table-scroll-x">
            <table className="w-full min-w-[600px]">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">From</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">To</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Vehicle</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Trip</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Passengers</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rules.map((rule) => (
                  <tr key={rule.id} className={!rule.active ? 'opacity-50' : ''}>
                    <td className="px-4 py-3 text-sm">{rule.zoneFrom}</td>
                    <td className="px-4 py-3 text-sm">{rule.zoneTo}</td>
                    <td className="px-4 py-3 text-sm">{rule.vehicleClass}</td>
                    <td className="px-4 py-3 text-sm">{rule.tripType}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      ${(rule.basePriceCents / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {rule.passengersMin || '1'} - {rule.passengersMax || '∞'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingRule(rule);
                            setShowRuleForm(true);
                          }}
                          className="text-gold hover:text-gold/80"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Extras Tab */}
      {activeTab === 'extras' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h2 className="text-xl font-semibold">Pricing Extras</h2>
            <button
              onClick={() => {
                setEditingExtra(null);
                setShowExtraForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gold text-navy rounded-lg hover:bg-gold/90 transition-colors"
            >
              <Plus size={16} />
              Add Extra
            </button>
          </div>

          {showExtraForm && (
            <ExtraForm
              extra={editingExtra}
              onSave={handleSaveExtra}
              onCancel={() => {
                setShowExtraForm(false);
                setEditingExtra(null);
              }}
            />
          )}

          <div className="border rounded-lg overflow-x-auto table-scroll-x">
            <table className="w-full min-w-[500px]">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Label</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Mode</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Max Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {extras.map((extra) => (
                  <tr key={extra.id} className={!extra.active ? 'opacity-50' : ''}>
                    <td className="px-4 py-3 text-sm font-mono">{extra.code}</td>
                    <td className="px-4 py-3 text-sm">{extra.label}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      ${(extra.priceCents / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm">{extra.pricingMode}</td>
                    <td className="px-4 py-3 text-sm">{extra.maxQty || '∞'}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingExtra(extra);
                            setShowExtraForm(true);
                          }}
                          className="text-gold hover:text-gold/80"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteExtra(extra.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function AreaForm({
  area,
  onSave,
  onCancel,
}: {
  area: Area | null;
  onSave: (area: { name?: string; oneWayPriceCents?: number; roundTripPriceCents?: number }) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: area?.name || '',
    oneWayPrice: area ? area.oneWayPriceCents / 100 : 0,
    roundTripPrice: area ? area.roundTripPriceCents / 100 : 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData.name.trim(),
      oneWayPriceCents: Math.round(formData.oneWayPrice * 100),
      roundTripPriceCents: Math.round(formData.roundTripPrice * 100),
    });
  };

  return (
    <div className="border rounded-lg p-6 bg-card space-y-4">
      <h3 className="text-lg font-semibold">{area ? 'Edit Area' : 'New Area'}</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="e.g. Cabo San Lucas"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">One-way price (USD)</label>
          <input
            type="number"
            min={0}
            step={1}
            required
            value={formData.oneWayPrice || ''}
            onChange={(e) => setFormData({ ...formData, oneWayPrice: Number(e.target.value) || 0 })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Round-trip price (USD)</label>
          <input
            type="number"
            min={0}
            step={1}
            required
            value={formData.roundTripPrice || ''}
            onChange={(e) => setFormData({ ...formData, roundTripPrice: Number(e.target.value) || 0 })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div className="sm:col-span-3 flex gap-2">
          <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-gold text-navy rounded-lg hover:bg-gold/90">
            <Save size={16} />
            {area ? 'Update' : 'Create'}
          </button>
          <button type="button" onClick={onCancel} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted">
            <X size={16} />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function RuleForm({
  rule,
  onSave,
  onCancel,
}: {
  rule: PricingRule | null;
  onSave: (rule: Partial<PricingRule>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    active: rule?.active ?? true,
    serviceType: rule?.serviceType || 'TRANSFER',
    tripType: rule?.tripType || 'ONE_WAY',
    zoneFrom: rule?.zoneFrom || '',
    zoneTo: rule?.zoneTo || '',
    vehicleClass: rule?.vehicleClass || 'SUV',
    basePriceCents: rule ? rule.basePriceCents / 100 : 0,
    currency: rule?.currency || 'USD',
    passengersMin: rule?.passengersMin || undefined,
    passengersMax: rule?.passengersMax || undefined,
    notes: rule?.notes || '',
  });

  return (
    <div className="border rounded-lg p-6 bg-card space-y-4">
      <h3 className="text-lg font-semibold">{rule ? 'Edit Rule' : 'New Rule'}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Zone From</label>
          <input
            type="text"
            value={formData.zoneFrom}
            onChange={(e) => setFormData({ ...formData, zoneFrom: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Zone To</label>
          <input
            type="text"
            value={formData.zoneTo}
            onChange={(e) => setFormData({ ...formData, zoneTo: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Vehicle Class</label>
          <select
            value={formData.vehicleClass}
            onChange={(e) => setFormData({ ...formData, vehicleClass: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="SUV">SUV</option>
            <option value="SPRINTER">Sprinter</option>
            <option value="VAN">Van</option>
            <option value="SEDAN">Sedan</option>
            <option value="LUXURY">Luxury</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Trip Type</label>
          <select
            value={formData.tripType}
            onChange={(e) => setFormData({ ...formData, tripType: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="ONE_WAY">One Way</option>
            <option value="ROUND_TRIP">Round Trip</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Base Price (USD)</label>
          <input
            type="number"
            step="0.01"
            value={formData.basePriceCents}
            onChange={(e) => setFormData({ ...formData, basePriceCents: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Passengers Min</label>
          <input
            type="number"
            value={formData.passengersMin || ''}
            onChange={(e) =>
              setFormData({ ...formData, passengersMin: e.target.value ? parseInt(e.target.value) : undefined })
            }
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Passengers Max</label>
          <input
            type="number"
            value={formData.passengersMax || ''}
            onChange={(e) =>
              setFormData({ ...formData, passengersMax: e.target.value ? parseInt(e.target.value) : undefined })
            }
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave({ ...formData, basePriceCents: Math.round(formData.basePriceCents * 100) })}
          className="flex items-center gap-2 px-4 py-2 bg-gold text-navy rounded-lg hover:bg-gold/90"
        >
          <Save size={16} />
          Save
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted"
        >
          <X size={16} />
          Cancel
        </button>
      </div>
    </div>
  );
}

function ExtraForm({
  extra,
  onSave,
  onCancel,
}: {
  extra: PricingExtra | null;
  onSave: (extra: Partial<PricingExtra>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    active: extra?.active ?? true,
    code: extra?.code || 'GROCERY_STOP',
    label: extra?.label || '',
    priceCents: extra ? extra.priceCents / 100 : 0,
    pricingMode: extra?.pricingMode || 'PER_BOOKING',
    maxQty: extra?.maxQty || undefined,
    description: extra?.description || '',
  });

  return (
    <div className="border rounded-lg p-6 bg-card space-y-4">
      <h3 className="text-lg font-semibold">{extra ? 'Edit Extra' : 'New Extra'}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Code</label>
          <select
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="GROCERY_STOP">Grocery Stop</option>
            <option value="EXTRA_STOP">Extra Stop</option>
            <option value="BABY_SEAT">Baby Seat</option>
            <option value="BOOSTER">Booster</option>
            <option value="SPECIAL_ASSISTANCE">Special Assistance</option>
            <option value="OVERSIZE_LUGGAGE">Oversize Luggage</option>
            <option value="CHAMPAGNE">Champagne</option>
            <option value="CHAMPAGNE_UPGRADE">Champagne (Moët)</option>
            <option value="LUXURY_WELCOME">Luxury Welcome</option>
            <option value="ROMANTIC_KIT">Romantic Kit</option>
            <option value="BIRTHDAY_KIT">Birthday Kit</option>
            <option value="DELUXE_ARRIVAL_KIT">Deluxe Arrival Kit</option>
            <option value="INCLUDED_BASIC_KIT">Included Basic Kit</option>
            <option value="WAIT_TIME">Wait Time</option>
            <option value="LATE_NIGHT">Late Night</option>
            <option value="EARLY_MORNING">Early Morning</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Label</label>
          <input
            type="text"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Price (USD)</label>
          <input
            type="number"
            step="0.01"
            value={formData.priceCents}
            onChange={(e) => setFormData({ ...formData, priceCents: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Pricing Mode</label>
          <select
            value={formData.pricingMode}
            onChange={(e) => setFormData({ ...formData, pricingMode: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="PER_BOOKING">Per Booking</option>
            <option value="PER_STOP">Per Stop</option>
            <option value="PER_SEAT">Per Seat</option>
            <option value="PER_HOUR">Per Hour</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Max Quantity</label>
          <input
            type="number"
            value={formData.maxQty || ''}
            onChange={(e) =>
              setFormData({ ...formData, maxQty: e.target.value ? parseInt(e.target.value) : undefined })
            }
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave({ ...formData, priceCents: Math.round(formData.priceCents * 100) })}
          className="flex items-center gap-2 px-4 py-2 bg-gold text-navy rounded-lg hover:bg-gold/90"
        >
          <Save size={16} />
          Save
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted"
        >
          <X size={16} />
          Cancel
        </button>
      </div>
    </div>
  );
}

