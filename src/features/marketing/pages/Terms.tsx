import { useLanguage } from '@/shared/providers/LanguageContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SEO } from '@/features/marketing/components/SEO';

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
        body: `All prices are displayed in US Dollars (USD) and include taxes. Payment is processed securely through our approved payment providers. The final price is determined by the route, vehicle type, number of passengers, and any extras selected during booking. Class VIP Transfers reserves the right to update pricing at any time; however, confirmed bookings will honor the price at the time of payment.`,
      },
      {
        heading: '4. Cancellation Policy',
        body: `• Cancellations made more than 48 hours before the service: full refund.\n• Cancellations made between 24 and 48 hours before the service: 50% refund.\n• Cancellations made less than 24 hours before the service or no-shows: no refund.\n• To cancel, contact us via WhatsApp at +52 624 122 2174 or email armando@classviptransfers.com with your booking reference.`,
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
    title: 'Terminos y Condiciones',
    lastUpdated: 'Ultima actualizacion',
    sections: [
      {
        heading: '1. Descripcion del Servicio',
        body: `Class VIP Transfers ofrece servicios de transporte terrestre privado en Los Cabos, Mexico, incluyendo traslados aeropuerto-hotel, hotel-hotel y rutas personalizadas. Todos los servicios se operan con vehiculos con licencia y seguro, conducidos por choferes profesionales.`,
      },
      {
        heading: '2. Reservacion y Confirmacion',
        body: `Una reservacion se confirma cuando el cliente completa el proceso de pago y recibe un correo de confirmacion con un numero de referencia unico. Los datos de la reservacion (fecha, hora, puntos de recogida/destino, numero de pasajeros) deben ser precisos al momento de reservar. Cualquier cambio debe comunicarse con al menos 24 horas de anticipacion.`,
      },
      {
        heading: '3. Precios y Pagos',
        body: `Todos los precios se muestran en Dolares Americanos (USD) e incluyen impuestos. El pago se procesa de forma segura a traves de nuestros proveedores de pago autorizados. El precio final se determina por la ruta, tipo de vehiculo, numero de pasajeros y extras seleccionados. Class VIP Transfers se reserva el derecho de actualizar precios en cualquier momento; sin embargo, las reservaciones confirmadas respetaran el precio al momento del pago.`,
      },
      {
        heading: '4. Politica de Cancelacion',
        body: `• Cancelaciones con mas de 48 horas de anticipacion: reembolso total.\n• Cancelaciones entre 24 y 48 horas antes del servicio: reembolso del 50%.\n• Cancelaciones con menos de 24 horas o no presentarse: sin reembolso.\n• Para cancelar, contactanos por WhatsApp al +52 624 122 2174 o email a armando@classviptransfers.com con tu numero de reservacion.`,
      },
      {
        heading: '5. Modificaciones',
        body: `Cambios de fecha, hora, lugar de recogida o numero de pasajeros pueden solicitarse con al menos 24 horas de anticipacion sin costo adicional, sujeto a disponibilidad. Cambios solicitados con menos de 24 horas pueden generar cargos adicionales.`,
      },
      {
        heading: '6. Responsabilidades del Pasajero',
        body: `Los pasajeros deben estar listos en el punto de recogida designado a la hora programada. Se otorga un tiempo de espera de cortesia de 15 minutos para recogidas en hotel y 45 minutos para recogidas en aeropuerto (desde el aterrizaje del vuelo). Despues del tiempo de cortesia, pueden aplicar cargos adicionales. Los pasajeros son responsables de informarnos sobre retrasos de vuelo.`,
      },
      {
        heading: '7. Equipaje y Pertenencias',
        body: `La capacidad de equipaje estandar depende del tipo de vehiculo seleccionado. Class VIP Transfers no se hace responsable por pertenencias personales perdidas, robadas o danadas durante el traslado. Si olvidas algun articulo en el vehiculo, contactanos de inmediato y haremos esfuerzos razonables para recuperarlo.`,
      },
      {
        heading: '8. Deslinde de Actividades',
        body: `Class VIP Transfers actua como intermediario para actividades de aventura y excursiones (ATV, UTV, cabalgata, safari en camello, etc.). NO somos los operadores directos de estas actividades. Los operadores son terceros independientes responsables de la seguridad, seguro y ejecucion. Al reservar una actividad a traves de nuestra plataforma, reconoces que:\n• Class VIP Transfers no es responsable de lesiones, danos o incidentes durante la actividad.\n• Participas bajo tu propio riesgo y debes seguir las instrucciones de seguridad del operador.\n• Las politicas de cancelacion y reembolso de actividades se rigen por los terminos del operador respectivo.`,
      },
      {
        heading: '9. Responsabilidad',
        body: `Class VIP Transfers cuenta con seguro integral para todos los servicios de transporte. Nuestra responsabilidad se limita al valor del servicio contratado. No somos responsables por retrasos causados por trafico, clima, condiciones del camino u otras circunstancias fuera de nuestro control.`,
      },
      {
        heading: '10. Ley Aplicable',
        body: `Estos terminos se rigen por las leyes de Mexico. Cualquier disputa derivada de estos terminos se resolvera en los tribunales de Los Cabos, Baja California Sur, Mexico.`,
      },
    ],
  },
} as const;

export default function Terms() {
  const { lang } = useLanguage();
  const c = content[lang];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 px-4 pb-20 pt-28">
      <SEO
        title={lang === 'es' ? 'Terminos y Condiciones' : 'Terms & Conditions'}
        description={
          lang === 'es'
            ? 'Terminos de servicio, politica de cancelacion y deslinde de actividades de Class VIP Transfers en Los Cabos.'
            : 'Terms of service, cancellation policy and activity disclaimer for Class VIP Transfers in Los Cabos.'
        }
        canonical="https://classviptransfers.com/terms"
      />
      <div className="container mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground md:text-4xl">{c.title}</h1>
          <p className="mb-10 text-sm text-muted-foreground">
            {c.lastUpdated}:{' '}
            {new Date().toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', {
              year: 'numeric',
              month: 'long',
            })}
          </p>
        </motion.div>

        <div className="space-y-8">
          {c.sections.map((section, index) => (
            <motion.section
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.35 }}
            >
              <h2 className="mb-2 font-display text-lg font-semibold text-foreground">{section.heading}</h2>
              <div className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{section.body}</div>
            </motion.section>
          ))}
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            {lang === 'es' ? 'Tienes preguntas sobre estos terminos?' : 'Questions about these terms?'}
          </p>
          <Link to="/contact" className="text-sm font-medium text-gold hover:underline">
            {lang === 'es' ? 'Contactanos' : 'Contact Us'}
          </Link>
        </div>
      </div>
    </div>
  );
}
