import OpenAI from 'openai';
import { prisma } from '../lib/prisma';
import { BookingService } from './booking.service';
import { CreateBookingInput } from '../lib/validation';
import { BookingType, BookingStatus, BookingSource } from '@prisma/client';

const bookingService = new BookingService();

interface ExtractedBookingData {
  intent: 'transportation' | 'activity' | 'combo' | null;
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
}

export class AIService {
  private openai: OpenAI;
  private model: string;
  private whisperModel: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    this.openai = new OpenAI({ apiKey });
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.whisperModel = process.env.OPENAI_WHISPER_MODEL || 'whisper-1';
  }

  /**
   * Transcribe audio to text
   */
  async transcribeAudio(audioBuffer: Buffer, filename: string): Promise<{ text: string; language: string }> {
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
   * Get system prompt for booking extraction
   */
  private getSystemPrompt(locale: string = 'en'): string {
    const isSpanish = locale === 'es';
    
    return isSpanish ? `
Eres un asistente de reservas de lujo para Class VIP Transfers en Los Cabos, México.
Tu trabajo es extraer información de reservas de conversaciones con clientes.

IMPORTANTE:
- NUNCA digas que la reserva está "confirmada" hasta que el pago esté completo
- Extrae SOLO información que el cliente menciona explícitamente
- Si falta información requerida, pregunta de manera amigable
- Mantén respuestas cortas y profesionales
- Siempre ofrece contacto humano: WhatsApp +52 624 122 2174 o email Armando@caboviptransfers.com

Debes extraer la siguiente información en formato JSON estricto:
{
  "intent": "transportation" | "activity" | "combo" | null,
  "when": { "date": "YYYY-MM-DD" | null, "time": "HH:mm" | null, "timezone": "America/Mazatlan" },
  "passengers": number | null,
  "transportation": {
    "pickup": string | null,
    "dropoff": string | null,
    "flightNumber": string | null,
    "airline": string | null,
    "arrivalTime": string | null
  } | null,
  "activities": {
    "selected": string[],
    "combo": { "enabled": boolean, "count": number } | null
  } | null,
  "customer": { "name": string | null, "email": string | null, "phone": string | null },
  "notes": string | null
}

Responde SOLO con JSON válido. No agregues texto adicional.
` : `
You are a luxury booking assistant for Class VIP Transfers in Los Cabos, Mexico.
Your job is to extract booking information from customer conversations.

IMPORTANT:
- NEVER say the booking is "confirmed" until payment is complete
- Extract ONLY information the customer explicitly mentions
- If required information is missing, ask friendly follow-up questions
- Keep replies short and concierge-style
- Always offer human handoff: WhatsApp +52 624 122 2174 or email Armando@caboviptransfers.com

You must extract the following information in strict JSON format:
{
  "intent": "transportation" | "activity" | "combo" | null,
  "when": { "date": "YYYY-MM-DD" | null, "time": "HH:mm" | null, "timezone": "America/Mazatlan" },
  "passengers": number | null,
  "transportation": {
    "pickup": string | null,
    "dropoff": string | null,
    "flightNumber": string | null,
    "airline": string | null,
    "arrivalTime": string | null
  } | null,
  "activities": {
    "selected": string[],
    "combo": { "enabled": boolean, "count": number } | null
  } | null,
  "customer": { "name": string | null, "email": string | null, "phone": string | null },
  "notes": string | null
}

Respond ONLY with valid JSON. Do not add any additional text.
`;
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
    // Get conversation history
    const history = await prisma.aIConversation.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 10, // Last 10 messages
    });

    // Build conversation context
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: this.getSystemPrompt(locale),
      },
    ];

    // Add history
    for (const conv of history) {
      messages.push({
        role: 'user',
        content: conv.userMessage,
      });
      messages.push({
        role: 'assistant',
        content: conv.assistantReply,
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message,
    });

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const responseContent = completion.choices[0]?.message?.content || '{}';
      
      // Parse JSON response
      let extracted: ExtractedBookingData;
      let reply: string;

      try {
        const parsed = JSON.parse(responseContent);
        
        // Check if it's a structured extraction or a conversational reply
        if (parsed.extracted) {
          extracted = parsed.extracted;
          reply = parsed.reply || 'I understand. Let me help you with that.';
        } else if (parsed.intent !== undefined) {
          // Direct extraction format
          extracted = parsed;
          reply = this.generateReply(extracted, locale);
        } else {
          // Fallback: try to extract from reply
          extracted = this.parseExtractionFromText(responseContent);
          reply = responseContent;
        }
      } catch (parseError) {
        // Fallback parsing
        extracted = this.parseExtractionFromText(responseContent);
        reply = responseContent;
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
          const bookingInput = this.extractedToBookingInput(extracted);
          const booking = await bookingService.createDraftBooking(bookingInput, 'AI_CHAT');
          finalBookingId = booking.id;
        } catch (error: any) {
          console.error('Failed to create draft booking:', error);
          // Continue without booking ID
        }
      } else if (bookingDraftId && missingFields.length === 0) {
        // Update existing booking
        try {
          const bookingInput = this.extractedToBookingInput(extracted);
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
          userMessage: message,
          assistantReply: reply,
          extractedData: extracted as any,
          missingFields: missingFields as any,
          nextAction,
          messageType: 'text',
        },
      });

      return {
        reply,
        bookingDraftId: finalBookingId,
        extracted,
        missingFields,
        nextAction,
      };
    } catch (error: any) {
      console.error('AI chat error:', error);
      throw new Error(`Failed to process chat: ${error.message}`);
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

  /**
   * Parse extraction from text (fallback)
   */
  private parseExtractionFromText(text: string): ExtractedBookingData {
    // Basic fallback - return empty structure
    return {
      intent: null,
      when: { date: null, time: null, timezone: 'America/Mazatlan' },
      passengers: null,
      transportation: null,
      activities: null,
      customer: { name: null, email: null, phone: null },
      notes: null,
    };
  }

  /**
   * Get missing required fields
   */
  private getMissingFields(extracted: ExtractedBookingData, isUpdate: boolean): string[] {
    const missing: string[] = [];

    if (!extracted.intent) {
      missing.push('intent');
    }

    if (!extracted.when.date) {
      missing.push('date');
    }

    if (!extracted.passengers || extracted.passengers < 1) {
      missing.push('passengers');
    }

    if (extracted.intent === 'transportation') {
      if (!extracted.transportation?.pickup) {
        missing.push('pickup');
      }
      if (!extracted.transportation?.dropoff) {
        missing.push('dropoff');
      }
    }

    if (extracted.intent === 'activity' || extracted.intent === 'combo') {
      if (!extracted.activities?.selected || extracted.activities.selected.length === 0) {
        missing.push('activities');
      }
    }

    if (!extracted.customer.name) {
      missing.push('customer_name');
    }
    if (!extracted.customer.email) {
      missing.push('customer_email');
    }
    if (!extracted.customer.phone) {
      missing.push('customer_phone');
    }

    return missing;
  }

  /**
   * Convert extracted data to booking input
   */
  private extractedToBookingInput(extracted: ExtractedBookingData): CreateBookingInput {
    // Map activities to booking items
    const items: any[] = [];

    if (extracted.intent === 'transportation' && extracted.transportation) {
      items.push({
        type: 'TRANSPORTATION',
        name: 'Private Transfer',
        quantity: 1,
        unitPrice: 85, // Default price, should come from pricing service
      });
    }

    if (extracted.activities?.selected) {
      for (const activity of extracted.activities.selected) {
        items.push({
          type: 'ACTIVITY',
          name: activity,
          quantity: 1,
          unitPrice: 50, // Default price
        });
      }
    }

    return {
      type: (extracted.intent?.toUpperCase() || 'TRANSPORTATION') as any,
      customer: {
        name: extracted.customer.name || 'Guest',
        email: extracted.customer.email || '',
        phone: extracted.customer.phone || '',
        language: 'en',
      },
      bookingDate: extracted.when.date || new Date().toISOString(),
      bookingTime: extracted.when.time || undefined,
      pickupLocation: extracted.transportation?.pickup || undefined,
      dropoffLocation: extracted.transportation?.dropoff || undefined,
      flightNumber: extracted.transportation?.flightNumber || undefined,
      arrivalTime: extracted.transportation?.arrivalTime || undefined,
      passengers: extracted.passengers || 1,
      items: items.length > 0 ? items : [{
        type: 'TRANSPORTATION',
        name: 'Private Transfer',
        quantity: 1,
        unitPrice: 85,
      }],
      notes: extracted.notes || undefined,
    };
  }
}

