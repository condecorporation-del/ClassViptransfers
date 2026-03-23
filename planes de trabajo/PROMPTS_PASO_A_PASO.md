# Prompts paso a paso – Plan nuevas implementaciones

**Proyecto:** los-cabos-luxe-transfers  
**Plan de referencia:** `PLAN_NUEVAS_IMPLEMENTACIONES.md`  

Usa estos prompts **en orden**. Copia y pega uno, ejecuta en Cursor, verifica que el build pase y que se cumpla el criterio; luego pasa al siguiente.

---

## Cómo usar

1. Abre Cursor en el proyecto.
2. Copia el **Prompt** del paso que toque.
3. Pégalo en el chat y ejecuta.
4. Revisa la **Verificación** y el build.
5. Sigue con el siguiente paso.

Si un paso ya está hecho (por una sesión anterior), el agente puede indicarlo y pasar a comprobar/ajustar.

---

## Paso 1 – Home: quitar Shuttle

**Objetivo:** En la página de inicio no debe aparecer Shuttle; solo transfer privado.

**Prompt:**

```
Proyecto los-cabos-luxe-transfers. Plan: PLAN_NUEVAS_IMPLEMENTACIONES.md — Paso 2 (Home, quitar Shuttle).

En src/pages/Index.tsx: elimina por completo el bloque/card de "Shuttle" en la sección de transfers. Deja solo la opción "Private" / "Privado". Ajusta el layout (por ejemplo una sola card centrada con max-w-xl). Revisa que en hero/subtitle y en i18n no quede "shuttle" (cambiar a "Private luxury transfers" / "Transfers privados de lujo" donde corresponda). Ejecuta build y deja el front en verde.
```

**Verificación:** En Home solo se ve transfer privado; no hay opción Shuttle. `npm run build` pasa.

---

## Paso 2 – Home y /activities: solo combos (sin venta individual)

**Objetivo:** En Home quitar el grid de actividades con precios individuales. En /activities solo Combo $100 y Crazy Combo $125 (+ yates/masajes).

**Prompt:**

```
Proyecto los-cabos-luxe-transfers. Plan: PLAN_NUEVAS_IMPLEMENTACIONES.md — Paso 3 (Actividades solo combos).

1) En src/pages/Index.tsx: elimina el array "activities" y el grid que muestra actividades individuales con precios (Camel Ride $120, Horseback, ATV, RZR $205+, Sunset, Fishing, etc.). Deja solo las dos cards de Combo ($100, 2 actividades) y Crazy Combo ($125, 3 actividades) con enlaces a /book-activities. Quita imports no usados (ej. Clock si ya no se usa).

2) En src/pages/Activities.tsx: asegura que no exista la sección "Or Book Individually" ni tarjetas con precios por actividad. Solo deben verse: Combo $100, Crazy Combo $125 y el bloque de yates/masajes por WhatsApp.

Build en verde al terminar.
```

**Verificación:** En Home y en /activities no hay venta individual; solo Combo y Crazy Combo. Build OK.

---

## Paso 3 – Hoteles: primero área, luego hotel

**Objetivo:** En /book, paso Hotel: primero elegir área (zona), luego hotel dentro de esa área.

**Prompt:**

```
Proyecto los-cabos-luxe-transfers. Plan: PLAN_NUEVAS_IMPLEMENTACIONES.md — Paso 5 (Hoteles por áreas).

En el paso "hotel" de src/pages/Book.tsx: implementa flujo "primero área, luego hotel".

1) Añade estado selectedZoneForHotel (string | null). Cuando es null, muestra un paso "1. Elige el área" con botones/cards por cada zona (usar zonas que vengan de areas o de hotels por zone). Cada zona debe mostrar el número de hoteles (ej. "San Jose del Cabo · 12 hoteles").

2) Al elegir un área, set selectedZoneForHotel(zone) y muestra "2. Elige hotel en [zona]" con la lista de hoteles filtrada por esa zona, más el input de búsqueda. Incluye botón "Cambiar área" que vuelve a poner selectedZoneForHotel en null.

3) Mantén la lógica actual de selectHotel (pickup/dropoff, areaId) al elegir un hotel. Asegura que zonesOrdered use areas si existen, si no las zonas únicas de hotels.

Build en verde.
```

**Verificación:** En /book, al elegir ruta se ve primero la lista de áreas; al elegir área se ve solo hoteles de esa zona. Build OK.

---

## Paso 4 – Seed: más hoteles y comentario de precios

**Objetivo:** Ampliar lista de hoteles por zona en el seed y dejar comentario para alinear precios con classviptransfers.com.

**Prompt:**

```
Proyecto los-cabos-luxe-transfers. Plan: PLAN_NUEVAS_IMPLEMENTACIONES.md — Pasos 4 y 5 (datos).

En backend/prisma/seed.ts:

1) En HOTELS_BY_ZONE, añade más hoteles por zona (San Jose del Cabo, Port Los Cabos, Tourist Corridor, Cabo San Lucas, Cabo Pacific Area, Pacific & East Cape) para acercar la lista a classviptransfers.com. Mantén el mismo formato: array de nombres por zona.

2) Añade un comentario junto a PRICES_ONE_WAY (o DEFAULT_AREAS) indicando que los precios deben verificarse/actualizarse desde classviptransfers.com (Rates by zone). No cambies los números salvo que tengas la referencia a mano.

Ejecuta build del backend (npm run build en backend/). No hace falta correr el seed en esta tarea.
```

**Verificación:** Seed tiene más hoteles por zona y comentario de precios. Backend build OK.

---

## Paso 5 – Transfers y textos: quitar Shuttle

**Objetivo:** En la página Transfers y en traducciones no debe ofrecerse Shuttle.

**Prompt:**

```
Proyecto los-cabos-luxe-transfers. Plan: PLAN_NUEVAS_IMPLEMENTACIONES.md — Presentación (Paso 6).

1) En src/pages/Transfers.tsx: elimina la card/sección de "Shuttle" o "Shared Shuttle". Deja solo la card de transfer privado (puedes centrarla con max-w-xl). Quita el import Users si solo se usaba para Shuttle.

2) En src/i18n/translations.ts: donde diga "Private & shuttle" o "Transfers privados y compartidos" en hero.subtitle o transfers.cta.subtitle, cámbialo a "Private luxury transfers" / "Transfers privados de lujo". No borres las claves de shuttle por si se usan en otro sitio; solo ajusta los textos que ve el usuario en Home y Transfers.

Build en verde.
```

**Verificación:** En /transfers solo se ve transfer privado. Hero y CTAs sin "shuttle". Build OK.

---

## Paso 6 – Chat: botones para reservar con clics

**Objetivo:** Mostrar en el chat botones rápidos (pasajeros, tipo de viaje) cuando el backend indique que faltan esos datos.

**Prompt:**

```
Proyecto los-cabos-luxe-transfers. Plan: PLAN_NUEVAS_IMPLEMENTACIONES.md — Paso 1 (Chat formularios).

En src/components/ChatWidget.tsx:

1) Añade estado lastMissingFields: string[] (inicial []). Cuando la API de chat responda con data.success, haz setLastMissingFields(data.data.missingFields || []).

2) Encima del formulario de input (y solo si !isLoading y lastMissingFields.length > 0), muestra una sección "Quick replies" con:
   - Si lastMissingFields incluye "passengers": una fila de botones 1, 2, 3, 4, 5+. Al hacer clic en uno, enviar ese número como mensaje (sendMessage(String(n)) o sendMessage('5+')).
   - Si lastMissingFields incluye "intent": botones "Solo ida" / "One way" e "Ida y vuelta" / "Round trip" (usar lang para el texto). Al clic, sendMessage con ese texto.

3) Estilo: botones discretos (ej. bg-gold/15, border-gold/30) y etiquetas "Pasajeros" / "Trip type" según idioma.

No modifiques el backend en este paso. Build en verde.
```

**Verificación:** Tras una respuesta del bot que pida pasajeros o tipo de viaje, aparecen los botones; al clicar se envía el valor. Build OK.

---

## Paso 7 – Revisión final y build

**Objetivo:** Comprobar que todo compila y que el flujo es correcto.

**Prompt:**

```
Proyecto los-cabos-luxe-transfers. Revisión final según PLAN_NUEVAS_IMPLEMENTACIONES.md.

1) Ejecuta npm run build en la raíz (frontend) y npm run build en backend/. Deben pasar sin errores.

2) Comprueba de forma rápida: en Home no hay Shuttle ni grid de actividades con precios individuales; en /activities solo Combo y Crazy Combo; en /book el paso hotel pide primero área y luego hotel; en /transfers solo transfer privado; en el Chat hay botones de quick reply cuando el bot pide pasajeros o tipo de viaje.

3) Si algo no cumple, corrígelo y deja un resumen breve de lo que ajustaste.
```

**Verificación:** Frontend y backend build OK. Flujos revisados.

---

## Resumen de orden

| Orden | Paso | Archivo(s) principal |
|-------|------|----------------------|
| 1 | Home: quitar Shuttle | Index.tsx, i18n |
| 2 | Home + Activities: solo combos | Index.tsx, Activities.tsx |
| 3 | Book: área → hotel | Book.tsx |
| 4 | Seed: hoteles y precios | backend/prisma/seed.ts |
| 5 | Transfers + textos sin shuttle | Transfers.tsx, i18n |
| 6 | Chat: quick reply buttons | ChatWidget.tsx |
| 7 | Revisión final y build | — |

Cuando termines los 7 pasos, el plan de nuevas implementaciones quedará aplicado y listo para revisar precios/hoteles en classviptransfers.com y ajustar el seed si hace falta.
