import { Request, Response } from 'express';
import { AIService } from '../services/ai.service';
import { aiChatSchema } from '../lib/validation';
import { randomUUID } from 'crypto';

// Initialize AI service - won't crash if key is missing
let aiService: AIService;
try {
  aiService = new AIService();
} catch (error: any) {
  console.warn('⚠️ AIService initialization warning:', error.message);
  // Create a dummy service that will return errors gracefully
  aiService = null as any;
}

export class AIController {
  /**
   * POST /api/ai/transcribe
   * Transcribe audio to text
   */
  async transcribe(req: Request, res: Response) {
    try {
      if (!aiService) {
        return res.status(400).json({
          success: false,
          error: 'OPENAI_API_KEY missing - AI service is not configured',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Audio file is required',
        });
      }

      const audioBuffer = req.file.buffer;
      const filename = req.file.originalname || 'audio.webm';

      const result = await aiService.transcribeAudio(audioBuffer, filename);

      res.json({
        success: true,
        data: {
          text: result.text,
          language: result.language,
        },
      });
    } catch (error: any) {
      console.error('Transcribe error:', error);
      const statusCode = error.message?.includes('OPENAI_API_KEY') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to transcribe audio',
      });
    }
  }

  /**
   * POST /api/ai/chat
   * Chat with AI assistant
   */
  async chat(req: Request, res: Response) {
    try {
      if (!aiService) {
        console.warn('[AI Chat] OPENAI_API_KEY missing - service not configured');
        return res.status(400).json({
          success: false,
          error: 'OPENAI_API_KEY missing - AI service is not configured',
        });
      }

      const input = aiChatSchema.parse(req.body);
      const sessionId = input.sessionId || randomUUID();

      if (!input.message || input.message.trim().length < 1) {
        return res.status(400).json({ success: false, error: 'Message is required' });
      }
      if (input.message.length > 2000) {
        return res.status(400).json({ success: false, error: 'Message too long (max 2000 characters)' });
      }

      console.log('[AI Chat] Request:', { sessionId: sessionId.slice(0, 8), locale: input.locale, messageLen: input.message?.length, hasDraft: !!input.bookingDraftId });

      const result = await aiService.chat(
        input.message,
        input.bookingDraftId ?? null,
        sessionId,
        input.locale
      );

      console.log('[AI Chat] Success:', { replyLen: result.reply?.length, bookingDraftId: result.bookingDraftId ?? null, nextAction: result.nextAction });

      res.json({
        success: true,
        data: {
          reply: result.reply,
          bookingDraftId: result.bookingDraftId,
          extracted: result.extracted,
          missingFields: result.missingFields,
          nextAction: result.nextAction,
          sessionId,
        },
      });
    } catch (error: any) {
      console.error('[AI Chat] Error:', error?.message ?? error);
      const statusCode = error.message?.includes('OPENAI_API_KEY') ? 400 : (error?.code === 'ZodError' || error?.name === 'ZodError' ? 400 : 500);
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to process chat',
      });
    }
  }
}

