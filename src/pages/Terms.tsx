import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';

const content = {
  en: {
    title: 'Terms & Conditions',
    lastUpdated: 'Last updated',
    sections: [
      {
        heading: '1. Service Description',
        body: `Class VIP Transfers provides private ground transportation services in Los Cabos, Mexico, including airport transfers, hotel-to-hotel transfers, and custom routes. All services are operated with licensed, insured vehicles and professional drivers.`,
      },
      {
        heading: '2. Booking & Confirmation',
        body: `A booking is confirmed once the customer completes the payment process and receives a confirmation email with a unique booking reference. The booking details (date, time, pickup/drop-off locations, number of passengers) must be accurate at the time of booking. Any changes must be communicated at least 24 hours before the scheduled service.`,
      },
      {
        heading: '3. Pricing & Payment',
        body: `All prices are displayed in US Dollars (USD) and include taxes. Payment is processed securely through PayPal. The final price is determined by the route, vehicle type, number of passengers, and any extras selected during booking. Class VIP Transfers reserves the right to update pricing at any time; however, confirmed bookings will honor the price at the time of payment.`,
      },
      {
        heading: '4. Cancellation Policy',
        body: `• Cancellations made more than 48 hours before the service: full refund.\n• Cancellations made between 24 and 48 hours before the service: 50% refund.\n• Cancellations made less than 24 hours before the service or no-shows: no refund.\n• To cancel, contact us via WhatsApp at +52 624 122 2174 or email Armando@classviptransfers.com with your booking reference.`,
      },
      {
        heading: '5. Modifications',
        body: `Changes to date, time, pickup location, or number of passengers can be requested at least 24 hours in advance at no extra charge, subject to availability. Changes requested less than 24 hours before the service may incur additional fees.`,
      },
      {
        heading: '6. Passenger Responsibilities',
        body: `Passengers must be ready at the designated pickup point at the scheduled time. A complimentary waiting time of 15 minutes is provided for hotel pickups and 45 minutes for airport pickups (from the time the flight lands). After the complimentary waiting period, additional charges may apply. Passengers are responsible for informing us of flight delays.`,
      },
      {
        heading: '7. Luggage & Personal Belongings',
        body: `Standard luggage capacity depends on the vehicle type selected. Class VIP Transfers is not responsible for lost, stolen, or damaged personal belongings during the transfer. If you forget an item in the vehicle, please contact us immediately and we will make reasonable efforts to recover it.`,
      },
      {
        heading: '8. Activities Disclaimer',
        body: `Class VIP Transfers acts as an intermediary for adventure activities and excursions (ATV, UTV, horseback riding, camel safari, etc.). We are NOT the direct operators of these activities. The activity operators are independent third parties responsible for safety, insurance, and execution. By booking an activity through our platform, you acknowledge that:\n• Class VIP Transfers is not liable for injuries, damages, or incidents during the activity.\n• You participate at your own risk and must follow the operator's safety instructions.\n• Cancellation and refund policies for activities are governed by the respective operator's terms.`,
      },
      {
        heading: '9. Liability',
        body: `Class VIP Transfers carries comprehensive insurance for all transportation services. Our liability is limited to the value of the service purchased. We are not responsible for delays caused by traffic, weather, road conditions, or other circumstances beyond our control.`,
      },
      {
        heading: '10. Governing Law',
        body: `These terms are governed by the laws of Mexico. Any disputes arising from these terms shall be resolved in the courts of Los Cabos, Baja California Sur, Mexico.`,
      },
    ],
  },
  es: {
    title: 'Términos y Condiciones',
    lastUpdated: 'Última actualización',
    sections: [
      {
        heading: '1. Descripción del Servicio',
        body: `Class VIP Transfers ofrece servicios de transporte terrestre privado en Los Cabos, México, incluyendo traslados aeropuerto-hotel, hotel-hotel y rutas personalizadas. Todos los servicios se operan con vehículos con licencia y seguro, conducidos por choferes profesionales.`,
      },
      {
        heading: '2. Reservación y Confirmación',
        body: `Una reservación se confirma cuando el cliente completa el proceso de pago y recibe un correo de confirmación con un número de referencia único. Los datos de la reservación (fecha, hora, puntos de recogida/destino, número de pasajeros) deben ser precisos al momento de reservar. Cualquier cambio debe comunicarse con al menos 24 horas de anticipación.`,
      },
      {
        heading: '3. Precios y Pagos',
        body: `Todos los precios se muestran en Dólares Americanos (USD) e incluyen impuestos. El pago se procesa de forma segura a través de PayPal. El precio final se determina por la ruta, tipo de vehículo, número de pasajeros y extras seleccionados. Class VIP Transfers se reserva el derecho de actualizar precios en cualquier momento; sin embargo, las reservaciones confirmadas respetarán el precio al momento del pago.`,
      },
      {
        heading: '4. Política de Cancelación',
        body: `• Cancelaciones con más de 48 horas de anticipación: reembolso total.\n• Cancelaciones entre 24 y 48 horas antes del servicio: reembolso del 50%.\n• Cancelaciones con menos de 24 horas o no presentarse: sin reembolso.\n• Para cancelar, contáctanos por WhatsApp al +52 624 122 2174 o email a Armando@classviptransfers.com con tu número de reservación.`,
      },
      {
        heading: '5. Modificaciones',
        body: `Cambios de fecha, hora, lugar de recogida o número de pasajeros pueden solicitarse con al menos 24 horas de anticipación sin costo adicional, sujeto a disponibilidad. Cambios solicitados con menos de 24 horas pueden generar cargos adicionales.`,
      },
      {
        heading: '6. Responsabilidades del Pasajero',
        body: `Los pasajeros deben estar listos en el punto de recogida designado a la hora programada. Se otorga un tiempo de espera cortesía de 15 minutos para recogidas en hotel y 45 minutos para recogidas en aeropuerto (desde el aterrizaje del vuelo). Después del tiempo cortesía, pueden aplicar cargos adicionales. Los pasajeros son responsables de informarnos sobre retrasos de vuelo.`,
      },
      {
        heading: '7. Equipaje y Pertenencias',
        body: `La capacidad de equipaje estándar depende del tipo de vehículo seleccionado. Class VIP Transfers no se hace responsable por pertenencias personales perdidas, robadas o dañadas durante el traslado. Si olvidas algún artículo en el vehículo, contáctanos de inmediato y haremos esfuerzos razonables para recuperarlo.`,
      },
      {
        heading: '8. Deslinde de Actividades',
        body: `Class VIP Transfers actúa como intermediario para actividades de aventura y excursiones (ATV, UTV, cabalgata, safari en camello, etc.). NO somos los operadores directos de estas actividades. Los operadores son terceros independientes responsables de la seguridad, seguro y ejecución. Al reservar una actividad a través de nuestra plataforma, reconoces que:\n• Class VIP Transfers no es responsable de lesiones, daños o incidentes durante la actividad.\n• Participas bajo tu propio riesgo y debes seguir las instrucciones de seguridad del operador.\n• Las políticas de cancelación y reembolso de actividades se rigen por los términos del operador respectivo.`,
      },
      {
        heading: '9. Responsabilidad',
        body: `Class VIP Transfers cuenta con seguro integral para todos los servicios de transporte. Nuestra responsabilidad se limita al valor del servicio contratado. No somos responsables por retrasos causados por tráfico, clima, condiciones del camino u otras circunstancias fuera de nuestro control.`,
      },
      {
        heading: '10. Ley Aplicable',
        body: `Estos términos se rigen por las leyes de México. Cualquier disputa derivada de estos términos se resolverá en los tribunales de Los Cabos, Baja California Sur, México.`,
      },
    ],
  },
};

export default function Terms() {
  const { lang } = useLanguage();
  const c = content[lang];

  return (
    <div className="pt-28 pb-20 px-4 min-h-screen bg-gradient-to-b from-background to-muted/30">
      <SEO
        title={lang === 'es' ? 'Términos y Condiciones' : 'Terms & Conditions'}
        description={lang === 'es' ? 'Términos y condiciones de servicio, política de cancelación y deslinde de actividades de Class VIP Transfers en Los Cabos.' : 'Terms of service, cancellation policy and activity disclaimer for Class VIP Transfers in Los Cabos.'}
      />
      <div className="container mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">{c.title}</h1>
          <p className="text-muted-foreground text-sm mb-10">{c.lastUpdated}: {new Date().toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { year: 'numeric', month: 'long' })}</p>
        </motion.div>

        <div className="space-y-8">
          {c.sections.map((s, i) => (
            <motion.section
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.35 }}
            >
              <h2 className="font-display text-lg font-semibold text-foreground mb-2">{s.heading}</h2>
              <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{s.body}</div>
            </motion.section>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-muted-foreground text-sm mb-4">
            {lang === 'es' ? '¿Tienes preguntas sobre estos términos?' : 'Questions about these terms?'}
          </p>
          <Link to="/contact" className="text-gold font-medium text-sm hover:underline">
            {lang === 'es' ? 'Contáctanos' : 'Contact Us'}
          </Link>
        </div>
      </div>
    </div>
  );
}
