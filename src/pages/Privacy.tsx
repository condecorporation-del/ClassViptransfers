import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';

const content = {
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'Last updated',
    sections: [
      {
        heading: '1. Information We Collect',
        body: `When you use our services or website, we may collect the following information:\n• Personal information: name, email, phone number (provided during booking or contact).\n• Booking details: travel dates, pickup/drop-off locations, number of passengers, flight information.\n• Payment information: processed securely through PayPal; we do not store credit card numbers.\n• Usage data: pages visited, browser type, device information (collected via cookies and analytics).`,
      },
      {
        heading: '2. How We Use Your Information',
        body: `We use the collected information to:\n• Process and confirm your bookings.\n• Communicate service details, updates, and confirmations via email or WhatsApp.\n• Provide customer support.\n• Improve our website and services.\n• Comply with legal obligations.\n\nWe do NOT sell, rent, or share your personal information with third parties for marketing purposes.`,
      },
      {
        heading: '3. Information Sharing',
        body: `We share your information only with:\n• Our drivers and operations team (name, pickup details, and flight info to perform the service).\n• Payment processors (PayPal) to process transactions.\n• Activity operators (when you book an activity, we share your name and booking details with the operator).\n• Law enforcement or regulatory authorities when required by law.`,
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
        body: `You have the right to:\n• Access the personal data we hold about you.\n• Request correction of inaccurate data.\n• Request deletion of your data (subject to legal retention requirements).\n• Withdraw consent for communications at any time.\n\nTo exercise these rights, contact us at Armando@caboviptransfers.com or via WhatsApp at +52 624 122 2174.`,
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
        body: `For questions or concerns about this privacy policy:\n• Email: Armando@caboviptransfers.com\n• WhatsApp: +52 624 122 2174\n• Address: Los Cabos, Baja California Sur, Mexico`,
      },
    ],
  },
  es: {
    title: 'Política de Privacidad',
    lastUpdated: 'Última actualización',
    sections: [
      {
        heading: '1. Información que Recopilamos',
        body: `Cuando usas nuestros servicios o sitio web, podemos recopilar la siguiente información:\n• Información personal: nombre, correo electrónico, número de teléfono (proporcionados al reservar o contactarnos).\n• Detalles de reservación: fechas de viaje, puntos de recogida/destino, número de pasajeros, información de vuelo.\n• Información de pago: procesada de forma segura a través de PayPal; no almacenamos números de tarjeta de crédito.\n• Datos de uso: páginas visitadas, tipo de navegador, información del dispositivo (recopilados mediante cookies y analíticas).`,
      },
      {
        heading: '2. Cómo Usamos tu Información',
        body: `Utilizamos la información recopilada para:\n• Procesar y confirmar tus reservaciones.\n• Comunicar detalles del servicio, actualizaciones y confirmaciones por email o WhatsApp.\n• Brindar soporte al cliente.\n• Mejorar nuestro sitio web y servicios.\n• Cumplir con obligaciones legales.\n\nNO vendemos, rentamos ni compartimos tu información personal con terceros para fines de marketing.`,
      },
      {
        heading: '3. Compartir Información',
        body: `Compartimos tu información únicamente con:\n• Nuestros choferes y equipo de operaciones (nombre, detalles de recogida e info de vuelo para realizar el servicio).\n• Procesadores de pago (PayPal) para procesar transacciones.\n• Operadores de actividades (cuando reservas una actividad, compartimos tu nombre y detalles con el operador).\n• Autoridades legales o regulatorias cuando la ley lo requiera.`,
      },
      {
        heading: '4. Seguridad de Datos',
        body: `Implementamos medidas de seguridad estándar de la industria para proteger tu información personal, incluyendo comunicaciones encriptadas (HTTPS), autenticación segura y acceso limitado a datos personales. Sin embargo, ningún método de transmisión o almacenamiento electrónico es 100% seguro, y no podemos garantizar seguridad absoluta.`,
      },
      {
        heading: '5. Cookies',
        body: `Nuestro sitio web utiliza cookies para:\n• Recordar tu preferencia de idioma.\n• Mantener tu sesión durante el proceso de reservación.\n• Analizar el tráfico del sitio (mediante Google Analytics, cuando esté habilitado).\n\nPuedes desactivar las cookies en tu navegador, pero algunas funciones del sitio pueden no funcionar correctamente.`,
      },
      {
        heading: '6. Tus Derechos',
        body: `Tienes derecho a:\n• Acceder a los datos personales que tenemos sobre ti.\n• Solicitar la corrección de datos inexactos.\n• Solicitar la eliminación de tus datos (sujeto a requisitos legales de retención).\n• Retirar el consentimiento para comunicaciones en cualquier momento.\n\nPara ejercer estos derechos, contáctanos a Armando@caboviptransfers.com o por WhatsApp al +52 624 122 2174.`,
      },
      {
        heading: '7. Retención de Datos',
        body: `Conservamos los datos de reservaciones y clientes por hasta 3 años para fines operativos y legales. Después de este período, los datos personales se eliminan de forma segura. Puedes solicitar la eliminación anticipada contactándonos directamente.`,
      },
      {
        heading: '8. Enlaces a Terceros',
        body: `Nuestro sitio web puede contener enlaces a sitios de terceros (operadores de actividades, proveedores de pago, etc.). No somos responsables de las prácticas de privacidad de estos sitios externos. Te recomendamos revisar sus políticas de privacidad.`,
      },
      {
        heading: '9. Cambios a Esta Política',
        body: `Podemos actualizar esta política de privacidad periódicamente. Los cambios se publicarán en esta página con una fecha actualizada. El uso continuado de nuestros servicios después de los cambios constituye la aceptación de la política actualizada.`,
      },
      {
        heading: '10. Contacto',
        body: `Para preguntas o dudas sobre esta política de privacidad:\n• Email: Armando@caboviptransfers.com\n• WhatsApp: +52 624 122 2174\n• Dirección: Los Cabos, Baja California Sur, México`,
      },
    ],
  },
};

export default function Privacy() {
  const { lang } = useLanguage();
  const c = content[lang];

  return (
    <div className="pt-28 pb-20 px-4 min-h-screen bg-gradient-to-b from-background to-muted/30">
      <SEO
        title={lang === 'es' ? 'Política de Privacidad' : 'Privacy Policy'}
        description={lang === 'es' ? 'Cómo Class VIP Transfers recopila, usa y protege tu información personal. Política de privacidad completa.' : 'How Class VIP Transfers collects, uses and protects your personal information. Full privacy policy.'}
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
            {lang === 'es' ? '¿Tienes preguntas sobre nuestra privacidad?' : 'Questions about our privacy practices?'}
          </p>
          <Link to="/contact" className="text-gold font-medium text-sm hover:underline">
            {lang === 'es' ? 'Contáctanos' : 'Contact Us'}
          </Link>
        </div>
      </div>
    </div>
  );
}
