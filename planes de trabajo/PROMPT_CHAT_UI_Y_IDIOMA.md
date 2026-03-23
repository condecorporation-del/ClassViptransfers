# Prompt: Chat UI y detección de idioma

**Fecha:** 28 feb 2026  
**Errores a corregir:**
1. UI: Solo PASSENGERS deben verse como shortcuts (botones). TRIP TYPE no debe tener el mismo estilo de botones.
2. Idioma: El chat responde en inglés aunque el usuario escriba en español (ej. "hola" → "how may I help you"). Debe detectar el idioma del mensaje y responder en el mismo idioma.

---

## Objetivo

1. **UI ChatBookingForm:** Mantener PASSENGERS como shortcuts (botones). TRIP TYPE debe mostrarse de forma diferente: select/dropdown o control más discreto (no botones como shortcuts).
2. **Idioma del chat:** Detectar idioma del mensaje del usuario y responder SIEMPRE en ese idioma. Si el usuario escribe "hola", responder en español. Si escribe "hi", responder en inglés.

---

## Archivos a modificar

- `src/components/chat/ChatBookingForm.tsx` — TRIP TYPE: cambiar de botones a select o control discreto.
- `backend/src/services/ai.service.ts` — SIMPLE_LOCAL_REPLIES y flujo general: usar detección de idioma del mensaje (detectLocaleFromMessage) para elegir la respuesta, no solo locale del request.

---

## Prompt (copiar y pegar)

```
Proyecto los-cabos-luxe-transfers. Corrección: UI del formulario de chat + idioma del asistente.

1) CHATBOOKINGFORM - TRIP TYPE (src/components/chat/ChatBookingForm.tsx)
   - PASSENGERS: mantener como botones/shortcuts (1, 2, 3, 4, 5, 5+).
   - TRIP TYPE: cambiar de botones a un select (dropdown) o control más discreto. NO debe verse como los mismos shortcuts que Passengers. Usar un <select> con opciones "One way" / "Round trip" o un estilo visual distinto (más sutil, menos "buttony").
   - Objetivo: solo Passengers se ve como shortcuts; Trip Type debe diferenciarse visualmente.

2) AI SERVICE - IDIOMA (backend/src/services/ai.service.ts)
   - Para SIMPLE_LOCAL_REPLIES (hola, hi, gracias, etc.): usar SIEMPRE detectLocaleFromMessage(msgTrimmed) para elegir la respuesta. Si detecta español → replies.es. Si detecta inglés → replies.en. Si no detecta → usar locale del request.
   - Cambiar la lógica actual de useSpanish para que priorice detectLocaleFromMessage.
   - Garantizar que si el usuario escribe "hola", la respuesta sea en español ("¿En qué puedo ayudarte?") y NO en inglés ("How can I help you?").
   - Para respuestas de OpenAI: ya se usa replyLocale = detectLocaleFromMessage(msgTrimmed) || locale. Verificar que no haya otro camino que ignore esto.

3) CHATWIDGET (src/components/ChatWidget.tsx) - opcional
   - Si es posible, enviar locale detectado del último mensaje del usuario (para sesiones con historial) o del mensaje actual. Prioridad: el idioma del mensaje del usuario sobre el idioma del sitio.

Verifica npm run build (front y back) y que "hola" devuelva respuesta en español.
```

---

## Verificación

- [ ] Passengers: botones como shortcuts.
- [ ] Trip Type: select o control distinto, no mismo estilo que Passengers.
- [ ] "hola" → respuesta en español.
- [ ] "hi" → respuesta en inglés.
- [ ] Build OK.
