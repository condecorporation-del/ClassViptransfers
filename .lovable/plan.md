

# Class VIP Transfers — Sitio Web Premium de Lujo

## Visión General
Sitio web bilingüe (EN/ES) para una empresa DMC de lujo en Los Cabos, México. Diseño premium con glassmorphism, paleta navy/gold, y experiencia mobile-first.

---

## Design System
- **Colores**: Navy (#071A2B), Deep Blue (#0B2A4A), Royal Blue (#1E63E9), Gold (#D4AF37), Off-white (#F7FAFF) — todos como CSS variables HSL
- **Tipografía**: Playfair Display (headings) + Inter (body)
- **Estilo visual**: Glassmorphism limpio, sombras sutiles, bordes suaves, whitespace generoso
- **Animaciones**: Fade/slide suaves con framer-motion

---

## Componentes Globales
- **Navbar** sticky con backdrop blur, logo, nav links, botón "Book Now" dorado, y toggle de idioma EN|ES
- **Footer** premium con información de contacto, links de navegación y redes sociales
- **Botón flotante de WhatsApp** visible en todas las páginas
- **Sistema de internacionalización** con contexto React para alternar entre inglés y español

---

## Páginas

### 1. Home (/)
- Hero fullscreen con slideshow de 3 imágenes (crossfade cada 5s, overlay oscuro) usando las imágenes de Cloudinary proporcionadas
- Trust Chips: "30+ Years", "Local Experts", "Licensed & Insured", "24/7 Support"
- Sección de Transfers: comparación Private SUV/Sprinter vs Shuttle con cards
- Sección de Activities: Camels, Horses, ATV, RZR, Sky Bikes, Fishing, Sunsets con combos de $100 y $125 USD
- How It Works: 3 pasos visuales
- Testimonials: carrusel de reseñas
- FAQ: accordion expandible

### 2. Transfers (/transfers)
- Comparación detallada Private vs Shuttle
- Sección "What's Included" con iconos
- Políticas de servicio

### 3. Activities (/activities)
- Grid de cards de actividades con imagen, duración y precios placeholder
- Información de combos disponibles

### 4. Booking Wizard (/book)
- Wizard de 8 pasos click-first:
  1. Service Type → 2. Trip Type → 3. Route → 4. Date/Passengers → 5. Locations → 6. Extras → 7. Upsell Activities → 8. Review
- **Desktop**: 2 columnas (wizard izquierda + summary sticky derecha)
- **Mobile**: full-width con bottom-sheet summary colapsable
- Barra de progreso visual

### 5. Book Activities (/book-activities)
- Wizard simplificado para reservar combos de actividades
- Selección de actividades, fecha y detalles

### 6. Contact (/contact)
- Formulario de contacto con validación
- Link directo a WhatsApp
- Información de contacto y mapa placeholder

### 7. Admin (/admin)
- Placeholder con pantalla de login
- Dashboard shell básico (sin funcionalidad backend)

### 8. Confirmation (/confirmation)
- UI post-checkout con resumen de reservación
- Próximos pasos e información de contacto

---

## Tecnología
- React + Vite + TypeScript + Tailwind CSS
- framer-motion para animaciones
- shadcn/ui como base de componentes
- react-router-dom para navegación
- Solo frontend, datos mock/placeholder, sin backend

