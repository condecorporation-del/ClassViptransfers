import OpenAI from 'openai';
import { prisma } from '../lib/prisma';
import { BookingService } from './booking.service';
import { PricingService } from './pricing.service';
import { CreateBookingInput } from '../lib/validation';
import { getKnowledgeForPrompt, AI_KNOWLEDGE } from '../lib/ai-knowledge';
import { BookingType, BookingStatus, BookingSource } from '@prisma/client';

const bookingService = new BookingService();
const pricingService = new PricingService();

// Zone aliases for mapping user input to pricing zones
// Puerto Los Cabos / Port Los Cabos: mismo lugar, NO traducir — ambos válidos
const ZONE_ALIASES: Record<string, string> = {
  airport: 'SJD', aeropuerto: 'SJD', sjd: 'SJD', 'los cabos airport': 'SJD',
  cabo: 'Cabo San Lucas', 'cabo san lucas': 'Cabo San Lucas',
  'san jose': 'San Jose', 'san josé': 'San Jose', 'san jose del cabo': 'San Jose',
  corridor: 'Corridor', corredor: 'Corridor', 'tourist corridor': 'Corridor',
  'hotel zone': 'Cabo San Lucas', marina: 'Cabo San Lucas',
  'puerto los cabos': 'Port Los Cabos', 'port los cabos': 'Port Los Cabos',
};

function resolveZone(text: string | null | undefined, validZones: string[]): string | null {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase().trim();
  const alias = ZONE_ALIASES[lower];
  if (alias && validZones.includes(alias)) return alias;
  for (const z of validZones) if (z.toLowerCase() === lower) return z;
  for (const [k, v] of Object.entries(ZONE_ALIASES))
    if (lower.includes(k) && validZones.includes(v)) return v;
  // Puerto Los Cabos / Port Los Cabos: aceptar cualquiera si está en validZones
  if (lower.includes('puerto los cabos') || lower.includes('port los cabos'))
    return validZones.find(z => z === 'Port Los Cabos' || z === 'Puerto Los Cabos') ?? null;
  return validZones.includes(text) ? text : null;
}

// Popular activities for upselling
const POPULAR_ACTIVITIES = ['Camel Ride', 'ATV Adventure', 'Horseback Riding', 'Paseo en Camello', 'Aventura ATV'];

// In-memory response cache (5 min TTL) - reduces OpenAI calls for similar queries
const CACHE_TTL_MS = 5 * 60 * 1000;
const responseCache = new Map<string, { data: any; expiresAt: number }>();

function normalizeForCache(msg: string): string {
  return (msg || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/** Detect language from message (Spanish vs English) for reply locale */
function detectLocaleFromMessage(msg: string): 'es' | 'en' | null {
  const lower = (msg || '').toLowerCase().trim();
  if (!lower) return null;
  const spanishWords = /\b(quiero|reservar|transportación|actividades|cotización|hola|gracias|por favor|cómo|dónde|cuánto|necesito|información|precio|aeropuerto|hotel|ida y vuelta|solo ida)\b/i;
  const englishWords = /\b(want|book|transportation|activities|quote|hi|thanks|please|how|where|how much|need|information|price|airport|hotel|round trip|one way)\b/i;
  const hasSpanish = spanishWords.test(lower);
  const hasEnglish = englishWords.test(lower);
  if (hasSpanish && !hasEnglish) return 'es';
  if (hasEnglish && !hasSpanish) return 'en';
  return null;
}

function getCacheKey(sessionId: string, message: string, locale: string): string {
  return `chat:${sessionId}:${locale}:${normalizeForCache(message)}`;
}

function getCached(key: string): any | null {
  const entry = responseCache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    if (entry) responseCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: any): void {
  responseCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  // Prune old entries if cache grows (keep last ~500)
  if (responseCache.size > 500) {
    const now = Date.now();
    for (const [k, v] of responseCache.entries()) {
      if (now > v.expiresAt) responseCache.delete(k);
      if (responseCache.size <= 400) break;
    }
  }
}

// Simple acknowledgments/greetings - respond locally without OpenAI to save rate limit
const SIMPLE_LOCAL_REPLIES: Record<string, { en: string; es: string }> = {
  hi: { en: "I'm the Class VIP Transfers assistant. How can I help you? Use the buttons below or type your request.", es: 'Soy el asistente de Class VIP Transfers. ¿En qué puedo ayudarte? Usa los botones de abajo o escribe tu solicitud.' },
  hello: { en: "I'm the Class VIP Transfers assistant. How can I help you? Use the buttons below or type your request.", es: 'Soy el asistente de Class VIP Transfers. ¿En qué puedo ayudarte? Usa los botones de abajo o escribe tu solicitud.' },
  hey: { en: "I'm the Class VIP Transfers assistant. How can I help you? Use the buttons below or type your request.", es: 'Soy el asistente de Class VIP Transfers. ¿En qué puedo ayudarte? Usa los botones de abajo o escribe tu solicitud.' },
  hola: { en: "I'm the Class VIP Transfers assistant. How can I help you? Use the buttons below or type your request.", es: 'Soy el asistente de Class VIP Transfers. ¿En qué puedo ayudarte? Usa los botones de abajo o escribe tu solicitud.' },
  'buenos días': { en: "I'm the Class VIP Transfers assistant. How can I help you? Use the buttons below or type your request.", es: 'Soy el asistente de Class VIP Transfers. ¿En qué puedo ayudarte? Usa los botones de abajo o escribe tu solicitud.' },
  'buenas tardes': { en: "I'm the Class VIP Transfers assistant. How can I help you? Use the buttons below or type your request.", es: 'Soy el asistente de Class VIP Transfers. ¿En qué puedo ayudarte? Usa los botones de abajo o escribe tu solicitud.' },
  'buenas noches': { en: "I'm the Class VIP Transfers assistant. How can I help you? Use the buttons below or type your request.", es: 'Soy el asistente de Class VIP Transfers. ¿En qué puedo ayudarte? Usa los botones de abajo o escribe tu solicitud.' },
  ok: { en: 'Got it! Anything else you\'d like to add to your booking?', es: '¡Entendido! ¿Algo más que quieras añadir a tu reserva?' },
  okay: { en: 'Got it! Anything else you\'d like to add to your booking?', es: '¡Entendido! ¿Algo más que quieras añadir?' },
  yes: { en: 'Great! Tell me more about what you need (date, passengers, pickup/dropoff).', es: '¡Genial! Cuéntame más (fecha, pasajeros, recogida/entrega).' },
  no: { en: 'No problem. How can I help you with your booking?', es: 'Sin problema. ¿Cómo puedo ayudarte con tu reserva?' },
  si: { en: 'Great! Tell me more about what you need.', es: '¡Genial! Cuéntame más sobre lo que necesitas.' },
  sure: { en: 'Perfect! What details would you like to provide?', es: '¡Perfecto! ¿Qué detalles te gustaría dar?' },
  thanks: { en: 'You\'re welcome! Let me know if you need anything else.', es: '¡De nada! Avísame si necesitas algo más.' },
  'thank you': { en: 'You\'re welcome! Let me know if you need anything else.', es: '¡De nada! Avísame si necesitas algo más.' },
  thank: { en: 'You\'re welcome! Let me know if you need anything else.', es: '¡De nada! Avísame si necesitas algo más.' },
  gracias: { en: 'You\'re welcome! Let me know if you need anything else.', es: '¡De nada! Avísame si necesitas algo más.' },
  perfect: { en: 'Great! Anything else for your booking?', es: '¡Genial! ¿Algo más para tu reserva?' },
  perfecto: { en: 'Great! Anything else for your booking?', es: '¡Genial! ¿Algo más para tu reserva?' },
  yep: { en: 'Got it! Tell me more.', es: '¡Entendido! Cuéntame más.' },
  nope: { en: 'No problem. What would you like to book?', es: 'Sin problema. ¿Qué te gustaría reservar?' },
};

interface ExtractedBookingData {
  intent: 'transportation' | 'activity' | 'combo' | null;
  tripType?: 'oneway' | 'roundtrip';
  vehicleClass?: string;
  zoneFrom?: string | null;
  zoneTo?: string | null;
  extras?: Array<{ code: string; qty: number }>;
  when: {
    date: string | null;
    time: string | null;
    timezone: string;
  };
  passengers: number | null;
  transportation: {
    pickup: string | null;
    dropoff: string | null;
    flightNumber: string | null;
    airline: string | null;
    arrivalTime: string | null;
  } | null;
  activities: {
    selected: string[];
    combo: { enabled: boolean; count: number } | null;
  } | null;
  customer: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  notes: string | null;
  /** Upsell offered to client (e.g. "ATV Adventure con 20% descuento") */
  upsellOffered?: string | null;
  /** Detected client sentiment */
  clientSentiment?: 'interested' | 'hesitant' | 'decided' | null;
  /** Whether a combo was recommended */
  recommendedCombo?: boolean | null;
}

export class AIService {
  private openai: OpenAI;
  private model: string;
  private whisperModel: string;
  private temperature: number;
  private maxTokens: number;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      console.warn('⚠️ OPENAI_API_KEY is not set - AI features will be disabled');
      this.openai = null as any;
    }
    this.model = process.env.OPENAI_MODEL || 'gpt-4o';
    this.whisperModel = process.env.OPENAI_WHISPER_MODEL || 'whisper-1';
    this.temperature = Math.min(1, Math.max(0, parseFloat(process.env.OPENAI_TEMPERATURE || '0.3') || 0.3));
    this.maxTokens = Math.min(4096, Math.max(256, parseInt(process.env.OPENAI_MAX_TOKENS || '400', 10) || 400));
  }

  private checkApiKey(): void {
    if (!process.env.OPENAI_API_KEY || !this.openai) {
      throw new Error('OPENAI_API_KEY missing - AI service is not configured');
    }
  }

  /**
   * Transcribe audio to text
   */
  async transcribeAudio(audioBuffer: Buffer, filename: string): Promise<{ text: string; language: string }> {
    this.checkApiKey();
    try {
      // Create File-like object for OpenAI (Node.js compatible)
      // OpenAI SDK accepts File, Blob, or Buffer with proper metadata
      const file = new File([audioBuffer], filename, { 
        type: filename.endsWith('.webm') ? 'audio/webm' : 'audio/mpeg'
      });
      
      const transcription = await this.openai.audio.transcriptions.create({
        file: file,
        model: this.whisperModel,
        language: 'en', // Can be auto-detected
        response_format: 'verbose_json',
      });

      return {
        text: transcription.text,
        language: (transcription as any).language || 'en',
      };
    } catch (error: any) {
      console.error('Transcription error:', error);
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
  }

  /**
   * Get system prompt for intelligent sales agent (discovery, upselling, closing).
   * Injects real prices (areas, extras, activity combos) so the AI can quote and close sales.
   */
  private getSystemPrompt(
    locale: string,
    zones: string[],
    extras: Array<{ code: string; label: string; labelEs?: string | null; priceCents?: number | null; included?: boolean }>,
    areas: Array<{ name: string; oneWayPriceCents: number; roundTripPriceCents: number }> = []
  ): string {
    const isSpanish = locale === 'es';
    const knowledge = getKnowledgeForPrompt(locale as 'en' | 'es');
    const zoneList = zones.length > 0 ? zones.join(', ') : areas.map((a) => a.name).join(', ') || 'SJD, Cabo San Lucas, San Jose, Corridor';
    const extrasList = extras.map((e) => `${e.code} (${isSpanish ? e.labelEs || e.label : e.label})`).join(', ') || 'BABY_SEAT, GROCERY_STOP, CHAMPAGNE';

    // Real transfer prices by zone (so AI can quote and close)
    const transferPricesOneWay = areas.length > 0
      ? areas.map((a) => `${a.name}: $${(a.oneWayPriceCents / 100).toFixed(0)} USD`).join(', ')
      : (isSpanish ? 'Consultar por zona' : 'Quote by zone');
    const transferPricesRound = areas.length > 0
      ? areas.map((a) => `${a.name}: $${(a.roundTripPriceCents / 100).toFixed(0)} USD`).join(', ')
      : (isSpanish ? 'Consultar por zona' : 'Quote by zone');
    const paidExtras = extras.filter((e) => e.priceCents != null && e.priceCents > 0 && !e.included);
    const extrasWithPrices = paidExtras.length > 0
      ? paidExtras.map((e) => `${isSpanish ? e.labelEs || e.label : e.label}: $${((e.priceCents ?? 0) / 100).toFixed(0)} USD`).join(', ')
      : (isSpanish ? 'Parada super, silla bebé, champagne, etc. (consultar)' : 'Grocery stop, baby seat, champagne, etc. (ask)');
    const activityPrices = isSpanish
      ? 'Combo (2 actividades, 1h c/u): $100 USD/persona. Crazy Combo (3 actividades, 1h c/u): $125 USD/persona. Entrada al parque $25/persona (pago en parque).'
      : 'Combo (2 activities, 1hr each): $100 USD/person. Crazy Combo (3 activities, 1hr each): $125 USD/person. Park fee $25/person (paid at park).';

    return isSpanish ? `Eres un VENDEDOR INTELIGENTE de Class VIP Transfers en Los Cabos. Tu rol: cerrar reservas con valor, no ser pasivo. USA SIEMPRE LOS PRECIOS REALES ABAJO para cotizar y cerrar ventas.

RESTRICCIÓN ESTRICTA: SOLO respondes preguntas relacionadas con Class VIP Transfers, sus servicios, precios, actividades, destino Los Cabos y políticas de la empresa. Si el usuario pregunta algo completamente ajeno (clima en otro país, política, recetas, otra empresa, etc.), responde ÚNICAMENTE: "Solo puedo ayudarte con información sobre los servicios de Class VIP Transfers y el destino Los Cabos. ¿En qué más puedo ayudarte?" — No expliques por qué, solo dilo una vez y ofrece ayuda relevante.

IMPORTANTE - BREVEDAD Y IDIOMA:
- Respuestas CORTAS (1–3 oraciones). Sin párrafos largos. Un paso a la vez.
- Responde SIEMPRE en el mismo idioma que el mensaje del usuario: si escribe en español → respuesta en español; si escribe en inglés → respuesta en inglés.

NOMBRES DE ZONA — NO TRADUCIR: Puerto Los Cabos, Port Los Cabos, San Jose del Cabo, Cabo San Lucas, Tourist Corridor, etc. son nombres propios. Usa siempre "Puerto Los Cabos" (nunca traduzcas a "Port Los Cabos" ni al revés).

CONOCIMIENTO (usa siempre):
${knowledge}

PRECIOS REALES DE LA EMPRESA (cítalos al cotizar y cerrar):
- Transfer SJD → zona (solo ida): ${transferPricesOneWay}
- Transfer ida y vuelta por zona: ${transferPricesRound}
- Extras de pago: ${extrasWithPrices}
- Actividades: ${activityPrices}

ZONAS API (para rutas): ${zoneList}
EXTRAS API: ${extrasList}

FASE 1 - DESCUBRIMIENTO (respuesta breve):
- TRANSPORTE → Cotiza por zona. Menciona SUV/Sprinter, WiFi, bebidas.
- ACTIVIDADES → Ofrece Combo $100 o Crazy Combo $125. Breve.
- COMBO → Ofrece precios según número de actividades.

FASE 2 - UPSELLING (breve):
- Solo transporte → Ofrece Combo/Crazy Combo. Cita precios.
- Solo actividad → Ofrece transfer. Cita precio por zona.
- Dudas → "Conductores bilingües, WiFi, bebidas". Precio concreto.

FASE 3 - CIERRE (breve):
Confirme → Pide nombre, email, teléfono, fecha, hora, pasajeros. Di: "¿Listo para confirmar? Voy a asegurar tu reserva."

NUNCA seas pasivo. Siempre ofrece valor y siguiente paso.
MANEJO OBJECIONES:
- "Es caro" → Compara con precios reales: "El transfer a [zona] son $X ida. Con Crazy Combo (3 actividades) son $125/persona. ¿Comparamos?"
- "Necesito pensar" → "Te dejo 1 hora de hold. ¿Cuál es tu email para confirmar después?"
- "¿Qué me recomiendas?" → Cita precios: "Para 4 personas: transfer a [zona] $X ida y vuelta + Crazy Combo $125/persona. ¿Te late?"

NUNCA digas "confirmado" hasta que el pago esté completo. Contacto: WhatsApp ${AI_KNOWLEDGE.contact.whatsapp} | ${AI_KNOWLEDGE.contact.email}

Responde SOLO con este JSON:
{
  "extracted": {
    "intent": "transportation"|"activity"|"combo"|null,
    "tripType": "oneway"|"roundtrip"|null,
    "vehicleClass": "SUV"|"SUBURBAN"|"SEDAN"|"VAN"|"SPRINTER"|"LUXURY"|null,
    "zoneFrom": string|null,
    "zoneTo": string|null,
    "extras": [{"code":string,"qty":number}]|null,
    "when": {"date": "YYYY-MM-DD"|null,"time": "HH:mm"|null,"timezone": "America/Mazatlan"},
    "passengers": number|null,
    "transportation": {"pickup":string|null,"dropoff":string|null,"flightNumber":string|null,"airline":string|null,"arrivalTime":string|null}|null,
    "activities": {"selected":string[],"combo": {"enabled":boolean,"count":number}|null}|null,
    "customer": {"name":string|null,"email":string|null,"phone":string|null},
    "notes": string|null,
    "upsellOffered": string|null,
    "clientSentiment": "interested"|"hesitant"|"decided"|null,
    "recommendedCombo": boolean|null
  },
  "reply": "Tu respuesta BREVE (1–3 oraciones) en español: proactivo, valor, siguiente paso. Sin párrafos largos."
}` : `You are an INTELLIGENT SALESPERSON for Class VIP Transfers in Los Cabos. Your role: close bookings with value, never be passive. ALWAYS USE THE REAL PRICES BELOW when quoting and closing sales.

ZONE NAMES — DO NOT TRANSLATE: Puerto Los Cabos, Port Los Cabos, San Jose del Cabo, Cabo San Lucas, Tourist Corridor, etc. are proper place names. Always use "Puerto Los Cabos" (never translate to "Port Los Cabos" or vice versa).

STRICT RESTRICTION: You ONLY answer questions related to Class VIP Transfers services, prices, activities, the Los Cabos destination, and company policies. If the user asks about anything completely unrelated (weather in other countries, politics, recipes, other companies, etc.), respond ONLY with: "I can only help you with Class VIP Transfers services and Los Cabos. How can I assist you?" — Don't explain further, just offer relevant help.

IMPORTANT - BREVITY AND LANGUAGE:
- Keep replies SHORT (1–3 sentences). No long paragraphs. One step at a time.
- ALWAYS respond in the SAME language as the user's message: if they write in Spanish → reply in Spanish; if they write in English → reply in English.

KNOWLEDGE (always use):
${knowledge}

REAL COMPANY PRICES (quote these when giving prices and closing):
- Transfer SJD → zone (one-way): ${transferPricesOneWay}
- Round-trip by zone: ${transferPricesRound}
- Paid extras: ${extrasWithPrices}
- Activities: ${activityPrices}

API ZONES (for routes): ${zoneList}
API EXTRAS: ${extrasList}

PHASE 1 - DISCOVERY (brief):
- TRANSPORT → Quote by zone. Mention SUV/Sprinter, WiFi, drinks.
- ACTIVITIES → Offer Combo $100 or Crazy Combo $125. Brief.
- COMBO → Offer prices based on number of activities.

PHASE 2 - UPSELLING (brief):
- Transport only → Offer Combo/Crazy Combo. Quote prices.
- Activity only → Offer transfer. Quote zone price.
- Hesitant → "Bilingual drivers, WiFi, drinks". Concrete price.

PHASE 3 - CLOSE (brief):
Confirm → Ask name, email, phone, date, time, passengers. Say: "Ready to confirm? I'll secure your reservation."

NEVER be passive. Always offer value and next step.
OBJECTION HANDLING:
- "It's expensive" → Compare with real prices: "Transfer to [zone] is $X one-way. With Crazy Combo (3 activities) it's $125/person. Want me to compare?"
- "I need to think" → "I'll hold it for 1 hour. What's your email to confirm later?"
- "What do you recommend?" → Quote prices: "For 4 people: transfer to [zone] $X round-trip + Crazy Combo $125/person. Sound good?"

NEVER say "confirmed" until payment is complete. Contact: WhatsApp ${AI_KNOWLEDGE.contact.whatsapp} | ${AI_KNOWLEDGE.contact.email}

Respond ONLY with this JSON:
{
  "extracted": {
    "intent": "transportation"|"activity"|"combo"|null,
    "tripType": "oneway"|"roundtrip"|null,
    "vehicleClass": "SUV"|"SUBURBAN"|"SEDAN"|"VAN"|"SPRINTER"|"LUXURY"|null,
    "zoneFrom": string|null,
    "zoneTo": string|null,
    "extras": [{"code":string,"qty":number}]|null,
    "when": {"date": "YYYY-MM-DD"|null,"time": "HH:mm"|null,"timezone": "America/Mazatlan"},
    "passengers": number|null,
    "transportation": {"pickup":string|null,"dropoff":string|null,"flightNumber":string|null,"airline":string|null,"arrivalTime":string|null}|null,
    "activities": {"selected":string[],"combo": {"enabled":boolean,"count":number}|null}|null,
    "customer": {"name":string|null,"email":string|null,"phone":string|null},
    "notes": string|null,
    "upsellOffered": string|null,
    "clientSentiment": "interested"|"hesitant"|"decided"|null,
    "recommendedCombo": boolean|null
  },
  "reply": "Your BRIEF reply (1–3 sentences) in English: proactive, value, next step. No long paragraphs."
}`;
  }

  /**
   * Call OpenAI with retry on 429 (rate limit)
   */
  private async callOpenAIWithRetry(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    maxRetries: number = 3
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    let lastError: any;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.openai.chat.completions.create({
          model: this.model,
          messages,
          temperature: this.temperature,
          max_tokens: this.maxTokens,
          response_format: { type: 'json_object' },
        });
      } catch (err: any) {
        lastError = err;
        const status = err?.status ?? err?.response?.status;
        const is429 = status === 429;
        if (is429 && attempt < maxRetries) {
          const delayMs = 2000 + Math.random() * 3000;
          console.warn(`[AI Chat] Rate limit (429), retry ${attempt}/${maxRetries} in ${Math.round(delayMs / 1000)}s`);
          await new Promise((r) => setTimeout(r, delayMs));
        } else {
          throw err;
        }
      }
    }
    throw lastError;
  }

  /**
   * Chat with AI and extract booking data
   */
  async chat(
    message: string,
    bookingDraftId: string | null,
    sessionId: string,
    locale: string = 'en'
  ): Promise<{
    reply: string;
    bookingDraftId: string | null;
    extracted: ExtractedBookingData;
    missingFields: string[];
    nextAction: 'ask_more' | 'confirm_summary' | 'proceed_to_payment';
  }> {
    this.checkApiKey();

    const msgTrimmed = (message || '').trim();
    if (!msgTrimmed || msgTrimmed.length < 1) {
      const isSpanish = locale === 'es';
      const reply = isSpanish ? 'Por favor escribe un mensaje para ayudarte.' : 'Please type a message so I can help you.';
      const extracted = this.parseExtractionFromText('');
      return { reply, bookingDraftId, extracted, missingFields: ['message'], nextAction: 'ask_more' };
    }

    // Check cache (5 min TTL) - skip if same message in same session
    const cacheKey = getCacheKey(sessionId, msgTrimmed, locale);
    const cached = getCached(cacheKey);
    if (cached) {
      console.log('[AI Chat] Cache hit:', cacheKey.slice(0, 50) + '...');
      await prisma.aIConversation.create({
        data: {
          sessionId,
          bookingId: cached.bookingDraftId,
          locale,
          userMessage: msgTrimmed,
          assistantReply: cached.reply,
          extractedData: cached.extracted as any,
          missingFields: (cached.missingFields || []) as any,
          nextAction: cached.nextAction || 'ask_more',
          messageType: 'text',
        },
      });
      return cached;
    }

    // Load pricing context and history (areas = real transfer prices by zone; extras = paid add-ons)
    const [zones, extras, areas, history] = await Promise.all([
      pricingService.getZones().catch(() => []),
      pricingService.getPublicExtras().catch(() => []),
      pricingService.listAreas().catch(() => []),
      prisma.aIConversation.findMany({ where: { sessionId }, orderBy: { createdAt: 'asc' }, take: 10 }),
    ]);

    // Local validation: simple greetings/acks without history - respond locally (no OpenAI call)
    const normalized = msgTrimmed.toLowerCase().replace(/\s+/g, ' ').trim();
    const simpleKey = Object.keys(SIMPLE_LOCAL_REPLIES).find((k) => normalized === k);
    if (history.length === 0 && simpleKey) {
      const replies = SIMPLE_LOCAL_REPLIES[simpleKey];
      // SIEMPRE priorizar idioma del mensaje: detectLocaleFromMessage → si no detecta, usar locale del request
      const detectedLocale = detectLocaleFromMessage(msgTrimmed);
      const useSpanish = detectedLocale === 'es' || (detectedLocale === null && locale === 'es');
      const reply = useSpanish ? replies.es : replies.en;
      const extracted = this.parseExtractionFromText('');
      await prisma.aIConversation.create({
        data: {
          sessionId,
          bookingId: null,
          locale,
          userMessage: msgTrimmed,
          assistantReply: reply,
          extractedData: extracted as any,
          missingFields: ['date', 'passengers', 'pickup', 'dropoff'] as any,
          nextAction: 'ask_more',
          messageType: 'text',
        },
      });
      console.log('[AI Chat] Local reply (simple):', simpleKey);
      return { reply, bookingDraftId, extracted, missingFields: ['date', 'passengers', 'pickup', 'dropoff'], nextAction: 'ask_more' };
    }

    // Detect reply language from message when possible (es/en); fallback to request locale
    const replyLocale = detectLocaleFromMessage(msgTrimmed) || (locale === 'es' ? 'es' : 'en');

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: this.getSystemPrompt(replyLocale, zones, extras, areas) },
    ];
    for (const conv of history) {
      messages.push({ role: 'user', content: conv.userMessage });
      messages.push({ role: 'assistant', content: conv.assistantReply });
    }
    messages.push({ role: 'user', content: msgTrimmed });

    try {
      console.log('[AI Chat] Calling OpenAI:', { model: this.model, historyLen: history.length });
      const completion = await this.callOpenAIWithRetry(messages);

      const responseContent = completion.choices[0]?.message?.content || '{}';
      let extracted: ExtractedBookingData;
      let reply: string;

      try {
        const parsed = JSON.parse(responseContent);
        if (parsed.extracted && typeof parsed.extracted === 'object') {
          extracted = { ...this.parseExtractionFromText(''), ...parsed.extracted };
          this.ensureExtractedShape(extracted);
          reply = typeof parsed.reply === 'string' && parsed.reply.trim() ? parsed.reply.trim() : this.generateReply(extracted, locale);
        } else if (parsed.intent !== undefined && typeof parsed === 'object') {
          extracted = { ...this.parseExtractionFromText(''), ...parsed };
          this.ensureExtractedShape(extracted);
          reply = typeof parsed.reply === 'string' && parsed.reply.trim() ? parsed.reply.trim() : this.generateReply(extracted, locale);
        } else {
          extracted = this.parseExtractionFromText(responseContent);
          reply = typeof responseContent === 'string' ? responseContent : this.generateReply(extracted, locale);
        }
      } catch (parseErr: any) {
        console.warn('[AI Chat] JSON parse fallback:', parseErr?.message || 'Invalid JSON');
        extracted = this.parseExtractionFromText(responseContent);
        reply = typeof responseContent === 'string' ? responseContent : this.generateReply(extracted, locale);
      }
      this.ensureExtractedShape(extracted);

      // Resolve zones and fetch real quote
      const validVehicleClasses = ['SUV', 'SUBURBAN', 'SEDAN', 'VAN', 'SPRINTER', 'LUXURY'];
      let zoneFrom = extracted.zoneFrom ? resolveZone(extracted.zoneFrom, zones) : null;
      let zoneTo = extracted.zoneTo ? resolveZone(extracted.zoneTo, zones) : null;
      if (!zoneFrom && extracted.transportation?.pickup) zoneFrom = resolveZone(extracted.transportation.pickup, zones);
      if (!zoneTo && extracted.transportation?.dropoff) zoneTo = resolveZone(extracted.transportation.dropoff, zones);

      const tripType = extracted.tripType || 'oneway';
      const vehicleClass = extracted.vehicleClass && validVehicleClasses.includes(extracted.vehicleClass)
        ? extracted.vehicleClass
        : 'SUV';
      const passengers = extracted.passengers ?? 1;

      let quoteResult: { total: number; currency: string } | null = null;
      let pricingData: CreateBookingInput['pricingData'] = undefined;

      if (zoneFrom && zoneTo && extracted.intent === 'transportation') {
        try {
          const quote = await pricingService.calculateQuote({
            serviceType: 'TRANSFER',
            tripType: tripType === 'roundtrip' ? 'ROUND_TRIP' : 'ONE_WAY',
            zoneFrom,
            zoneTo,
            vehicleClass,
            passengers,
            extras: extracted.extras?.length ? extracted.extras : undefined,
          });
          quoteResult = { total: quote.total, currency: quote.currency };
          pricingData = {
            tripType: tripType as 'oneway' | 'roundtrip',
            zoneFrom,
            zoneTo,
            vehicleClass,
            extras: extracted.extras ?? undefined,
          };
        } catch {
          // Pricing not available for route
        }
      }

      // Build upsell suggestions
      const isSpanish = locale === 'es';
      const upsellLines: string[] = [];
      if (extracted.intent === 'transportation') {
        if (tripType === 'oneway') {
          upsellLines.push(isSpanish ? '¿Sabías que el round-trip tiene descuento?' : 'Did you know round-trip gets a discount?');
        }
        const hasGrocery = extracted.extras?.some((e) => e.code === 'GROCERY_STOP');
        if (!hasGrocery) {
          upsellLines.push(isSpanish ? '¿Te gustaría añadir una parada en supermercado?' : 'Would you like to add a grocery stop?');
        }
        if (!extracted.activities?.selected?.length) {
          upsellLines.push(isSpanish ? 'También ofrecemos actividades populares como paseo en camello o ATV.' : 'We also offer popular activities like camel rides or ATV adventures.');
        }
      }
      if (quoteResult && !reply.toLowerCase().includes('$') && !reply.includes(quoteResult.currency)) {
        const priceLine = isSpanish
          ? `\n\nTu transfer quedaría en ${quoteResult.currency} $${quoteResult.total}.`
          : `\n\nYour transfer would be ${quoteResult.currency} $${quoteResult.total}.`;
        reply = reply + priceLine;
      }
      if (upsellLines.length > 0) {
        reply = reply + '\n\n' + upsellLines.join(' ');
      }

      // Determine missing fields
      const missingFields = this.getMissingFields(extracted, bookingDraftId !== null);

      // Determine next action
      let nextAction: 'ask_more' | 'confirm_summary' | 'proceed_to_payment' = 'ask_more';
      
      if (missingFields.length === 0 && bookingDraftId) {
        // All fields present, ask for confirmation
        nextAction = 'confirm_summary';
      } else if (missingFields.length === 0 && !bookingDraftId) {
        // Need to create booking first
        nextAction = 'ask_more';
      }

      // Create or update booking draft
      let finalBookingId = bookingDraftId;
      if (missingFields.length === 0 && !bookingDraftId) {
        try {
          const bookingInput = this.extractedToBookingInput(extracted, pricingData, passengers);
          const booking = await bookingService.createDraftBooking(bookingInput, 'AI_CHAT');
          finalBookingId = booking.id;
          const { EmailService } = await import('./email.service');
          const emailService = new EmailService();
          emailService.sendBookingReceived(booking).catch((err) => console.error('[AI] Booking received email failed:', err));
        } catch (error: any) {
          console.error('Failed to create draft booking:', error);
          // Continue without booking ID
        }
      } else if (bookingDraftId && missingFields.length === 0) {
        // Update existing booking
        try {
          const bookingInput = this.extractedToBookingInput(extracted, pricingData, passengers);
          // TODO: Implement update booking method
        } catch (error: any) {
          console.error('Failed to update booking:', error);
        }
      }

      // Save conversation
      await prisma.aIConversation.create({
        data: {
          sessionId,
          bookingId: finalBookingId,
          locale,
          userMessage: msgTrimmed,
          assistantReply: reply,
          extractedData: extracted as any,
          missingFields: missingFields as any,
          nextAction,
          messageType: 'text',
        },
      });

      const result = {
        reply,
        bookingDraftId: finalBookingId,
        extracted,
        missingFields,
        nextAction,
      };

      // Cache response for 5 min (reduces rate limit on similar queries)
      setCache(cacheKey, result);

      return result;
    } catch (error: any) {
      console.error('[AI Chat] Service error:', error?.message ?? error);
      const msg = error?.message || String(error);
      if (msg.includes('OPENAI_API_KEY') || msg.includes('API key')) {
        throw new Error('OPENAI_API_KEY missing - AI service is not configured');
      }
      if (error?.status === 401) {
        throw new Error('Invalid OpenAI API key');
      }
      if (error?.status === 429) {
        throw new Error('OpenAI rate limit exceeded - please try again in a moment');
      }
      throw new Error(`Failed to process chat: ${msg}`);
    }
  }

  /**
   * Generate conversational reply from extracted data
   */
  private generateReply(extracted: ExtractedBookingData, locale: string): string {
    const isSpanish = locale === 'es';
    
    if (isSpanish) {
      return 'Entiendo. Déjame ayudarte con tu reserva. ¿Hay algo más que necesites?';
    }
    return 'I understand. Let me help you with your booking. Is there anything else you need?';
  }

  /** Ensure all nested extracted objects are valid (never null) to avoid "Cannot read properties of null" */
  private ensureExtractedShape(extracted: ExtractedBookingData): void {
    const defaultWhen = { date: null as string | null, time: null as string | null, timezone: 'America/Mazatlan' };
    const defaultTransport = { pickup: null as string | null, dropoff: null as string | null, flightNumber: null as string | null, airline: null as string | null, arrivalTime: null as string | null };
    const defaultActivities = { selected: [] as string[], combo: null as { enabled: boolean; count: number } | null };

    if (!extracted.when || typeof extracted.when !== 'object') {
      extracted.when = { ...defaultWhen };
    } else {
      extracted.when = {
        date: extracted.when.date ?? null,
        time: extracted.when.time ?? null,
        timezone: extracted.when.timezone ?? 'America/Mazatlan',
      };
    }

    if (!extracted.transportation || typeof extracted.transportation !== 'object') {
      extracted.transportation = { ...defaultTransport };
    } else {
      extracted.transportation = {
        pickup: extracted.transportation.pickup ?? null,
        dropoff: extracted.transportation.dropoff ?? null,
        flightNumber: extracted.transportation.flightNumber ?? null,
        airline: extracted.transportation.airline ?? null,
        arrivalTime: extracted.transportation.arrivalTime ?? null,
      };
    }

    if (!extracted.activities || typeof extracted.activities !== 'object') {
      extracted.activities = { selected: [...defaultActivities.selected], combo: defaultActivities.combo };
    } else {
      extracted.activities = {
        selected: Array.isArray(extracted.activities.selected) ? extracted.activities.selected : [],
        combo: extracted.activities.combo ?? null,
      };
    }

    if (!extracted.extras || !Array.isArray(extracted.extras)) {
      extracted.extras = undefined;
    }

    const defaultCustomer = { name: null as string | null, email: null as string | null, phone: null as string | null };
    if (!extracted.customer || typeof extracted.customer !== 'object') {
      extracted.customer = { ...defaultCustomer };
    } else {
      extracted.customer = {
        name: extracted.customer.name ?? null,
        email: extracted.customer.email ?? null,
        phone: extracted.customer.phone ?? null,
      };
    }
  }

  /**
   * Parse extraction from text (fallback)
   */
  private parseExtractionFromText(text: string): ExtractedBookingData {
    const data: ExtractedBookingData = {
      intent: null,
      when: { date: null, time: null, timezone: 'America/Mazatlan' },
      passengers: null,
      transportation: null,
      activities: null,
      customer: { name: null, email: null, phone: null },
      notes: null,
      upsellOffered: null,
      clientSentiment: null,
      recommendedCombo: null,
    };
    return data;
  }

  /**
   * Get missing required fields
   */
  private getMissingFields(extracted: ExtractedBookingData, isUpdate: boolean): string[] {
    const missing: string[] = [];

    if (!extracted.intent) {
      missing.push('intent');
    }

    if (!extracted.when?.date || !String(extracted.when.date).trim()) {
      missing.push('date');
    }

    if (!extracted.passengers || extracted.passengers < 1) {
      missing.push('passengers');
    }

    if (extracted.intent === 'transportation') {
      if (!extracted.tripType || (extracted.tripType !== 'oneway' && extracted.tripType !== 'roundtrip')) {
        missing.push('tripType');
      }
      if (!extracted.transportation?.pickup) {
        missing.push('pickup');
      }
      if (!extracted.transportation?.dropoff) {
        missing.push('dropoff');
      }
    }

    if (extracted.intent === 'activity' || extracted.intent === 'combo') {
      const sel = extracted.activities?.selected;
      if (!sel || !Array.isArray(sel) || sel.length === 0) {
        missing.push('activities');
      }
    }

    const customer = extracted.customer;
    if (!customer || !customer.name || !String(customer.name).trim()) {
      missing.push('customer_name');
    }
    if (!customer || !customer.email || !String(customer.email).trim()) {
      missing.push('customer_email');
    }
    if (!customer || !customer.phone || !String(customer.phone).trim()) {
      missing.push('customer_phone');
    }

    return missing;
  }

  /**
   * Convert extracted data to booking input
   */
  private extractedToBookingInput(
    extracted: ExtractedBookingData,
    pricingData: CreateBookingInput['pricingData'],
    passengers: number
  ): CreateBookingInput {
    const items: any[] = [];

    // Use pricingData when available (BookingService will calculate via PricingService)
    if (extracted.intent === 'transportation' && pricingData) {
      items.push({
        type: 'TRANSPORTATION',
        name: `Transfer: ${pricingData.zoneFrom} → ${pricingData.zoneTo}`,
        quantity: 1,
        unitPrice: 0,
      });
    } else if (extracted.intent === 'transportation' && extracted.transportation != null) {
      items.push({
        type: 'TRANSPORTATION',
        name: 'Private Transfer',
        quantity: 1,
        unitPrice: 0,
      });
    }

    const activitiesSelected = extracted.activities?.selected;
    if (activitiesSelected && Array.isArray(activitiesSelected) && activitiesSelected.length > 0) {
      for (const activity of activitiesSelected) {
        items.push({
          type: 'ACTIVITY',
          name: activity,
          quantity: 1,
          unitPrice: 50,
        });
      }
    }

    const defaultTransport = {
      type: 'TRANSPORTATION' as const,
      name: 'Private Transfer',
      quantity: 1,
      unitPrice: pricingData ? 0 : 85,
    };
    const finalItems = items.length > 0 ? items : [defaultTransport];

    const customer = extracted.customer && typeof extracted.customer === 'object' ? extracted.customer : null;
    return {
      type: (extracted.intent?.toUpperCase() || 'TRANSPORTATION') as any,
      customer: {
        name: (customer?.name && String(customer.name).trim()) || 'Guest',
        email: (customer?.email && String(customer.email).trim()) || '',
        phone: (customer?.phone && String(customer.phone).trim()) || '',
        language: 'en',
      },
      bookingDate: extracted.when?.date || new Date().toISOString(),
      bookingTime: extracted.when?.time || undefined,
      pickupLocation: extracted.transportation?.pickup ?? undefined,
      dropoffLocation: extracted.transportation?.dropoff ?? undefined,
      flightNumber: extracted.transportation?.flightNumber ?? undefined,
      arrivalTime: extracted.transportation?.arrivalTime ?? undefined,
      passengers,
      items: finalItems,
      pricingData: pricingData || undefined,
      notes: extracted.notes || undefined,
    };
  }
}

