# Logos oficiales y marca de agua

Para que correos, PDF y web usen el logo oficial en alta resolución:

## Archivos necesarios

| Archivo | Uso | Recomendación |
|---------|-----|---------------|
| `public/logo.png` | Web (navbar, footer), correos, PDF | PNG o SVG, **mínimo 400px de ancho**; ideal 800px+ para impresión |
| Marca de agua (opcional) | Fondo sutil en correos y PDF | Logo en PNG con opacidad ~5–8% ya aplicada |

## Estado actual

- **`public/logo.png`** existe (1536×1024px) – resolución correcta para web, correos y PDF.
- **PDF:** incluye marca de agua con el logo (opacidad 6 %) aplicada por CSS.
- **Correos:** marca de agua opcional mediante `EMAIL_WATERMARK_LOGO_URL`.

## Si no tienes el logo en alta resolución

1. Usa el **logo oficial en PNG o SVG** (formato vectorial preferido).
2. Para PNG:
   - Ancho mínimo recomendado: **400px** (800px+ si vas a imprimir).
   - Fondo transparente si se usa sobre fondos de color.
3. Coloca el archivo en `public/logo.png` (o el nombre que indiques en `EMAIL_LOGO_URL`).

## Marca de agua en correos

Muchos clientes de correo (p. ej. Gmail) no aplican bien fondos con opacidad. Para mejor compatibilidad:

1. Crea una versión del logo con opacidad ~5–8 % (Photoshop, Figma, etc.).
2. Súbela a un servidor accesible por URL.
3. Define en `.env`:
   ```
   EMAIL_WATERMARK_LOGO_URL=https://tu-dominio.com/logo-watermark.png
   ```

Si no defines `EMAIL_WATERMARK_LOGO_URL`, el correo se enviará sin marca de agua; el PDF seguirá mostrándola.

## Producción

Para correos y PDF en producción, define la URL absoluta del logo:

```
EMAIL_LOGO_URL=https://tu-dominio.com/logo.png
```

Así los clientes de correo podrán cargar la imagen aunque el frontend esté en otro dominio.
