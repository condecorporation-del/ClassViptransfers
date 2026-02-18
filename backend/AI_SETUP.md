# AI Booking Agent Setup

## Overview

AI-powered concierge that creates reservations through chat and voice messages.

## Features

✅ **Chat Interface** - Text-based booking assistance
✅ **Voice Messages** - Audio transcription and processing
✅ **Draft Booking Creation** - Automatic booking generation
✅ **Structured Extraction** - JSON extraction of booking details
✅ **Confirmation Flow** - Mandatory confirmation before payment
✅ **PayPal Integration** - Seamless checkout after confirmation

## Environment Variables

Add to `.env`:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_WHISPER_MODEL=whisper-1
```

### Getting OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Sign up or sign in
3. Create new API key
4. Copy the key (starts with `sk-`)
5. Add to `.env` file

### Model Options

- **OPENAI_MODEL**: `gpt-4o-mini` (recommended, cost-effective) or `gpt-4o`
- **OPENAI_WHISPER_MODEL**: `whisper-1` (for audio transcription)

## API Endpoints

### POST /api/ai/transcribe

Transcribe audio to text.

**Request:**
- `multipart/form-data`
- Field: `audio` (audio file)
- Max size: 10MB

**Response:**
```json
{
  "success": true,
  "data": {
    "text": "I need a transfer from airport to hotel",
    "language": "en"
  }
}
```

### POST /api/ai/chat

Chat with AI assistant.

**Request:**
```json
{
  "message": "I need a transfer from airport to hotel on December 25th",
  "bookingDraftId": "optional-existing-booking-id",
  "locale": "en",
  "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reply": "I understand. Let me help you with your booking...",
    "bookingDraftId": "clxxx...",
    "extracted": {
      "intent": "transportation",
      "when": {
        "date": "2024-12-25",
        "time": null,
        "timezone": "America/Mazatlan"
      },
      "passengers": 2,
      "transportation": {
        "pickup": "airport",
        "dropoff": "hotel",
        "flightNumber": null
      },
      "customer": {
        "name": null,
        "email": null,
        "phone": null
      }
    },
    "missingFields": ["customer_name", "customer_email", "customer_phone"],
    "nextAction": "ask_more",
    "sessionId": "uuid"
  }
}
```

**Next Actions:**
- `ask_more` - Need more information
- `confirm_summary` - Ready for confirmation
- `proceed_to_payment` - User confirmed, proceed to PayPal

## Rate Limiting

- **Window:** 15 minutes
- **Max requests:** 50 per window
- Applied to both `/transcribe` and `/chat` endpoints

## Database

### AIConversation Model

Stores all AI conversations:
- User messages
- Assistant replies
- Extracted booking data
- Session tracking
- Booking association

## Flow

1. **User sends message** (text or audio)
2. **AI extracts booking data** (structured JSON)
3. **System creates/updates draft booking**
4. **AI asks follow-up questions** if fields missing
5. **AI presents summary** when ready
6. **User confirms** booking
7. **System creates PayPal order**
8. **User redirected to checkout**

## Safety Features

✅ **Server-side validation** - Zod schemas
✅ **Rate limiting** - Prevent abuse
✅ **Prompt injection protection** - System prompt restrictions
✅ **Error logging** - No secrets exposed
✅ **Never claims "confirmed"** - Only after payment

## Testing

### Local Testing

1. **Set up environment:**
   ```bash
   cp env.example.txt .env
   # Add OPENAI_API_KEY
   ```

2. **Start server:**
   ```bash
   npm run dev
   ```

3. **Test transcription:**
   ```bash
   curl -X POST http://localhost:3001/api/ai/transcribe \
     -F "audio=@test-audio.webm"
   ```

4. **Test chat:**
   ```bash
   curl -X POST http://localhost:3001/api/ai/chat \
     -H "Content-Type: application/json" \
     -d '{
       "message": "I need a transfer from airport to hotel",
       "locale": "en"
     }'
   ```

### Frontend Integration

See `ChatWidget` component in frontend for full integration.

## Troubleshooting

**Transcription fails:**
- Check audio file format (webm, mp3, wav supported)
- Verify file size < 10MB
- Check OPENAI_API_KEY is set

**Chat returns errors:**
- Verify OPENAI_API_KEY is valid
- Check model name is correct
- Review server logs for details

**Booking not created:**
- Check database connection
- Verify booking service is working
- Review extracted data structure

## Next Steps

- [ ] Test with real audio files
- [ ] Fine-tune extraction prompts
- [ ] Add activity pricing lookup
- [ ] Improve confirmation flow
- [ ] Add conversation history UI

