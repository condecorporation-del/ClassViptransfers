# Plan de nuevas implementaciones

**Proyecto:** los-cabos-luxe-transfers  
**Objetivo:** Cerrar ventas con IA, alinear precios y hoteles con classviptransfers.com, y dejar el sitio listo para portafolio/Upwork (full stack + agentes IA).  
**Referencia de precios y estructura:** classviptransfers.com  

---

## Resumen de tareas

| # | Área | Prioridad | Descripción breve |
|---|------|-----------|-------------------|
| 1 | Chat / IA | Alta | Formularios en el chat para reservar con clics (cerrar ventas). |
| 2 | Home | Alta | Quitar opción Shuttle; solo privado. |
| 3 | Actividades | Alta | Quitar venta individual; solo combos 2=$100 y 3=$125 (Home y /activities). |
| 4 | Precios | Alta | Aplicar precios de classviptransfers.com (transfers y zonas). |
| 5 | Hoteles | Alta | Incluir todos los hoteles como en classviptransfers.com; organizar por áreas (elegir área → luego hotel). |
| 6 | Presentación | Media | Organización y diseño profesional para portafolio/Upwork. |

---

## Paso 1: Chat con formularios para cerrar ventas (IA)

**Objetivo:** Que el agente de IA ayude a cerrar ventas mostrando pequeños formularios en el chat para que la persona reserve solo con clics.

### 1.1 Definir flujo de “reserva por clics”

- [ ] **1.1.1** Documentar o dibujar el flujo: mensaje del bot → botones o formulario (ej. “¿Cuántos pasajeros?” 1–2–3–4+) → siguiente pregunta (ej. fecha, ruta) → resumen → botón “Confirmar reserva” / “Ir a pagar”.
- [ ] **1.1.2** Decidir qué datos se piden por clic (pasajeros, tipo de viaje one way/roundtrip, zona/área, fecha, vuelo opcional) y en qué orden.

### 1.2 Componentes en el chat

- [ ] **1.2.1** Crear componentes reutilizables para el chat: por ejemplo `ChatChoiceButtons` (opciones múltiples), `ChatDatePicker`, `ChatAreaSelector` (áreas), `ChatSummaryCard` (resumen + CTA).
- [ ] **1.2.2** Integrar estos componentes en las respuestas del bot: cuando el backend indique “ask_passengers” o “ask_date”, el frontend muestre el formulario o botones correspondientes en lugar de solo texto.
- [ ] **1.2.3** Al completar el flujo, mostrar resumen y un botón tipo “Reservar ahora” que lleve a `/book` con datos pre-rellenados (query params o estado global) o a `/checkout` si ya hay booking draft.

### 1.3 Backend (API de chat)

- [ ] **1.3.1** Extender el contrato del chat (payload/response) para que el backend pueda devolver: tipo de “siguiente paso” (e.g. `collect_passengers`, `collect_date`, `collect_area`, `show_summary`) y opciones (ej. lista de áreas, rangos de pasajeros).
- [ ] **1.3.2** Si hace falta, crear o usar `bookingDraftId` para ir guardando respuestas y al final crear/actualizar el draft y devolver enlace a checkout.

### 1.4 Criterios de aceptación

- El usuario puede elegir pasajeros, tipo de viaje, área, fecha (y opcionalmente vuelo) desde el chat con clics/botones o selects.
- Se muestra un resumen antes de confirmar y un CTA claro para “Reservar” / “Ir a pagar”.
- Build en verde y sin errores de lint.

---

## Paso 2: Home – quitar Shuttle

**Objetivo:** En la página de inicio no debe aparecer la opción de Shuttle; solo transfer privado.

### 2.1 Cambios en la UI

- [ ] **2.1.1** En `src/pages/Index.tsx` (o equivalente de Home), localizar el bloque que muestra “Shuttle” (texto, descripción, precio o nota de contacto).
- [ ] **2.1.2** Eliminar ese bloque por completo (card, columna o sección de Shuttle).
- [ ] **2.1.3** Dejar solo la opción “Private” / “Privado” en la sección de transfers. Ajustar grid o layout si queda una sola opción (centrado o ancho único).
- [ ] **2.1.4** Revisar que no queden enlaces o textos que mencionen “shuttle” en la Home (buscar en traducciones y en el mismo componente).

### 2.2 Criterios de aceptación

- En Home no se ve ninguna opción de Shuttle.
- Solo se ofrece transfer privado.
- Build en verde.

---

## Paso 3: Actividades – solo combos (no venta individual)

**Objetivo:** Las actividades ya no se venden individuales; solo combos: 2 actividades = $100 USD/persona, 3 actividades = $125 USD/persona. Esto debe reflejarse en Home y en la página /activities.

### 3.1 Página Home

- [ ] **3.1.1** En `src/pages/Index.tsx`, localizar la sección que muestra la lista/grid de actividades individuales (Camel Ride $120, Horseback $120, ATV, RZR $205+, Sunset Cruise, Fishing Yacht, etc.).
- [ ] **3.1.2** Eliminar ese grid de actividades con precios individuales (o reemplazarlo por una versión que no muestre precios por actividad).
- [ ] **3.1.3** Dejar solo la oferta de **Combo** ($100, 2 actividades) y **Crazy Combo** ($125, 3 actividades) con botones a “Reservar Combo” / “Reservar Crazy Combo” (enlace a `/book-activities` o equivalente).
- [ ] **3.1.4** Ajustar textos si hace falta (ej. “Elige tu combo” en lugar de “Elige actividades individuales”).

### 3.2 Página /activities

- [ ] **3.2.1** En `src/pages/Activities.tsx`, asegurarse de que **no** exista una sección tipo “Or Book Individually” con tarjetas de actividades con precios ($120, $205+, etc.).
- [ ] **3.2.2** Si aún existe, eliminarla. La página debe mostrar únicamente:
  - Combo: 2 actividades, 1h cada una, $100 USD/persona, CTA a reservar.
  - Crazy Combo: 3 actividades, 1h cada una, $125 USD/persona, CTA a reservar.
  - Bloque de yates/masajes por WhatsApp (mantener).
- [ ] **3.2.3** Cualquier enlace “View Details” a una actividad individual puede mantenerse solo como información (sin precio individual ni “Book This Activity”), o eliminarse si se prefiere no destacar venta individual.

### 3.3 Criterios de aceptación

- En Home y en /activities no se venden actividades individuales con precio.
- Solo se ofrecen Combo $100 y Crazy Combo $125 (y nota yates/masajes).
- Build en verde.

---

## Paso 4: Precios alineados con classviptransfers.com

**Objetivo:** Los precios mostrados y usados en el sitio deben coincidir con los de la página de referencia (classviptransfers.com – Rates by zone / precios por zona).

### 4.1 Recopilar precios de referencia

- [ ] **4.1.1** Revisar classviptransfers.com (Rates by zone o equivalente) y anotar precios por zona/área: one way y round trip (y vehículo si aplica: SUV, Sprinter).
- [ ] **4.1.2** Crear una tabla o CSV con: zona/área, one way (USD), round trip (USD), y tipo de vehículo si aplica.

### 4.2 Actualizar backend / datos

- [ ] **4.2.1** En el backend (seed, BD o panel de Pricing), actualizar **áreas** (zonas) con los precios correctos: `oneWayPriceCents`, `roundTripPriceCents` según la referencia.
- [ ] **4.2.2** Si hay reglas de precios por ruta/vehículo (PricingRule), alinearlas con la misma fuente.
- [ ] **4.2.3** Ejecutar seed o migración y comprobar en Admin → Pricing que los valores coinciden con classviptransfers.com.

### 4.3 Frontend

- [ ] **4.3.1** Verificar que el flujo de reserva (/book) use siempre los precios por área que vienen del backend (no precios hardcodeados en el front).
- [ ] **4.3.2** Revisar página de Transfers (si existe) y cualquier tabla de precios para que muestre los mismos números que la referencia.

### 4.4 Criterios de aceptación

- Precios por zona/área coinciden con classviptransfers.com.
- El total del transfer en /book se calcula con esos precios.
- Build en verde.

---

## Paso 5: Hoteles completos y organizados por áreas (como classviptransfers.com)

**Objetivo:** Tener todos los hoteles que aparecen en classviptransfers.com, organizados por áreas; primero el usuario elige área, luego hotel.

### 5.1 Estructura de datos

- [ ] **5.1.1** En classviptransfers.com, listar las **áreas** (zonas) que usan y, por cada área, la lista de hoteles.
- [ ] **5.1.2** En el backend (seed o BD), asegurar que exista una tabla o estructura: Área (nombre, id) y Hoteles (nombre, areaId o zona). Incluir todos los hoteles de la referencia.
- [ ] **5.1.3** Actualizar seed (o script de importación) con la lista completa de hoteles por área.

### 5.2 Flujo en /book

- [ ] **5.2.1** En el paso “Hotel” (o “Ruta y Hotel”), el flujo debe ser: primero **selección de área** (dropdown o cards por zona), luego **selección de hotel** dentro de esa área (dropdown o lista filtrada).
- [ ] **5.2.2** Cargar hoteles desde el backend filtrados por área (ej. `GET /api/pricing/hotels?zone=San Jose del Cabo` o equivalente).
- [ ] **5.2.3** No mostrar un único listado plano de todos los hoteles; mantener la agrupación por área para que coincida con classviptransfers.com.

### 5.3 UI

- [ ] **5.3.1** Mostrar las áreas con nombres consistentes con la referencia (ej. “San Jose del Cabo”, “Cabo San Lucas”, “Tourist Corridor”, etc.).
- [ ] **5.3.2** Tras elegir área, mostrar solo los hoteles de esa área (y opción de buscar por nombre si la lista es larga).

### 5.4 Criterios de aceptación

- Todas las áreas y hoteles de classviptransfers.com están representados.
- En /book se elige primero área, luego hotel.
- Build en verde.

---

## Paso 6: Organización y aspecto profesional (portafolio / Upwork)

**Objetivo:** Que el sitio esté bien organizado y se vea muy profesional para usarlo en portafolio y en Upwork como programador full stack con agentes de IA.

### 6.1 Estructura y navegación

- [ ] **6.1.1** Revisar el menú y las rutas: nombres claros (Transfers, Activities, Book, Contact, etc.), sin páginas huérfanas o duplicadas.
- [ ] **6.1.2** Asegurar que el flujo principal (Home → Book o Activities → Checkout) sea obvio y sin pasos redundantes.
- [ ] **6.1.3** Revisar footer y enlaces internos: que no apunten a shuttle ni a ofertas que ya no existan.

### 6.2 Diseño y consistencia

- [ ] **6.2.1** Revisar tipografía, espaciado y jerarquía en las páginas principales (Home, Book, Activities, Transfers, Contact).
- [ ] **6.2.2** Unificar paleta (navy, gold, fondos) y componentes (botones, cards, inputs) para que se vean coherentes en todo el sitio.
- [ ] **6.2.3** Revisar responsive en móvil y tablet: botones y formularios usables, texto legible, ChatWidget visible pero no molesto.

### 6.3 Contenido y mensajes

- [ ] **6.3.1** Revisar textos en español e inglés: que no mencionen shuttle ni venta individual de actividades donde ya no aplique.
- [ ] **6.3.2** CTAs claros (“Reservar”, “Book now”, “Elegir combo”) y mensajes de error o validación comprensibles.

### 6.4 ChatWidget y “agente IA”

- [ ] **6.4.1** Que el chat se presente como “Asistente de reservas” o similar, con diseño navy/gold y animación ya implementada.
- [ ] **6.4.2** Cuando estén listos los formularios del Paso 1, que el chat sea el punto destacado para “reservar con pocos clics” (útil para portafolio).

### 6.5 Criterios de aceptación

- Navegación clara y sin opciones obsoletas.
- Diseño consistente y profesional en todas las páginas.
- Sitio listo para mostrarse como proyecto de portafolio (full stack + IA).

---

## Orden sugerido de implementación

| Orden | Paso | Motivo |
|-------|------|--------|
| 1 | Paso 2 – Quitar Shuttle en Home | Rápido, evita confusión. |
| 2 | Paso 3 – Actividades solo combos (Home + /activities) | Coherente con modelo de negocio. |
| 3 | Paso 5 – Hoteles por áreas | Base para precios y flujo correcto. |
| 4 | Paso 4 – Precios classviptransfers.com | Depende de áreas/hoteles. |
| 5 | Paso 6 – Organización y profesional | Mejora continua. |
| 6 | Paso 1 – Chat con formularios | Más complejo; mejor con flujo y precios ya definidos. |

---

## Prompt resumido para Cursor (opcional)

```
Proyecto: los-cabos-luxe-transfers

Sigue el plan en PLAN_NUEVAS_IMPLEMENTACIONES.md por este orden:

1. Home: quitar toda opción de Shuttle; solo transfer privado.
2. Home y /activities: quitar venta individual de actividades; solo ofrecer Combo $100 (2 actividades) y Crazy Combo $125 (3 actividades). En Home eliminar el grid de actividades con precios individuales ($120, $205+, etc.).
3. Hoteles: organizar por áreas como en classviptransfers.com; en /book primero elegir área, luego hotel. Incluir todos los hoteles de esa página.
4. Precios: alinear zonas/áreas y precios (one way, round trip) con classviptransfers.com (Rates by zone).
5. Diseño y navegación: revisar que todo esté organizado y se vea profesional para portafolio/Upwork.
6. Chat (IA): añadir formularios/botones en el chat para que el usuario pueda reservar con clics (pasajeros, fecha, área, etc.) y cerrar venta desde el chat.

Referencia: classviptransfers.com para precios, áreas y hoteles.
Build en verde al terminar cada bloque.
```

---

## Notas

- **classviptransfers.com:** Usar como fuente única de verdad para precios por zona, lista de áreas y lista de hoteles por área.
- **Backend:** Mantener compatibilidad con reservas existentes; nuevos precios/hoteles aplican a reservas nuevas.
- **i18n:** Actualizar traducciones (EN/ES) donde se elimine shuttle o venta individual de actividades.
