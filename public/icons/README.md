# PWA Icons

This directory should contain the following icon files for PWA support:

## Required Icons

1. **icon-192x192.png** (192x192px)
   - Standard PWA icon
   - Maskable (safe zone: 80% visible when masked)
   - Used for Android and general PWA

2. **icon-512x512.png** (512x512px)
   - High-resolution PWA icon
   - Maskable (safe zone: 80% visible when masked)
   - Used for splash screens and high-DPI displays

3. **apple-touch-icon.png** (180x180px or 192x192px)
   - Apple iOS home screen icon
   - No transparency (will be rounded by iOS)
   - Used for iPhone/iPad "Add to Home Screen"

## Icon Requirements

- **Format:** PNG
- **Aspect Ratio:** 1:1 (square)
- **Background:** Transparent (for maskable) or solid color (for Apple)
- **Quality:** High resolution, sharp edges
- **Content:** Logo or app icon centered
- **Safe Zone:** For maskable icons, keep important content within 80% of the icon (iOS will mask the edges)

## Quick Generation

### Option 1: Using ImageMagick

```bash
# Resize existing logo
convert ../logo.png -resize 192x192 -background transparent -gravity center -extent 192x192 icon-192x192.png
convert ../logo.png -resize 512x512 -background transparent -gravity center -extent 512x512 icon-512x512.png
convert ../logo.png -resize 180x180 -background white -gravity center -extent 180x180 apple-touch-icon.png
```

### Option 2: Online Tools

- **PWA Builder Image Generator:** https://www.pwabuilder.com/imageGenerator
- **RealFaviconGenerator:** https://realfavicongenerator.net/
- **Favicon.io:** https://favicon.io/

### Option 3: Design Tool

1. Create 512x512px design in Figma/Photoshop
2. Export as PNG
3. Resize to 192x192px for smaller icon
4. Create 180x180px version for Apple (with solid background)

## Brand Colors

- **Theme Color:** #071A2B (Navy)
- **Background:** #F7FAFF (Off-white)
- **Accent:** #D4AF37 (Gold)

Consider using these colors in your icon design to match the app theme.

## Testing

After adding icons:

1. Build the app: `npm run build`
2. Check manifest: Open `/manifest.webmanifest` in browser
3. Test on iOS: Add to home screen and verify icon appears
4. Test on Android: Install PWA and verify icons

