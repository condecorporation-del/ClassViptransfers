# Debug PayPal Checkout Issues

## Problema: Botón de PayPal no funciona en producción

Si ya tienes `VITE_API_BASE_URL` configurado en Netlify pero el botón no funciona, sigue estos pasos:

## 1. Verificar que el Backend esté corriendo

Abre en el navegador:
```
https://los-cabos-luxe-transfers.onrender.com/health
```

Debe responder:
```json
{"status":"ok","timestamp":"..."}
```

**Si no responde:**
- El backend en Render puede estar dormido (free tier)
- Ve a Render Dashboard y "Manual Deploy" para despertarlo
- O espera ~30 segundos y recarga (Render despierta automáticamente)

## 2. Verificar Variable de Entorno en Netlify

1. Ve a Netlify Dashboard → Site Settings → Environment Variables
2. Verifica que `VITE_API_BASE_URL` esté configurada
3. **IMPORTANTE:** Si agregaste la variable DESPUÉS del último deploy, necesitas:
   - Ir a "Deploys"
   - Click en "Trigger deploy" → "Clear cache and deploy site"

**Las variables de Vite solo se inyectan en BUILD TIME, no en runtime.**

## 3. Verificar en la Consola del Navegador

Abre `classvip.netlify.app/book` y abre DevTools (F12) → Console

Debes ver:
```
[Book] API_BASE_URL: https://los-cabos-luxe-transfers.onrender.com
```

**Si ves `http://localhost:3001`:**
- La variable no se inyectó en el build
- Necesitas redeploy con "Clear cache"

## 4. Verificar CORS

El backend debe permitir `https://classvip.netlify.app`

Verifica en Render logs que no aparezcan errores de CORS.

## 5. Verificar Errores de Red

En DevTools → Network:
- Busca la petición a `/api/bookings`
- Verifica el status code
- Si es `0` o `ERR_CONNECTION_REFUSED`: Backend no responde
- Si es `CORS error`: Backend no permite el origin

## Solución Rápida

1. **Redeploy Netlify con cache limpio:**
   - Deploys → Trigger deploy → Clear cache and deploy

2. **Despertar backend en Render:**
   - Render Dashboard → Manual Deploy
   - O visita `https://los-cabos-luxe-transfers.onrender.com/health` para despertarlo

3. **Verificar logs:**
   - Netlify: Deploy logs
   - Render: Service logs
   - Browser: Console + Network tabs

## Si sigue sin funcionar

Copia estos logs y compártelos:
1. Console del navegador (todos los mensajes)
2. Network tab (la petición a `/api/bookings` con status y response)
3. Render logs (últimos 50 líneas)

