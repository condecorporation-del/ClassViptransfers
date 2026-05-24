# WORKPLAN FINAL - Class VIP Transfers

## Objetivo

Dejar el proyecto listo para produccion con estas condiciones:

- Admin funcional sin errores `400`, `404`, `429` ni pantallas congeladas
- Frontend y backend compilando sin errores
- Sin codigo muerto critico ni piezas desconectadas del flujo real
- Seguridad endurecida para despliegue real
- SEO base correcto
- Riesgo operativo bajo al hacer `git push` y deploy

## Estado actual resumido

Hoy el proyecto esta cerca, pero no esta listo al 100% para decir "push y ya".
Los bloqueos reales mas importantes son:

1. El admin hace llamadas a `/api/admin/bookings` con `limit` mayores a `100`, pero el backend valida `limit <= 100`.
2. El admin hace demasiadas llamadas a `/api/admin/auth/me` porque varios componentes montan `useAdminAuth()` por separado.
3. Hay secretos reales en archivos `.env` locales. Eso es un riesgo grave de seguridad si tocaron git o si alguien los replica mal en produccion.
4. Varias vistas del admin silencian errores y aparentan estar vacias cuando en realidad la API fallo.
5. Hay ruido de encoding roto, SEO incompleto y pruebas backend inestables.

## Avance de ejecucion

### Corte actual - 2026-05-23

Ya se ejecutaron estos cambios reales sobre el codigo:

- Se centralizo la sesion del admin con `AdminAuthProvider` y cache compartido en `useAdminAuth`.
- Se dejo de rate-limitar todo `/api/admin/auth/*` desde `backend/src/app.ts`; el login sigue protegido por su propio limiter.
- Se corrigio el error de compilacion de `AlertCircle is not defined` en reservaciones.
- Se corrigio la augmentacion de tipos de Express para `adminEmail` y `adminRole`.
- Se movio `ensureAdminExists()` tambien al entrypoint serverless `api/index.ts`.
- Se subio temporalmente el maximo de `limit` del backend a `1000` para destrabar el admin mientras se completa la optimizacion definitiva.
- Se bajo `AdminBookings` de `1200` a `1000`.
- Se quitaron cuellos de botella Prisma dentro de `booking.service.ts` y `admin.controller.ts` reemplazando `Promise.all` pesados por consultas secuenciales en endpoints criticos.
- Se simplifico `FinanzasTab` para que el resumen no dependa del dashboard general ni de llamadas `N+1` por cuenta.
- `FinanzasTab` y `MarketingTab` ahora validan `response.ok` y muestran errores reales en vez de quedarse silenciosamente vacios.
- Se agregaron validaciones Zod para CRUD de `pricing rules`, `extras`, `areas` y `hotels`, y ya quedaron conectadas a `admin.routes.ts`.
- `PricingManager` ahora muestra errores visibles y retry en vez de quedarse solo con `console.error`.
- Se ajustaron los timeouts de `backend/src/shared/test/booking.test.ts` para reflejar el tiempo real de Prisma en este entorno y la suite backend ya pasa completa.
- Se ejecuto un smoke test real de escritura local para `drivers`, `vehicles`, `pricing areas` y `manual booking`, con cleanup automatico al final.
- Se agrego un guard central de entorno para bloquear configuraciones inseguras en produccion, incluyendo `ADMIN_AUTH_DISABLED=true` y URLs locales en variables remotas.

### Verificacion local ya confirmada

Estas rutas y vistas ya fueron verificadas en local despues de los cambios:

- `http://localhost:5173/admin`
- Dashboard carga
- Reservaciones carga y ya no muestra `Validation error`
- Finanzas carga y sus subtabs `Resumen Financiero`, `Cuentas por Cobrar` y `Cuentas Abiertas` renderizan
- Marketing carga y renderiza metricas
- Configuracion/Pricing carga
- RRHH carga
- Nueva Reserva carga
- Escrituras locales verificadas:
  - crear driver
  - crear vehicle
  - create/update/deactivate area de pricing
  - crear manual booking `save only`
- `npm run lint` frontend pasa
- `npm run test` frontend pasa
- `npm run build` frontend pasa
- `npm run test` backend pasa
- `npm run build` backend pasa
- Prueba negativa confirmada: payload invalido en pricing ahora responde `400`

### Abierto todavia

Esto sigue pendiente para poder marcar el workplan como terminado:

- limpiar secretos y validar variables reales de produccion
- cerrar encoding, sitemap y SEO faltante
- decidir si el ajuste final de `limit` se queda en backend `1000` o si se regresa a paginacion estricta

## Alcance del plan

Este workplan cubre:

- Frontend React
- Backend Express/Prisma
- Admin
- Seguridad
- SEO
- Verificacion final antes de deploy

No cubre:

- Rediseño visual completo
- Reescritura total del booking flow
- Replanteamiento de arquitectura a largo plazo

---

## P0 - Bloqueantes de produccion

Estas tareas deben resolverse primero. Mientras una sola falle, el proyecto no debe considerarse "listo al 100%".

### P0.1 - Corregir contrato roto entre admin y backend en listados de bookings

**Problema**

El frontend pide:

- `limit=500` en dashboard
- `limit=300` en finanzas
- `limit=200` en marketing
- `limit=800/1200` en reservaciones

Pero el backend valida:

- `limit <= 100`

**Archivos**

- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\AdminBookings.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\DashboardOverviewTab.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\FinanzasTab.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\MarketingTab.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\backend\src\shared\lib\validation.ts`

**Accion exacta**

Elegir una de estas dos rutas y aplicarla de forma consistente:

1. Mantener el backend en `100` y bajar todos los `limit` del frontend a `100`, agregando paginacion o agregacion.
2. Subir el limite permitido en backend solo si la consulta real soporta ese volumen sin degradarse.

**Recomendacion**

Usar la opcion 1. Es mas segura y mas consistente con produccion.

**Definition of done**

- Dashboard carga sin `400`
- Reservaciones carga sin `400`
- Finanzas carga sin `400`
- Marketing carga sin `400`
- Ninguna vista depende de `limit > 100`

---

### P0.2 - Centralizar autenticacion del admin para eliminar tormenta de `/me`

**Problema**

Muchos componentes del admin ejecutan `useAdminAuth()` por separado, y cada montaje vuelve a pegarle a:

- `/api/admin/auth/me`

Eso provoca:

- trafico innecesario
- riesgo de `429`
- comportamiento inestable en local y produccion

**Archivos**

- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\hooks\useAdminAuth.ts`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\AdminRoute.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\pages\Admin.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\AccountsTab.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\AdminBookings.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\DashboardOverviewTab.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\FinanzasTab.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\MarketingTab.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\PricingManager.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\RRHHTab.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\backend\src\app.ts`

**Accion exacta**

1. Crear `AdminAuthProvider` o migrar auth a React Query con cache compartido.
2. Hacer una sola lectura de sesion por carga inicial del admin.
3. Exponer `email`, `authenticated`, `logout` y `loading` desde contexto.
4. Dejar `useAdminAuth()` como wrapper del contexto en lugar de ejecutar `fetch` por su cuenta.
5. Revisar si `/api/admin/auth/me` debe vivir fuera del rate limiter de login.

**Definition of done**

- Navegar por tabs del admin no dispara multiples llamadas redundantes a `/me`
- No aparecen `429` por cambio de seccion
- El estado de sesion se conserva correctamente

---

### P0.3 - Blindar secretos y configuracion de entorno

**Problema**

Hay secretos reales visibles en archivos locales `.env` y `backend/.env`. Aunque esten ignorados por git, eso sigue siendo un riesgo de operacion y de fuga.

**Archivos**

- `C:\Users\conde\Documents\classvip-live-correct2\.env`
- `C:\Users\conde\Documents\classvip-live-correct2\backend\.env`
- `C:\Users\conde\Documents\classvip-live-correct2\.env.example`
- `C:\Users\conde\Documents\classvip-live-correct2\backend\.env.example`

**Accion exacta**

1. Rotar llaves activas de:
   - Stripe
   - OpenAI
   - Resend
   - JWT secret
   - Database password si aplica
2. Verificar historial git para asegurarse de que secretos nunca fueron commiteados.
3. Asegurar que produccion use solo variables del hosting.
4. Confirmar que `ADMIN_AUTH_DISABLED` este en `false` en cualquier entorno remoto.
5. Dejar `.env.example` limpio, util y sin valores reales.

**Definition of done**

- No hay secretos reales en archivos que puedan compartirse
- Produccion usa solo secrets del hosting
- `ADMIN_AUTH_DISABLED` no puede quedar activo fuera de local

---

### P0.4 - Resolver errores silenciosos en vistas criticas del admin

**Problema**

Varias pantallas no muestran error real al usuario. Si la API falla, la UI muchas veces cae en estado vacio o ambiguo.

**Archivos**

- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\PricingManager.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\FinanzasTab.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\MarketingTab.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\DashboardOverviewTab.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\AdminBookings.tsx`

**Accion exacta**

1. Estandarizar una capa de fetch que:
   - revise `response.ok`
   - lea JSON de error
   - lance excepcion con mensaje util
2. Mostrar:
   - estado loading
   - error claro
   - boton retry
3. Evitar "pantalla vacia = todo bien".

**Definition of done**

- Si la API falla, el usuario ve un mensaje correcto
- No hay tabs del admin que queden "en blanco" sin explicacion

---

### P0.5 - Validar deploy serverless de admin bootstrap

**Problema**

El admin en produccion depende de que la inicializacion del backend serverless sea consistente.

**Archivos**

- `C:\Users\conde\Documents\classvip-live-correct2\api\index.ts`
- `C:\Users\conde\Documents\classvip-live-correct2\backend\src\app.ts`
- `C:\Users\conde\Documents\classvip-live-correct2\vercel.json`

**Accion exacta**

1. Confirmar que `ensureAdminExists()` corre en el entrypoint serverless.
2. Confirmar que la cookie admin funciona con dominio real y HTTPS.
3. Confirmar que `VITE_API_BASE_URL` en produccion no apunte a `localhost` ni `127.0.0.1`.

**Definition of done**

- `/admin/login` funciona en produccion
- `/api/admin/auth/me` responde correctamente con sesion valida
- No hay 404 de API por base URL incorrecta

---

## P1 - Estabilizacion funcional

Estas tareas no siempre tumban produccion de inmediato, pero si afectan soporte, mantenimiento o fiabilidad.

### P1.1 - Agregar validaciones Zod faltantes en CRUD de pricing

**Problema**

Las rutas admin de pricing no validan request body con el mismo nivel que bookings/accounts.

**Archivos**

- `C:\Users\conde\Documents\classvip-live-correct2\backend\src\features\admin\routes\admin.routes.ts`
- `C:\Users\conde\Documents\classvip-live-correct2\backend\src\shared\lib\validation.ts`
- `C:\Users\conde\Documents\classvip-live-correct2\backend\src\features\pricing\controllers\pricing.controller.ts`

**Accion exacta**

1. Crear schemas para:
   - pricing rules
   - extras
   - areas
   - hotels
2. Aplicarlos con `validate(..., 'body')` en `POST` y `PUT`.

**Definition of done**

- Ninguna escritura admin de pricing acepta payload arbitrario
- Los errores de validacion regresan `400` consistente

---

### P1.2 - Convertir tareas admin de localStorage a backend real

**Problema**

La seccion `Tareas` solo persiste en el navegador local.

**Archivos**

- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\TareasTab.tsx`
- Backend nuevo: modelo, rutas y controlador de tareas

**Accion exacta**

1. Crear modelo Prisma para tareas admin.
2. Exponer CRUD minimo.
3. Migrar `TareasTab` a API real.
4. Eliminar dependencia en `localStorage`.

**Definition of done**

- Las tareas persisten entre sesiones
- Se comparten entre admins
- No se pierden al cambiar de equipo o navegador

---

### P1.3 - Estabilizar pruebas backend

**Problema**

Las pruebas backend fallan por timeout, no por compilacion.

**Archivos**

- `C:\Users\conde\Documents\classvip-live-correct2\backend\src\shared\test\booking.test.ts`
- `C:\Users\conde\Documents\classvip-live-correct2\backend\src\shared\test\setup.ts`

**Accion exacta**

1. Aumentar timeout donde si aplique.
2. Reducir dependencia en red/DB compartida.
3. Revisar uso de Prisma y limpieza entre pruebas.
4. Considerar DB de test aislada o transaction rollback por prueba.

**Definition of done**

- `npm run test` backend pasa de forma consistente
- Sin timeouts intermitentes

---

### P1.4 - Eliminar efectos fragiles y `eslint-disable` de hooks

**Problema**

Hay efectos con dependencias omitidas, lo que puede producir estados viejos o dobles cargas.

**Archivos**

- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\AccountsTab.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\FinanzasTab.tsx`

**Accion exacta**

1. Memoizar fetchers con `useCallback` si hace falta.
2. Migrar fetches repetidos a React Query donde convenga.
3. Quitar `eslint-disable` de `exhaustive-deps`.

**Definition of done**

- No quedan ignores innecesarios de hooks
- El comportamiento no cambia por re-render

---

### P1.5 - Completar superficie funcional del admin

**Problema**

Hay piezas funcionales parcialmente conectadas o muy dispersas.

**Archivos**

- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\pages\Admin.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\AccountsTab.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\FinanzasTab.tsx`

**Accion exacta**

1. Verificar que cuentas, cargos y pagos esten accesibles desde navegacion real.
2. Confirmar si `AccountsTab` debe ser tab propio o solo subtab dentro de Finanzas.
3. Reducir duplicacion entre shell admin y subtabs.

**Definition of done**

- Toda funcion existente en codigo esta accesible desde UI o se elimina

---

## P2 - Calidad, SEO y mantenibilidad

Estas tareas elevan el proyecto a un estado mas limpio y mas defendible.

### P2.1 - Corregir encoding roto

**Problema**

Hay textos con mojibake como:

- `ConfiguraciÃ³n`
- `vehÃ­culo`
- `Error de conexiÃ³n`
- `Class VIP Transfers â€”`

**Archivos detectados**

- `C:\Users\conde\Documents\classvip-live-correct2\index.html`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\pages\Admin.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\marketing\pages\Transfers.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\RRHHTab.tsx`
- revisar tambien `BookActivities.tsx` y otros archivos con strings visibles

**Accion exacta**

1. Convertir archivos a UTF-8 limpio.
2. Reescribir strings visibles dañados.
3. Revisar comentarios y textos cargados por UI.

**Definition of done**

- No aparecen caracteres rotos en UI ni metadata

---

### P2.2 - Corregir sitemap y SEO faltante

**Problema**

El sitemap tiene URLs duplicadas y varias paginas no renderizan `SEO`.

**Archivos**

- `C:\Users\conde\Documents\classvip-live-correct2\public\sitemap.xml`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\marketing\pages\ActivityDetail.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\booking\pages\BookActivities.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\index.html`

**Accion exacta**

1. Deduplicar sitemap.
2. Agregar `SEO` a `ActivityDetail`.
3. Agregar `SEO` a `BookActivities`.
4. Corregir `meta description` base en `index.html`.

**Definition of done**

- No hay URLs duplicadas en sitemap
- Todas las landings principales tienen title, description y canonical correctos

---

### P2.3 - Reducir bundle inicial

**Problema**

El build sigue marcando chunk principal arriba de `500 kB`.

**Archivos**

- `C:\Users\conde\Documents\classvip-live-correct2\src\App.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\shared\lib\public-data.ts`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\MarketingTab.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\components\FinanzasTab.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\booking\pages\Book.tsx`

**Accion exacta**

1. Seguir separando chunks pesados.
2. Mover data pesada fuera del bundle inicial.
3. Revisar `recharts` y tableros admin para carga diferida mas agresiva.
4. Evaluar `manualChunks` en Vite.

**Definition of done**

- Chunk principal por debajo del warning o justificado con split correcto

---

### P2.4 - Reducir monolitos grandes

**Problema**

Hay componentes demasiado largos y con demasiada responsabilidad.

**Archivos**

- `C:\Users\conde\Documents\classvip-live-correct2\src\features\admin\pages\Admin.tsx`
- `C:\Users\conde\Documents\classvip-live-correct2\src\features\booking\pages\Book.tsx`

**Accion exacta**

1. Separar shell de admin de formularios complejos.
2. Mover `QuickBookingTab` a su propio modulo.
3. Seguir extrayendo hooks de `Book.tsx`.

**Definition of done**

- Cada modulo principal tiene responsabilidades mas claras
- Menor riesgo de regresiones al tocar una sola vista

---

## Secuencia recomendada de ejecucion

### Fase 1 - Recuperar estabilidad del admin

1. P0.1 contratos de `limit`
2. P0.2 auth centralizada
3. P0.4 manejo visible de errores
4. smoke test completo del admin

### Fase 2 - Asegurar despliegue y seguridad

1. P0.3 secretos y entornos
2. P0.5 serverless y base URL
3. verificacion en staging o produccion controlada

### Fase 3 - Endurecer backend

1. P1.1 validaciones CRUD pricing
2. P1.3 pruebas backend
3. P1.4 hooks fragiles

### Fase 4 - Calidad final

1. P1.2 persistencia real de tareas
2. P2.1 encoding
3. P2.2 SEO y sitemap
4. P2.3 rendimiento
5. P2.4 refactor estructural

---

## Checklist de verificacion final antes de push

### Build y tests

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm --prefix backend run build`
- `npm --prefix backend run test`

### Admin local

- `/admin/login` abre
- `/admin` abre
- Dashboard carga sin `400`
- Reservaciones carga sin `400`
- Finanzas carga sin `400`
- Marketing carga sin `400`
- RRHH carga
- Pricing carga
- Nueva Reserva crea flujo valido
- No hay `429` al navegar tabs
- No hay errores rojos en consola

### Produccion

- `www.classviptransfers.com/admin/login` carga
- login real funciona
- `/api/admin/auth/me` responde correctamente con sesion
- no hay `localhost` ni `127.0.0.1` en variables remotas
- cookies admin funcionan bajo HTTPS

### Seguridad

- `ADMIN_AUTH_DISABLED=false` en remoto
- secretos rotados
- `.env.example` limpio
- verificacion de historial si hubo riesgo de fuga

### SEO

- homepage con meta description correcta
- sitemap sin duplicados
- `ActivityDetail` con SEO
- `BookActivities` con SEO
- `robots.txt` correcto

---

## Criterio real de "100% listo"

Se puede considerar listo para produccion cuando:

1. El admin carga y navega completo sin errores de consola ni respuestas `400/429`.
2. Frontend y backend construyen sin fallos.
3. Las pruebas importantes pasan o quedan justificadas y estabilizadas.
4. No hay secretos expuestos ni bypass de auth remoto.
5. El SEO base y sitemap estan corregidos.
6. El deploy en produccion se verifica manualmente despues del push.

---

## Recomendacion final

Si el objetivo es resolver rapido para cliente y luego dejarlo fino, el orden ideal es:

1. arreglar `limit` del admin
2. centralizar auth del admin
3. validar produccion
4. luego seguridad y limpieza

Ese es el camino mas corto entre "hoy esta inestable" y "ya quedo operando bien en produccion".
