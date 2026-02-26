/**
 * RAG / Knowledge base for Class VIP Transfers AI sales agent.
 * Injected into system prompt to avoid repeating context and reduce tokens.
 */

export const AI_KNOWLEDGE = {
  vehicles: [
    'SUV Premium',
    'Suburban (8 pax)',
    'Escalade Luxury',
    'Sedan Ejecutivo',
    'Van',
    'Sprinter',
  ],
  activities: [
    'Camel Ride',
    'ATV Adventure',
    'Horseback Riding',
    'Snorkeling',
    'Fishing',
    'Whale Watching',
    'Sunset Cruise',
    'Food Tour',
    'Wine Tasting',
  ],
  activitiesEs: [
    'Paseo en Camello',
    'Aventura ATV',
    'Paseo a Caballo',
    'Snorkel',
    'Pesca',
    'Avistamiento de Ballenas',
    'Crucero al Atardecer',
    'Tour Gastronómico',
    'Degustación de Vinos',
  ],
  locations: [
    'SJD Airport',
    'Cabo San Lucas',
    'San José del Cabo',
    'Corridor (Palmilla, Punta Ballena)',
    'El Arco',
    'Flora Farms',
    'Médano Beach',
  ],
  hotels: [
    'Hilton',
    'Marriott',
    'Grand Solmar',
    'Pueblo Bonito',
    'Cerritos Beach Resort',
    'Mayan Hotel',
  ],
  pricing: {
    transportSjdToCabo: 85,
    roundTrip: 150,
    activitiesRange: '120-400',
    comboDiscountPercent: 15,
    activityUpsellDiscountPercent: 20,
  },
  extras: [
    'Free WiFi',
    'Welcome drinks',
    'Bilingual drivers (Spanish, English, French)',
    'Child seats',
    'Luggage assist',
  ],
  extrasEs: [
    'WiFi gratis',
    'Bebidas de bienvenida',
    'Conductores bilingües (español, inglés, francés)',
    'Sillas infantiles',
    'Asistencia con equipaje',
  ],
  benefits: [
    'All our vehicles include welcome drinks for you and your family.',
    'Our drivers speak Spanish, English and French.',
    'Free WiFi in all our vehicles.',
    'Flexibility: you can change times without penalty.',
  ],
  benefitsEs: [
    'Todos nuestros vehículos incluyen bebidas de bienvenida para ti y tu familia.',
    'Nuestros conductores hablan español, inglés y francés.',
    'WiFi gratis en todos nuestros vehículos.',
    'Flexibilidad: puedes cambiar horarios sin penalidad.',
  ],
  contact: {
    whatsapp: '+52 624 122 2174',
    email: 'Armando@caboviptransfers.com',
  },
} as const;

export function getKnowledgeForPrompt(locale: 'en' | 'es'): string {
  const k = AI_KNOWLEDGE;
  const isEs = locale === 'es';
  const vehicles = k.vehicles.join(', ');
  const activities = isEs ? k.activitiesEs.join(', ') : k.activities.join(', ');
  const locations = k.locations.join(', ');
  const hotels = k.hotels.join(', ');
  const extras = isEs ? k.extrasEs.join(', ') : k.extras.join(', ');
  const benefits = isEs ? k.benefitsEs : k.benefits;

  return isEs
    ? `CATÁLOGO VEHÍCULOS: ${vehicles}
ACTIVIDADES: ${activities}
UBICACIONES: ${locations}
HOTELES PRINCIPALES: ${hotels}
EXTRAS INCLUIDOS: ${extras}
PRECIOS BASE: Transport SJD→Cabo $${k.pricing.transportSjdToCabo}, Round-trip $${k.pricing.roundTrip}, Actividades $${k.pricing.activitiesRange} USD.
COMBO: ${k.pricing.comboDiscountPercent}% descuento. Actividad + transporte: ${k.pricing.activityUpsellDiscountPercent}% desc en actividad.
BENEFICIOS (menciona siempre): ${benefits.join(' ')}
CONTACTO: WhatsApp ${k.contact.whatsapp} | ${k.contact.email}`
    : `VEHICLE CATALOG: ${vehicles}
ACTIVITIES: ${activities}
KEY LOCATIONS: ${locations}
MAIN HOTELS: ${hotels}
INCLUDED EXTRAS: ${extras}
BASE PRICES: Transport SJD→Cabo $${k.pricing.transportSjdToCabo}, Round-trip $${k.pricing.roundTrip}, Activities $${k.pricing.activitiesRange} USD.
COMBO: ${k.pricing.comboDiscountPercent}% off. Activity + transport: ${k.pricing.activityUpsellDiscountPercent}% off activity.
BENEFITS (always mention): ${benefits.join(' ')}
CONTACT: WhatsApp ${k.contact.whatsapp} | ${k.contact.email}`;
}
