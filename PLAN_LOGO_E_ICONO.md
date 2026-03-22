# Plan: Logo de Página e Icono de App

## Resumen

Actualizar el icono de la página (favicon) y el logo del navbar usando los nuevos assets:
- **Icono Class** → Para la app (PWA, favicon, apple-touch-icon)
- **Logo Class** → Para la página (navbar grande y llamativo)

---

## 1. Preparar los archivos de imagen

### 1.1 Ubicación de los assets

Los archivos proporcionados están en la carpeta `assets/`:
- `Icono_Class-*.png` → Para la app
- `Logo_Class-*.png` → Para el navbar

### 1.2 Copiar y convertir (Icono Class - App)

El **Icono Class** se usará en:
- Favicon (pestaña del navegador) → 32x32 o 48x48 px
- PWA icons → 192x192 y 512x512 px
- Apple touch icon → 180x180 px

**Acciones:**
1. Redimensionar el Icono Class a los tamaños necesarios
2. Guardar en:
   - `/public/favicon.ico` o `/public/favicon.png` (32x32 o 48x48)
   - `/public/icons/icon-192x192.png`
   - `/public/icons/icon-512x512.png`
   - `/public/icons/apple-touch-icon.png` (180x180)

### 1.3 Copiar (Logo Class - Página)

El **Logo Class** es horizontal y detallado (van, avión, texto). Para el navbar:
1. Copiar la imagen original a `/public/logo.png` (reemplazando el actual)
2. Si la imagen tiene fondo negro, se verá bien sobre el navbar con gradiente oscuro en home
3. En páginas con fondo claro, el logo con fondo oscuro puede necesitar un contenedor sutil o la imagen ya tiene transparencia

---

## 2. Cambios en el código

### 2.1 Favicon (index.html)

**Archivo:** `index.html`  
**Cambio:** Actualizar la línea del favicon para usar el nuevo icono.

```html
<!-- Actual -->
<link rel="icon" type="image/png" href="/logo.png" />

<!-- Nuevo (usar icono de app para la pestaña) -->
<link rel="icon" type="image/png" href="/icons/icon-192x192.png" />
<!-- O crear favicon.ico dedicado: href="/favicon.ico" -->
```

### 2.2 Logo del Navbar (Navbar.tsx)

**Archivo:** `src/components/Navbar.tsx`  
**Objetivo:** Logo más grande y llamativo sin romper el layout.

**Estrategia:** Aumentar el tamaño del logo y aplicar una clase CSS reutilizable.

- La navbar tiene `h-16 md:h-20` (64px / 80px de alto)
- Logo actual: `h-10 md:h-12` (40px / 48px) → muy pequeño
- **Propuesta:** `h-14 md:h-[72px]` o similar para que sea ~90% del alto del navbar
- Usar clase `logo` como solicitaste para facilitar ajustes

**Cambio en el `<img>`:**

```tsx
<img
  src="/logo.png"
  alt="Class VIP Transfers"
  className="logo h-14 md:h-[72px] w-auto object-contain drop-shadow-[0_0_30px_rgba(212,175,55,0.6)] brightness-[1.1] transition-transform duration-300 group-hover:scale-[1.02]"
/>
```

- `object-contain` → mantiene proporciones del logo detallado
- `h-14` = 56px en móvil
- `h-[72px]` = 72px en desktop (casi toda la altura del navbar)
- La clase `logo` permite ajustar tamaño vía CSS global si hace falta

### 2.3 Clase CSS `.logo` (opcional, para fine-tuning)

**Archivo:** `src/index.css`  
Si quieres control centralizado del logo:

```css
/* Logo Class - navbar, grande y llamativo */
.logo {
  max-height: 72px;
  height: auto;
  width: auto;
}
@media (min-width: 768px) {
  .logo {
    max-height: 80px;
  }
}
```

### 2.4 PWA Manifest y meta tags (index.html)

**Archivo:** `public/manifest.webmanifest`  
Las rutas `/icons/icon-192x192.png`, `/icons/icon-512x512.png` y `/icons/apple-touch-icon.png` ya están definidas. Solo hay que reemplazar esos archivos con el Icono Class redimensionado.

**Archivo:** `index.html`  
Los `apple-touch-icon` ya apuntan a `/icons/apple-touch-icon.png`. Al sustituir ese archivo, quedará actualizado.

---

## 3. Checklist de implementación

| Paso | Acción | Estado |
|------|--------|--------|
| 1 | Copiar Logo Class a `/public/logo.png` | ⬜ |
| 2 | Redimensionar Icono Class a 192x192, 512x512, 180x180 | ⬜ |
| 3 | Guardar iconos en `/public/icons/` | ⬜ |
| 4 | Crear favicon (32x32 o 48x48) si se desea uno específico | ⬜ |
| 5 | Actualizar favicon en `index.html` | ⬜ |
| 6 | Aumentar tamaño del logo en `Navbar.tsx` y añadir clase `logo` | ⬜ |
| 7 | (Opcional) Añadir reglas CSS para `.logo` en `index.css` | ⬜ |
| 8 | Probar en móvil y desktop | ⬜ |

---

## 4. Consideraciones de diseño

### Logo Class en el navbar
- El logo es horizontal y tiene mucho detalle (van, avión, texto). Un tamaño mayor ayudará a la legibilidad.
- Con `h-14 md:h-[72px]` el logo ocupará la mayor parte del alto del navbar sin desbordar.
- El contenedor del logo (`flex-shrink-0`) evita que se comprima.
- Los enlaces y botones siguen en su lugar; solo cambia el tamaño de la imagen.

### Icono Class para la app
- Ya está preparado como icono cuadrado con esquinas redondeadas.
- Al usarlo como favicon, se verá recortado en círculo o cuadrado según el navegador.
- Para PWA, los tamaños 192x192 y 512x512 son obligatorios.

---

## 5. Próximos pasos

1. **Preparar imágenes:** Redimensionar Icono Class a los tamaños indicados (herramienta: [Squoosh](https://squoosh.app), Photoshop, etc.).
2. **Colocar archivos** en `public/` y `public/icons/`.
3. **Ejecutar cambios de código** descritos arriba.
4. **Probar** en local con `npm run dev`.

Si quieres, puedo ayudarte a aplicar los cambios de código cuando tengas las imágenes listas.
