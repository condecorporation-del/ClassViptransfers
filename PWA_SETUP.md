# PWA Setup Guide - iPhone Add to Home Screen

## Overview

The frontend is now configured as a Progressive Web App (PWA) with full iPhone "Add to Home Screen" support.

## What Was Implemented

✅ **Vite PWA Plugin** - Configured with service worker
✅ **Manifest** - Complete web manifest with icons
✅ **Apple iOS Support** - All required meta tags
✅ **Install Banner** - Smart iOS detection and banner
✅ **Caching Strategy** - Network-first for API, cache for assets
✅ **Performance** - No impact on initial load

## Configuration

### 1. Vite PWA Plugin

**File:** `vite.config.ts`

- Service worker auto-updates
- Caches app shell + static assets
- Network-first for API calls
- Network-only for admin API (no caching)
- Cache-first for fonts

### 2. Manifest

**File:** `public/manifest.webmanifest`

- Name: "Class VIP Transfers"
- Short name: "Class VIP"
- Theme color: #071A2B (Navy)
- Background color: #F7FAFF (Off-white)
- Display: standalone
- Icons: 192x192, 512x512, Apple touch icon

### 3. Apple iOS Tags

**File:** `index.html`

- `apple-mobile-web-app-capable="yes"`
- `apple-mobile-web-app-status-bar-style="black-translucent"`
- `apple-touch-icon` link
- Theme color meta tag

### 4. Install Banner Component

**File:** `src/components/InstallBanner.tsx`

- Detects iOS Safari
- Shows only if not already installed
- Dismissable (stores in localStorage)
- Non-intrusive design
- Bilingual (EN/ES)

## Icon Generation

You need to create the following icons in `/public/icons/`:

1. **icon-192x192.png** - 192x192px, maskable
2. **icon-512x512.png** - 512x512px, maskable
3. **apple-touch-icon.png** - 180x180px (or 192x192px)

### Quick Icon Creation

You can use the existing logo (`/public/logo.png`) and resize it:

```bash
# Using ImageMagick (if installed)
convert public/logo.png -resize 192x192 public/icons/icon-192x192.png
convert public/logo.png -resize 512x512 public/icons/icon-512x512.png
convert public/logo.png -resize 180x180 public/icons/apple-touch-icon.png

# Or use online tools:
# - https://realfavicongenerator.net/
# - https://www.pwabuilder.com/imageGenerator
```

**Icon Requirements:**
- Square format (1:1 aspect ratio)
- Transparent background (PNG)
- High quality
- Maskable icons should have safe zone (80% of icon visible when masked)

## Testing

### 1. Development

```bash
npm run dev
```

- Service worker disabled in dev mode
- Test install banner on iOS Safari
- Check manifest at `/manifest.webmanifest`

### 2. Production Build

```bash
npm run build
npm run preview
```

- Service worker enabled
- Test full PWA functionality
- Test offline mode

### 3. iOS Testing Steps

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Serve locally or deploy:**
   ```bash
   npm run preview
   # Or deploy to your server
   ```

3. **On iPhone Safari:**
   - Open the site
   - Wait for install banner (if iOS)
   - Or manually: Share → Add to Home Screen
   - Verify app icon appears
   - Open from home screen
   - Verify standalone mode (no Safari UI)

4. **Verify:**
   - App opens in standalone mode
   - No Safari address bar
   - Status bar matches theme
   - Icons display correctly
   - Offline functionality works

### 4. Lighthouse PWA Audit

1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select "Progressive Web App"
4. Run audit
5. Should score 90+ (requires HTTPS in production)

**Checklist:**
- ✅ Manifest present
- ✅ Service worker registered
- ✅ Icons configured
- ✅ HTTPS (production)
- ✅ Responsive design
- ✅ Fast load time

## Features

### Caching Strategy

**App Shell:**
- HTML, CSS, JS files cached
- Static assets cached
- Auto-updates on new version

**API Calls:**
- Network-first strategy
- Falls back to cache if offline
- Admin API: Network-only (no cache)

**Fonts:**
- Cache-first
- 1 year expiration

### Install Banner Behavior

- **Shows:** iOS Safari, not installed, not dismissed
- **Hides:** Already installed, dismissed, non-iOS
- **Delay:** 2 seconds (avoids flash)
- **Storage:** localStorage key `pwa-install-banner-dismissed`

### Offline Support

- App shell works offline
- Cached assets available
- API calls fail gracefully
- Shows appropriate error messages

## Admin Routes

Admin routes (`/admin/*`) work normally in PWA:
- Full functionality preserved
- No password protection yet (as requested)
- Network-only caching (no sensitive data cached)

## Performance

- **No impact on initial load**
- Service worker loads asynchronously
- Install banner appears after 2s delay
- No gray flashes
- Hero preload behavior intact

## Troubleshooting

### Banner Not Showing

1. Check iOS detection: `navigator.userAgent` includes "iPhone"
2. Check standalone detection: `window.matchMedia('(display-mode: standalone)')`
3. Check localStorage: `pwa-install-banner-dismissed` not set
4. Clear localStorage and refresh

### Icons Not Showing

1. Verify icons exist in `/public/icons/`
2. Check manifest paths are correct
3. Clear browser cache
4. Rebuild: `npm run build`

### Service Worker Not Registering

1. Check console for errors
2. Verify HTTPS (required in production)
3. Check `vite.config.ts` PWA config
4. Clear service worker: DevTools → Application → Service Workers → Unregister

### App Not Installing

1. Verify manifest is valid: `/manifest.webmanifest`
2. Check all required fields present
3. Verify icons are accessible
4. Check HTTPS (required for install)

## Production Checklist

- [ ] Icons generated and placed in `/public/icons/`
- [ ] Manifest tested and valid
- [ ] Service worker working
- [ ] iOS install tested
- [ ] Lighthouse PWA score 90+
- [ ] HTTPS enabled
- [ ] Offline functionality tested
- [ ] Install banner tested on iOS
- [ ] Admin routes working in PWA

## Next Steps

1. Generate icons from logo
2. Test on real iPhone
3. Deploy to production (HTTPS required)
4. Test install flow
5. Run Lighthouse audit

## Resources

- [Vite PWA Plugin Docs](https://vite-pwa-org.netlify.app/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Apple PWA Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [PWA Builder](https://www.pwabuilder.com/)

