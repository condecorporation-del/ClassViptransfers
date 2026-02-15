import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, Check, Shield, Users, Plane, Clock } from 'lucide-react';

const Transfers = () => {
  const { t } = useLanguage();

  const privateFeatures = [
    t('Private luxury SUV or Sprinter Van', 'SUV de lujo o Sprinter Van privada'),
    t('Professional bilingual driver', 'Chofer profesional bilingüe'),
    t('Cold beverages & towels', 'Bebidas frías y toallas'),
    t('Real-time flight monitoring', 'Monitoreo de vuelo en tiempo real'),
    t('Meet & Greet at airport', 'Recibimiento en aeropuerto'),
    t('Door-to-door service', 'Servicio puerta a puerta'),
    t('Child seats available', 'Sillas para niños disponibles'),
    t('Free cancellation (24h)', 'Cancelación gratuita (24h)'),
  ];

  const shuttleFeatures = [
    t('Comfortable A/C vehicle', 'Vehículo con A/C'),
    t('Scheduled departures', 'Salidas programadas'),
    t('Safe & reliable', 'Seguro y confiable'),
    t('Budget-friendly option', 'Opción económica'),
    t('Airport pickup included', 'Recogida en aeropuerto incluida'),
  ];

  const policies = [
    { icon: <Clock size={20} />, title: t('24h Free Cancellation', 'Cancelación gratuita 24h'), desc: t('Full refund if cancelled 24+ hours before service.', 'Reembolso total si cancela 24+ horas antes del servicio.') },
    { icon: <Plane size={20} />, title: t('Flight Delays', 'Retrasos de Vuelo'), desc: t('We monitor your flight. No extra charge for delays.', 'Monitoreamos su vuelo. Sin cargo extra por retrasos.') },
    { icon: <Users size={20} />, title: t('Group Discounts', 'Descuentos de Grupo'), desc: t('Special rates for groups of 8+. Contact us!', 'Tarifas especiales para grupos de 8+. ¡Contáctenos!') },
    { icon: <Shield size={20} />, title: t('Full Insurance', 'Seguro Completo'), desc: t('All vehicles fully insured and regularly inspected.', 'Todos los vehículos asegurados e inspeccionados.') },
  ];

  return (
    <div className="py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">{t('Airport Transfers', 'Transfers al Aeropuerto')}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">{t('Choose the perfect transportation for your Los Cabos arrival.', 'Elige la transportación perfecta para tu llegada a Los Cabos.')}</p>
        </motion.div>

        {/* Comparison */}
        <div className="grid md:grid-cols-2 gap-6 mb-20">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-8 border-secondary/30">
            <span className="bg-secondary/20 text-secondary text-xs font-bold px-3 py-1 rounded-full">{t('MOST POPULAR', 'MÁS POPULAR')}</span>
            <h2 className="font-display text-2xl font-bold mt-4 mb-2">{t('Private Transfer', 'Transfer Privado')}</h2>
            <p className="text-muted-foreground text-sm mb-6">{t('Exclusive door-to-door luxury service', 'Servicio de lujo exclusivo puerta a puerta')}</p>
            <ul className="space-y-3 mb-8">
              {privateFeatures.map((f, i) => (
                <li key={i} className="text-sm text-foreground/80 flex items-center gap-2">
                  <Check size={14} className="text-secondary flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Link to="/book" className="bg-secondary text-secondary-foreground px-6 py-3 rounded-full text-sm font-semibold inline-flex items-center gap-2 hover:brightness-110 transition-all">
              {t('Book Private Transfer', 'Reservar Transfer Privado')} <ArrowRight size={16} />
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-8">
            <h2 className="font-display text-2xl font-bold mt-4 mb-2">{t('Shared Shuttle', 'Shuttle Compartido')}</h2>
            <p className="text-muted-foreground text-sm mb-6">{t('Affordable and comfortable transportation', 'Transportación cómoda y económica')}</p>
            <ul className="space-y-3 mb-8">
              {shuttleFeatures.map((f, i) => (
                <li key={i} className="text-sm text-foreground/80 flex items-center gap-2">
                  <Check size={14} className="text-primary flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Link to="/book" className="glass-card px-6 py-3 rounded-full text-sm font-semibold inline-flex items-center gap-2 hover:bg-foreground/10 transition-all">
              {t('Book Shuttle', 'Reservar Shuttle')} <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>

        {/* Policies */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-display text-3xl font-bold text-center mb-10">{t("What's Included & Policies", 'Incluido y Políticas')}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {policies.map((p, i) => (
              <div key={i} className="glass-card rounded-xl p-6 text-center">
                <div className="text-secondary mb-3 flex justify-center">{p.icon}</div>
                <h4 className="font-display font-bold mb-2 text-sm">{p.title}</h4>
                <p className="text-muted-foreground text-xs">{p.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Transfers;
