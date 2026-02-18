# PWA Testing Guide

## Quick Testing Checklist

### 1. Development Testing

```bash
# Start dev server
npm run dev

# Check manifest
# Open: http://localhost:8080/manifest.webmanifest

# Check service worker (disabled in dev)
# Should see: "Service worker disabled in dev mode"
```

### 2. Production Build Testing

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Open: http://localhost:4173
```

### 3. iOS Testing Steps

#### On iPhone Safari:

1. **Open the site** in Safari
   - Use your local network IP or deployed URL
   - Example: `http://192.168.1.100:8080` (dev) or your production URL

2. **Wait for install banner** (2 second delay)
   - Should appear at bottom
   - Shows "Install App" message
   - Has dismiss button

3. **Manual install** (if banner doesn't show):
   - Tap Share button (square with arrow)
   - Scroll down to "Add to Home Screen"
   - Tap it
   - Confirm

4. **Verify installation:**
   - App icon appears on home screen
   - Tap to open
   - Should open in standalone mode (no Safari UI)
   - Status bar should be translucent black

5. **Test functionality:**
   - Navigate through app
   - Test booking flow
   - Verify offline behavior (turn off WiFi)
   - Check admin routes work

### 4. Lighthouse PWA Audit

1. **Open Chrome DevTools**
   - F12 or Cmd+Option+I

2. **Go to Lighthouse tab**

3. **Select:**
   - Progressive Web App
   - Desktop or Mobile
   - Click "Analyze page load"

4. **Check scores:**
   - PWA: Should be 90+
   - Performance: Should be good
   - Accessibility: Should be good

5. **Review issues:**
   - Fix any warnings
   - Ensure all checks pass

### 5. Service Worker Testing

1. **Open DevTools → Application tab**

2. **Service Workers:**
   - Should see registered service worker
   - Status: "activated and running"
   - Check "Update on reload" for testing

3. **Cache Storage:**
   - Should see cache entries
   - `vite-pwa-assets` cache
   - `api-cache` (if API calls made)
   - `google-fonts-cache` (if fonts loaded)

4. **Test offline:**
   - Go to Network tab
   - Check "Offline"
   - Refresh page
   - Should still work (cached assets)

### 6. Manifest Validation

1. **Open:** `/manifest.webmanifest`

2. **Check:**
   - Valid JSON
   - All required fields present
   - Icons paths correct
   - Theme colors match brand

3. **Use validator:**
   - https://manifest-validator.appspot.com/
   - Paste manifest URL

### 7. Install Banner Testing

**Test scenarios:**

1. **iOS Safari (not installed):**
   - Banner should appear after 2s
   - Can dismiss
   - Dismiss persists (localStorage)

2. **iOS Safari (already installed):**
   - Banner should NOT appear
   - Standalone mode detected

3. **Non-iOS browser:**
   - Banner should NOT appear
   - iOS detection works

4. **Dismissed banner:**
   - Clear localStorage: `pwa-install-banner-dismissed`
   - Refresh page
   - Banner should appear again

### 8. Icon Testing

1. **Check icon files exist:**
   ```bash
   ls -la public/icons/
   # Should see:
   # - icon-192x192.png
   # - icon-512x512.png
   # - apple-touch-icon.png
   ```

2. **Verify in manifest:**
   - Open `/manifest.webmanifest`
   - Check icon paths

3. **Test on device:**
   - Install app
   - Check home screen icon
   - Should match brand

### 9. Performance Testing

**Before PWA:**
- Note initial load time
- Check bundle size

**After PWA:**
- Should be same or better
- Service worker loads async
- No impact on initial load

**Metrics to check:**
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Total Bundle Size

### 10. Admin Routes Testing

1. **Navigate to:** `/admin`

2. **Verify:**
   - Routes work normally
   - No caching issues
   - API calls work
   - Network-only strategy active

3. **Check service worker:**
   - Admin routes should NOT be cached
   - Network-only strategy confirmed

## Common Issues & Fixes

### Issue: Banner not showing

**Fix:**
- Check iOS detection
- Verify not in standalone mode
- Clear localStorage
- Check console for errors

### Issue: Icons not appearing

**Fix:**
- Verify icons exist in `/public/icons/`
- Check manifest paths
- Clear browser cache
- Rebuild: `npm run build`

### Issue: Service worker not registering

**Fix:**
- Check HTTPS (required in production)
- Verify vite.config.ts PWA config
- Clear service worker cache
- Check console errors

### Issue: App not installing

**Fix:**
- Verify manifest is valid
- Check all required fields
- Ensure HTTPS (production)
- Check icons are accessible

### Issue: Offline not working

**Fix:**
- Check service worker registered
- Verify cache strategy
- Check network tab for cached resources
- Test with DevTools offline mode

## Production Deployment Checklist

- [ ] Icons generated and uploaded
- [ ] Manifest validated
- [ ] HTTPS enabled
- [ ] Service worker working
- [ ] iOS install tested
- [ ] Android install tested (if needed)
- [ ] Lighthouse score 90+
- [ ] Offline functionality tested
- [ ] Install banner tested
- [ ] Admin routes working
- [ ] Performance verified

## Testing URLs

**Development:**
- Local: `http://localhost:8080`
- Network: `http://[your-ip]:8080`

**Production:**
- Your deployed URL (must be HTTPS)

## Next Steps After Testing

1. ✅ Fix any issues found
2. ✅ Generate proper icons from logo
3. ✅ Deploy to production
4. ✅ Test on real devices
5. ✅ Monitor service worker updates
6. ✅ Collect user feedback

