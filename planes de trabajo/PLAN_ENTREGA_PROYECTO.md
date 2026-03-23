# Plan de trabajo – Entrega del proyecto Los Cabos Luxe Transfers

**Fecha:** 2026-02-21  
**Estado:** El proyecto NO compila actualmente (SEO.tsx vacío). Varias funcionalidades fueron revertidas por undo.

---

## 🔴 Problemas detectados (build falla)

1. **`src/components/SEO.tsx`** – Archivo vacío. Gallery.tsx y Contact.tsx importan `SEO` → build falla con "SEO is not exported".

2. **`src/main.tsx`** – Falta `HelmetProvider` (Tarea 12 – meta tags dinámicos).

3. **`src/pages/Book.tsx`** – Falta:
   - Imports: SEO, JsonLd, AlertCircle, startOfDay
   - Tarea 14: validación de fechas y números de vuelo (dateStepErrors, validateDateStep, InputField con error, Next deshabilitado)
   - Tarea 13: BreadcrumbList JSON-LD

4. **`src/components/SchemaOrg.tsx`** – No existe (Tarea 13 – JSON-LD).

5. **`src/i18n/translations.ts`** – Faltan claves: `book.date.errorPast`, `book.date.errorDepartureBefore`, `book.date.errorFlightFormat`.

6. **Backend `validation.ts`** – Versión simplificada; faltan validaciones opcionales de fechas y formato de vuelo.

---

## 📋 Plan de trabajo (orden de ejecución)

### Fase A: Restaurar build mínimo (CRÍTICO)

| # | Tarea | Archivo | Descripción |
|---|-------|---------|-------------|
| A1 | Restaurar SEO.tsx | `src/components/SEO.tsx` | Componente que recibe title, description, opcionalmente image/url; usa Helmet para meta tags. |
| A2 | HelmetProvider en main | `src/main.tsx` | Envolver App con HelmetProvider de react-helmet-async. |

**Resultado esperado:** `npm run build` pasa.

---

### Fase B: Tarea 14 – Validación paso date (Book.tsx)

| # | Tarea | Archivo | Descripción |
|---|-------|---------|-------------|
| B1 | Imports y estado | Book.tsx | Añadir AlertCircle, startOfDay; dateStepErrors, validateDateStep, useEffect. |
| B2 | Traducciones | translations.ts | book.date.errorPast, errorDepartureBefore, errorFlightFormat (EN/ES). |
| B3 | InputField con error | Book.tsx | InputField acepta prop opcional error; muestra mensaje con AlertCircle. |
| B4 | UI paso date | Book.tsx | Errores en arrivalDate, departureDate, flightNumber; input departureFlightNumber en roundtrip; Next deshabilitado si hay errores. |

---

### Fase C: Tarea 13 – JSON-LD (opcional para entrega)

| # | Tarea | Archivo | Descripción |
|---|-------|---------|-------------|
| C1 | SchemaOrg.tsx | `src/components/SchemaOrg.tsx` | LocalBusiness, BreadcrumbList, Product, JsonLd. |
| C2 | Layout | Layout.tsx | LocalBusiness global via JsonLd. |
| C3 | Páginas | Index, Book, Activities, ActivityDetail | BreadcrumbList por ruta; Product en ActivityDetail. |

---

### Fase D: Backend opcional

| # | Tarea | Archivo | Descripción |
|---|-------|---------|-------------|
| D1 | Validación fechas | backend/src/lib/validation.ts | Refine: bookingDate no pasada; flightNumber/departureFlightNumber regex cuando no vacío. |

---

### Fase E: Entrega final

| # | Tarea | Descripción |
|---|-------|-------------|
| E1 | `npm run build` | Frontend y backend compilan OK. |
| E2 | Variables Render | BOOKING_PDF_SECRET, PAYPAL_WEBHOOK_ID documentadas. |
| E3 | Deploy | Netlify (frontend), Render (backend), Supabase (DB). |

---

## 📎 Prompt para Cursor (copiar y pegar)

```
Proyecto: los-cabos-luxe-transfers (React + Vite, backend Node/Express).

PROBLEMA: El build falla porque src/components/SEO.tsx está vacío y no exporta SEO. 
Varias tareas fueron revertidas por undo.

NECESITO que restaures el proyecto en este orden:

1. SEO.tsx: Crea el componente SEO que recibe props { title, description?, image?, url? } 
   y usa Helmet (react-helmet-async) para actualizar <title>, meta description, og:title, 
   og:description, og:image, og:url. Exporta SEO como named export.

2. main.tsx: Envuelve App con HelmetProvider de react-helmet-async.

3. Book.tsx - Tarea 14 (validación paso date):
   - Añadir imports: AlertCircle, startOfDay
   - dateStepErrors state, validateDateStep(), useEffect
   - Validar: arrivalDate no pasada; departureDate >= arrivalDate; flightNumber/departureFlightNumber 
     con regex /^[A-Za-z]{2,3}\s?\d{1,4}$/ (solo si no vacío)
   - InputField con prop error opcional (borde rojo, mensaje con AlertCircle)
   - Errores en arrival/departure date, flightNumber; input departureFlightNumber en roundtrip
   - Deshabilitar botón Next en paso date cuando hay errores

4. translations.ts: Añadir book.date.errorPast, book.date.errorDepartureBefore, book.date.errorFlightFormat (en/es)

5. Verificar: npm run build (frontend) y cd backend && npm run build (backend) deben pasar.

Ejecuta las tareas en orden. Si algo ya está hecho, omítelo.
```

---

## ✅ Checklist rápido antes de entregar

- [ ] `npm run build` pasa
- [ ] `cd backend && npm run build` pasa
- [ ] SEO.tsx exporta SEO correctamente
- [ ] HelmetProvider en main.tsx
- [ ] Validación paso date en Book.tsx funcionando
- [ ] Traducciones de errores en ES/EN
- [ ] Variables de producción documentadas (BOOKING_PDF_SECRET, PAYPAL_WEBHOOK_ID)
