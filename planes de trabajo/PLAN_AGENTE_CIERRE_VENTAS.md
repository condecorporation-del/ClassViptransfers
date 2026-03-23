# Plan de trabajo: Agente de chat para cierre de ventas automático

**Proyecto:** los-cabos-luxe-transfers  
**Referencia:** [classviptransfers.com](https://www.classviptransfers.com), [transcabo.com](https://www.transcabo.com)  
**Objetivo:** Llevar el agente a cerrar ventas automáticamente, con flujo profesional de reserva y diseño futurista.  

**Estado:** Pendiente de autorización  

---

## 1. Entendimiento del proceso de reserva (transporte turístico Los Cabos)

### Flujo correcto según la industria

| Paso | Requerimiento | Descripción |
|------|---------------|-------------|
| **1. Zona** | Área/zone | San José del Cabo, Corredor, Cabo San Lucas, Puerto Los Cabos, etc. |
| **2. Hotel** | OBLIGATORIO | Al elegir zona, el cliente DEBE seleccionar o escribir el hotel. Es vital saber a qué hotel va. (Referencia: Transcabo, Class VIP — selector de hotel por zona) |
| **3. Llegada** | Vuelo de llegada + hora de aterrizaje | ARRIVAL FLIGHT (número de vuelo, ej. AA 1234) y hora a la que llega el avión. NO solo "arrival time" genérico. |
| **4. Salida (round trip)** | Vuelo de salida + pickup automático | DEPARTURE FLIGHT (número de vuelo) y hora de salida. El sistema debe calcular automáticamente el pickup 3 horas antes. La info de vuelo de salida es indispensable. |
| **5. Número de vuelo** | OBLIGATORIO, no opcional | Es información vital para hacer una reserva. Quitar "flight number optional". |

### Cambios necesarios respecto al flujo actual

- **ChatBookingForm:** Actualmente pide zona pero no hotel. Añadir: zona → hotel (selector o búsqueda).
- **ChatBookingForm:** Cambiar "arrival time" genérico por: Arrival flight (número) + Arrival time (hora de aterrizaje).
- **ChatBookingForm:** En round trip: Departure flight + Departure time, y calcular pickup 3h antes automáticamente.
- **ChatBookingForm:** Quitar "flight number optional" — hacerlo obligatorio.
- **Lógica:** Alinear con Book.tsx (hoteles por zona, validaciones de fecha/vuelo, pickup 3h antes en round trip).

---

## 2. Flujo propuesto del formulario de chat

| Paso | Campos | Validación |
|------|--------|------------|
| **1. Transporte** | Ruta (aeropuerto→hotel / hotel→aeropuerto), Zona, Hotel (selector/búsqueda), Tipo viaje, Fecha, Pasajeros | Zona + Hotel obligatorios |
| **2. Vuelo llegada** | Arrival flight (ej. AA 1234), Arrival time (hora aterrizaje) | Formato vuelo, hora válida |
| **3. Vuelo salida** (si round trip) | Departure flight, Departure time | Pickup = departure time − 3h (automático) |
| **4. Extras** | Parada super, silla bebé, champagne, etc. | Opcional |
| **5. Actividades** | Solo transporte / Combo $100 / Crazy Combo $125 | Opcional |
| **6. Datos personales** | Nombre, correo, teléfono | Obligatorios |
| **7. Resumen y pago** | Revisión final, ir a checkout | — |

---

## 3. Diseño del chat: futurista y orgánico

### Objetivo visual
- Aspecto futurista pero orgánico (líneas suaves, gradientes, sombras sutiles).
- Coherente con la marca (gold, navy) pero con sensación más tecnológica.

### Elementos propuestos
- Bordes redondeados generosos, sombras suaves, gradientes sutiles.
- Animaciones ligeras (hover, transiciones).
- Tipografía clara y espaciado amplio.
- Botones y cards con efecto glass/blur.
- Colores: navy oscuro, gold, acentos cyan o blanco suave para contraste futurista.

### Referencias
- Interfaces de chat modernas (estilo iMessage/WhatsApp pero más premium).
- Estética "luxury tech" — limpio, espaciado, minimalista con detalles cuidados.

---

## 4. Optimización del agente para cerrar ventas

### Comportamiento
- Respuestas breves, directas, orientadas al cierre.
- Guiar paso a paso sin abrumar.
- Recordar datos ya capturados para no repetir preguntas.
- Ofrecer siguiente paso claro en cada mensaje.

### Técnico
- Mantener detección de idioma (español/inglés) según mensaje.
- Mantener precios reales inyectados (zonas, extras, combos).
- Instrucciones de cierre en el system prompt (objeción "es caro", "necesito pensar", etc.).

---

## 5. Tareas / Checklist

### Fase A – Corrección del flujo de reserva (ChatBookingForm)

| # | Tarea | Descripción |
|---|-------|-------------|
| A1 | Zona → Hotel | Tras elegir zona, mostrar selector/búsqueda de hoteles (API /api/pricing/hotels filtrada por zona). Hotel obligatorio. |
| A2 | Arrival flight + Arrival time | Reemplazar "arrival time" genérico por: Arrival flight (input) y Arrival time (hora aterrizaje). Validar formato vuelo (AA 1234). |
| A3 | Departure flight + Pickup 3h antes | En round trip: Departure flight, Departure time. Calcular pickup = departure − 3h. Mostrar pickup sugerido al usuario. |
| A4 | Flight number obligatorio | Quitar "optional" del número de vuelo. Hacerlo obligatorio en llegada (y en salida si round trip). |

### Fase B – Diseño futurista del chat

| # | Tarea | Descripción |
|---|-------|-------------|
| B1 | Estilos del panel de chat | Bordes más redondeados, sombras suaves, gradientes sutiles. Efecto glass/blur. |
| B2 | Botones y cards | Estilo más "luxury tech" — espaciado, transiciones suaves, hover sutil. |
| B3 | Mensajes | Burbujas o cards con estilo orgánico-futurista (bordes suaves, sombras). |
| B4 | Formulario ChatBookingForm | Misma estética dentro del chat: limpio, espaciado, futurista. |

### Fase C – Integración y validación

| # | Tarea | Descripción |
|---|-------|-------------|
| C1 | Fetch hoteles por zona | Usar API de hoteles en ChatBookingForm (como Book.tsx). |
| C2 | Payload de booking | Incluir hotel (pickup/dropoff), arrival flight, arrival time, departure flight, departure time, pickup time (round trip). |
| C3 | Build | Frontend y backend compilan OK. |

---

## 6. Criterios de aceptación

- [ ] Al elegir zona, el cliente puede seleccionar o buscar hotel. Hotel obligatorio.
- [ ] Arrival: flight number + arrival time. Formato válido.
- [ ] Round trip: departure flight + departure time. Pickup automático 3h antes.
- [ ] Flight number no es opcional; es obligatorio.
- [ ] Chat y formulario con diseño futurista y orgánico.
- [ ] Flujo guía al cierre sin pasos confusos.

---

## 7. Orden de ejecución recomendado

1. **Fase A** (flujo de reserva correcto) — base funcional.
2. **Fase B** (diseño futurista) — experiencia visual.
3. **Fase C** (integración y validación) — cierre.

---

*Plan listo para revisión y autorización. No se implementa hasta que apruebes.*
