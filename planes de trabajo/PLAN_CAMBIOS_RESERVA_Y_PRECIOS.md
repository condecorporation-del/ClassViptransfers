# Plan de cambios – Proceso de reserva, precios y simplificación

**Proyecto:** los-cabos-luxe-transfers  
**Fecha:** 2026-02-28  
**Fuente de precios:** classviptransfers.com (sección "Rates by zone")

---

## Resumen ejecutivo

| Área | Cambio principal |
|------|------------------|
| Servicios | Solo privado; eliminar shuttle |
| Flujo Book | Trip → Hotel/Zona → Fecha → Ubicaciones; precios por zona |
| Extras | Eliminar: extra stop, wait time, late night, early morning, special assistance |
| Arrival upgrades | Solo 5 opciones: Champagne 40, Moet 80, Birthday 100, Romantic 100, Deluxe 130 |
| Actividades | Solo combos (2=$100, 3=$125); duración 1h; nota yates/masajes por WhatsApp |
| Pick up time | Mínimo 3h antes del vuelo; cliente editable |
| Quick fills | SJD Airport en pickup (llegada) y dropoff (salida) |
| Checkout | Validación con sección concreta en error |
| Admin | Solo Bookings + Pricing + Preview email |
| ChatWidget | Más profesional y llamativo |

---

## Fase 1: Servicios y flujo de reserva

### 1.1 Solo servicios privados – eliminar shuttle

| Tarea | Archivo | Descripción |
|-------|---------|-------------|
| 1.1.1 | `Book.tsx` | Quitar paso "service" o simplificar: solo private, pre-seleccionado |
| 1.1.2 | `Book.tsx` | Eliminar opción shuttle en UI; `serviceType` fijo a `'private'` |
| 1.1.3 | `Book.tsx` | Quitar referencias a shuttle en extras, paidExtras, upsellKits |
| 1.1.4 | Backend/types | Ajustar schemas si validan shuttle (opcional) |

**Nuevo flujo de pasos sugerido:**  
`trip` → `hotel` → `date` → `locations` → `extras` → `upsell` → `review`

---

### 1.2 Nuevo orden del proceso: Trip → Hotel → Fecha → Ubicaciones

| Tarea | Descripción |
|-------|-------------|
| 1.2.1 | **Paso 1 – Trip:** One way / Round trip |
| 1.2.2 | **Paso 2 – Hotel/Zona:** Selección de hotel o zona; de aquí sale el costo (Rates by zone) |
| 1.2.3 | **Paso 3 – Date:** Fechas, vuelos, horarios |
| 1.2.4 | **Paso 4 – Locations:** Pickup/Dropoff con quick fills |

**Precios por zona:**  
- Fuente: classviptransfers.com → Rates by zone  
- Modernizar y automatizar  
- Zonas y hoteles actuales + precios de la página  

---

### 1.3 Departure time + Pick up time

| Tarea | Descripción |
|-------|-------------|
| 1.3.1 | En roundtrip: "Departure time" (hora del vuelo) + "Pick up time" (hora de recogida) |
| 1.3.2 | Pick up time mínimo 3h antes del vuelo; cliente puede modificar si cumple regla |
| 1.3.3 | Validación: pick up time ≥ departure flight time − 3h |
| 1.3.4 | Sugerencia por defecto: 3h antes del vuelo |

---

### 1.4 Quick fill – SJD Airport

| Tarea | Descripción |
|-------|-------------|
| 1.4.1 | **Llegada (airport → hotel):** Pickup = SJD Airport; botón "SJD Airport" en pickup |
| 1.4.2 | **Salida (hotel → airport):** Pickup = hotel; Dropoff = SJD Airport; botón "SJD Airport" en dropoff |
| 1.4.3 | Ubicación: junto a los campos pickup/dropoff |

---

## Fase 2: Extras y arrival upgrades

### 2.1 Extras a eliminar

| Código | Acción |
|--------|--------|
| `EXTRA_STOP` | Eliminar de UI y seed (opcional: desactivar en BD) |
| `WAIT_TIME` | Eliminar |
| `LATE_NIGHT` | Eliminar |
| `EARLY_MORNING` | Eliminar |
| `SPECIAL_ASSISTANCE` | Eliminar |

**Extras que se mantienen (referencia):** Baby Seat, Booster, Oversize, Grocery Stop (a confirmar según decisión final).

---

### 2.2 Arrival upgrades – solo 5 opciones

| Producto | Precio | Descripción |
|----------|--------|-------------|
| **Champagne** | $40 USD | Champagne normal |
| **Champagne Moet** | $80 USD | Champagne Moet |
| **Birthday kit** | $100 USD | Champagne $40 + globos decorativos + tabla de quesos o pastel pequeño |
| **Romantic kit** | $100 USD | Champagne normal + tabla de quesos + 12 rosas |
| **Deluxe arrival** | $130 USD | Birthday o aniversario con Champagne Moet |

| Tarea | Archivo | Descripción |
|-------|---------|-------------|
| 2.2.1 | `prisma/seed.ts` | Crear/actualizar extras con estos códigos y precios |
| 2.2.2 | `Book.tsx` | Mostrar solo estos 5 kits en la sección de upgrades |
| 2.2.3 | Backend | Asegurar que PricingExtra incluya estos códigos |

---

## Fase 3: Actividades

### 3.1 Solo combos – sin venta individual

| Producto | Precio | Incluye |
|----------|--------|---------|
| **Crazy Combo** | $125 USD/persona | 3 actividades, 1h cada una |
| **Combo** | $100 USD/persona | 2 actividades, 1h cada una |

| Tarea | Archivo | Descripción |
|-------|---------|-------------|
| 3.1.1 | `BookActivities.tsx` | Eliminar venta individual; solo Combo y Crazy Combo |
| 3.1.2 | `Book.tsx` (upsell) | Solo combos 100 y 125; quitar modo individual |
| 3.1.3 | Duración | Todas las actividades en combo = 1h |
| 3.1.4 | Restricciones | Mantener reglas actuales (park entrance $25, etc.) |

---

### 3.2 Nota: Yates y masajes por WhatsApp

| Tarea | Descripción |
|-------|-------------|
| 3.2.1 | Añadir texto: "Yates privados y masajes a domicilio en villas – reserva directa por WhatsApp" |
| 3.2.2 | Enlace o botón a WhatsApp |

---

## Fase 4: Validación y checkout

### 4.1 Mensajes de error en checkout

| Tarea | Descripción |
|-------|-------------|
| 4.1.1 | Si falta algo: mensaje claro, p.ej. "Falta completar la sección: Fecha y vuelos" |
| 4.1.2 | Identificar qué paso/section tiene errores |
| 4.1.3 | Opción: enlace/botón para ir a ese paso |
| 4.1.4 | Deshabilitar "Checkout" o "Continuar al pago" hasta que todo esté válido |

---

## Fase 5: Admin dashboard

### 5.1 Simplificar admin

**Mantener:**

| Sección | Descripción |
|---------|-------------|
| **Bookings** | Listado de reservas ordenado por fecha; búsqueda por fecha |
| **Detalle booking** | Cliente, hora llegada, info vuelo, etc. (para cambios si el cliente contacta) |
| **Pricing** | Precio por área (zonas), precios de extras, precios de actividades |
| **Preview email** | Vista previa de emails (para mejoras futuras) |

**Eliminar:**

| Sección | Acción |
|---------|--------|
| Zones | Quitar del sidebar y UI |
| Places | Quitar |
| Extras (como gestión separada) | Integrar en Pricing o quitar si ya está en Pricing |
| Dashboard estadísticas (si no se usan) | A confirmar |

---

### 5.2 Vista Bookings

| Campo | Descripción |
|-------|-------------|
| Fecha | Fecha de la reserva |
| Cliente | Nombre |
| Arrival time | Hora de llegada |
| Información de vuelo | Número de vuelo, etc. |
| Servicio / zona | Para identificar y hacer cambios |
| Total | Monto total |

---

## Fase 6: ChatWidget (IA)

### 6.1 Diseño más profesional

| Tarea | Descripción |
|-------|-------------|
| 6.1.1 | Ajustar estilos: colores, bordes, sombras |
| 6.1.2 | Posición y tamaño más visibles |
| 6.1.3 | Animación suave al abrir/cerrar |
| 6.1.4 | Icono y branding más claros |

---

## Orden sugerido de implementación

| Fase | Prioridad | Complejidad |
|------|-----------|-------------|
| 1.1 Solo privado | Alta | Baja |
| 1.2 Nuevo flujo (trip → hotel → date → locations) | Alta | Alta |
| 1.3 Pick up time | Alta | Media |
| 1.4 Quick fill SJD | Media | Baja |
| 2.1 Eliminar extras | Alta | Media |
| 2.2 Arrival upgrades | Alta | Media |
| 3.1 Solo combos actividades | Alta | Media |
| 3.2 Nota yates/masajes | Baja | Baja |
| 4.1 Validación checkout | Alta | Media |
| 5 Admin simplificado | Media | Media |
| 6 ChatWidget | Baja | Baja |

---

## Datos necesarios para precios (Rates by zone)

Revisar classviptransfers.com → Rates by zone y preparar:

1. Lista de zonas con precios one way y round trip  
2. Relación zonas ↔ hoteles  
3. Precios por tipo de vehículo (SUV, Sprinter) si aplica  

Si no se puede scrapear la web, será necesario un documento (Excel/CSV) con zonas, hoteles y precios para importar o configurar manualmente.

---

## Prompt resumido para Cursor

```
Proyecto: los-cabos-luxe-transfers

Implementa los cambios del plan PLAN_CAMBIOS_RESERVA_Y_PRECIOS.md:

1. Eliminar shuttle – solo servicios privados.
2. Reordenar flujo: trip → hotel/zona → date → locations. Precios por zona (classviptransfers.com Rates by zone).
3. Roundtrip: departure time + pick up time (mínimo 3h antes del vuelo).
4. Quick fill: SJD Airport en pickup (llegada) y dropoff (salida).
5. Eliminar extras: EXTRA_STOP, WAIT_TIME, LATE_NIGHT, EARLY_MORNING, SPECIAL_ASSISTANCE.
6. Arrival upgrades: solo Champagne 40, Moet 80, Birthday 100, Romantic 100, Deluxe 130.
7. Actividades: solo Crazy Combo $125 (3) y Combo $100 (2), 1h cada una. Nota yates/masajes por WhatsApp.
8. Checkout: validación que indique la sección con error.
9. Admin: solo Bookings + Pricing + Preview email.
10. ChatWidget: diseño más profesional y llamativo.
```
