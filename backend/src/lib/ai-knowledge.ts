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
    transportSjdToSanJose: 90,
    transportSjdToPortLosCabos: 95,
    transportSjdToCorridor: 100,
    transportSjdToCabo: 110,
    transportSjdToPacific: 130,
    transportSjdToEastCape: 150,
    comboPrice: 100,
    crazyComboPrice: 125,
    parkFeePerPerson: 25,
    roundTripMultiplier: 1.8,
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

  const p = k.pricing;
  // Puerto Los Cabos is a proper name - never translate (same in EN/ES)
  const priceTable = `San José $${p.transportSjdToSanJose}, Puerto Los Cabos $${p.transportSjdToPortLosCabos}, Corridor $${p.transportSjdToCorridor}, Cabo San Lucas $${p.transportSjdToCabo}, Pacific $${p.transportSjdToPacific}, East Cape $${p.transportSjdToEastCape}`;

  return isEs
    ? `CATÁLOGO VEHÍCULOS: ${vehicles}
ACTIVIDADES: ${activities}
UBICACIONES: ${locations}
HOTELES PRINCIPALES: ${hotels}
EXTRAS INCLUIDOS: ${extras}
PRECIOS TRANSPORTE (SUV solo ida desde SJD): ${priceTable}. Ida y vuelta = precio x${p.roundTripMultiplier}. Sprinter (6-14 pax) tiene precio diferente.
ACTIVIDADES COMBO: Combo (2 actividades) $${p.comboPrice} USD/persona, Crazy Combo (3 actividades) $${p.crazyComboPrice} USD/persona. Entrada parque $${p.parkFeePerPerson}/persona.
BENEFICIOS (menciona siempre): ${benefits.join(' ')}
CONTACTO: WhatsApp ${k.contact.whatsapp} | ${k.contact.email}
IMPORTANTE: Eres un asistente informativo. NO hagas reservaciones. Cuando el cliente quiera reservar, indícale que contacte por WhatsApp o email.`
    : `VEHICLE CATALOG: ${vehicles}
ACTIVITIES: ${activities}
KEY LOCATIONS: ${locations}
MAIN HOTELS: ${hotels}
INCLUDED EXTRAS: ${extras}
TRANSPORT PRICES (SUV one-way from SJD): ${priceTable}. Round trip = price x${p.roundTripMultiplier}. Sprinter (6-14 pax) has different pricing.
ACTIVITY COMBOS: Combo (2 activities) $${p.comboPrice} USD/person, Crazy Combo (3 activities) $${p.crazyComboPrice} USD/person. Park fee $${p.parkFeePerPerson}/person.
BENEFITS (always mention): ${benefits.join(' ')}
CONTACT: WhatsApp ${k.contact.whatsapp} | ${k.contact.email}
IMPORTANT: You are an informational assistant. Do NOT make bookings. When the client wants to book, direct them to contact via WhatsApp or email.`;
}
