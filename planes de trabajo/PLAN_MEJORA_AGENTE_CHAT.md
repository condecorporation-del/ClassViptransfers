# Plan de mejoras del agente de chat – Class VIP Transfers

**Proyecto:** los-cabos-luxe-transfers  
**Estado:** Pendiente de autorización  
**Fecha:** 2026-02-21  

---

## 1. Objetivo

Hacer el chat **breve**, **profesional** y **fácil** para reservas. Flujo guiado con clics y mínimo texto. Que el cliente pueda reservar con pocos clics y solo escriba lo indispensable (nombre, correo, teléfono, vuelo).

---

## 2. Requerimientos

### 2.1 Saludo inicial

- Cuando el usuario diga **"hi"**, **"hola"** o similar:
  - Responder: *"Soy el asistente de Class VIP Transfers. ¿En qué puedo ayudarte?"* (o equivalente en inglés según idioma).
  - Mostrar **atajos rápidos** como botones:
    - Reservar transporte
    - Reservar actividades
    - Cotizar
    - Hablar con humano

### 2.2 "Quiero reservar transportación" / "Reservar transporte"

- Responder breve (1–2 líneas).
- Mostrar formulario visual user-friendly.
- No enviar textos largos; guiar con formulario/selectores.

### 2.3 "Quiero reservar"

- Responder: *"Claro, llena el siguiente formulario"* (o *"Sure, fill out the form below"* en inglés).
- Guiar paso a paso: transporte → extras → actividades → datos personales.

### 2.4 Formulario

- Solo los datos que **deben escribirse**:
  - Nombre
  - Correo
  - Teléfono
  - Número de vuelo (si aplica)
- Todo lo demás: **botones y selectores** (origen/destino, tipo de viaje, pasajeros, fecha, extras, actividades).

### 2.5 Botones quick reply

- Rediseño profesional.
- Coherente con la app (colores, bordes, espaciado).
- Evitar apariencia genérica o descuidada.

### 2.6 IA breve en reservas

- Respuestas cortas durante el flujo de reserva.
- Flujo claro, sin párrafos largos.
- Un paso a la vez.

### 2.7 Idioma

- El agente debe **responder en el mismo idioma** que el cliente:
  - Si escribe en español → respuesta en español.
  - Si escribe en inglés → respuesta en inglés.
- La mayoría de clientes son angloparlantes, pero siempre detectar el idioma del mensaje y contestar en ese idioma.
- Mantener el mismo idioma durante toda la conversación (a menos que el cliente cambie explícitamente).

---

## 3. Flujo propuesto

| Paso | Descripción | Tipo de interacción |
|------|-------------|---------------------|
| 1 | **Transporte** | Selectores: origen, destino, tipo viaje (solo ida / ida y vuelta), fecha/hora, pasajeros |
| 2 | **Extras** | Botones/tarjetas: parada super, silla bebé, champagne, etc. |
| 3 | **Actividades** | Botones: Combo $100, Crazy Combo $125, Ninguna |
| 4 | **Datos personales** | Inputs: nombre, correo, teléfono, número de vuelo (opcional) |
| 5 | **Resumen y confirmación** | Vista previa + botón Confirmar / Pagar |

---

## 4. Criterios de aceptación

| # | Criterio | Cumplido |
|---|----------|----------|
| A1 | Saludo muestra atajos (Reservar transporte, Reservar actividades, Cotizar) | ☐ |
| A2 | "Quiero reservar" / "Reservar transporte" muestra formulario visual, no texto largo | ☐ |
| A3 | Formulario tiene botones/selectores para transporte, extras, actividades | ☐ |
| A4 | Solo se escriben nombre, correo, teléfono, vuelo | ☐ |
| A5 | Botones quick reply con diseño profesional y coherente con la app | ☐ |
| A6 | Respuestas de la IA breves durante el flujo de reserva | ☐ |
| A7 | El agente responde en español si el cliente escribe en español, y en inglés si escribe en inglés | ☐ |
| A8 | Flujo guiado paso a paso sin confusiones | ☐ |

---

## 5. Tareas / Checklist

### Fase 1 – Saludo y atajos

| # | Tarea | Archivo(s) | Prioridad |
|---|-------|------------|-----------|
| 1.1 | Ajustar saludo inicial (hi/hola) con texto correcto | Backend AI (system prompt), ChatWidget | Alta |
| 1.2 | Añadir atajos como botones: Reservar transporte, Reservar actividades, Cotizar, Hablar con humano | ChatWidget.tsx | Alta |
| 1.3 | Al hacer clic en atajo, iniciar flujo correspondiente | ChatWidget.tsx, ai.service.ts | Alta |

### Fase 2 – Formulario visual en chat

| # | Tarea | Archivo(s) | Prioridad |
|---|-------|------------|-----------|
| 2.1 | Crear componente de formulario de transporte (selectores: origen, destino, tipo viaje, fecha, pasajeros) | Nuevo componente o ChatWidget | Alta |
| 2.2 | Integrar formulario en flujo de chat cuando el usuario pida reservar | ChatWidget.tsx | Alta |
| 2.3 | Crear bloque de extras (botones/tarjetas) | ChatWidget.tsx | Alta |
| 2.4 | Crear bloque de actividades (Combo $100, Crazy Combo $125) | ChatWidget.tsx | Alta |
| 2.5 | Crear bloque de datos personales (nombre, correo, teléfono, vuelo) | ChatWidget.tsx | Alta |

### Fase 3 – IA breve y detección de idioma

| # | Tarea | Archivo(s) | Prioridad |
|---|-------|------------|-----------|
| 3.1 | Actualizar system prompt: respuestas breves en flujo de reserva | ai.service.ts | Alta |
| 3.2 | Asegurar que el backend use locale/idioma del mensaje para responder | ai.service.ts | Alta |
| 3.3 | Evitar párrafos largos; instruir al modelo a ser conciso | ai.service.ts | Alta |

### Fase 4 – Rediseño botones quick reply

| # | Tarea | Archivo(s) | Prioridad |
|---|-------|------------|-----------|
| 4.1 | Rediseñar botones quick reply (pasajeros, tipo viaje) | ChatWidget.tsx | Media |
| 4.2 | Usar estilos coherentes con la app (gold, navy, bordes, espaciado) | ChatWidget.tsx | Media |

### Fase 5 – Integración y pruebas

| # | Tarea | Descripción | Prioridad |
|---|-------|-------------|-----------|
| 5.1 | Pruebas de flujo | Verificar que "Quiero reservar" muestre formulario y guíe paso a paso | Alta |
| 5.2 | Pruebas de idioma | Verificar respuesta en español e inglés según input | Alta |
| 5.3 | Build | Frontend y backend compilan OK | Alta |

---

## Resumen

- **Objetivo:** Chat breve y fácil para reservas, guiado por clics.
- **Flujo:** Saludo + atajos → Transporte → Extras → Actividades → Datos → Confirmación.
- **Idioma:** Responder en el mismo idioma que el cliente (español/inglés).
- **Entregables:** Formulario visual en chat, botones profesionales, IA concisa.

---

*Documento listo para revisión y autorización antes de implementar.*
