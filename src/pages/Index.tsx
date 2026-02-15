import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, MapPin, Clock, Phone, ArrowRight, Star, ChevronDown } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const heroImages = [
  'https://res.cloudinary.com/dpmozdkfh/image/upload/v1770770171/ChatGPT_Image_Feb_10_2026_05_35_19_PM_md3ey7.png',
  'https://res.cloudinary.com/dpmozdkfh/image/upload/v1766726559/Vista_1_sz3qkw.jpg',
  'https://res.cloudinary.com/dpmozdkfh/image/upload/v1770770334/ChatGPT_Image_Feb_10_2026_05_38_39_PM_hkunxs.png',
];

const Index = () => {
  const { t } = useLanguage();
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage(prev => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const trustChips = [
    { icon: <Shield size={16} />, label: t('30+ Years', '30+ Años') },
    { icon: <MapPin size={16} />, label: t('Local Experts', 'Expertos Locales') },
    { icon: <Shield size={16} />, label: t('Licensed & Insured', 'Licenciados y Asegurados') },
    { icon: <Phone size={16} />, label: t('24/7 Support', 'Soporte 24/7') },
  ];

  const transfers = [
    {
      title: t('Private SUV / Sprinter', 'SUV / Sprinter Privado'),
      desc: t('Door-to-door luxury transfer with professional bilingual driver.', 'Transfer de lujo puerta a puerta con chofer bilingüe profesional.'),
      features: [t('Cold beverages', 'Bebidas frías'), t('Flight monitoring', 'Monitoreo de vuelo'), t('Meet & Greet', 'Recibimiento')],
    },
    {
      title: t('Shared Shuttle', 'Shuttle Compartido'),
      desc: t('Comfortable, affordable airport transportation.', 'Transportación cómoda y económica al aeropuerto.'),
      features: [t('A/C vehicle', 'Vehículo con A/C'), t('Scheduled departures', 'Salidas programadas'), t('Safe & reliable', 'Seguro y confiable')],
    },
  ];

  const activities = [
    { name: t('Camel Ride', 'Paseo en Camello'), price: '$85', duration: '2h' },
    { name: t('Horseback Riding', 'Cabalgata'), price: '$80', duration: '1.5h' },
    { name: t('ATV Adventure', 'Aventura en ATV'), price: '$95', duration: '2h' },
    { name: t('RZR Tour', 'Tour en RZR'), price: '$120', duration: '2.5h' },
    { name: t('Sky Bikes', 'Sky Bikes'), price: '$70', duration: '1h' },
    { name: t('Sport Fishing', 'Pesca Deportiva'), price: '$250', duration: '4h' },
  ];

  const steps = [
    { num: '01', title: t('Choose Your Service', 'Elige Tu Servicio'), desc: t('Select transfer type or activity', 'Selecciona tipo de transfer o actividad') },
    { num: '02', title: t('Book Online', 'Reserva en Línea'), desc: t('Pick date, time and passengers', 'Elige fecha, hora y pasajeros') },
    { num: '03', title: t('Enjoy Los Cabos', 'Disfruta Los Cabos'), desc: t("We'll handle the rest", 'Nosotros nos encargamos del resto') },
  ];

  const testimonials = [
    { name: 'Sarah M.', text: t('Incredible service! Driver was waiting for us with cold water. Best transfer in Cabo.', '¡Servicio increíble! El chofer nos esperaba con agua fría. Mejor transfer en Cabo.'), rating: 5 },
    { name: 'James R.', text: t('Professional, on time, and the vehicle was spotless. Highly recommend!', 'Profesional, puntual y el vehículo impecable. ¡Muy recomendado!'), rating: 5 },
    { name: 'María G.', text: t('The camel ride combo was unforgettable. Great value for money.', 'El combo de paseo en camello fue inolvidable. Excelente relación calidad-precio.'), rating: 5 },
  ];

  const faqs = [
    { q: t('How do I book a transfer?', '¿Cómo reservo un transfer?'), a: t('Simply use our online booking wizard or contact us via WhatsApp. We\'ll confirm your reservation within minutes.', 'Simplemente usa nuestro wizard de reservación en línea o contáctanos por WhatsApp. Confirmaremos tu reservación en minutos.') },
    { q: t('What\'s included in private transfers?', '¿Qué incluye el transfer privado?'), a: t('Cold beverages, flight monitoring, meet & greet at the airport, bilingual driver, and door-to-door service.', 'Bebidas frías, monitoreo de vuelo, recibimiento en el aeropuerto, chofer bilingüe y servicio puerta a puerta.') },
    { q: t('Can I combine activities?', '¿Puedo combinar actividades?'), a: t('Yes! We offer special combo packages starting at $100 USD for 2 activities and $125 USD for 3 activities.', '¡Sí! Ofrecemos paquetes combo especiales desde $100 USD por 2 actividades y $125 USD por 3 actividades.') },
    { q: t('What is your cancellation policy?', '¿Cuál es su política de cancelación?'), a: t('Free cancellation up to 24 hours before your scheduled service. Full refund guaranteed.', 'Cancelación gratuita hasta 24 horas antes de su servicio programado. Reembolso total garantizado.') },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative h-screen overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0"
          >
            <img
              src={heroImages[currentImage]}
              alt="Los Cabos"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background" />

        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="font-display text-4xl sm:text-5xl md:text-7xl font-bold mb-4 max-w-4xl"
          >
            {t('Luxury Transfers & Experiences', 'Transfers y Experiencias de Lujo')}
            <br />
            <span className="text-gold-gradient">{t('in Los Cabos', 'en Los Cabos')}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-foreground/70 text-lg md:text-xl max-w-2xl mb-8"
          >
            {t(
              'Premium airport transportation and curated adventures with over 30 years of local expertise.',
              'Transportación premium al aeropuerto y aventuras curadas con más de 30 años de experiencia local.'
            )}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              to="/book"
              className="bg-secondary text-secondary-foreground px-8 py-3.5 rounded-full font-semibold text-base hover:brightness-110 transition-all shadow-lg shadow-secondary/25 flex items-center gap-2"
            >
              {t('Book Your Transfer', 'Reserva Tu Transfer')} <ArrowRight size={18} />
            </Link>
            <Link
              to="/activities"
              className="glass-card px-8 py-3.5 rounded-full font-semibold text-base text-foreground hover:bg-foreground/10 transition-all flex items-center gap-2"
            >
              {t('Explore Activities', 'Explorar Actividades')}
            </Link>
          </motion.div>

          {/* Trust Chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-wrap justify-center gap-3 mt-12"
          >
            {trustChips.map((chip, i) => (
              <span key={i} className="glass-card px-4 py-2 rounded-full text-xs font-medium text-foreground/80 flex items-center gap-2">
                {chip.icon} {chip.label}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-foreground/40"
        >
          <ChevronDown size={28} />
        </motion.div>
      </section>

      {/* Transfers Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">{t('Our Transfers', 'Nuestros Transfers')}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t('Reliable, comfortable, and premium transportation services.', 'Servicios de transportación confiables, cómodos y premium.')}</p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            {transfers.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="glass-card rounded-2xl p-8 hover:border-secondary/30 transition-all group">
                <h3 className="font-display text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground text-sm mb-5">{item.desc}</p>
                <ul className="space-y-2 mb-6">
                  {item.features.map((f, j) => (
                    <li key={j} className="text-sm text-foreground/80 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/book" className="text-secondary text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                  {t('Book Now', 'Reservar')} <ArrowRight size={14} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section className="py-24 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-6">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">{t('Adventures & Activities', 'Aventuras y Actividades')}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t('Curated experiences to make your Los Cabos trip unforgettable.', 'Experiencias curadas para hacer tu viaje a Los Cabos inolvidable.')}</p>
          </motion.div>

          {/* Combo banner */}
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="glass-card rounded-2xl p-6 mb-10 text-center border-secondary/20">
            <p className="text-secondary font-semibold text-lg mb-1">🎉 {t('Special Combos', 'Combos Especiales')}</p>
            <p className="text-foreground/80 text-sm">
              {t('2 activities for $100 USD · 3 activities for $125 USD', '2 actividades por $100 USD · 3 actividades por $125 USD')}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activities.map((act, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="glass-card rounded-xl p-6 hover:border-secondary/30 transition-all">
                <h4 className="font-display text-lg font-bold mb-1">{act.name}</h4>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                  <span><Clock size={13} className="inline mr-1" />{act.duration}</span>
                  <span className="text-secondary font-semibold">{act.price} USD</span>
                </div>
                <Link to="/book-activities" className="text-secondary text-xs font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                  {t('Book Activity', 'Reservar')} <ArrowRight size={12} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">{t('How It Works', 'Cómo Funciona')}</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="text-center">
                <span className="text-5xl font-display font-bold text-secondary/30 block mb-3">{step.num}</span>
                <h4 className="font-display text-xl font-bold mb-2">{step.title}</h4>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-card/30">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">{t('What Our Guests Say', 'Lo Que Dicen Nuestros Huéspedes')}</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t2, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="glass-card rounded-2xl p-6">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t2.rating }).map((_, j) => <Star key={j} size={14} className="fill-secondary text-secondary" />)}
                </div>
                <p className="text-foreground/80 text-sm mb-4 italic">"{t2.text}"</p>
                <p className="text-secondary font-semibold text-sm">{t2.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">{t('Frequently Asked Questions', 'Preguntas Frecuentes')}</h2>
          </motion.div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="glass-card rounded-xl border-none px-6">
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-5">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm pb-5">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
};

export default Index;
