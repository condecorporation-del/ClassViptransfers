import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Gift, Plane, Sparkles, ArrowRight, Calendar, MessageCircle, CheckCircle2, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

const presetAmounts = [50, 100, 150, 200, 250, 500];

type CardType = 'activities' | 'transportation' | 'bundle';

const cardTypes: { type: CardType; icon: React.ReactNode; title: { en: string; es: string }; desc: { en: string; es: string } }[] = [
  {
    type: 'activities',
    icon: <Sparkles size={28} className="text-gold" />,
    title: { en: 'Activities Gift Card', es: 'Tarjeta Regalo Actividades' },
    desc: { en: 'Gift an unforgettable adventure in Los Cabos', es: 'Regala una aventura inolvidable en Los Cabos' },
  },
  {
    type: 'transportation',
    icon: <Plane size={28} className="text-gold" />,
    title: { en: 'Transportation Gift Card', es: 'Tarjeta Regalo Transporte' },
    desc: { en: 'Luxury airport transfers as a gift', es: 'Transfers de lujo al aeropuerto como regalo' },
  },
  {
    type: 'bundle',
    icon: <Gift size={28} className="text-gold" />,
    title: { en: 'Complete Experience', es: 'Experiencia Completa' },
    desc: { en: 'Transportation + Activities — the ultimate gift', es: 'Transporte + Actividades — el regalo definitivo' },
  },
];

const GiftCards = () => {
  const { lang } = useLanguage();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<CardType | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [sendNow, setSendNow] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  const finalAmount = amount || parseInt(customAmount) || 0;
  const selectedCard = cardTypes.find(c => c.type === selectedType);

  const t = (en: string, es: string) => lang === 'es' ? es : en;

  const canProceedStep2 = selectedType && finalAmount > 0;
  const canProceedStep3 = recipientName && recipientEmail && senderName;

  const handleConfirm = () => {
    setConfirmed(true);
  };

  const giftCode = `CABO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const whatsappMsg = encodeURIComponent(
    `Hi! I'd like to purchase a Gift Card:\n• Type: ${selectedCard?.title.en}\n• Amount: $${finalAmount} USD\n• Recipient: ${recipientName}\n• From: ${senderName}`
  );

  if (confirmed) {
    return (
      <div>
        <section className="navy-gradient pt-36 pb-20 px-4">
          <div className="container mx-auto max-w-2xl text-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <CheckCircle2 size={64} className="text-gold mx-auto mb-6" />
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 text-off-white">
                {t('Gift Card Created!', '¡Tarjeta Regalo Creada!')}
              </h1>
              <p className="text-off-white/70 text-lg">
                {t('Your gift card is ready to share', 'Tu tarjeta regalo está lista para compartir')}
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-16 px-4 -mt-8">
          <div className="container mx-auto max-w-lg">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="glass-card rounded-2xl p-8 border-2 border-gold/30 text-center relative overflow-hidden">
              <div className="absolute inset-0 shimmer pointer-events-none" />
              <Gift size={40} className="text-gold mx-auto mb-4" />
              <p className="font-display text-3xl font-bold text-gold mb-2">${finalAmount} USD</p>
              <p className="text-foreground font-semibold mb-1">{selectedCard?.title[lang]}</p>
              <p className="text-muted-foreground text-sm mb-6">
                {t('For', 'Para')}: {recipientName}
              </p>
              <div className="bg-sand-light rounded-xl p-4 border border-border mb-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('Gift Card Code', 'Código de Tarjeta')}</p>
                <p className="font-display text-2xl font-bold text-foreground tracking-widest">{giftCode}</p>
              </div>
              {message && (
                <p className="text-muted-foreground text-sm italic mb-6">"{message}"</p>
              )}
              <p className="text-xs text-muted-foreground mb-6">
                {t('From', 'De')}: {senderName}
              </p>

              <div className="flex flex-col gap-3">
                <a
                  href={`https://wa.me/5216241222174?text=${whatsappMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-full bg-[#25D366] text-white font-bold text-sm hover:bg-[#20bd5a] transition-colors"
                >
                  <MessageCircle size={18} /> {t('Complete Purchase via WhatsApp', 'Completar Compra por WhatsApp')}
                </a>
                <button
                  onClick={() => { setConfirmed(false); setStep(1); setSelectedType(null); setAmount(null); }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('Create Another Gift Card', 'Crear Otra Tarjeta Regalo')}
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="navy-gradient pt-36 pb-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-px w-8 bg-gold/60" />
              <span className="font-accent text-gold text-sm tracking-[0.3em] uppercase">{t('The Perfect Gift', 'El Regalo Perfecto')}</span>
              <div className="h-px w-8 bg-gold/60" />
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-4 text-off-white">
              {t('Luxury Gift Cards', 'Tarjetas de Regalo de Lujo')}
            </h1>
            <p className="text-off-white/70 text-lg max-w-2xl mx-auto">
              {t(
                'Give the gift of unforgettable experiences in Los Cabos. Perfect for birthdays, anniversaries, or just because.',
                'Regala experiencias inolvidables en Los Cabos. Perfecto para cumpleaños, aniversarios o simplemente porque sí.'
              )}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4 -mt-8">
        <div className="container mx-auto max-w-3xl">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-12">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  step >= s ? 'gold-gradient text-secondary-foreground' : 'bg-sand-light text-muted-foreground border border-border'
                )}>
                  {s}
                </div>
                {s < 3 && <div className={cn('w-12 h-0.5 rounded-full', step > s ? 'bg-gold' : 'bg-border')} />}
              </div>
            ))}
          </div>

          {/* Step 1: Choose type + amount */}
          {step === 1 && (
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <h2 className="font-display text-2xl font-bold text-center mb-8 text-foreground">
                {t('Choose Your Gift', 'Elige Tu Regalo')}
              </h2>

              <div className="grid sm:grid-cols-3 gap-4 mb-10">
                {cardTypes.map(card => (
                  <button
                    key={card.type}
                    onClick={() => setSelectedType(card.type)}
                    className={cn(
                      'glass-card rounded-xl p-6 premium-card border text-center transition-all text-left',
                      selectedType === card.type ? 'border-gold/60 ring-2 ring-gold/20' : 'border-border hover:border-gold/30'
                    )}
                  >
                    <div className="mb-3">{card.icon}</div>
                    <p className="font-display text-sm font-bold text-foreground mb-1">{card.title[lang]}</p>
                    <p className="text-muted-foreground text-xs">{card.desc[lang]}</p>
                  </button>
                ))}
              </div>

              {selectedType && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h3 className="font-display text-lg font-bold mb-4 text-foreground">
                    {t('Select Amount', 'Selecciona el Monto')}
                  </h3>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {presetAmounts.map(a => (
                      <button
                        key={a}
                        onClick={() => { setAmount(a); setCustomAmount(''); }}
                        className={cn(
                          'py-3 rounded-xl font-bold text-sm transition-all border',
                          amount === a ? 'gold-gradient text-secondary-foreground border-gold/60' : 'glass-card border-border text-foreground hover:border-gold/30'
                        )}
                      >
                        ${a}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                    <input
                      type="number"
                      placeholder={lang === 'es' ? 'Monto personalizado' : 'Custom amount'}
                      value={customAmount}
                      onChange={e => { setCustomAmount(e.target.value); setAmount(null); }}
                      className="input-luxury pl-8"
                      min={10}
                    />
                  </div>
                </motion.div>
              )}

              <div className="mt-8 text-center">
                <button
                  disabled={!canProceedStep2}
                  onClick={() => setStep(2)}
                  className="gold-gradient text-secondary-foreground px-10 py-4 rounded-full font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all gold-glow inline-flex items-center gap-2"
                >
                  {t('Continue', 'Continuar')} <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Recipient details */}
          {step === 2 && (
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <h2 className="font-display text-2xl font-bold text-center mb-8 text-foreground">
                {t('Recipient Details', 'Datos del Destinatario')}
              </h2>

              <div className="glass-card rounded-2xl p-8 border border-border space-y-5">
                <div>
                  <label className="text-sm font-semibold mb-2 block text-foreground">{t('Your Name', 'Tu Nombre')}</label>
                  <input type="text" value={senderName} onChange={e => setSenderName(e.target.value)}
                    placeholder="John Doe" className="input-luxury" />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block text-foreground">{t('Recipient Name', 'Nombre del Destinatario')}</label>
                  <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)}
                    placeholder="Jane Smith" className="input-luxury" />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block text-foreground">{t('Recipient Email', 'Email del Destinatario')}</label>
                  <input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)}
                    placeholder="jane@email.com" className="input-luxury" />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block text-foreground">{t('Personal Message (optional)', 'Mensaje Personal (opcional)')}</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                    placeholder={lang === 'es' ? '¡Feliz cumpleaños! Disfruta Los Cabos...' : 'Happy birthday! Enjoy Los Cabos...'}
                    className="input-luxury resize-none" />
                </div>

                <div>
                  <label className="text-sm font-semibold mb-3 block text-foreground">{t('Delivery', 'Entrega')}</label>
                  <div className="flex gap-3">
                    <button onClick={() => { setSendNow(true); setDeliveryDate(undefined); }}
                      className={cn('flex-1 py-3 rounded-xl text-sm font-semibold border transition-all',
                        sendNow ? 'gold-gradient text-secondary-foreground border-gold/60' : 'glass-card border-border text-foreground')}>
                      {t('Send Now', 'Enviar Ahora')}
                    </button>
                    <button onClick={() => setSendNow(false)}
                      className={cn('flex-1 py-3 rounded-xl text-sm font-semibold border transition-all',
                        !sendNow ? 'gold-gradient text-secondary-foreground border-gold/60' : 'glass-card border-border text-foreground')}>
                      {t('Schedule', 'Programar')}
                    </button>
                  </div>
                  {!sendNow && (
                    <div className="mt-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="input-luxury flex items-center gap-2 w-full text-left">
                            <Calendar size={16} className="text-gold" />
                            {deliveryDate ? format(deliveryDate, 'PPP') : <span className="text-muted-foreground">{t('Pick a date', 'Elige una fecha')}</span>}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={deliveryDate}
                            onSelect={setDeliveryDate}
                            disabled={(date) => date < new Date()}
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  ← {t('Back', 'Atrás')}
                </button>
                <button
                  disabled={!canProceedStep3}
                  onClick={() => setStep(3)}
                  className="gold-gradient text-secondary-foreground px-10 py-4 rounded-full font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all gold-glow inline-flex items-center gap-2"
                >
                  {t('Review', 'Revisar')} <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Review & Confirm */}
          {step === 3 && (
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <h2 className="font-display text-2xl font-bold text-center mb-8 text-foreground">
                {t('Review Your Gift', 'Revisa Tu Regalo')}
              </h2>

              <div className="glass-card rounded-2xl p-8 border-2 border-gold/20 space-y-6">
                <div className="text-center">
                  <Gift size={40} className="text-gold mx-auto mb-3" />
                  <p className="font-display text-3xl font-bold text-gold">${finalAmount} USD</p>
                  <p className="text-foreground font-semibold">{selectedCard?.title[lang]}</p>
                </div>

                <div className="section-divider" />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">{t('From', 'De')}</p>
                    <p className="font-semibold text-foreground">{senderName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">{t('To', 'Para')}</p>
                    <p className="font-semibold text-foreground">{recipientName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">{t('Email', 'Correo')}</p>
                    <p className="text-foreground">{recipientEmail}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">{t('Delivery', 'Entrega')}</p>
                    <p className="text-foreground">{sendNow ? t('Immediately', 'Inmediato') : deliveryDate ? format(deliveryDate, 'PPP') : '—'}</p>
                  </div>
                </div>

                {message && (
                  <>
                    <div className="section-divider" />
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">{t('Message', 'Mensaje')}</p>
                      <p className="text-foreground italic">"{message}"</p>
                    </div>
                  </>
                )}

                <div className="section-divider" />

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield size={14} className="text-gold" />
                  {t('Secure purchase · Redeemable at checkout', 'Compra segura · Canjeable en el checkout')}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={handleConfirm}
                  className="gold-gradient text-secondary-foreground px-10 py-4 rounded-full font-bold text-sm hover:brightness-110 transition-all gold-glow w-full flex items-center justify-center gap-2"
                >
                  <Gift size={18} /> {t('Create Gift Card', 'Crear Tarjeta Regalo')}
                </button>
                <button onClick={() => setStep(2)} className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center">
                  ← {t('Back', 'Atrás')}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default GiftCards;
