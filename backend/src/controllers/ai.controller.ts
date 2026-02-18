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
        return res.status(400).json({
          success: false,
          error: 'OPENAI_API_KEY missing - AI service is not configured',
        });
      }

      const input = aiChatSchema.parse(req.body);
      
      // Generate or use session ID
      const sessionId = input.sessionId || randomUUID();

      const result = await aiService.chat(
        input.message,
        input.bookingDraftId || null,
        sessionId,
        input.locale
      );

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
      console.error('Chat error:', error);
      const statusCode = error.message?.includes('OPENAI_API_KEY') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to process chat',
      });
    }
  }
}

