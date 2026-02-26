# Brief: Class VIP Transfers / Los Cabos Luxe Transfers

**Propósito:** Este documento es para que otro agente (ej. Cloud Sonnet, ChatGPT) ayude a ordenar ideas y redactar instrucciones claras para Cursor. El objetivo es construir la página de transportación de transfer #1 en el mercado, innovadora y futurista.

**Última actualización:** Estado actual del proyecto para saber en qué puntos vamos.

---

## ESTADO ACTUAL — PRÓXIMOS PASOS (checkmarks = hecho o funcionando)

| # | Paso | Estado | Notas |
|---|------|--------|-------|
| 1 | Endpoint público de pricing | ✅ | `GET /api/pricing/rules`, `/zones`, `/hotels`, `POST /api/pricing/quote` |
| 2 | Tabulador dinámico en /transfers | ✅ | Tabla dinámica desde BD, zonas origen/destino, vehículos |
| 3 | Integrar pricing real en reservas (/book) | ✅ | Cotización en vivo por zonas/vehículo/extras, backend recalcula |
| 4 | Pulir dashboard admin | ⚠️ Parcial | Métricas, tabla bookings, "Mark as paid". **Problema: login admin no funciona** (pestaña login, no pasa nada) |
| 5 | Mejorar AI assistant | 🔲 Pendiente | Chat existe, falta pulir y diferenciar |
| 6 | UX polish final | 🔲 Pendiente | Animaciones, micro-interacciones, mobile-first |

**Problemas conocidos a resolver:**
- **Admin login**: Se ingresa correo y contraseña en /admin/login y no pasa nada (no redirige, no muestra error).
- **Correos**: Resend configurado con logs. Sandbox solo envía al email de la cuenta Resend; para otros destinatarios hay que verificar dominio.

---

## 1. CONTEXTO DEL PROYECTO

- **Producto:** Servicio de transportación de lujo en Los Cabos (transfers privados, shuttle, actividades)
- **Referencia actual:** https://classviptransfers.com — el usuario quiere replicar/mejorar esa experiencia
- **Objetivo:** Ser la página de transportación #1, super innovadora y futurista

---

## 2. STACK TECNOLÓGICO

| Capa | Tecnología |
|------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind, Framer Motion, Shadcn UI |
| Backend | Node.js, Express, TypeScript |
| Base de datos | PostgreSQL (Supabase) |
| ORM | Prisma |
| Pagos | PayPal (sandbox/producción) |
| Emails | Resend |
| AI | OpenAI (para chat/cotizador) |

---

## 3. ESTRUCTURA DEL PROYECTO

```
los-cabos-luxe-transfers/
├── backend/           # API Express
│   ├── src/
│   │   ├── controllers/   # Lógica de endpoints
│   │   ├── services/      # Email, PayPal, Booking, Pricing, AI
│   │   ├── routes/        # Rutas API
│   │   ├── middleware/    # Auth, validation
│   │   └── templates/     # Emails HTML (Handlebars)
│   └── prisma/
│       ├── schema.prisma  # Modelos de datos
│       └── seed.ts        # Datos iniciales
│
└── src/               # Frontend React
    ├── pages/         # Transfers, Book, Checkout, Admin, etc.
    ├── components/    # UI reutilizable
    ├── hooks/         # usePricing, useAdminAuth
    └── contexts/      # Language (i18n)
```

---

## 4. URLs Y RUTAS PRINCIPALES

| Ruta | Qué hace |
|------|----------|
| `/` | Home |
| `/transfers` | Página de transferencias (precios, info) |
| `/book` | Wizard de reserva (transporte) |
| `/book-activities` | Reserva de actividades |
| `/checkout` | Pago PayPal |
| `/admin` | Dashboard admin (bookings, pricing, drivers) |
| `/admin/login` | Login admin |

**Backend:** `http://localhost:3001`  
**Frontend:** `http://localhost:5173`

---

## 5. LO QUE YA ESTÁ IMPLEMENTADO

### Backend
- ✅ Bookings (crear, listar, confirmar, cancelar)
- ✅ PayPal integración (crear orden, webhook, captura)
- ✅ Emails premium con Handlebars (customer + company), logs detallados, EmailLog en BD
- ✅ Admin auth (JWT, cookies) — credenciales: condecorporation@gmail.com / 1234 (⚠️ login no responde)
- ✅ **Pricing configurable:**
  - Tabla `PricingRule` (zoneFrom, zoneTo, vehicleClass, basePriceCents, tripType)
  - Tabla `PricingExtra` (GROCERY_STOP, BABY_SEAT, INCLUDED_BASIC_KIT, etc.)
  - Endpoints públicos: `GET /api/pricing/rules`, `/zones`, `/hotels`, `POST /api/pricing/quote`
  - Admin: `/admin` → tab "Pricing" para CRUD reglas y extras
- ✅ AI chat para cotización (OpenAI)
- ✅ Seed con reglas de ejemplo (SJD → Cabo San Lucas, etc.)
- ✅ Dashboard admin: `GET /api/admin/dashboard` (totalToday, revenueToday, bookingsRecent, etc.)
- ✅ `POST /api/admin/bookings/:id/confirm` para "Mark as paid offline"

### Frontend
- ✅ Página Transfers con tabulador dinámico (datos desde API)
- ✅ Página Book (wizard de reserva con cotización en vivo)
- ✅ Checkout con PayPal
- ✅ Admin con tab Pricing (CRUD rules y extras)
- ✅ Admin dashboard con métricas, tabla bookings recientes, botón "Mark as paid"
- ✅ Admin tab Bookings (lista por fecha, detalle con Email log)
- ✅ i18n (en/es)

---

## 6. LO QUE FALTA O TIENE PROBLEMAS

### Urgente (arreglar)
1. **Admin login no funciona**  
   - Al ingresar condecorporation@gmail.com y 1234 en /admin/login no pasa nada  
   - Revisar: `src/pages/AdminLogin.tsx`, `backend/src/controllers/auth.controller.ts`  
   - Verificar CORS, cookies, proxy (getApiBaseUrl en dev puede ser '' para proxy)  

2. **Correos no llegan** (si aplica)  
   - Resend sandbox: `onboarding@resend.dev` solo envía al email de la cuenta Resend  
   - Para Gmail/otros: verificar dominio en resend.com/domains  
   - Logs `[Email]` en consola backend muestran respuesta de Resend  

### Pendiente (mejoras)
3. **UX premium**  
   - Animaciones suaves, micro-interacciones  
   - Diseño “concierge” / luxury  
   - Feedback visual al cotizar (skeleton, transiciones)  

4. **Sugerencias inteligentes (upsells)**  
   - Si no eligió grocery stop → sugerirlo  
   - Si round-trip → sugerir actividades  
   - Si activity-only → sugerir transfer  

5. **Experiencia móvil-first**  
   - Tabulador responsive  
   - Botón WhatsApp visible  
   - Formularios optimizados para touch  

6. **Trust & transparencia**  
   - Mostrar policy de cancelación  
   - Incluidos claros (Meet & Greet, agua, etc.)  
   - Testimonios o badges  

---

## 7. CÓMO COMUNICARSE CON CURSOR

### Buenas prácticas
- **Ser específico:** En lugar de "arregla los precios", decir: "En la página Transfers, reemplaza los precios hardcodeados por una tabla que consulte GET /api/admin/pricing/rules (o un endpoint público de solo lectura) y muestre precios por zona origen, zona destino y vehículo."
- **Mencionar archivos:** "En `src/pages/Transfers.tsx`..." o "En `backend/src/services/pricing.service.ts`..."
- **Objetivo claro:** "Quiero que el usuario vea un tabulador de precios por áreas, igual que en classviptransfers.com, pero con datos del admin."
- **Restricciones:** "No modificar el flujo de PayPal", "No hacer commits", "Solo entorno local", etc.

### Formato sugerido para pedidos
```
OBJETIVO: [qué quieres lograr]
ARCHIVOS: [qué archivos tocar]
DETALLES: [comportamiento esperado]
NO: [qué no hacer]
```

### Ejemplo bien redactado
```
OBJETIVO: Mostrar tabulador de precios por zonas en /transfers
ARCHIVOS: src/pages/Transfers.tsx, posiblemente nuevo componente PriceTable
DETALLES: 
- Crear sección "Precios por zona" con tabla: filas = zonas origen, columnas = zonas destino
- Celdas = precio para SUV (one-way). Si hay más vehículos, usar tabs o dropdown
- Datos desde backend (endpoint público GET /api/pricing/zones o usar /api/pricing/quote con combinaciones)
- Diseño premium, responsive
NO: No tocar PayPal ni checkout
```

---

## 8. ENDPOINTS RELEVANTES

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/pricing/quote` | Cotización en tiempo real (body: tripType, zoneFrom, zoneTo, vehicleClass, extras) |
| GET | `/api/admin/pricing/rules` | Lista reglas (requiere auth admin) |
| POST | `/api/admin/pricing/rules` | Crear regla |
| PUT | `/api/admin/pricing/rules/:id` | Actualizar regla |
| GET | `/api/admin/pricing/extras` | Lista extras |
| POST | `/api/bookings` | Crear booking (puede incluir pricingData para transport) |
| GET | `/api/bookings/:id` | Obtener booking |

**Nota:** Para que el frontend público muestre precios sin auth, hace falta un endpoint como `GET /api/pricing/rules` o `GET /api/pricing/table` que devuelva solo reglas activas (sin datos sensibles). Actualmente las reglas solo se obtienen desde admin.

---

## 9. MODELO DE PRICING (Prisma)

```
PricingRule:
  - zoneFrom, zoneTo (ej: "SJD", "Cabo San Lucas")
  - vehicleClass (SUV, SUBURBAN, SPRINTER, VAN, SEDAN, LUXURY)
  - tripType (ONE_WAY, ROUND_TRIP)
  - basePriceCents (precio en centavos)
  - passengersMin, passengersMax (opcional)

PricingExtra:
  - code (GROCERY_STOP, BABY_SEAT, etc.)
  - label, priceCents, pricingMode (PER_BOOKING, PER_STOP, PER_SEAT)
```

---

## 10. VISION: PÁGINA #1 INNOVADORA

- **Claridad:** El usuario ve en segundos cuánto cuesta su transfer (tabulador + cotizador)
- **Confianza:** Diseño premium, políticas claras, contacto fácil
- **Velocidad:** Cotización en tiempo real, checkout en pocos pasos
- **Diferenciación:** AI assistant, upsells inteligentes, UX "concierge"
- **Datos:** Todo configurable desde admin, sin tocar código para cambiar precios

---

## RESUMEN PARA EL AGENTE QUE AYUDA A REDACTAR

Cuando el usuario te pida ayuda para escribir instrucciones para Cursor:

1. Pregúntale qué quiere lograr exactamente (ej: "ver precios por zonas", "cotizador en tiempo real").
2. Usa este brief para saber qué existe y qué falta.
3. Redacta el pedido en formato claro: OBJETIVO, ARCHIVOS, DETALLES, NO.
4. Menciona rutas, componentes y endpoints concretos cuando sea posible.
5. Si no está seguro, sugiere crear un endpoint público de solo lectura para precios (ej: `GET /api/pricing/table`) para que el frontend muestre el tabulador sin auth.
