import { useLanguage } from '@/shared/providers/LanguageContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SEO } from '@/features/marketing/components/SEO';

const content = {
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'Last updated',
    sections: [
      {
        heading: '1. Information We Collect',
        body: `When you use our services or website, we may collect the following information:\n• Personal information: name, email, phone number (provided during booking or contact).\n• Booking details: travel dates, pickup/drop-off locations, number of passengers, flight information.\n• Payment information: processed securely through our payment providers; we do not store credit card numbers.\n• Usage data: pages visited, browser type, device information (collected via cookies and analytics).`,
      },
      {
        heading: '2. How We Use Your Information',
        body: `We use the collected information to:\n• Process and confirm your bookings.\n• Communicate service details, updates, and confirmations via email or WhatsApp.\n• Provide customer support.\n• Improve our website and services.\n• Comply with legal obligations.\n\nWe do NOT sell, rent, or share your personal information with third parties for marketing purposes.`,
      },
      {
        heading: '3. Information Sharing',
        body: `We share your information only with:\n• Our drivers and operations team (name, pickup details, and flight info to perform the service).\n• Payment processors (such as Stripe) to process transactions.\n• Activity operators (when you book an activity, we share your name and booking details with the operator).\n• Law enforcement or regulatory authorities when required by law.`,
      },
      {
        heading: '4. Data Security',
        body: `We implement industry-standard security measures to protect your personal information, including encrypted communications (HTTPS), secure authentication, and limited access to personal data. However, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.`,
      },
      {
        heading: '5. Cookies',
        body: `Our website uses cookies to:\n• Remember your language preference.\n• Maintain your session during the booking process.\n• Analyze website traffic (via Google Analytics, when enabled).\n\nYou can disable cookies in your browser settings, but some features of the website may not function properly.`,
      },
      {
        heading: '6. Your Rights',
        body: `You have the right to:\n• Access the personal data we hold about you.\n• Request correction of inaccurate data.\n• Request deletion of your data (subject to legal retention requirements).\n• Withdraw consent for communications at any time.\n\nTo exercise these rights, contact us at armando@classviptransfers.com or via WhatsApp at +52 624 122 2174.`,
      },
      {
        heading: '7. Data Retention',
        body: `We retain booking and customer data for up to 3 years for operational and legal purposes. After this period, personal data is securely deleted. You may request earlier deletion by contacting us directly.`,
      },
      {
        heading: '8. Third-Party Links',
        body: `Our website may contain links to third-party websites (e.g., activity operators, payment providers). We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.`,
      },
      {
        heading: '9. Changes to This Policy',
        body: `We may update this privacy policy periodically. Changes will be posted on this page with an updated date. Continued use of our services after changes constitutes acceptance of the updated policy.`,
      },
      {
        heading: '10. Contact',
        body: `For questions or concerns about this privacy policy:\n• Email: armando@classviptransfers.com\n• WhatsApp: +52 624 122 2174\n• Address: Los Cabos, Baja California Sur, Mexico`,
      },
    ],
  },
  es: {
    title: 'Politica de Privacidad',
    lastUpdated: 'Ultima actualizacion',
    sections: [
      {
        heading: '1. Informacion que Recopilamos',
        body: `Cuando usas nuestros servicios o sitio web, podemos recopilar la siguiente informacion:\n• Informacion personal: nombre, correo electronico, numero de telefono (proporcionados al reservar o contactarnos).\n• Detalles de reservacion: fechas de viaje, puntos de recogida/destino, numero de pasajeros, informacion de vuelo.\n• Informacion de pago: procesada de forma segura a traves de nuestros proveedores de pago; no almacenamos numeros de tarjeta de credito.\n• Datos de uso: paginas visitadas, tipo de navegador, informacion del dispositivo (recopilados mediante cookies y analiticas).`,
      },
      {
        heading: '2. Como Usamos tu Informacion',
        body: `Utilizamos la informacion recopilada para:\n• Procesar y confirmar tus reservaciones.\n• Comunicar detalles del servicio, actualizaciones y confirmaciones por email o WhatsApp.\n• Brindar soporte al cliente.\n• Mejorar nuestro sitio web y servicios.\n• Cumplir con obligaciones legales.\n\nNO vendemos, rentamos ni compartimos tu informacion personal con terceros para fines de marketing.`,
      },
      {
        heading: '3. Compartir Informacion',
        body: `Compartimos tu informacion unicamente con:\n• Nuestros choferes y equipo de operaciones (nombre, detalles de recogida e info de vuelo para realizar el servicio).\n• Procesadores de pago (como Stripe) para procesar transacciones.\n• Operadores de actividades (cuando reservas una actividad, compartimos tu nombre y detalles con el operador).\n• Autoridades legales o regulatorias cuando la ley lo requiera.`,
      },
      {
        heading: '4. Seguridad de Datos',
        body: `Implementamos medidas de seguridad estandar de la industria para proteger tu informacion personal, incluyendo comunicaciones encriptadas (HTTPS), autenticacion segura y acceso limitado a datos personales. Sin embargo, ningun metodo de transmision o almacenamiento electronico es 100% seguro, y no podemos garantizar seguridad absoluta.`,
      },
      {
        heading: '5. Cookies',
        body: `Nuestro sitio web utiliza cookies para:\n• Recordar tu preferencia de idioma.\n• Mantener tu sesion durante el proceso de reservacion.\n• Analizar el trafico del sitio (mediante Google Analytics, cuando este habilitado).\n\nPuedes desactivar las cookies en tu navegador, pero algunas funciones del sitio pueden no funcionar correctamente.`,
      },
      {
        heading: '6. Tus Derechos',
        body: `Tienes derecho a:\n• Acceder a los datos personales que tenemos sobre ti.\n• Solicitar la correccion de datos inexactos.\n• Solicitar la eliminacion de tus datos (sujeto a requisitos legales de retencion).\n• Retirar el consentimiento para comunicaciones en cualquier momento.\n\nPara ejercer estos derechos, contactanos a armando@classviptransfers.com o por WhatsApp al +52 624 122 2174.`,
      },
      {
        heading: '7. Retencion de Datos',
        body: `Conservamos los datos de reservaciones y clientes por hasta 3 anos para fines operativos y legales. Despues de este periodo, los datos personales se eliminan de forma segura. Puedes solicitar la eliminacion anticipada contactandonos directamente.`,
      },
      {
        heading: '8. Enlaces a Terceros',
        body: `Nuestro sitio web puede contener enlaces a sitios de terceros (operadores de actividades, proveedores de pago, etc.). No somos responsables de las practicas de privacidad de estos sitios externos. Te recomendamos revisar sus politicas de privacidad.`,
      },
      {
        heading: '9. Cambios a Esta Politica',
        body: `Podemos actualizar esta politica de privacidad periodicamente. Los cambios se publicaran en esta pagina con una fecha actualizada. El uso continuado de nuestros servicios despues de los cambios constituye la aceptacion de la politica actualizada.`,
      },
      {
        heading: '10. Contacto',
        body: `Para preguntas o dudas sobre esta politica de privacidad:\n• Email: armando@classviptransfers.com\n• WhatsApp: +52 624 122 2174\n• Direccion: Los Cabos, Baja California Sur, Mexico`,
      },
    ],
  },
} as const;

export default function Privacy() {
  const { lang } = useLanguage();
  const c = content[lang];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 px-4 pb-20 pt-28">
      <SEO
        title={lang === 'es' ? 'Politica de Privacidad' : 'Privacy Policy'}
        description={
          lang === 'es'
            ? 'Como Class VIP Transfers recopila, usa y protege tu informacion personal. Politica de privacidad completa.'
            : 'How Class VIP Transfers collects, uses and protects your personal information. Full privacy policy.'
        }
        canonical="https://classviptransfers.com/privacy"
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
            {lang === 'es' ? 'Tienes preguntas sobre nuestra privacidad?' : 'Questions about our privacy practices?'}
          </p>
          <Link to="/contact" className="text-sm font-medium text-gold hover:underline">
            {lang === 'es' ? 'Contactanos' : 'Contact Us'}
          </Link>
        </div>
      </div>
    </div>
  );
}
