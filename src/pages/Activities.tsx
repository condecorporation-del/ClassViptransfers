import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock, ArrowRight } from 'lucide-react';

const Activities = () => {
  const { t } = useLanguage();

  const activities = [
    { name: t('Camel Ride', 'Paseo en Camello'), price: '$85', duration: '2h', desc: t('Ride through desert landscapes with stunning ocean views.', 'Recorre paisajes desérticos con impresionantes vistas al mar.') },
    { name: t('Horseback Riding', 'Cabalgata'), price: '$80', duration: '1.5h', desc: t('Scenic horseback ride along the beach at sunset.', 'Paseo a caballo por la playa al atardecer.') },
    { name: t('ATV Adventure', 'Aventura en ATV'), price: '$95', duration: '2h', desc: t('Adrenaline-pumping ATV ride through desert trails.', 'Paseo en ATV por senderos del desierto lleno de adrenalina.') },
    { name: t('RZR Tour', 'Tour en RZR'), price: '$120', duration: '2.5h', desc: t('Off-road RZR experience through Baja landscapes.', 'Experiencia off-road en RZR por paisajes de Baja.') },
    { name: t('Sky Bikes', 'Sky Bikes'), price: '$70', duration: '1h', desc: t('Pedal through the sky with panoramic views of the coast.', 'Pedalea por el cielo con vistas panorámicas de la costa.') },
    { name: t('Sport Fishing', 'Pesca Deportiva'), price: '$250', duration: '4h', desc: t('Deep-sea fishing in the world\'s aquarium.', 'Pesca de altura en el acuario del mundo.') },
    { name: t('Sunset Cruise', 'Crucero al Atardecer'), price: '$90', duration: '2h', desc: t('Sail past El Arco with drinks and snacks included.', 'Navega frente a El Arco con bebidas y snacks incluidos.') },
  ];

  return (
    <div className="py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">{t('Activities & Adventures', 'Actividades y Aventuras')}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">{t('Unforgettable experiences curated by local experts.', 'Experiencias inolvidables curadas por expertos locales.')}</p>
        </motion.div>

        {/* Combo Banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-8 mb-12 text-center border-secondary/20">
          <h3 className="font-display text-2xl font-bold mb-2 text-secondary">{t('Special Combo Deals', 'Combos Especiales')}</h3>
          <p className="text-foreground/80 mb-4">
            {t('Save big when you combine activities!', '¡Ahorra al combinar actividades!')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="glass-card rounded-xl px-6 py-4">
              <p className="text-secondary text-2xl font-bold">$100 <span className="text-sm font-normal text-muted-foreground">USD</span></p>
              <p className="text-foreground/70 text-sm">{t('2 Activities', '2 Actividades')}</p>
            </div>
            <div className="glass-card rounded-xl px-6 py-4 border-secondary/30">
              <p className="text-secondary text-2xl font-bold">$125 <span className="text-sm font-normal text-muted-foreground">USD</span></p>
              <p className="text-foreground/70 text-sm">{t('3 Activities', '3 Actividades')}</p>
            </div>
          </div>
          <Link to="/book-activities" className="bg-secondary text-secondary-foreground px-6 py-3 rounded-full text-sm font-semibold inline-flex items-center gap-2 mt-6 hover:brightness-110 transition-all">
            {t('Book a Combo', 'Reservar Combo')} <ArrowRight size={16} />
          </Link>
        </motion.div>

        {/* Activities Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {activities.map((act, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
              className="glass-card rounded-xl p-6 hover:border-secondary/30 transition-all group">
              <h3 className="font-display text-xl font-bold mb-2">{act.name}</h3>
              <p className="text-muted-foreground text-sm mb-4">{act.desc}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span><Clock size={13} className="inline mr-1" />{act.duration}</span>
                  <span className="text-secondary font-bold text-base">{act.price}</span>
                </div>
                <Link to="/book-activities" className="text-secondary text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                  {t('Book', 'Reservar')} <ArrowRight size={12} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Activities;
