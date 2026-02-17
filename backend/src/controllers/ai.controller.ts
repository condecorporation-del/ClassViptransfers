import { Request, Response } from 'express';
import { AIService } from '../services/ai.service';
import { aiChatSchema } from '../lib/validation';
import { randomUUID } from 'crypto';

const aiService = new AIService();

export class AIController {
  /**
   * POST /api/ai/transcribe
   * Transcribe audio to text
   */
  async transcribe(req: Request, res: Response) {
    try {
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
      res.status(500).json({
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
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process chat',
      });
    }
  }
}

