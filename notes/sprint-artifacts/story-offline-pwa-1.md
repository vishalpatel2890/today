# Story 7.1: PWA Foundation

**Status:** Review

---

## User Story

As a **user**,
I want **to install the Today app on my device like a native app**,
So that **I can access it quickly from my home screen and it loads instantly**.

---

## Acceptance Criteria

**AC-7.1.1: Manifest Configuration**
- **Given** the app is built and deployed
- **When** a user visits the app in Chrome
- **Then** the browser shows an "Install" prompt in the address bar
- **And** the manifest includes: name "Today", theme_color "#0f172a", display "standalone"

**AC-7.1.2: PWA Icons**
- **Given** the app is installed
- **When** the user views their home screen/app drawer
- **Then** the Today app icon displays correctly at 192x192 and 512x512 resolutions

**AC-7.1.3: Standalone Mode**
- **Given** the app is installed as a PWA
- **When** the user opens it from home screen
- **Then** it opens in standalone mode without browser chrome (address bar, tabs)

**AC-7.1.4: Service Worker Registration**
- **Given** the app loads in the browser
- **When** the page finishes loading
- **Then** a service worker is registered and active (visible in DevTools > Application)

**AC-7.1.5: Asset Caching**
- **Given** the service worker is active
- **When** the user goes offline
- **Then** the app shell (HTML, CSS, JS) loads from cache
- **And** Google Fonts are served from cache

---

## Implementation Details

### Tasks / Subtasks

- [x] Install vite-plugin-pwa: `npm install -D vite-plugin-pwa`
- [x] Update `vite.config.ts` with VitePWA plugin configuration
- [x] Create PWA icons (192x192, 512x512) and place in `public/`
- [x] Add apple-touch-icon for iOS
- [x] Update `index.html` with theme-color meta tag
- [x] Configure Workbox caching strategies in vite config
- [x] Build and verify service worker in `dist/`
- [x] Test PWA installation on Chrome desktop
- [x] Test PWA installation on iOS Safari
- [x] Test PWA installation on Android Chrome

### Technical Summary

Use `vite-plugin-pwa` (v0.21.1) to automatically generate:
- Web App Manifest (`manifest.webmanifest`)
- Service Worker with Workbox
- Precache manifest for app shell

The plugin handles SW registration, updates, and cache invalidation automatically via `registerType: 'autoUpdate'`.

### Project Structure Notes

- **Files to create:** `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/apple-touch-icon.png`
- **Files to modify:** `vite.config.ts`, `index.html`
- **Expected test locations:** Manual testing via Chrome DevTools Lighthouse
- **Prerequisites:** None (first story in epic)

### Key Code References

**vite.config.ts (current):**
```typescript
// src: today-app/vite.config.ts:1-8
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

**vite.config.ts (target):**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Today',
        short_name: 'Today',
        description: 'Minimalist to-do app for daily focus',
        theme_color: '#0f172a',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
})
```

---

## Context References

**Tech-Spec:** [tech-spec-offline-pwa.md](../tech-spec-offline-pwa.md) - Primary context document containing:
- Complete vite-plugin-pwa configuration
- Workbox caching strategies
- PWA manifest requirements

**Architecture:** [architecture.md](../architecture.md) - Vite build configuration patterns

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log
- 2026-01-07: Started PWA Foundation implementation
- Installed vite-plugin-pwa v1.2.0 (298 packages)
- Created favicon.svg with checkmark icon design (dark theme: #0f172a, green checkmark: #22c55e)
- Used sharp library to generate PNG icons from SVG (192x192, 512x512, 180x180 apple-touch-icon)
- Configured VitePWA with autoUpdate registration, Workbox for asset caching
- Added Google Fonts runtime caching with CacheFirst strategy (1 year expiration)
- Build successful: SW generated with 13 precached entries (548.96 KiB)

### Completion Notes
✅ Test Gate PASSED by Vishal (2026-01-07)

PWA Foundation successfully implemented:
- App is installable via Chrome "Install" prompt
- Opens in standalone mode without browser chrome
- Service worker caches app shell and Google Fonts
- Icons display correctly at all required sizes
- Offline access works after first visit

### Files Modified
- `vite.config.ts` - Added VitePWA plugin with manifest and Workbox config
- `index.html` - Added theme-color meta, apple-touch-icon link, description meta
- `public/favicon.svg` - Created new app icon (checkmark design)
- `public/pwa-192x192.png` - Generated from SVG
- `public/pwa-512x512.png` - Generated from SVG
- `public/apple-touch-icon.png` - Generated from SVG (180x180)
- `package.json` - Added vite-plugin-pwa, sharp dev dependencies

### Test Results
- ✅ Service worker registered and active
- ✅ Manifest has correct name, theme_color, display
- ✅ Install prompt available in Chrome
- ✅ App opens in standalone mode
- ✅ App loads when offline
- ✅ Icons display correctly (checkmark on dark background)

---

## Review Notes
<!-- Will be populated during code review -->
