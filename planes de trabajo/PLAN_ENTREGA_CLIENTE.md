# Plan de Entrega — Class VIP Transfers
## Lo que necesitas hacer para dejar la página en producción con el dominio del cliente

---

## 1. DNS — Qué pasarle al encargado del dominio

El proceso es:
1. Tú conectas el dominio en **Netlify** (tarda 2 minutos).
2. Netlify te da los DNS records.
3. Tú se los pasas al encargado del dominio del cliente.
4. El encargado apunta el dominio a Netlify.
5. Netlify activa el SSL automáticamente (HTTPS gratis).

### Pasos exactos para obtener los DNS en Netlify

1. Entra a [app.netlify.com](https://app.netlify.com)
2. Abre tu sitio → **Domain management** → **Add a domain**
3. Escribe el dominio del cliente (ej. `classviptransfers.com`)
4. Netlify te va a mostrar los **Name Servers** o registros DNS
5. Los registros que te da Netlify se ven así:

```
Tipo: A
Nombre: @  (o el dominio raíz)
Valor: 75.2.60.5

Tipo: CNAME
Nombre: www
Valor: tu-sitio.netlify.app
```

> Si el cliente tiene Premium DNS (como Namecheap BasicDNS → PremiumDNS), el encargado solo necesita cambiar los **Name Servers** a los de Netlify:
> ```
> dns1.p05.nsone.net
> dns2.p05.nsone.net
> dns3.p05.nsone.net
> dns4.p05.nsone.net
> ```

### Qué decirle al encargado del dominio (mensaje listo para copiar)

> Hola, necesito que apuntes el dominio `classviptransfers.com` a Netlify.
> Por favor cambia los Name Servers a estos:
>
> - dns1.p05.nsone.net
> - dns2.p05.nsone.net
> - dns3.p05.nsone.net
> - dns4.p05.nsone.net
>
> Una vez hecho, Netlify activa el SSL automáticamente en unas horas.

> **Nota:** Si el encargado prefiere no cambiar los Name Servers (host privado),
> pídele que agregue solo estos dos registros DNS:
> ```
> A    @     75.2.60.5
> CNAME www   tu-sitio.netlify.app
> ```
> Netlify también acepta esta modalidad (External DNS).

---

## 2. Checklist de entrega — Antes de dar el dominio

Haz esto **en orden** el día que tengas las credenciales:

### Backend (Render)
- [ ] Confirmar que `backend/.env` en Render tiene todas las variables correctas:
  - `DATABASE_URL` → Supabase
  - `JWT_SECRET` → string random seguro (mínimo 32 chars)
  - `BOOKING_LOOKUP_SECRET` → string random diferente al JWT
  - `OPENAI_API_KEY` → API key de OpenAI del cliente
  - `RESEND_API_KEY` → API key de Resend (emails)
  - `COMPANY_BOOKINGS_EMAIL` → correo oficial del cliente
  - `PAYPAL_CLIENT_ID` + `PAYPAL_CLIENT_SECRET` → credenciales PayPal del cliente
  - `FRONTEND_URL` → `https://classviptransfers.com` (dominio final)
  - `NODE_ENV=production`
- [ ] Hacer `deploy` manual en Render y verificar que responde en `/api/health`

### Frontend (Netlify)
- [ ] En Netlify → **Environment variables**, actualizar:
  - `VITE_API_URL` → URL del backend en Render (ej. `https://classvip-backend.onrender.com`)
- [ ] Hacer un nuevo deploy en Netlify (o push a `main`)
- [ ] Verificar que el sitio carga en `tu-sitio.netlify.app` antes de conectar el dominio

### Código — Antes del deploy final
- [ ] En `src/pages/Index.tsx` y `src/components/SEO.tsx`: verificar que el canonical URL apunta al dominio real
- [ ] En `public/sitemap.xml`: reemplazar `https://classviptransfers.com` si el dominio es diferente
- [ ] En `public/robots.txt`: mismo, verificar URL del sitemap
- [ ] En `backend/src/lib/ai-knowledge.ts`: actualizar teléfono/email si el cliente los cambió

### Dominio
- [ ] Conectar dominio en Netlify → Domain management
- [ ] Pasar DNS al encargado del dominio (ver sección 1)
- [ ] Esperar propagación DNS: entre 30 minutos y 24 horas
- [ ] Verificar que `https://classviptransfers.com` carga con candado verde

### Prueba final antes de entregar
- [ ] Ir a `/book` → completar una reserva de prueba hasta review (no pagar)
- [ ] Ir a `/contact` → enviar mensaje de prueba → verificar que llega por WhatsApp
- [ ] Ir a `/admin` → hacer login con credenciales del admin
- [ ] Verificar que el chat responde preguntas básicas

---

## 3. Costos mensuales/anuales del proyecto

| Servicio | Costo | Frecuencia | Notas |
|---|---|---|---|
| **Dominio** (Namecheap) | $499 MXN | Anual | ~$25 USD/año |
| **Premium DNS** (Namecheap) | $280 MXN | Anual | ~$14 USD/año. Recomendado para velocidad |
| **Render** (backend) | ~$7 USD | Mensual | Plan Starter. ~$84 USD/año |
| **Supabase** (base de datos) | $0 | — | Free tier suficiente para este volumen |
| **Netlify** (frontend) | $0 | — | Free tier suficiente. 100GB bandwidth/mes |
| **OpenAI** (chat IA) | ~$20 USD | Cada 6 meses | Solo info/precios, uso bajo |
| **Resend** (emails) | $0 | — | Free tier: 3,000 emails/mes |
| **PayPal** | % por transacción | Por venta | Sin costo fijo. ~3.49% + $0.49 por pago |

### Resumen de costos fijos al año

| Concepto | USD/año |
|---|---|
| Dominio + Premium DNS | ~$39 USD |
| Render backend | ~$84 USD |
| OpenAI (2 recargas de $20) | ~$40 USD |
| **Total estimado** | **~$163 USD/año** |

> Todo lo demás (Netlify, Supabase, Resend) es gratis en los volúmenes actuales.
> Si el negocio crece y el tráfico sube, Supabase Pro son $25/mes y Netlify Pro $19/mes.

---

## 4. Flujo de trabajo una vez entregado

Así funciona el ciclo de desarrollo después de la entrega:

```
Tu computadora (VS Code / Cursor)
        ↓  git push origin main
GitHub (repositorio)
        ↓  deploy automático
Netlify (frontend) → classviptransfers.com
```

**Solo haces push a `main` y Netlify despliega en ~2 minutos automáticamente.**

Para el backend (Render):
- Render también puede conectarse a GitHub y hacer deploy automático en cada push.
- O puedes hacer deploy manual desde el dashboard de Render cuando haya cambios en el backend.

### Comandos para el día a día

```bash
# Hacer cambios y subir
git add .
git commit -m "descripción del cambio"
git push origin main
# → Netlify detecta el push y despliega automáticamente
```

---

## 5. Contactos y accesos que debes tener documentados

Guarda esto en un lugar seguro (no en el repo):

| Recurso | URL | Credencial |
|---|---|---|
| Netlify | app.netlify.com | tu cuenta |
| Render | dashboard.render.com | tu cuenta |
| Supabase | supabase.com | tu cuenta |
| OpenAI | platform.openai.com | tu cuenta |
| Resend | resend.com | tu cuenta |
| Namecheap / Dominio | namecheap.com | cuenta del cliente |
| PayPal Developer | developer.paypal.com | cuenta del cliente |

---

*Generado: Marzo 2026*
