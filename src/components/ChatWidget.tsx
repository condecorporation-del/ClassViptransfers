import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Mic, MicOff, Loader2, Headphones,
  MessageCircle, Mail, Phone, ExternalLink, ChevronRight,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getApiBaseUrl } from '@/lib/api';
const assistBg = 'https://res.cloudinary.com/dt9iyiorn/image/upload/v1774168334/Widget_futurista_de_sdx22e.png';

const WHATSAPP_LINK = 'https://wa.me/5216241222174';
const WHATSAPP_PHONE = '+52 624 122 2174';
const EMAIL = 'Armando@classviptransfers.com';
const SMS_PHONE = '+5262412222174';
const BOOK_FORM = '/book';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isAudio?: boolean;
  showBookingCta?: boolean;
}

type ActivePanel = 'none' | 'book' | 'price';

export const ChatWidget = () => {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showLabel, setShowLabel] = useState(true);
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  const [priceInput, setPriceInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const priceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Hide label after 15 seconds
    const timer = setTimeout(() => setShowLabel(false), 15000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (activePanel === 'price' && priceInputRef.current) {
      setTimeout(() => priceInputRef.current?.focus(), 100);
    }
  }, [activePanel]);

  // ── Recording ────────────────────────────────────────────────────────────

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
    } catch { /* silently fail */ }
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
      if (!res.ok) throw new Error();
      const data = await res.json();
      await sendMessage(data.data.text);
    } catch {
      addFallbackMessage();
      setIsLoading(false);
    }
  };

  // ── Messaging ─────────────────────────────────────────────────────────────

  const addFallbackMessage = () => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(), role: 'assistant',
      content: lang === 'es'
        ? `No pude conectar. Contáctanos directamente:\n📱 WhatsApp: ${WHATSAPP_PHONE}\n📧 ${EMAIL}`
        : `Could not connect. Contact us directly:\n📱 WhatsApp: ${WHATSAPP_PHONE}\n📧 ${EMAIL}`,
      timestamp: new Date(), showBookingCta: true,
    }]);
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;
    setActivePanel('none');
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
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (data.success) {
        if (data.data.sessionId) setSessionId(data.data.sessionId);
        const BOOKING_RE = /reserv|book|pagar|pay|checkout|comprar|agendar/i;
        const wantsToBook = BOOKING_RE.test(messageText) || data.data.nextAction === 'proceed_to_payment';
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(), role: 'assistant',
          content: data.data.reply, timestamp: new Date(),
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

  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceInput.trim()) return;
    const q = lang === 'es'
      ? `¿Cuánto cuesta el traslado a ${priceInput}?`
      : `How much does a transfer to ${priceInput} cost?`;
    setPriceInput('');
    setActivePanel('none');
    sendMessage(q);
  };

  const handleActivityShortcut = () => {
    setActivePanel('none');
    const q = lang === 'es'
      ? '¿Qué actividades tienen y cuáles son los precios de los combos?'
      : 'What activities do you offer and what are the combo prices?';
    sendMessage(q);
  };

  // Contact links
  const bookingMsg = encodeURIComponent(lang === 'es' ? 'Hola, quiero reservar mi traslado.' : 'Hi, I want to book my transfer.');
  const smsLink = `sms:${SMS_PHONE}?&body=${bookingMsg}`;
  const mailtoLink = `mailto:${EMAIL}?subject=${encodeURIComponent(lang === 'es' ? 'Reservar traslado' : 'Book transfer')}&body=${bookingMsg}`;

  return (
    <>
      {/* ── Floating Button ── */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[9999] flex flex-col items-end gap-2">
        {/* Animated label */}
        <AnimatePresence>
          {!isOpen && showLabel && (
            <motion.div
              initial={{ opacity: 0, x: 12, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 12, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-navy text-gold text-xs font-bold px-3 py-2 rounded-lg shadow-xl border border-gold/40 whitespace-nowrap cursor-pointer select-none flex items-center gap-1.5"
              onClick={() => { setIsOpen(true); setShowLabel(false); }}
            >
              <Headphones size={14} className="shrink-0" />
              {lang === 'es' ? '¿Necesitas ayuda?' : 'Need assistance?'}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main button — compact combo-style with image bg + bold HELP */}
        <motion.button
          onClick={() => { setIsOpen(v => !v); setShowLabel(false); }}
          className="relative w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] md:w-[64px] md:h-[64px] rounded-xl flex items-center justify-center overflow-hidden focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 focus:ring-offset-background"
          aria-label={lang === 'es' ? 'Abrir asistencia' : 'Open assistance'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 18 }}
        >
          {/* Background image + overlay — como los combos */}
          <img
            src={assistBg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/70 to-navy/50" />
          <div className="absolute inset-0 shimmer opacity-30 pointer-events-none" />

          {/* Border & shadow */}
          <div className="absolute inset-0 rounded-xl border border-gold/50 shadow-[0_4px_16px_rgba(212,175,55,0.3),inset_0_0_0_1px_rgba(255,255,255,0.08)]" />

          {isOpen ? (
            <X size={20} strokeWidth={2.5} className="text-gold relative z-10" />
          ) : (
            <div className="relative z-10 flex flex-col items-center gap-0.5">
              <Headphones size={14} strokeWidth={2.5} className="text-gold drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]" />
              <span
                className="text-[9px] sm:text-[10px] md:text-[11px] font-black text-gold tracking-[0.2em] sm:tracking-[0.25em] uppercase leading-none"
                style={{ textShadow: '0 0 8px rgba(212,175,55,0.5), 0 1px 3px rgba(0,0,0,0.5)' }}
              >
                Help
              </span>
            </div>
          )}

          {/* Green online dot */}
          {!isOpen && (
            <span className="absolute -top-0.5 -right-0.5 z-20 w-3.5 h-3.5 bg-emerald-400 rounded-full border border-navy flex items-center justify-center shadow-md">
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />
            </span>
          )}
        </motion.button>
      </div>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-[72px] sm:bottom-[76px] md:bottom-[80px] right-4 md:right-6 z-[9998] w-[calc(100vw-2rem)] max-w-[420px] h-[min(580px,82vh)] bg-card border border-gold/25 rounded-2xl shadow-[0_32px_72px_-8px_rgba(0,0,0,0.4),0_0_0_1px_rgba(212,175,55,0.15)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-4 border-b border-gold/20"
              style={{ background: 'linear-gradient(135deg, #0A1628 0%, #112240 60%, #0D1B35 100%)' }}
            >
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))' }}>
                  <Headphones size={20} className="text-gold" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border border-navy" />
                </div>
                <div>
                  <h3 className="font-bold text-gold text-sm tracking-wide">
                    {lang === 'es' ? 'Asistencia Class VIP' : 'Class VIP Assistance'}
                  </h3>
                  <p className="text-[11px] text-off-white/55 mt-0.5">
                    {lang === 'es' ? 'Los Cabos · Disponible 24/7' : 'Los Cabos · Available 24/7'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-off-white/50 hover:text-off-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-5"
                >
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))' }}>
                    <Headphones size={30} className="text-gold/70" />
                  </div>
                  <p className="text-sm font-semibold">
                    {lang === 'es' ? '¡Hola! ¿En qué puedo ayudarte?' : "Hi! How can I assist you today?"}
                  </p>
                  <p className="text-xs mt-1.5 text-muted-foreground leading-relaxed">
                    {lang === 'es'
                      ? 'Pregúntame sobre precios, actividades y servicios en Los Cabos.'
                      : 'Ask me about prices, activities, and services in Los Cabos.'}
                  </p>
                </motion.div>
              )}

              {messages.map((msg) => (
                <div key={msg.id}>
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'text-navy font-medium'
                        : 'bg-muted text-foreground'
                    }`}
                      style={msg.role === 'user' ? {
                        background: 'linear-gradient(135deg, #D4AF37, #F5C842)',
                      } : {}}
                    >
                      {msg.content}
                    </div>
                  </div>
                  {msg.showBookingCta && msg.role === 'assistant' && (
                    <div className="flex gap-2 mt-2 ml-1 flex-wrap">
                      <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#25D366] text-white hover:bg-[#20bd5a] transition-colors">
                        <MessageCircle size={12} /> WhatsApp
                      </a>
                      <a href={BOOK_FORM}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gold/15 text-gold border border-gold/30 hover:bg-gold/25 transition-colors">
                        <ExternalLink size={12} /> {lang === 'es' ? 'Reservar online' : 'Book online'}
                      </a>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-xl px-4 py-2.5 flex items-center gap-2">
                    <Loader2 size={13} className="animate-spin text-gold" />
                    <span className="text-xs text-muted-foreground">{lang === 'es' ? 'Pensando...' : 'Thinking...'}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Shortcut Panels ── */}

            {/* Book Now panel */}
            <AnimatePresence>
              {activePanel === 'book' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-border/60 overflow-hidden"
                >
                  <div className="p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                      {lang === 'es' ? '¿Cómo quieres reservar?' : 'How do you want to book?'}
                    </p>
                    <a href={BOOK_FORM}
                      className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
                      style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)', color: '#0A1628' }}
                    >
                      <span className="flex items-center gap-2">
                        <ExternalLink size={16} />
                        {lang === 'es' ? 'Formulario online' : 'Online booking form'}
                      </span>
                      <ChevronRight size={16} />
                    </a>
                    <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold bg-[#25D366] text-white hover:bg-[#20bd5a] transition-all hover:scale-[1.01]">
                      <span className="flex items-center gap-2">
                        <MessageCircle size={16} /> WhatsApp
                      </span>
                      <ChevronRight size={16} />
                    </a>
                    <a href={mailtoLink}
                      className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/80 transition-all border border-border hover:scale-[1.01]">
                      <span className="flex items-center gap-2">
                        <Mail size={16} /> {lang === 'es' ? 'Email' : 'Email'}
                      </span>
                      <ChevronRight size={16} />
                    </a>
                    <a href={smsLink}
                      className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/80 transition-all border border-border hover:scale-[1.01]">
                      <span className="flex items-center gap-2">
                        <Phone size={16} /> iMessage / SMS
                      </span>
                      <ChevronRight size={16} />
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Price quote panel */}
            <AnimatePresence>
              {activePanel === 'price' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-border/60 overflow-hidden"
                >
                  <div className="p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
                      {lang === 'es' ? '¿A qué hotel o zona?' : 'Which hotel or area?'}
                    </p>
                    <form onSubmit={handlePriceSubmit} className="flex gap-2">
                      <input
                        ref={priceInputRef}
                        type="text"
                        value={priceInput}
                        onChange={e => setPriceInput(e.target.value)}
                        placeholder={lang === 'es' ? 'ej. Riu Palace, Corridor...' : 'e.g. Pueblo Bonito, Corridor...'}
                        className="flex-1 px-3 py-2.5 rounded-xl border border-gold/25 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                      />
                      <button
                        type="submit"
                        disabled={!priceInput.trim() || isLoading}
                        className="px-4 py-2.5 rounded-xl text-navy font-bold text-sm disabled:opacity-50 transition-all"
                        style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)' }}
                      >
                        {lang === 'es' ? 'Cotizar' : 'Quote'}
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Shortcut Buttons ── */}
            <div className="border-t border-border/50 px-3 py-2 bg-muted/20">
              <div className="flex flex-wrap gap-1.5">
                {/* Book now */}
                <button
                  onClick={() => setActivePanel(p => p === 'book' ? 'none' : 'book')}
                  disabled={isLoading}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-50 ${
                    activePanel === 'book'
                      ? 'bg-gold text-navy'
                      : 'bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366] hover:text-white'
                  }`}
                >
                  <Phone size={11} />
                  {lang === 'es' ? 'Reservar ahora' : 'Book now'}
                </button>

                {/* Price quote */}
                <button
                  onClick={() => setActivePanel(p => p === 'price' ? 'none' : 'price')}
                  disabled={isLoading}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all disabled:opacity-50 ${
                    activePanel === 'price'
                      ? 'bg-gold text-navy font-bold'
                      : 'bg-navy/90 text-gold border border-gold/30 hover:bg-gold hover:text-navy'
                  }`}
                >
                  💰 {lang === 'es' ? 'Cotizar precio' : 'Get a price'}
                </button>

                {/* Activities */}
                <button
                  onClick={handleActivityShortcut}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-navy/90 text-gold border border-gold/30 hover:bg-gold hover:text-navy transition-all disabled:opacity-50"
                >
                  🏄 {lang === 'es' ? 'Actividades' : 'Activities'}
                </button>
              </div>
            </div>

            {/* ── Input ── */}
            <div className="border-t border-gold/15 p-3 bg-card/95">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={lang === 'es' ? 'Escribe tu pregunta...' : 'Ask anything about Los Cabos...'}
                  className="flex-1 px-3.5 py-2.5 bg-background border border-gold/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold transition-colors"
                  disabled={isLoading || isRecording}
                />
                <button
                  type="button"
                  onMouseDown={startRecording} onMouseUp={stopRecording}
                  onTouchStart={startRecording} onTouchEnd={stopRecording}
                  disabled={isLoading}
                  className={`p-2.5 rounded-xl transition-colors ${isRecording ? 'bg-red-500 text-white' : 'bg-muted hover:bg-muted/80'}`}
                >
                  {isRecording ? <MicOff size={17} /> : <Mic size={17} />}
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !input.trim() || isRecording}
                  className="p-2.5 rounded-xl text-navy disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #F5C842)' }}
                >
                  <Send size={17} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
