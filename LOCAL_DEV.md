# Desarrollo Local — Class VIP Transfers

Entorno 100% local para probar pricing, tabulador y flujo de reserva.

---

## 0. Si nada carga (precios, chat, reservas)

1. **Backend debe estar corriendo en el puerto 3001.**  
   Si no lo has iniciado o dudas, en una terminal:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   Debes ver: `🚀 Server running on http://localhost:3001`

2. **Si el puerto 3001 ya está en uso** (error `EADDRINUSE`):
   - Opción A: Usar el proceso que ya está (si es tu backend). Verifica con el paso 3.
   - Opción B: Liberar el puerto y arrancar de nuevo:
     ```bash
     # En macOS/Linux, ver qué usa el puerto:
     lsof -i :3001
     # Matar el proceso (sustituye PID por el número de la columna PID):
     kill PID
     cd backend && npm run dev
     ```

3. **Comprobar que el backend responde:**
   ```bash
   curl -s http://localhost:3001/health
   # Debe devolver: {"status":"ok","timestamp":"..."}
   curl -s http://localhost:3001/api/pricing/extras
   # Debe devolver: {"success":true,"data":[...]}
   curl -s http://localhost:3001/api/pricing/areas
   # Debe devolver: {"success":true,"data":[...]}
   ```
   Si `/health` responde pero `/api/pricing/extras` o `/api/pricing/areas` dan 404, **reinicia el backend** (puede ser una versión antigua del código).

4. **Frontend debe abrirse en http://localhost:5173** (no en otro puerto ni abriendo el `dist/` a mano).  
   En dev, las peticiones a `/api/*` se proxean a `localhost:3001` solo cuando el front se sirve con `npm run dev` desde la raíz.

5. **Abrir la app en el navegador:** http://localhost:5173  
   En la pestaña Red (Network), las llamadas a `api/pricing/extras`, `api/pricing/areas`, `api/ai/chat` deben ir a `localhost:5173` (proxy) y responder 200. Si ves `ECONNREFUSED` o 502, el backend no está arriba o el proxy no puede alcanzarlo.

---

## 1. Backend (puerto 3001)

```bash
cd backend
npm run db:seed          # pricing rules + extras + hotels
npm run dev
```

- **URL:** http://localhost:3001
- **Health:** http://localhost:3001/health

**Importante:** El seed crea hoteles, reglas de pricing y extras. Ejecuta `db:seed` si la base está vacía.

---

## 2. Frontend (puerto 5173)

```bash
npm run dev
```

- **URL:** http://localhost:5173
- **Proxy:** En dev, las peticiones a `/api/*` se proxean automáticamente a `localhost:3001`

---

## 3. Variables de entorno

### Frontend (raíz del proyecto)

`.env`:

```
VITE_API_BASE_URL=http://localhost:3001
```

> En desarrollo, el proxy usa URLs relativas (`/api/...`) así que no es obligatorio. En producción, `VITE_API_BASE_URL` debe apuntar al backend.

### Backend

`backend/.env` debe tener al menos:

- `PORT=3001`
- `DATABASE_URL` (Supabase u otra PostgreSQL)
- `FRONTEND_URL=http://localhost:5173`
- PayPal, Resend, etc. según lo que vayas a probar

---

## 4. Endpoints de pricing

| Método | URL | Descripción |
|--------|-----|-------------|
| GET | http://localhost:3001/api/pricing/rules | Reglas activas de precios (TRANSFER) |
| GET | http://localhost:3001/api/pricing/zones | Lista única de zonas |
| GET | http://localhost:3001/api/pricing/hotels | Hoteles activos por zona |
| GET | http://localhost:3001/api/pricing/extras | Extras (incluidos + de pago) para la UI de reserva |
| GET | http://localhost:3001/api/pricing/areas | Áreas para precios dinámicos (transport) |
| POST | http://localhost:3001/api/pricing/quote | Cotización en tiempo real |

**Ejemplo POST /api/pricing/quote:**

```json
{
  "serviceType": "TRANSFER",
  "tripType": "ONE_WAY",
  "zoneFrom": "SJD",
  "zoneTo": "Cabo San Lucas",
  "vehicleClass": "SUV",
  "passengers": 2
}
```

---

## 5. Flujo de verificación

1. **Tabulador** — http://localhost:5173/transfers  
   - Tabla dinámica desde BD  
   - Solo reglas TRANSFER activas  
   - ONE_WAY por defecto  
   - "No disponible" si no hay combinación  

2. **Reserva** — http://localhost:5173/book  
   - Private: cotización en vivo por zonas/vehículo/extras  
   - Shuttle: fallback $25/persona (listo para reglas BD cuando existan)  
   - El backend recalcula el total y no confía en el frontend  

3. **Sin precios hardcodeados**  
   - Transfers, Index, cards Private/Shuttle usan datos dinámicos o texto genérico  

---

## 6. Comandos útiles

```bash
# Seed pricing + hotels (si hace falta)
cd backend && npm run db:seed

# Build frontend
npm run build

# Build backend (TypeScript)
cd backend && npx tsc --noEmit
```

---

## 7. Solución de problemas

### Hoteles no cargan (404)
- Verifica que el backend esté corriendo (`npm run dev` en `backend/`)
- Ejecuta el seed: `cd backend && npm run db:seed`
- En dev, el frontend usa el proxy; no deberías ver 404 si backend y frontend están activos

### Errores de CORS
- En dev con el proxy, las peticiones van a la misma origin
- Si usas el backend directo, añade `http://localhost:5173` a CORS en el backend

### Base de datos vacía
- `cd backend && npx prisma db push` (aplica schema)
- `cd backend && npm run db:seed` (inserta datos)

### Admin login (localhost)
- Email: `condecorporation@gmail.com`
- Password: `1234` (temporal para pruebas)
- Ir a: http://localhost:5173/admin/login

### Correos (Resend) no llegan
- **Sandbox Resend**: Con `onboarding@resend.dev` solo puedes enviar AL email de tu cuenta Resend. Para enviar a otros destinatarios debes verificar un dominio en https://resend.com/domains.
- Revisar logs en consola del backend: `[Email]` para ver respuestas de Resend.
