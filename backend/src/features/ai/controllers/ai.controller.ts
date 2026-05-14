import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { AIService } from '../services/ai.service';
import { getErrorMessage } from '../../../shared/lib/errors';
import { aiChatSchema } from '../../../shared/lib/validation';

let aiService: AIService | null = null;

try {
  aiService = new AIService();
} catch (error) {
  console.warn('[AI] Service initialization warning:', getErrorMessage(error, 'AI service unavailable'));
}

export class AIController {
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
    } catch (error) {
      console.error('Transcribe error:', error);
      const message = getErrorMessage(error, 'Failed to transcribe audio');
      const statusCode = message.includes('OPENAI_API_KEY') ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: message,
      });
    }
  }

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

      console.log('[AI Chat] Request:', {
        sessionId: sessionId.slice(0, 8),
        locale: input.locale,
        messageLen: input.message.length,
        hasDraft: Boolean(input.bookingDraftId),
      });

      const result = await aiService.chat(
        input.message,
        input.bookingDraftId ?? null,
        sessionId,
        input.locale
      );

      console.log('[AI Chat] Success:', {
        replyLen: result.reply?.length,
        bookingDraftId: result.bookingDraftId ?? null,
        nextAction: result.nextAction,
      });

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
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to process chat');
      const isZodError =
        typeof error === 'object' &&
        error !== null &&
        ((('code' in error) && error.code === 'ZodError') || (('name' in error) && error.name === 'ZodError'));

      console.error('[AI Chat] Error:', message);

      res.status(message.includes('OPENAI_API_KEY') ? 400 : (isZodError ? 400 : 500)).json({
        success: false,
        error: message,
      });
    }
  }
}
