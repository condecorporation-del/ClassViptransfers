import { cloudinaryAssets } from '@/lib/cloudinary-assets';

export interface ActivityInfo {
  slug: string;
  title: { en: string; es: string };
  hook: { en: string; es: string };
  heroImage: string;
  duration: string;
  price: string | null;
  pricingTable?: { label: string; price: string }[];
  experienceType: { en: string; es: string };
  description: { en: string; es: string };
  highlights: { icon: string; label: { en: string; es: string } }[];
  includes: { en: string; es: string }[];
  extraCosts: { en: string; es: string }[];
  beforeBooking: { en: string; es: string }[];
  restrictions: { en: string; es: string }[];
  recommendations: { en: string; es: string }[];
  whatsappMessage: string;
}

export const activityData: ActivityInfo[] = [
  {
    slug: 'camel-ride',
    title: { en: 'Camel Ride', es: 'Paseo en Camello' },
    hook: {
      en: 'Traverse golden dunes where the desert meets the sea — an unforgettable Baja experience.',
      es: 'Atraviesa dunas doradas donde el desierto se encuentra con el mar — una experiencia inolvidable en Baja.',
    },
    heroImage: cloudinaryAssets.activities.camel,
    duration: '1 hour',
    price: '$120 USD',
    experienceType: { en: 'Family-Friendly Adventure', es: 'Aventura Familiar' },
    description: {
      en: 'Ride through stunning beach and desert landscapes on gentle, well-trained camels. Guided by expert handlers, this unique experience blends relaxation with adventure as you take in panoramic views of the Baja California coastline.',
      es: 'Recorre impresionantes paisajes de playa y desierto sobre camellos dóciles y bien entrenados. Guiados por expertos, esta experiencia única combina relajación con aventura mientras disfrutas vistas panorámicas de la costa de Baja California.',
    },
    highlights: [
      { icon: 'Clock', label: { en: '1 Hour Duration', es: '1 Hora de Duración' } },
      { icon: 'Car', label: { en: 'Transportation Included', es: 'Transporte Incluido' } },
      { icon: 'Languages', label: { en: 'Bilingual Guide', es: 'Guía Bilingüe' } },
      { icon: 'Shield', label: { en: 'Safety Equipment', es: 'Equipo de Seguridad' } },
      { icon: 'Heart', label: { en: 'Family-Friendly', es: 'Para Toda la Familia' } },
    ],
    includes: [
      { en: 'Round-trip hotel transportation', es: 'Transporte ida y vuelta al hotel' },
      { en: 'Safety equipment & helmets', es: 'Equipo de seguridad y cascos' },
      { en: 'Bilingual guide', es: 'Guía bilingüe' },
      { en: 'Water', es: 'Agua' },
      { en: 'Kids club access', es: 'Acceso al club de niños' },
      { en: 'Tequila tasting', es: 'Degustación de tequila' },
      { en: 'Lockers', es: 'Casilleros' },
    ],
    extraCosts: [
      { en: 'Park entrance fee: $25 USD per person (mandatory, paid on-site)', es: 'Entrada al parque: $25 USD por persona (obligatorio, pago en sitio)' },
      { en: 'Photo package available for purchase', es: 'Paquete de fotos disponible para compra' },
      { en: 'Optional private tour (cameras/phones allowed)', es: 'Tour privado opcional (cámaras/teléfonos permitidos)' },
    ],
    beforeBooking: [
      { en: 'Minimum age: 5 years', es: 'Edad mínima: 5 años' },
      { en: 'Children 5–11 ride with an adult', es: 'Niños de 5 a 11 años montan con un adulto' },
      { en: 'Maximum weight: 125 kg (275 lbs)', es: 'Peso máximo: 125 kg (275 lbs)' },
      { en: "No driver's license required", es: 'No se requiere licencia de conducir' },
    ],
    restrictions: [
      { en: 'No pregnant travelers', es: 'No mujeres embarazadas' },
      { en: 'No alcohol or drugs before/during activity', es: 'Sin alcohol o drogas antes/durante la actividad' },
      { en: 'No back or neck injuries / recent surgery', es: 'Sin lesiones de espalda o cuello / cirugías recientes' },
      { en: 'Cameras & phones NOT allowed (public tours)', es: 'Cámaras y teléfonos NO permitidos (tours públicos)' },
      { en: 'GoPro hands-free cameras ARE allowed', es: 'Cámaras GoPro manos libres SÍ permitidas' },
      { en: 'Company reserves the right of admission', es: 'La empresa se reserva el derecho de admisión' },
    ],
    recommendations: [
      { en: 'Sport clothing', es: 'Ropa deportiva' },
      { en: 'Closed shoes', es: 'Zapatos cerrados' },
      { en: 'Sunscreen', es: 'Protector solar' },
      { en: 'Payment method (cash or card)', es: 'Método de pago (efectivo o tarjeta)' },
    ],
    whatsappMessage: "Hi! I'd like to book the Camel Ride experience.",
  },
  {
    slug: 'horseback-riding',
    title: { en: 'Horseback Riding', es: 'Cabalgata' },
    hook: {
      en: 'Gallop along pristine beaches with the Sierra de la Laguna as your backdrop — pure Baja magic.',
      es: 'Galopa por playas vírgenes con la Sierra de la Laguna como telón de fondo — pura magia de Baja.',
    },
    heroImage: cloudinaryAssets.activities.horseback,
    duration: '1 hour',
    price: '$120 USD',
    experienceType: { en: 'Scenic Adventure', es: 'Aventura Escénica' },
    description: {
      en: 'Experience the beauty of Los Cabos on horseback, riding through desert trails and along the beach. Expert guides lead you on well-trained horses through landscapes that blend rugged desert terrain with breathtaking ocean views.',
      es: 'Experimenta la belleza de Los Cabos a caballo, recorriendo senderos del desierto y la playa. Guías expertos te llevan en caballos bien entrenados por paisajes que combinan terreno desértico con impresionantes vistas al mar.',
    },
    highlights: [
      { icon: 'Clock', label: { en: '1 Hour Duration', es: '1 Hora de Duración' } },
      { icon: 'Car', label: { en: 'Transportation Included', es: 'Transporte Incluido' } },
      { icon: 'Languages', label: { en: 'Bilingual Guide', es: 'Guía Bilingüe' } },
      { icon: 'Shield', label: { en: 'Safety Equipment', es: 'Equipo de Seguridad' } },
      { icon: 'Mountain', label: { en: 'Desert & Beach', es: 'Desierto y Playa' } },
    ],
    includes: [
      { en: 'Round-trip hotel transportation', es: 'Transporte ida y vuelta al hotel' },
      { en: 'Safety equipment & helmets', es: 'Equipo de seguridad y cascos' },
      { en: 'Bilingual guide', es: 'Guía bilingüe' },
      { en: 'Water', es: 'Agua' },
      { en: 'Kids club access', es: 'Acceso al club de niños' },
      { en: 'Tequila tasting', es: 'Degustación de tequila' },
      { en: 'Lockers', es: 'Casilleros' },
    ],
    extraCosts: [
      { en: 'Park entrance fee: $25 USD per person (mandatory, paid on-site)', es: 'Entrada al parque: $25 USD por persona (obligatorio, pago en sitio)' },
      { en: 'Photo package available for purchase', es: 'Paquete de fotos disponible para compra' },
      { en: 'Optional private tour (cameras/phones allowed)', es: 'Tour privado opcional (cámaras/teléfonos permitidos)' },
    ],
    beforeBooking: [
      { en: 'Minimum age: 7 years', es: 'Edad mínima: 7 años' },
      { en: 'Maximum age: 70 years', es: 'Edad máxima: 70 años' },
      { en: 'Maximum weight: 110 kg (242 lbs)', es: 'Peso máximo: 110 kg (242 lbs)' },
      { en: "No driver's license required", es: 'No se requiere licencia de conducir' },
    ],
    restrictions: [
      { en: 'No pregnant travelers', es: 'No mujeres embarazadas' },
      { en: 'No alcohol or drugs before/during activity', es: 'Sin alcohol o drogas antes/durante la actividad' },
      { en: 'No back or neck injuries / recent surgery', es: 'Sin lesiones de espalda o cuello / cirugías recientes' },
      { en: 'Cameras & phones NOT allowed (public tours)', es: 'Cámaras y teléfonos NO permitidos (tours públicos)' },
      { en: 'GoPro hands-free cameras ARE allowed', es: 'Cámaras GoPro manos libres SÍ permitidas' },
      { en: 'Company reserves the right of admission', es: 'La empresa se reserva el derecho de admisión' },
    ],
    recommendations: [
      { en: 'Sport clothing', es: 'Ropa deportiva' },
      { en: 'Closed shoes (mandatory)', es: 'Zapatos cerrados (obligatorio)' },
      { en: 'Sunscreen', es: 'Protector solar' },
      { en: 'Payment method (cash or card)', es: 'Método de pago (efectivo o tarjeta)' },
    ],
    whatsappMessage: "Hi! I'd like to book the Horseback Riding experience.",
  },
  {
    slug: 'sky-bikes',
    title: { en: 'Sky Bikes', es: 'Sky Bikes' },
    hook: {
      en: 'Pedal through the sky on a world-class aerial trail — where adrenaline meets breathtaking views.',
      es: 'Pedalea por el cielo en una pista aérea de clase mundial — donde la adrenalina se encuentra con vistas impresionantes.',
    },
    heroImage: cloudinaryAssets.activities.skybikes,
    duration: '2 hours',
    price: '$96 USD',
    experienceType: { en: 'Aerial Adventure', es: 'Aventura Aérea' },
    description: {
      en: 'Experience a world-class aerial cycling adventure on a record-breaking elevated trail. This unique activity combines breathtaking panoramic views with eco-friendly exploration, plus a buffet, desert safari, and tequila tasting.',
      es: 'Vive una aventura de ciclismo aéreo de clase mundial en una pista elevada récord. Esta actividad única combina vistas panorámicas impresionantes con exploración ecológica, más buffet, safari desértico y degustación de tequila.',
    },
    highlights: [
      { icon: 'Clock', label: { en: '2 Hours Duration', es: '2 Horas de Duración' } },
      { icon: 'Car', label: { en: 'Transportation Included', es: 'Transporte Incluido' } },
      { icon: 'Languages', label: { en: 'Bilingual Guide', es: 'Guía Bilingüe' } },
      { icon: 'UtensilsCrossed', label: { en: 'Buffet Included', es: 'Buffet Incluido' } },
      { icon: 'Leaf', label: { en: 'Eco Adventure', es: 'Aventura Ecológica' } },
    ],
    includes: [
      { en: 'Round-trip hotel transportation', es: 'Transporte ida y vuelta al hotel' },
      { en: 'Safety equipment & helmets', es: 'Equipo de seguridad y cascos' },
      { en: 'Bilingual guide', es: 'Guía bilingüe' },
      { en: 'Buffet meal', es: 'Comida tipo buffet' },
      { en: 'Eco walk experience', es: 'Caminata ecológica' },
      { en: 'Tequila tasting', es: 'Degustación de tequila' },
      { en: 'Desert safari', es: 'Safari desértico' },
      { en: 'Lockers', es: 'Casilleros' },
    ],
    extraCosts: [
      { en: 'Park entrance fee: $25 USD per person (mandatory, paid on-site)', es: 'Entrada al parque: $25 USD por persona (obligatorio, pago en sitio)' },
      { en: 'Photo package available for purchase', es: 'Paquete de fotos disponible para compra' },
    ],
    beforeBooking: [
      { en: 'Minimum age: 8 years', es: 'Edad mínima: 8 años' },
      { en: 'Maximum weight: 120 kg (264 lbs)', es: 'Peso máximo: 120 kg (264 lbs)' },
      { en: "No driver's license required", es: 'No se requiere licencia de conducir' },
    ],
    restrictions: [
      { en: 'No pregnant travelers', es: 'No mujeres embarazadas' },
      { en: 'No alcohol or drugs before/during activity', es: 'Sin alcohol o drogas antes/durante la actividad' },
      { en: 'No back or neck injuries / recent surgery', es: 'Sin lesiones de espalda o cuello / cirugías recientes' },
      { en: 'Cameras & phones NOT allowed (public tours)', es: 'Cámaras y teléfonos NO permitidos (tours públicos)' },
      { en: 'GoPro hands-free cameras ARE allowed', es: 'Cámaras GoPro manos libres SÍ permitidas' },
      { en: 'Company reserves the right of admission', es: 'La empresa se reserva el derecho de admisión' },
    ],
    recommendations: [
      { en: 'Sport clothing', es: 'Ropa deportiva' },
      { en: 'Closed shoes', es: 'Zapatos cerrados' },
      { en: 'Sunscreen', es: 'Protector solar' },
      { en: 'Payment method (cash or card)', es: 'Método de pago (efectivo o tarjeta)' },
    ],
    whatsappMessage: "Hi! I'd like to book the Sky Bikes experience.",
  },
  {
    slug: 'utv-adventure',
    title: { en: 'UTV Adventure', es: 'Aventura en UTV' },
    hook: {
      en: "Conquer Baja's untamed canyons in a powerful UTV — raw adrenaline, cinematic landscapes.",
      es: 'Conquista los cañones salvajes de Baja en un potente UTV — adrenalina pura, paisajes cinematográficos.',
    },
    heroImage: cloudinaryAssets.activities.utv,
    duration: '2 hours',
    price: null,
    pricingTable: [
      { label: '1 passenger', price: '$205 USD' },
      { label: '2 passengers', price: '$290 USD' },
      { label: '3 passengers', price: '$350 USD' },
      { label: '4 passengers', price: '$405 USD' },
    ],
    experienceType: { en: 'Off-Road Adrenaline', es: 'Adrenalina Off-Road' },
    description: {
      en: "Take the wheel of a powerful UTV and navigate through Baja California's dramatic canyon trails. This off-road experience delivers pure adrenaline as you traverse rugged desert terrain with stunning ocean views in the distance.",
      es: 'Toma el volante de un potente UTV y navega por los espectaculares senderos de cañones de Baja California. Esta experiencia off-road ofrece adrenalina pura mientras recorres terreno desértico con impresionantes vistas al mar.',
    },
    highlights: [
      { icon: 'Clock', label: { en: '2 Hours Duration', es: '2 Horas de Duración' } },
      { icon: 'Car', label: { en: 'Transportation Included', es: 'Transporte Incluido' } },
      { icon: 'Languages', label: { en: 'Bilingual Guide', es: 'Guía Bilingüe' } },
      { icon: 'Shield', label: { en: 'Safety Equipment', es: 'Equipo de Seguridad' } },
      { icon: 'Zap', label: { en: 'High Adrenaline', es: 'Alta Adrenalina' } },
    ],
    includes: [
      { en: 'Round-trip hotel transportation', es: 'Transporte ida y vuelta al hotel' },
      { en: 'Safety equipment, helmets & goggles', es: 'Equipo de seguridad, cascos y goggles' },
      { en: 'Bilingual guide', es: 'Guía bilingüe' },
      { en: 'Water', es: 'Agua' },
      { en: 'Kids club access', es: 'Acceso al club de niños' },
      { en: 'Tequila tasting', es: 'Degustación de tequila' },
      { en: 'Lockers', es: 'Casilleros' },
    ],
    extraCosts: [
      { en: 'Park entrance fee: $25 USD per person (mandatory, paid on-site)', es: 'Entrada al parque: $25 USD por persona (obligatorio, pago en sitio)' },
      { en: 'Vehicle protection insurance available', es: 'Seguro de protección vehicular disponible' },
      { en: '$500 USD credit card hold if insurance declined (released within 48 hrs)', es: 'Depósito de $500 USD en tarjeta si se declina seguro (liberado en 48 hrs)' },
      { en: 'Photo package available for purchase', es: 'Paquete de fotos disponible para compra' },
    ],
    beforeBooking: [
      { en: 'Driver minimum age: 16 years with valid license', es: 'Edad mínima conductor: 16 años con licencia vigente' },
      { en: 'Passenger minimum age: 5 years', es: 'Edad mínima pasajero: 5 años' },
      { en: 'Maximum weight: 125 kg (275 lbs)', es: 'Peso máximo: 125 kg (275 lbs)' },
      { en: "Valid driver's license required", es: 'Licencia de conducir vigente requerida' },
    ],
    restrictions: [
      { en: 'No pregnant travelers', es: 'No mujeres embarazadas' },
      { en: 'No alcohol or drugs before/during activity', es: 'Sin alcohol o drogas antes/durante la actividad' },
      { en: 'No back or neck injuries / recent surgery', es: 'Sin lesiones de espalda o cuello / cirugías recientes' },
      { en: 'Cameras & phones NOT allowed (public tours)', es: 'Cámaras y teléfonos NO permitidos (tours públicos)' },
      { en: 'GoPro hands-free cameras ARE allowed', es: 'Cámaras GoPro manos libres SÍ permitidas' },
      { en: 'Company reserves the right of admission', es: 'La empresa se reserva el derecho de admisión' },
    ],
    recommendations: [
      { en: 'Sport clothing (will get dusty)', es: 'Ropa deportiva (se ensuciará)' },
      { en: 'Closed shoes (mandatory)', es: 'Zapatos cerrados (obligatorio)' },
      { en: 'Sunscreen', es: 'Protector solar' },
      { en: 'Payment method (cash or card)', es: 'Método de pago (efectivo o tarjeta)' },
    ],
    whatsappMessage: "Hi! I'd like to book the UTV Adventure experience.",
  },
  {
    slug: 'atv',
    title: { en: 'ATV Adventure', es: 'Aventura en ATV' },
    hook: {
      en: "Feel the rush of raw desert power — an adrenaline ride through Baja's most dramatic trails.",
      es: 'Siente la adrenalina pura del desierto — un recorrido emocionante por los senderos más espectaculares de Baja.',
    },
    heroImage: cloudinaryAssets.activities.atv,
    duration: '2 hours',
    price: '$120 USD',
    experienceType: { en: 'Off-Road Adrenaline', es: 'Adrenalina Off-Road' },
    description: {
      en: "Navigate rugged desert terrain on a powerful ATV, guided by experts through Baja California's stunning landscapes. This high-energy experience combines raw adrenaline with breathtaking views of mountains and coastline.",
      es: 'Recorre el terreno desértico en un potente ATV, guiado por expertos a través de los impresionantes paisajes de Baja California. Esta experiencia de alta energía combina adrenalina pura con vistas impresionantes de montañas y costa.',
    },
    highlights: [
      { icon: 'Clock', label: { en: '2 Hours Duration', es: '2 Horas de Duración' } },
      { icon: 'Car', label: { en: 'Transportation Included', es: 'Transporte Incluido' } },
      { icon: 'Languages', label: { en: 'Bilingual Guide', es: 'Guía Bilingüe' } },
      { icon: 'Shield', label: { en: 'Safety Equipment', es: 'Equipo de Seguridad' } },
      { icon: 'Zap', label: { en: 'High Adrenaline', es: 'Alta Adrenalina' } },
    ],
    includes: [
      { en: 'Round-trip hotel transportation', es: 'Transporte ida y vuelta al hotel' },
      { en: 'Safety equipment, helmets & goggles', es: 'Equipo de seguridad, cascos y goggles' },
      { en: 'Bilingual guide', es: 'Guía bilingüe' },
      { en: 'Water', es: 'Agua' },
      { en: 'Kids club access', es: 'Acceso al club de niños' },
      { en: 'Tequila tasting', es: 'Degustación de tequila' },
      { en: 'Lockers', es: 'Casilleros' },
    ],
    extraCosts: [
      { en: 'Park entrance fee: $25 USD per person (mandatory, paid on-site)', es: 'Entrada al parque: $25 USD por persona (obligatorio, pago en sitio)' },
      { en: 'Vehicle protection insurance available', es: 'Seguro de protección vehicular disponible' },
      { en: '$500 USD credit card hold if insurance declined (released within 48 hrs)', es: 'Depósito de $500 USD en tarjeta si se declina seguro (liberado en 48 hrs)' },
      { en: 'Photo package available for purchase', es: 'Paquete de fotos disponible para compra' },
    ],
    beforeBooking: [
      { en: 'Minimum age: 6 years', es: 'Edad mínima: 6 años' },
      { en: 'Maximum weight: 110 kg (242 lbs)', es: 'Peso máximo: 110 kg (242 lbs)' },
      { en: "No driver's license required", es: 'No se requiere licencia de conducir' },
    ],
    restrictions: [
      { en: 'No pregnant travelers', es: 'No mujeres embarazadas' },
      { en: 'No alcohol or drugs before/during activity', es: 'Sin alcohol o drogas antes/durante la actividad' },
      { en: 'No back or neck injuries / recent surgery', es: 'Sin lesiones de espalda o cuello / cirugías recientes' },
      { en: 'Cameras & phones NOT allowed (public tours)', es: 'Cámaras y teléfonos NO permitidos (tours públicos)' },
      { en: 'GoPro hands-free cameras ARE allowed', es: 'Cámaras GoPro manos libres SÍ permitidas' },
      { en: 'Company reserves the right of admission', es: 'La empresa se reserva el derecho de admisión' },
    ],
    recommendations: [
      { en: 'Sport clothing (will get dusty)', es: 'Ropa deportiva (se ensuciará)' },
      { en: 'Closed shoes (mandatory)', es: 'Zapatos cerrados (obligatorio)' },
      { en: 'Sunscreen', es: 'Protector solar' },
      { en: 'Payment method (cash or card)', es: 'Método de pago (efectivo o tarjeta)' },
    ],
    whatsappMessage: "Hi! I'd like to book the ATV Adventure experience.",
  },
  {
    slug: 'double-motorcycle',
    title: { en: 'Double Motorcycle', es: 'Moto Doble' },
    hook: {
      en: "Share the adventure on a powerful double-seat motorcycle — raw Baja energy for two.",
      es: 'Comparte la aventura en una potente moto doble — energía pura de Baja para dos.',
    },
    heroImage: cloudinaryAssets.activities.moto,
    duration: '2 hours',
    price: '$200 USD',
    experienceType: { en: 'Duo Adventure', es: 'Aventura en Dúo' },
    description: {
      en: "Ride together on a powerful double-seat motorcycle through the rugged Baja terrain. This shared adventure lets you experience the thrill of off-road riding as a pair, with expert guides leading you through desert trails with stunning coastal panoramas.",
      es: 'Recorre juntos en una potente moto doble por el terreno de Baja. Esta aventura compartida te permite experimentar la emoción del off-road en pareja, con guías expertos por senderos desérticos con panorámicas costeras impresionantes.',
    },
    highlights: [
      { icon: 'Clock', label: { en: '2 Hours Duration', es: '2 Horas de Duración' } },
      { icon: 'Car', label: { en: 'Transportation Included', es: 'Transporte Incluido' } },
      { icon: 'Languages', label: { en: 'Bilingual Guide', es: 'Guía Bilingüe' } },
      { icon: 'Shield', label: { en: 'Safety Equipment', es: 'Equipo de Seguridad' } },
      { icon: 'Heart', label: { en: 'Ride Together', es: 'Viaja en Pareja' } },
    ],
    includes: [
      { en: 'Round-trip hotel transportation', es: 'Transporte ida y vuelta al hotel' },
      { en: 'Safety equipment, helmets & goggles', es: 'Equipo de seguridad, cascos y goggles' },
      { en: 'Bilingual guide', es: 'Guía bilingüe' },
      { en: 'Water', es: 'Agua' },
      { en: 'Kids club access', es: 'Acceso al club de niños' },
      { en: 'Tequila tasting', es: 'Degustación de tequila' },
      { en: 'Lockers', es: 'Casilleros' },
    ],
    extraCosts: [
      { en: 'Park entrance fee: $25 USD per person (mandatory, paid on-site)', es: 'Entrada al parque: $25 USD por persona (obligatorio, pago en sitio)' },
      { en: 'Vehicle protection insurance available', es: 'Seguro de protección vehicular disponible' },
      { en: '$500 USD credit card hold if insurance declined (released within 48 hrs)', es: 'Depósito de $500 USD en tarjeta si se declina seguro (liberado en 48 hrs)' },
      { en: 'Photo package available for purchase', es: 'Paquete de fotos disponible para compra' },
    ],
    beforeBooking: [
      { en: 'Driver minimum age: 16 years', es: 'Edad mínima conductor: 16 años' },
      { en: 'Passenger minimum age: 5 years', es: 'Edad mínima pasajero: 5 años' },
      { en: 'Maximum weight: 110 kg (242 lbs)', es: 'Peso máximo: 110 kg (242 lbs)' },
      { en: "Valid driver's license required", es: 'Licencia de conducir vigente requerida' },
    ],
    restrictions: [
      { en: 'No pregnant travelers', es: 'No mujeres embarazadas' },
      { en: 'No alcohol or drugs before/during activity', es: 'Sin alcohol o drogas antes/durante la actividad' },
      { en: 'No back or neck injuries / recent surgery', es: 'Sin lesiones de espalda o cuello / cirugías recientes' },
      { en: 'Cameras & phones NOT allowed (public tours)', es: 'Cámaras y teléfonos NO permitidos (tours públicos)' },
      { en: 'GoPro hands-free cameras ARE allowed', es: 'Cámaras GoPro manos libres SÍ permitidas' },
      { en: 'Company reserves the right of admission', es: 'La empresa se reserva el derecho de admisión' },
    ],
    recommendations: [
      { en: 'Sport clothing (will get dusty)', es: 'Ropa deportiva (se ensuciará)' },
      { en: 'Closed shoes (mandatory)', es: 'Zapatos cerrados (obligatorio)' },
      { en: 'Sunscreen', es: 'Protector solar' },
      { en: 'Payment method (cash or card)', es: 'Método de pago (efectivo o tarjeta)' },
    ],
    whatsappMessage: "Hi! I'd like to book the Double Motorcycle experience.",
  },
];
