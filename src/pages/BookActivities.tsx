import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, ArrowLeft, Clock, Minus, Plus, Info, ToggleLeft, ToggleRight } from 'lucide-react';

const wizardSteps = ['combo', 'activities', 'date', 'info', 'review'] as const;

const allActivities = [
  { id: 'camel', key: 'activity.camel', duration: '1h' },
  { id: 'camelKids', key: 'activity.camelKids', duration: '1h' },
  { id: 'horseback', key: 'activity.horseback', duration: '1h' },
  { id: 'atv', key: 'activity.atv', duration: '1h' },
  { id: 'doubleMoto', key: 'activity.doubleMoto', duration: '1h' },
  { id: 'rzr', key: 'activity.rzr', duration: '1h' },
  { id: 'skyBikes', key: 'activity.skyBikes', duration: '1h' },
];

const BookActivities = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [comboType, setComboType] = useState<'combo' | 'crazy'>('combo');
  const [selected, setSelected] = useState<string[]>([]);
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState(2);
  const [info, setInfo] = useState({ name: '', email: '', phone: '' });
  const [needTransfer, setNeedTransfer] = useState(false);

  const maxActivities = comboType === 'combo' ? 2 : 3;
  const comboPrice = comboType === 'combo' ? 100 : 125;

  const toggle = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(v => v !== id);
      if (prev.length >= maxActivities) return prev;
      return [...prev, id];
    });
  };

  const next = () => setStep(s => Math.min(s + 1, wizardSteps.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const stepLabels = [
    t('bookAct.step1.title'), t('bookAct.step2.title'), t('bookAct.step3.title'),
    t('bookAct.step4.title'), t('bookAct.step5.title'),
  ];

  const renderStep = () => {
    switch (wizardSteps[step]) {
      case 'combo':
        return (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold">{t('bookAct.step1.title')}</h2>
            {[
              { id: 'combo' as const, label: t('bookAct.step1.combo') },
              { id: 'crazy' as const, label: t('bookAct.step1.crazy') },
            ].map(c => (
              <button key={c.id} onClick={() => { setComboType(c.id); setSelected([]); next(); }}
                className={`w-full glass-card rounded-xl p-5 text-left premium-card border transition-all flex items-center justify-between ${comboType === c.id ? 'border-gold' : 'border-border'}`}>
                <div>
                  <p className="font-semibold">{c.label}</p>
                  {c.id === 'crazy' && <span className="gold-gradient text-navy text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1">{t('home.activities.bestValue')}</span>}
                </div>
                {comboType === c.id && <div className="w-6 h-6 rounded-full gold-gradient flex items-center justify-center flex-shrink-0"><Check size={14} className="text-navy" /></div>}
              </button>
            ))}
          </div>
        );
      case 'activities':
        return (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold">{t('bookAct.step2.title')}</h2>
            <p className="text-muted-foreground text-sm">
              {selected.length}/{maxActivities} selected
            </p>
            {allActivities.map(act => (
              <button key={act.id} onClick={() => toggle(act.id)}
                className={`w-full glass-card rounded-xl p-4 text-left premium-card border transition-all flex items-center justify-between ${selected.includes(act.id) ? 'border-gold' : 'border-border'}`}>
                <div>
                  <p className="font-semibold text-sm">{t(act.key)}</p>
                  <p className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5"><Clock size={11} /> {act.duration}</p>
                </div>
                {selected.includes(act.id) && <div className="w-6 h-6 rounded-full gold-gradient flex items-center justify-center flex-shrink-0"><Check size={14} className="text-navy" /></div>}
              </button>
            ))}
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-accent/50 rounded-lg p-3 border border-border">
              <Info size={14} className="text-gold flex-shrink-0 mt-0.5" />
              <div>
                <p>{t('bookAct.step2.parkFee')}</p>
                <p className="mt-1">{t('bookAct.step2.insurance')}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t('bookAct.includes')}</p>
          </div>
        );
      case 'date':
        return (
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-bold">{t('bookAct.step3.title')}</h2>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('bookAct.step3.date')}</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full bg-accent/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('bookAct.step3.passengers')}</label>
              <div className="flex items-center gap-4">
                <button onClick={() => setPassengers(p => Math.max(1, p - 1))}
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors">
                  <Minus size={16} />
                </button>
                <span className="text-2xl font-bold w-8 text-center">{passengers}</span>
                <button onClick={() => setPassengers(p => Math.min(20, p + 1))}
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        );
      case 'info':
        return (
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-bold">{t('bookAct.step4.title')}</h2>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('bookAct.step4.name')}</label>
              <input type="text" value={info.name} onChange={e => setInfo({ ...info, name: e.target.value })}
                className="w-full bg-accent/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('bookAct.step4.email')}</label>
              <input type="email" value={info.email} onChange={e => setInfo({ ...info, email: e.target.value })}
                className="w-full bg-accent/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('bookAct.step4.phone')}</label>
              <input type="tel" value={info.phone} onChange={e => setInfo({ ...info, phone: e.target.value })}
                className="w-full bg-accent/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50" />
            </div>
            <button onClick={() => setNeedTransfer(!needTransfer)}
              className="w-full glass-card rounded-xl p-4 text-left premium-card border border-border flex items-center justify-between">
              <span className="font-medium text-sm">{t('bookAct.step4.needTransfer')}</span>
              {needTransfer ? <ToggleRight size={24} className="text-gold" /> : <ToggleLeft size={24} className="text-muted-foreground" />}
            </button>
          </div>
        );
      case 'review':
        return (
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-bold">{t('bookAct.step5.title')}</h2>
            <div className="glass-card rounded-xl p-6 space-y-3 text-sm border border-border">
              <div className="flex justify-between"><span className="text-muted-foreground">Combo</span><span className="font-medium capitalize">{comboType}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('book.step.activities')}</span><span className="font-medium">{selected.join(', ')}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('book.review.date')}</span><span className="font-medium">{date || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('book.review.passengers')}</span><span className="font-medium">{passengers}</span></div>
              {info.name && <div className="flex justify-between"><span className="text-muted-foreground">{t('bookAct.step4.name')}</span><span className="font-medium">{info.name}</span></div>}
              {selected.length >= 2 && (
                <div className="border-t border-border pt-3 text-xs text-gold font-semibold">
                  {t('bookAct.comboDiscount')}
                </div>
              )}
              <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                <span>{t('bookAct.total')}</span>
                <span className="text-gold">${comboPrice * passengers} USD</span>
              </div>
              <p className="text-xs text-muted-foreground">${comboPrice} {t('bookAct.perPerson')} × {passengers}</p>
            </div>

            {/* PayPal placeholder */}
            <button disabled className="w-full py-4 rounded-xl bg-[#0070ba] text-white font-bold text-sm opacity-50 cursor-not-allowed">
              {t('book.review.paypal')}
            </button>
            <p className="text-center text-xs text-muted-foreground">{t('book.review.paypalDisabled')}</p>
          </div>
        );
    }
  };

  return (
    <div className="pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            {/* Progress */}
            <div className="flex items-center gap-1.5 mb-8 overflow-x-auto scrollbar-hide pb-2">
              {wizardSteps.map((_, i) => (
                <button key={i} onClick={() => i <= step && setStep(i)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    i === step ? 'gold-gradient text-navy font-bold' : i < step ? 'text-gold' : 'text-muted-foreground'
                  }`}>
                  {stepLabels[i]}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between mt-8">
              <button onClick={prev} disabled={step === 0}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                <ArrowLeft size={16} /> {t('book.back')}
              </button>
              {step < wizardSteps.length - 1 && (
                <button onClick={next}
                  className="flex items-center gap-2 text-sm text-gold font-semibold hover:gap-3 transition-all">
                  {t('book.next')} <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Sticky Summary */}
          <div className="lg:col-span-2 hidden lg:block">
            <div className="sticky top-32 glass-card rounded-2xl p-6 border border-border">
              <h3 className="font-display text-lg font-bold text-gold mb-4">{t('bookAct.summary')}</h3>
              {selected.length === 0 ? (
                <p className="text-muted-foreground text-xs italic">{t('book.summaryEmpty')}</p>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Combo</span><span className="capitalize">{comboType}</span></div>
                  {selected.map(id => {
                    const act = allActivities.find(a => a.id === id)!;
                    return <div key={id} className="flex justify-between"><span>{t(act.key)}</span><span className="text-muted-foreground">{act.duration}</span></div>;
                  })}
                  {date && <div className="flex justify-between"><span className="text-muted-foreground">{t('book.review.date')}</span><span>{date}</span></div>}
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('book.review.passengers')}</span><span>{passengers}</span></div>
                  {selected.length >= 2 && (
                    <div className="border-t border-border pt-3 text-xs text-gold font-semibold">
                      {t('bookAct.comboDiscount')}
                    </div>
                  )}
                  <div className="border-t border-border pt-3 flex justify-between font-bold">
                    <span>{t('bookAct.total')}</span>
                    <span className="text-gold">${comboPrice * passengers} USD</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookActivities;
