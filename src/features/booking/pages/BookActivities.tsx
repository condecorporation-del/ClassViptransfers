import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/shared/providers/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/features/marketing/components/SEO';
import { Check, ArrowRight, ArrowLeft, Clock, Minus, Plus, Info, ToggleLeft, ToggleRight, MessageCircle, CalendarDays, User, Mail, Phone, Sparkles, Shield, Star, Car, ChevronUp, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/shared/lib/utils';
import { Calendar } from '@/shared/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

const wizardSteps = ['combo', 'activities', 'date', 'info', 'review'] as const;

const allActivities = [
  { id: 'camel', key: 'activity.camel', emoji: '🐫', duration: '1h', price: 120 },
  { id: 'camelKids', key: 'activity.camelKids', emoji: '🐫', duration: '1h', price: 120 },
  { id: 'horseback', key: 'activity.horseback', emoji: '🐎', duration: '1h', price: 120 },
  { id: 'atv', key: 'activity.atv', emoji: '🏍️', duration: '1h', price: 120 },
  { id: 'doubleMoto', key: 'activity.doubleMoto', emoji: '🏍️', duration: '1h', price: 200 },
  { id: 'rzr', key: 'activity.rzr', emoji: '🏎️', duration: '1h', price: 205 },
  { id: 'skyBikes', key: 'activity.skyBikes', emoji: '🚲', duration: '1h', price: 96 },
];

const BookActivities = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [comboType, setComboType] = useState<'' | 'combo' | 'crazy'>('');
  const [selected, setSelected] = useState<string[]>([]);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [passengers, setPassengers] = useState(1);
  const [info, setInfo] = useState({ name: '', email: '', phone: '' });
  const [needTransfer, setNeedTransfer] = useState(false);

  const maxActivities = comboType === 'combo' ? 2 : 3;
  const comboPrice = comboType === 'combo' ? 100 : comboType === 'crazy' ? 125 : 0;

  const toggle = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(v => v !== id);
      if (prev.length >= maxActivities) return prev;
      return [...prev, id];
    });
  };

  const next = () => setStep(s => Math.min(s + 1, wizardSteps.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const total = comboType ? comboPrice * passengers : 0;

  const renderStep = () => {
    switch (wizardSteps[step]) {
      case 'combo':
        return (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">{t('bookAct.step1.title')}</h2>
              <p className="text-muted-foreground text-sm md:text-base mt-2 leading-relaxed">
                {lang === 'es' ? 'Todas las actividades del combo son de 1 hora cada una' : 'All combo activities are 1 hour each'}
              </p>
            </div>

            {/* Crazy Combo — primary CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "relative rounded-2xl p-6 border-2 overflow-hidden cursor-pointer transition-all",
                comboType === 'crazy'
                  ? "border-gold bg-gold/5"
                  : "border-gold/30 hover:border-gold/60 bg-gradient-to-br from-gold/5 to-transparent"
              )}
              onClick={() => { setComboType('crazy'); setSelected(s => s.slice(0, 3)); }}
            >
              <div className="absolute inset-0 shimmer pointer-events-none" />
              <div className="absolute top-0 right-0 gold-gradient text-secondary-foreground text-[10px] font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-wider">
                {lang === 'es' ? 'MEJOR VALOR' : 'BEST VALUE'}
              </div>
              <div className="flex items-start gap-4">
                <div className="text-3xl">🔥</div>
                <div className="flex-1">
                  <p className="font-display text-xl font-bold text-foreground">Crazy Combo</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {lang === 'es' ? '3 actividades (1 hr cada una) · Transporte incluido' : '3 activities (1 hr each) · Transport included'}
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-gold text-2xl font-bold">$125</span>
                    <span className="text-muted-foreground text-sm">USD/{lang === 'es' ? 'persona' : 'person'}</span>
                    <span className="text-xs line-through text-muted-foreground/60 ml-2">$360</span>
                    <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full">
                      {lang === 'es' ? 'AHORRA 65%' : 'SAVE 65%'}
                    </span>
                  </div>
                </div>
                {comboType === 'crazy' && (
                  <div className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center flex-shrink-0">
                    <Check size={15} className="text-navy" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Regular Combo */}
            <button onClick={() => { setComboType('combo'); setSelected(s => s.slice(0, 2)); }}
              className={cn(
                "w-full rounded-xl p-6 text-center border transition-all",
                comboType === 'combo' ? "border-gold bg-gold/5" : "border-border hover:border-gold/30 glass-card"
              )}>
              <p className="text-2xl mb-2">🎯</p>
              <p className="font-display text-xl font-bold text-foreground">Combo</p>
              <p className="text-muted-foreground text-sm mt-1">
                {lang === 'es' ? '2 actividades (1 hr cada una)' : '2 activities (1 hr each)'}
              </p>
              <p className="text-gold text-2xl font-bold mt-3">$100 <span className="text-sm text-muted-foreground font-normal">USD/{lang === 'es' ? 'persona' : 'person'}</span></p>
            </button>
          </div>
        );
      case 'activities':
        return (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">{t('bookAct.step2.title')}</h2>
              <p className="text-muted-foreground text-sm md:text-base mt-2">
                <span className="font-semibold text-gold">{selected.length}/{maxActivities}</span> {lang === 'es' ? 'seleccionadas' : 'selected'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {allActivities.map(act => {
                const isSelected = selected.includes(act.id);
                const maxReached = selected.length >= maxActivities;
                const disabled = !isSelected && maxReached;
                return (
                  <button key={act.id} onClick={() => !disabled && toggle(act.id)}
                    disabled={disabled}
                    className={cn(
                      "rounded-xl p-4 text-center border transition-all",
                      isSelected ? "border-gold bg-gold/5" : disabled ? "border-border/50 opacity-40 cursor-not-allowed" : "border-border hover:border-gold/30 glass-card"
                    )}>
                    <span className="text-2xl block mb-1">{act.emoji}</span>
                    <p className="font-display text-xs font-bold text-foreground leading-tight">{t(act.key)}</p>
                    <p className="text-muted-foreground text-[10px] mt-1 flex items-center justify-center gap-1">
                      <Clock size={9} /> {act.duration}
                    </p>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full gold-gradient flex items-center justify-center mx-auto mt-2">
                        <Check size={11} className="text-navy" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Upgrade prompt if in combo mode */}
            {comboType === 'combo' && selected.length === 2 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-4 border border-gold/30 bg-gold/5 cursor-pointer hover:bg-gold/10 transition-all"
                onClick={() => { setComboType('crazy'); }}>
                <div className="flex items-center gap-3">
                  <Zap size={18} className="text-gold" />
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {lang === 'es' ? '🔥 ¡Upgrade a Crazy Combo!' : '🔥 Upgrade to Crazy Combo!'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lang === 'es' ? 'Agrega 1 actividad más por solo $25 más' : 'Add 1 more activity for just $25 more'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-accent rounded-xl p-3 border border-border">
              <Info size={14} className="text-gold flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <p>{t('bookAct.step2.parkFee')}</p>
                <p className="mt-1">{t('bookAct.step2.insurance')}</p>
              </div>
            </div>
          </div>
        );
      case 'date':
        return (
          <div className="space-y-6">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">{t('bookAct.step3.title')}</h2>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">{t('bookAct.step3.date')}</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button className={cn("input-luxury w-full flex items-center gap-3 text-left", !date && "text-muted-foreground")}>
                    <CalendarDays size={18} className="text-gold flex-shrink-0" />
                    {date ? format(date, 'PPP') : (lang === 'es' ? 'Selecciona fecha' : 'Select date')}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate}
                    disabled={(d) => d < new Date()}
                    initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-3 block">{t('bookAct.step3.passengers')}</label>
              <div className="flex items-center gap-5">
                <button onClick={() => setPassengers(p => Math.max(1, p - 1))}
                  className="w-12 h-12 rounded-xl border-2 border-border flex items-center justify-center hover:border-gold/40 hover:bg-gold/5 transition-all active:scale-95">
                  <Minus size={18} />
                </button>
                <span className="text-3xl font-bold w-10 text-center text-foreground">{passengers}</span>
                <button onClick={() => setPassengers(p => Math.min(20, p + 1))}
                  className="w-12 h-12 rounded-xl border-2 border-border flex items-center justify-center hover:border-gold/40 hover:bg-gold/5 transition-all active:scale-95">
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>
        );
      case 'info':
        return (
          <div className="space-y-6">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">{t('bookAct.step4.title')}</h2>
            <InputField label={t('bookAct.step4.name')} icon={<User size={18} className="text-gold" />}>
              <input type="text" value={info.name} onChange={e => setInfo({ ...info, name: e.target.value })}
                placeholder="John Doe" className="input-luxury pl-11" />
            </InputField>
            <InputField label={t('bookAct.step4.email')} icon={<Mail size={18} className="text-gold" />}>
              <input type="email" value={info.email} onChange={e => setInfo({ ...info, email: e.target.value })}
                placeholder="john@example.com" className="input-luxury pl-11" />
            </InputField>
            <InputField label={t('bookAct.step4.phone')} icon={<Phone size={18} className="text-gold" />}>
              <input type="tel" value={info.phone} onChange={e => setInfo({ ...info, phone: e.target.value })}
                placeholder="+1 (555) 000-0000" className="input-luxury pl-11" />
            </InputField>

            {/* Transportation upsell */}
            <div className="border-t border-border pt-6">
              <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Car size={16} className="text-gold" />
                {lang === 'es' ? '¿Necesitas transporte al aeropuerto?' : 'Need airport transportation?'}
              </p>
              <button onClick={() => setNeedTransfer(!needTransfer)}
                className={cn(
                  "w-full rounded-xl p-5 text-left flex items-center justify-between border transition-all",
                  needTransfer ? "border-gold bg-gold/5" : "border-border hover:border-gold/30 glass-card"
                )}>
                <div>
                  <p className="font-bold text-sm text-foreground">
                    {lang === 'es' ? 'Agregar Transfer Privado' : 'Add Private Transfer'}
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    {lang === 'es' ? 'SUV de lujo · Desde $85 USD' : 'Luxury SUV · From $85 USD'}
                  </p>
                </div>
                {needTransfer ? <ToggleRight size={28} className="text-gold" /> : <ToggleLeft size={28} className="text-muted-foreground" />}
              </button>
              {needTransfer && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-gold mt-2 flex items-center gap-1.5">
                  <Check size={12} /> {lang === 'es' ? 'Te contactaremos para coordinar tu transfer' : "We'll contact you to coordinate your transfer"}
                </motion.p>
              )}
            </div>
          </div>
        );
      case 'review':
        return (
          <div className="space-y-6">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">{t('bookAct.step5.title')}</h2>
            <div className="booking-card rounded-2xl p-6 md:p-8 space-y-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Combo</span><span className="font-semibold text-foreground capitalize">{comboType === 'crazy' ? 'Crazy Combo 🔥' : 'Combo 🎯'}</span></div>
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">{t('book.step.activities')}</span>
                <div className="text-right">
                  {selected.map(id => {
                    const act = allActivities.find(a => a.id === id);
                    return <span key={id} className="inline-block bg-gold/10 text-gold text-xs font-semibold px-2.5 py-1 rounded-full ml-1 mb-1">{act ? t(act.key) : id}</span>;
                  })}
                </div>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('book.review.date')}</span><span className="font-semibold text-foreground">{date ? format(date, 'PPP') : '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('book.review.passengers')}</span><span className="font-semibold text-foreground">{passengers}</span></div>
              {info.name && <div className="flex justify-between"><span className="text-muted-foreground">{t('bookAct.step4.name')}</span><span className="font-semibold text-foreground">{info.name}</span></div>}
              {needTransfer && <div className="flex justify-between"><span className="text-muted-foreground">{lang === 'es' ? 'Transfer' : 'Transfer'}</span><span className="font-semibold text-gold">✓ {lang === 'es' ? 'Solicitado' : 'Requested'}</span></div>}
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{comboType === 'crazy' ? 'Crazy Combo' : 'Combo'}</span>
                  <span className="text-gold font-semibold">${comboPrice} × {passengers}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-border pt-3">
                  <span>{t('bookAct.total')}</span>
                  <span className="text-gold">${total} USD</span>
                </div>
              </div>
            </div>

            {/* Trust elements */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><Shield size={14} className="text-gold" /> {lang === 'es' ? 'Pago seguro' : 'Secure checkout'}</div>
              <div className="flex items-center gap-1.5"><Star size={14} className="text-gold" /> {lang === 'es' ? '4.9/5 calificación' : '4.9/5 rating'}</div>
            </div>

            {/* Activity checkout is not wired here yet; keep the state clear and neutral */}
            <button disabled className="w-full py-4 rounded-xl bg-muted text-foreground font-bold text-base opacity-60 cursor-not-allowed border border-border">
              {t('book.review.checkout')}
            </button>
            <p className="text-center text-sm text-muted-foreground">{t('book.review.checkoutDisabled')}</p>
          </div>
        );
    }
  };

  return (
    <div className="pt-32 pb-28 lg:pb-20 px-4">
      <SEO
        title={lang === 'es' ? 'Reservar Actividades en Los Cabos' : 'Book Los Cabos Activities'}
        description={
          lang === 'es'
            ? 'Reserva combos y aventuras en Los Cabos con una experiencia premium y asistencia personalizada.'
            : 'Reserve Los Cabos activity combos and adventures with a premium booking experience and personalized support.'
        }
        canonical="https://classviptransfers.com/book-activities"
        url="https://classviptransfers.com/book-activities"
        keywords="Los Cabos activities booking, camel ride Cabo, ATV Cabo, UTV Cabo, Class VIP Transfers"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: lang === 'es' ? 'Reserva de Actividades en Los Cabos' : 'Los Cabos Activities Booking',
          serviceType: lang === 'es' ? 'Reserva de tours y aventuras' : 'Adventure and tour booking',
          provider: {
            '@type': 'Organization',
            name: 'Class VIP Transfers',
            url: 'https://classviptransfers.com',
          },
          areaServed: 'Los Cabos, Baja California Sur, Mexico',
        }}
      />

      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">{t('bookAct.title')}</h1>
          <span className="text-muted-foreground text-sm font-semibold bg-accent px-3 py-1 rounded-full">{step + 1}/5</span>
        </div>

        <div className="flex gap-1.5 mb-10">
          {wizardSteps.map((_, i) => (
            <button
              key={i}
              onClick={() => i <= step && setStep(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-gold' : i < step ? 'w-2 bg-gold/50 hover:bg-gold/70' : 'w-2 bg-border'
              }`}
            />
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between mt-10">
              <button onClick={prev} disabled={step === 0}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors py-2">
                <ArrowLeft size={16} /> {t('book.back')}
              </button>
              {step < wizardSteps.length - 1 && (
                <button onClick={next}
                  className="gold-gradient text-navy px-8 py-3 rounded-xl text-sm font-bold inline-flex items-center gap-2 hover:brightness-110 transition-all gold-glow active:scale-[0.97]">
                  {t('book.next')} <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Sticky Summary (desktop) */}
          <div className="lg:col-span-2 hidden lg:block">
            <div className="sticky top-32 booking-card rounded-2xl p-6 space-y-4">
              <h3 className="font-display text-lg font-bold text-foreground">{t('book.summary')}</h3>
              <div className="space-y-2.5 text-sm">
                {comboType && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Combo</span>
                    <span className="font-semibold text-foreground capitalize">{comboType === 'crazy' ? 'Crazy Combo 🔥' : 'Combo 🎯'}</span>
                  </div>
                )}
                {selected.length > 0 && (
                  <div>
                    <span className="text-muted-foreground block mb-1">{lang === 'es' ? 'Actividades' : 'Activities'}</span>
                    {selected.map(id => {
                      const act = allActivities.find(a => a.id === id);
                      return <span key={id} className="inline-block bg-gold/10 text-gold text-xs font-semibold px-2.5 py-1 rounded-full mr-1 mb-1">{act ? t(act.key) : id}</span>;
                    })}
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{lang === 'es' ? 'Personas' : 'Persons'}</span>
                  <span className="font-semibold text-foreground">{passengers}</span>
                </div>
                {date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{lang === 'es' ? 'Fecha' : 'Date'}</span>
                    <span className="font-semibold text-foreground">{format(date, 'PPP')}</span>
                  </div>
                )}
                {needTransfer && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transfer</span>
                    <span className="text-gold font-semibold">✓</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">{lang === 'es' ? 'Entrada al parque ($25/persona) pagada en el parque' : 'Park fee ($25/person) paid at park'}</p>

              <div className="border-t border-border pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-foreground">{lang === 'es' ? 'Total' : 'Total Due Now'}</span>
                  <span className="text-gold">${total} USD</span>
                </div>
                {comboType && <p className="text-xs text-muted-foreground mt-1">${comboPrice} × {passengers} {lang === 'es' ? 'personas' : 'persons'}</p>}
              </div>

              {/* Upgrade prompt */}
              {comboType === 'combo' && (
                <div className="border-t border-border pt-4">
                  <button onClick={() => { setComboType('crazy'); setStep(1); }}
                    className="w-full text-left rounded-xl p-3 border border-gold/20 bg-gold/5 hover:bg-gold/10 transition-all">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-gold" />
                      <span className="text-xs font-bold text-gold">🔥 {lang === 'es' ? '¡Upgrade a Crazy Combo!' : 'Upgrade to Crazy Combo!'}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {lang === 'es' ? '+1 actividad por solo $25 más' : '+1 activity for just $25 more'}
                    </p>
                  </button>
                </div>
              )}

              <a href="https://wa.me/5216241222174?text=Hello%2C%20I%27d%20like%20to%20book%20activities" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors pt-2">
                <MessageCircle size={16} className="text-[#25D366]" /> {lang === 'es' ? 'Chatea por WhatsApp' : 'Chat on WhatsApp'}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom summary bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/98 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="w-full px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChevronUp size={16} className={cn("text-muted-foreground transition-transform", mobileOpen && "rotate-180")} />
            <span className="text-sm font-semibold text-foreground">{t('book.summary')}</span>
          </div>
          <span className="text-gold font-bold text-lg">${total} USD</span>
        </button>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border"
            >
              <div className="px-4 py-4 space-y-2.5 text-sm max-h-60 overflow-y-auto">
                {comboType && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Combo</span>
                    <span className="font-semibold text-foreground">{comboType === 'crazy' ? 'Crazy 🔥' : 'Combo 🎯'}</span>
                  </div>
                )}
                {selected.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{lang === 'es' ? 'Actividades' : 'Activities'}</span>
                    <span className="text-foreground font-semibold">{selected.length}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{lang === 'es' ? 'Personas' : 'Persons'}</span>
                  <span className="text-foreground font-semibold">{passengers}</span>
                </div>

                {/* Mobile upgrade prompt */}
                {comboType === 'combo' && (
                  <button onClick={() => { setComboType('crazy'); setStep(1); setMobileOpen(false); }}
                    className="w-full text-left rounded-lg p-2.5 border border-gold/20 bg-gold/5 mt-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={12} className="text-gold" />
                      <span className="text-[11px] font-bold text-gold">🔥 {lang === 'es' ? '¡Upgrade por solo $25 más!' : 'Upgrade for just $25 more!'}</span>
                    </div>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const InputField = ({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div>
    <label className="text-sm font-semibold text-foreground mb-2 block">{label}</label>
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">{icon}</div>
      {children}
    </div>
  </div>
);

export default BookActivities;
