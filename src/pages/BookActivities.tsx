import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Clock } from 'lucide-react';

const allActivities = [
  { id: 'camel', name: { en: 'Camel Ride', es: 'Paseo en Camello' }, price: 85, duration: '2h' },
  { id: 'horse', name: { en: 'Horseback Riding', es: 'Cabalgata' }, price: 80, duration: '1.5h' },
  { id: 'atv', name: { en: 'ATV Adventure', es: 'Aventura ATV' }, price: 95, duration: '2h' },
  { id: 'rzr', name: { en: 'RZR Tour', es: 'Tour en RZR' }, price: 120, duration: '2.5h' },
  { id: 'sky', name: { en: 'Sky Bikes', es: 'Sky Bikes' }, price: 70, duration: '1h' },
  { id: 'fish', name: { en: 'Sport Fishing', es: 'Pesca Deportiva' }, price: 250, duration: '4h' },
  { id: 'sunset', name: { en: 'Sunset Cruise', es: 'Crucero al Atardecer' }, price: 90, duration: '2h' },
];

const BookActivities = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [date, setDate] = useState('');

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  };

  const comboPrice = selected.length >= 3 ? 125 : selected.length === 2 ? 100 : selected.reduce((sum, id) => sum + (allActivities.find(a => a.id === id)?.price || 0), 0);

  return (
    <div className="py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">{t('Book Activities', 'Reservar Actividades')}</h1>
          <p className="text-muted-foreground">{t('Select 2+ activities for combo pricing!', '¡Selecciona 2+ actividades para precio combo!')}</p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-3">
            {allActivities.map(act => (
              <button key={act.id} onClick={() => toggle(act.id)}
                className={`w-full glass-card rounded-xl p-5 text-left hover:border-secondary/40 transition-all flex items-center justify-between ${selected.includes(act.id) ? 'border-secondary' : ''}`}>
                <div>
                  <p className="font-semibold">{act.name[lang]}</p>
                  <p className="text-muted-foreground text-xs flex items-center gap-2 mt-1">
                    <Clock size={12} /> {act.duration} · ${act.price} USD
                  </p>
                </div>
                {selected.includes(act.id) && <Check size={18} className="text-secondary" />}
              </button>
            ))}

            <div className="pt-4">
              <label className="text-sm font-medium mb-1.5 block">{t('Preferred Date', 'Fecha Preferida')}</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50" />
            </div>

            <button onClick={() => navigate('/confirmation')} disabled={selected.length === 0}
              className="bg-secondary text-secondary-foreground px-6 py-3 rounded-full text-sm font-semibold hover:brightness-110 transition-all w-full mt-4 disabled:opacity-40 flex items-center justify-center gap-2">
              {t('Confirm Booking', 'Confirmar Reservación')} <ArrowRight size={16} />
            </button>
          </div>

          <div className="lg:col-span-2 hidden lg:block">
            <div className="sticky top-24 glass-card rounded-2xl p-6">
              <h3 className="font-display text-lg font-bold text-secondary mb-4">{t('Summary', 'Resumen')}</h3>
              {selected.length === 0 ? (
                <p className="text-muted-foreground text-xs italic">{t('Select activities to see pricing', 'Selecciona actividades para ver precios')}</p>
              ) : (
                <div className="space-y-3">
                  {selected.map(id => {
                    const act = allActivities.find(a => a.id === id)!;
                    return <div key={id} className="flex justify-between text-sm"><span>{act.name[lang]}</span><span className="text-muted-foreground">${act.price}</span></div>;
                  })}
                  {selected.length >= 2 && (
                    <div className="border-t border-border/50 pt-3 text-xs text-secondary font-semibold">
                      {t('🎉 Combo discount applied!', '🎉 ¡Descuento combo aplicado!')}
                    </div>
                  )}
                  <div className="border-t border-border/50 pt-3 flex justify-between font-bold">
                    <span>{t('Total', 'Total')}</span>
                    <span className="text-secondary">${comboPrice} USD</span>
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
