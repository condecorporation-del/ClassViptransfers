# Netlify Environment Variables Setup

## ⚠️ IMPORTANTE: Configurar en Netlify Dashboard

Para que PayPal checkout funcione en producción (`classvip.netlify.app`), debes configurar la variable de entorno en Netlify.

## Pasos:

1. **Ve a Netlify Dashboard:**
   - https://app.netlify.com
   - Selecciona tu sitio: `classvip`

2. **Ve a Site Settings → Environment Variables**

3. **Agrega esta variable:**
   ```
   VITE_API_BASE_URL = https://tu-backend-en-render.onrender.com
   ```
   
   **Reemplaza `tu-backend-en-render.onrender.com` con la URL real de tu backend en Render.**

4. **Redeploy:**
   - Después de agregar la variable, ve a "Deploys"
   - Click en "Trigger deploy" → "Clear cache and deploy site"

## Verificar:

Después del deploy, abre la consola del navegador en `classvip.netlify.app/book` y verifica:
- No debe aparecer `http://localhost:3001` en los logs
- Debe aparecer la URL de tu backend en Render

## Ejemplo:

Si tu backend en Render es: `https://los-cabos-backend.onrender.com`

Entonces configura:
```
VITE_API_BASE_URL = https://los-cabos-backend.onrender.com
```

## Nota:

- Las variables que empiezan con `VITE_` se exponen al cliente
- No incluyas `/api` al final, solo la URL base
- El código ya agrega `/api/bookings` automáticamente

