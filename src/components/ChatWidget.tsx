import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Mic, MicOff, Loader2, Bot, Phone, Mail } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getApiBaseUrl } from '@/lib/api';

const WHATSAPP_LINK = 'https://wa.me/5216241222174';
const WHATSAPP_PHONE = '+52 624 122 2174';
const EMAIL = 'Armando@caboviptransfers.com';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isAudio?: boolean;
  showBookingCta?: boolean;
}

export const ChatWidget = () => {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showPulse, setShowPulse] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const BOOKING_KEYWORDS = /reserv|book|pagar|pay|checkout|comprar|purchase|agendar|schedule/i;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => { stream.getTracks().forEach(t => t.stop()); await handleAudioSubmit(); };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch {
      // silently fail
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioSubmit = async () => {
    if (audioChunksRef.current.length === 0) return;
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    audioChunksRef.current = [];

    const userMessage: Message = {
      id: Date.now().toString(), role: 'user',
      content: lang === 'es' ? '🎤 Mensaje de voz' : '🎤 Voice message',
      timestamp: new Date(), isAudio: true,
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      const res = await fetch(`${getApiBaseUrl()}/api/ai/transcribe`, { method: 'POST', credentials: 'include', body: formData });
      if (!res.ok) throw new Error('Transcription failed');
      const data = await res.json();
      await sendMessage(data.data.text);
    } catch {
      addFallbackMessage();
      setIsLoading(false);
    }
  };

  const addFallbackMessage = () => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(), role: 'assistant',
      content: lang === 'es'
        ? `No pude conectar con el servidor. ¡Contáctanos directamente!\n\n📱 WhatsApp: ${WHATSAPP_PHONE}\n📧 Email: ${EMAIL}`
        : `Could not connect to the server. Contact us directly!\n\n📱 WhatsApp: ${WHATSAPP_PHONE}\n📧 Email: ${EMAIL}`,
      timestamp: new Date(), showBookingCta: true,
    }]);
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: messageText, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/ai/chat`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, locale: lang, sessionId }),
      });

      if (!response.ok) throw new Error('Chat failed');
      const data = await response.json();

      if (data.success) {
        if (data.data.sessionId) setSessionId(data.data.sessionId);

        const wantsToBook = BOOKING_KEYWORDS.test(messageText) ||
          data.data.nextAction === 'confirm_summary' ||
          data.data.nextAction === 'proceed_to_payment';

        let reply = data.data.reply;
        if (wantsToBook) {
          const bookingCta = lang === 'es'
            ? `\n\n📱 Para reservar, contacta a nuestro equipo:\n• WhatsApp: ${WHATSAPP_PHONE}\n• Email: ${EMAIL}`
            : `\n\n📱 To book, contact our team:\n• WhatsApp: ${WHATSAPP_PHONE}\n• Email: ${EMAIL}`;
          reply += bookingCta;
        }

        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(), role: 'assistant',
          content: reply, timestamp: new Date(),
          showBookingCta: wantsToBook,
        }]);
      }
    } catch {
      addFallbackMessage();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading && input.trim()) sendMessage();
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[9999] flex flex-col items-end gap-3">
        {/* Label badge - visible initially */}
        <AnimatePresence>
          {!isOpen && showPulse && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-navy text-gold text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg border border-gold/30 whitespace-nowrap"
            >
              {lang === 'es' ? '¿Necesitas ayuda? 💬' : 'Need help? 💬'}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => { setIsOpen(!isOpen); setShowPulse(false); }}
          className="relative w-16 h-16 md:w-[72px] md:h-[72px] rounded-2xl bg-gradient-to-br from-gold via-amber-500 to-amber-600 hover:from-amber-400 hover:to-gold text-navy flex items-center justify-center shadow-[0_8px_32px_rgba(212,175,55,0.4)] border-2 border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-background"
          aria-label={lang === 'es' ? 'Abrir chat' : 'Open chat'}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 260, damping: 20 }}
        >
          {isOpen ? (
            <X size={28} strokeWidth={2.5} />
          ) : (
            <Bot size={30} strokeWidth={2} />
          )}
          {!isOpen && showPulse && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </motion.button>
      </div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-28 right-6 md:right-8 z-[9998] w-[calc(100vw-2rem)] max-w-md h-[min(560px,80vh)] bg-card border-2 border-gold/30 rounded-2xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.35)] backdrop-blur-xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-navy text-off-white p-4 flex items-center justify-between border-b border-gold/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
                  <Bot size={22} className="text-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-gold text-sm">
                    {lang === 'es' ? 'Asistente Class VIP' : 'Class VIP Assistant'}
                  </h3>
                  <p className="text-[11px] text-off-white/60">
                    {lang === 'es' ? 'Información · Precios · Destinos' : 'Info · Pricing · Destinations'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-6">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                    <Bot size={28} className="text-gold/80" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {lang === 'es'
                      ? '¡Hola! Soy tu asistente de Class VIP Transfers.'
                      : "Hi! I'm your Class VIP Transfers assistant."}
                  </p>
                  <p className="text-xs mt-1.5 text-muted-foreground">
                    {lang === 'es'
                      ? 'Pregúntame sobre precios, servicios, actividades o destinos.'
                      : 'Ask me about pricing, services, activities, or destinations.'}
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id}>
                  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 ${
                      message.role === 'user' ? 'bg-gold text-navy' : 'bg-muted text-foreground'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                  {message.showBookingCta && message.role === 'assistant' && (
                    <div className="flex gap-2 mt-2 ml-1">
                      <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#25D366] text-white hover:bg-[#20bd5a] transition-colors">
                        <MessageCircle size={14} /> WhatsApp
                      </a>
                      <a href={`mailto:${EMAIL}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors border border-border">
                        <Mail size={14} /> Email
                      </a>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-xl px-3.5 py-2.5 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-sm text-muted-foreground">{lang === 'es' ? 'Pensando...' : 'Thinking...'}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick actions */}
            <div className="border-t border-border/50 px-3 py-2.5 bg-muted/30">
              <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={() => sendMessage(lang === 'es' ? '¿Cuáles son sus precios?' : 'What are your prices?')}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-navy/90 text-gold border border-gold/30 hover:bg-gold hover:text-navy transition-colors disabled:opacity-50">
                  {lang === 'es' ? '💰 Precios' : '💰 Prices'}
                </button>
                <button type="button" onClick={() => sendMessage(lang === 'es' ? '¿Qué actividades ofrecen?' : 'What activities do you offer?')}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-navy/90 text-gold border border-gold/30 hover:bg-gold hover:text-navy transition-colors disabled:opacity-50">
                  {lang === 'es' ? '🏄 Actividades' : '🏄 Activities'}
                </button>
                <button type="button" onClick={() => sendMessage(lang === 'es' ? '¿Qué incluye el servicio?' : 'What is included?')}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-navy/90 text-gold border border-gold/30 hover:bg-gold hover:text-navy transition-colors disabled:opacity-50">
                  {lang === 'es' ? '✅ ¿Qué incluye?' : '✅ What\'s included?'}
                </button>
                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366] hover:text-white transition-colors inline-flex items-center gap-1">
                  <Phone size={11} /> {lang === 'es' ? 'Reservar' : 'Book now'}
                </a>
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-gold/20 p-3 bg-card/95">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text" value={input} onChange={(e) => setInput(e.target.value)}
                  placeholder={lang === 'es' ? 'Pregunta lo que quieras...' : 'Ask anything...'}
                  className="flex-1 px-3.5 py-2.5 bg-background border border-gold/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold/40 transition-colors"
                  disabled={isLoading || isRecording}
                />
                <button type="button" onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}
                  className={`p-2.5 rounded-xl transition-colors ${isRecording ? 'bg-red-500 text-white' : 'bg-muted hover:bg-muted/80 text-foreground'}`}
                  disabled={isLoading}>
                  {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <button type="submit" disabled={isLoading || !input.trim() || isRecording}
                  className="p-2.5 bg-gold text-navy rounded-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
