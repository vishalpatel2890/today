# Today - Technical Specification: Offline-First PWA

**Author:** Vishal
**Date:** 2026-01-07
**Project Level:** Quick-Flow (4 stories)
**Change Type:** Feature - Offline-First Progressive Web App
**Development Context:** Brownfield - Existing React/Supabase app

---

## Context

### Available Documents

| Document | Status | Key Insights |
|----------|--------|--------------|
| `notes/prd.md` | Loaded | PWA listed as Growth feature; offline capability aligns with local-first philosophy |
| `notes/architecture.md` | Loaded | localStorage backup pattern exists; Vite build system; React 18+ patterns |
| `notes/tech-spec.md` | Loaded | Base implementation patterns |
| `notes/tech-spec-email-linking.md` | Loaded | Supabase auth integration patterns |
| `notes/tech-spec-task-notes.md` | Loaded | Recent feature patterns for notes/JSONB |

### Project Stack

| Technology | Version | Role |
|------------|---------|------|
| React | 19.2.0 | UI Framework |
| TypeScript | 5.9.3 | Language |
| Vite | 7.2.4 | Build Tool |
| Tailwind CSS | 4.1.18 | Styling |
| @supabase/supabase-js | 2.89.0 | Backend, Auth, Realtime |
| @radix-ui/* | Various | Accessible UI primitives |
| lucide-react | 0.562.0 | Icons |
| date-fns | 4.1.0 | Date utilities |

### Existing Codebase Structure

**Current Data Flow:**
```
User Action → useTasks dispatch → Local state update → localStorage save → Supabase sync
                                                    ↓
                                              Real-time subscription ← Supabase changes
```

**Existing Offline Support (Partial):**
- `src/utils/storage.ts` - localStorage persistence (STORAGE_KEY: 'today-app-state')
- `src/hooks/useTasks.ts` - Hydrates from localStorage first, then fetches from Supabase
- Optimistic updates pattern already implemented

**Gap Analysis:**
| Capability | Current | Required |
|------------|---------|----------|
| Service Worker | ❌ None | ✅ Caches app shell + assets |
| PWA Manifest | ❌ None | ✅ Installable on mobile/desktop |
| Offline Storage | ⚠️ localStorage (5MB limit) | ✅ IndexedDB (unlimited) |
| Sync Queue | ❌ None | ✅ Queue failed operations for retry |
| Conflict Resolution | ❌ None | ✅ Last-write-wins with timestamps |
| Offline Indicator | ❌ None | ✅ UI shows online/offline status |

---

## The Change

### Problem Statement

Users want to use the Today app like a native mobile app - adding and updating tasks even when offline (subway, airplane, poor connectivity), with changes automatically syncing to Supabase when reconnected. Currently, if Supabase is unreachable, operations fail silently and data can be lost.

### Proposed Solution

Implement a true offline-first Progressive Web App (PWA) architecture:

1. **Service Worker** - Cache the app shell and assets for offline access
2. **IndexedDB Storage** - Replace localStorage with IndexedDB for robust offline storage
3. **Sync Queue** - Queue all write operations when offline, replay when online
4. **Conflict Resolution** - Use last-write-wins strategy based on `updated_at` timestamps
5. **Offline UI** - Visual indicator showing connection status and pending sync count

### Scope

**In Scope:**
- PWA manifest for app installation
- Service Worker for asset caching
- IndexedDB for offline data storage
- Sync queue with retry logic
- Online/offline detection and UI indicator
- Conflict resolution for concurrent edits
- Background sync when connection restored

**Out of Scope:**
- Push notifications
- Background fetch API
- Sharing/receiving via Web Share API
- Offline-first for categories (low priority, small dataset)
- Full CRDTs for collaborative editing

---

## Implementation Details

### Source Tree Changes

```
today-app/
├── public/
│   └── manifest.json                    # CREATE - PWA manifest
├── src/
│   ├── lib/
│   │   ├── supabase.ts                  # MODIFY - Add offline detection
│   │   ├── db.ts                        # CREATE - IndexedDB schema with Dexie
│   │   └── syncQueue.ts                 # CREATE - Offline sync queue
│   ├── hooks/
│   │   ├── useTasks.ts                  # MODIFY - Use IndexedDB + sync queue
│   │   ├── useOnlineStatus.ts           # CREATE - Online/offline detection
│   │   └── useSyncQueue.ts              # CREATE - Sync queue management
│   ├── components/
│   │   ├── Header.tsx                   # MODIFY - Add offline indicator
│   │   └── SyncStatusBadge.tsx          # CREATE - Pending sync count badge
│   └── sw.ts                            # CREATE - Service worker (via vite-plugin-pwa)
├── vite.config.ts                       # MODIFY - Add vite-plugin-pwa config
├── package.json                         # MODIFY - Add dependencies
└── index.html                           # MODIFY - Add manifest link, theme-color
```

### Technical Approach

**1. PWA Infrastructure (vite-plugin-pwa 0.21.x)**

Use `vite-plugin-pwa` for automatic service worker generation with Workbox:
- Precache app shell (HTML, CSS, JS, fonts)
- Runtime caching for Google Fonts
- Network-first strategy for API calls (Supabase)
- Cache-first for static assets

**2. Offline Storage (Dexie.js 4.x)**

Dexie provides a clean Promise-based API over IndexedDB:
- `tasks` table mirrors Supabase schema
- `syncQueue` table stores pending operations
- `metadata` table stores sync timestamps

**3. Sync Queue Pattern**

```typescript
// Operation types queued when offline
type SyncOperation = {
  id: string
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: 'tasks' | 'categories'
  payload: Record<string, unknown>
  timestamp: string
  retryCount: number
}
```

**4. Conflict Resolution**

Last-write-wins using `updated_at` timestamp:
- When syncing, compare local `updated_at` with server
- If server is newer, pull server version
- If local is newer, push local version
- Store both timestamps to detect conflicts

### Existing Patterns to Follow

**From `useTasks.ts`:**
- Optimistic local updates before server sync
- Reducer pattern for state management
- `rowToTask()` conversion function
- Console logging with `[Today]` prefix in dev mode

**From `useAuth.ts`:**
- Status state pattern (`'idle' | 'loading' | 'success' | 'error'`)
- Error state handling
- Cleanup on unmount

**From `storage.ts`:**
- Success/error return pattern: `{ success: boolean; error?: Error }`
- Graceful degradation on storage failures

**Component patterns:**
- Arrow function exports
- Props destructuring
- Lucide icons for UI elements

### Integration Points

| Component | Integration | Direction |
|-----------|-------------|-----------|
| `useTasks` | `db.ts` (IndexedDB) | Read/Write local data |
| `useTasks` | `syncQueue.ts` | Queue operations when offline |
| `syncQueue` | Supabase | Replay operations when online |
| `useOnlineStatus` | Navigator API | Detect connectivity |
| `Header` | `useOnlineStatus` | Display status indicator |
| Service Worker | Vite build | Auto-generated from config |

---

## Development Context

### Relevant Existing Code

| File | Lines | Pattern to Reference |
|------|-------|---------------------|
| `src/hooks/useTasks.ts` | 96-391 | Full hook structure, Supabase integration |
| `src/hooks/useTasks.ts` | 106-139 | `fetchFromSupabase()` - data fetch pattern |
| `src/hooks/useTasks.ts` | 246-275 | `addTask()` - optimistic update + sync |
| `src/utils/storage.ts` | 14-28 | `saveState()` - error handling pattern |
| `src/lib/supabase.ts` | 1-17 | Supabase client initialization |
| `src/components/Header.tsx` | Full | Header layout for status indicator |

### Dependencies

**Framework/Libraries (to add):**

| Package | Version | Purpose |
|---------|---------|---------|
| vite-plugin-pwa | 0.21.1 | PWA + Service Worker generation |
| dexie | 4.0.10 | IndexedDB wrapper |
| dexie-react-hooks | 1.1.7 | React hooks for Dexie |

**Internal Modules:**
- `@/lib/supabase` - Existing Supabase client
- `@/hooks/useTasks` - Task state management (will be modified)
- `@/components/Header` - App header (will be modified)

### Configuration Changes

**`vite.config.ts`:**
```typescript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
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
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
})
```

**`index.html`:**
- Add `<link rel="manifest" href="/manifest.json">`
- Add `<meta name="theme-color" content="#0f172a">`
- Add Apple touch icon links

### Existing Conventions (Brownfield)

**Code Style:**
- TypeScript strict mode enabled
- ESLint with React hooks rules
- No semicolons (mixed - some files have them)
- 2-space indentation
- Single quotes for strings

**Test Patterns:**
- No test files currently in `today-app/src/`
- `tests/` directory referenced in architecture but not present
- For this feature: focus on integration tests for sync queue

**File Organization:**
- Hooks in `src/hooks/`
- Utilities in `src/utils/`
- Library code in `src/lib/`
- Components in `src/components/`
- Views in `src/views/`

### Test Framework & Standards

| Aspect | Standard |
|--------|----------|
| Framework | Vitest (referenced in architecture) |
| Test location | `tests/` or colocated `.test.ts` files |
| Mocking | Vitest mocks for IndexedDB, navigator.onLine |
| Coverage | Focus on sync queue logic |

---

## Implementation Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | Browser (Chrome, Safari, Firefox, Edge) | Latest 2 |
| Framework | React | 19.2.0 |
| Language | TypeScript | 5.9.3 |
| Build | Vite | 7.2.4 |
| PWA | vite-plugin-pwa | 0.21.1 |
| Offline DB | Dexie (IndexedDB) | 4.0.10 |
| Backend | Supabase | 2.89.0 |
| Styling | Tailwind CSS | 4.1.18 |

---

## Technical Details

### IndexedDB Schema

```typescript
// src/lib/db.ts
import Dexie, { type EntityTable } from 'dexie'

interface LocalTask {
  id: string
  user_id: string
  text: string
  created_at: string
  deferred_to: string | null
  category: string | null
  completed_at: string | null
  updated_at: string
  notes: TaskNotes | null
  _syncStatus: 'synced' | 'pending' | 'conflict'
  _localUpdatedAt: string
}

interface SyncQueueItem {
  id: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  entityId: string
  payload: string // JSON stringified
  createdAt: string
  retryCount: number
}

class TodayDatabase extends Dexie {
  tasks!: EntityTable<LocalTask, 'id'>
  syncQueue!: EntityTable<SyncQueueItem, 'id'>

  constructor() {
    super('today-app')
    this.version(1).stores({
      tasks: 'id, user_id, _syncStatus',
      syncQueue: 'id, createdAt',
    })
  }
}

export const db = new TodayDatabase()
```

### Sync Queue Logic

```typescript
// src/lib/syncQueue.ts

// 1. When offline, queue operations instead of calling Supabase
// 2. When online, process queue in order (FIFO)
// 3. Handle failures with exponential backoff (max 3 retries)
// 4. On success, remove from queue and mark task as synced

const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 5000, 15000] // ms

export async function processQueue(userId: string): Promise<SyncResult> {
  const items = await db.syncQueue.orderBy('createdAt').toArray()
  const results: SyncResult = { processed: 0, failed: 0, conflicts: 0 }

  for (const item of items) {
    try {
      await processSyncItem(item, userId)
      await db.syncQueue.delete(item.id)
      results.processed++
    } catch (error) {
      if (item.retryCount >= MAX_RETRIES) {
        // Move to dead letter / mark as conflict
        results.failed++
      } else {
        await db.syncQueue.update(item.id, { retryCount: item.retryCount + 1 })
      }
    }
  }

  return results
}
```

### Online/Offline Detection

```typescript
// src/hooks/useOnlineStatus.ts
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

### Conflict Resolution Strategy

**Last-Write-Wins with Timestamps:**

1. Every task has `updated_at` (server) and `_localUpdatedAt` (client)
2. When syncing a pending update:
   - Fetch current server version
   - Compare `updated_at` timestamps
   - If server is newer → discard local, use server
   - If local is newer → push local to server
3. For deletes: always apply (delete wins)
4. For inserts: always apply (no conflict possible)

**Edge Cases:**
- Same timestamp → server wins (arbitrary but consistent)
- Missing timestamp → treat as oldest
- Network error during sync → keep in queue, retry

---

## Development Setup

```bash
# Install new dependencies
cd today-app
npm install vite-plugin-pwa dexie dexie-react-hooks

# Generate PWA icons (using any PNG-to-icons tool)
# Place in public/: pwa-192x192.png, pwa-512x512.png, apple-touch-icon.png

# Development
npm run dev

# Build (generates service worker)
npm run build

# Preview PWA behavior
npm run preview
```

---

## Implementation Guide

### Setup Steps

1. Create feature branch: `git checkout -b feature/offline-pwa`
2. Install dependencies: `npm install vite-plugin-pwa dexie dexie-react-hooks`
3. Create PWA icons (192x192 and 512x512 PNG)
4. Verify dev environment: `npm run dev`

### Implementation Steps

**Story 1: PWA Foundation**
1. Update `vite.config.ts` with VitePWA plugin
2. Create `public/manifest.json` (or use inline in plugin)
3. Update `index.html` with manifest link and meta tags
4. Add PWA icons to `public/`
5. Verify PWA installable in Chrome DevTools

**Story 2: IndexedDB + Dexie Setup**
1. Create `src/lib/db.ts` with Dexie schema
2. Create migration from localStorage to IndexedDB
3. Update `useTasks.ts` to read/write from IndexedDB
4. Maintain localStorage as secondary backup
5. Test data persistence across refreshes

**Story 3: Sync Queue Implementation**
1. Create `src/lib/syncQueue.ts` with queue logic
2. Create `src/hooks/useSyncQueue.ts` hook
3. Modify `useTasks.ts` to queue operations when offline
4. Implement queue processing when online
5. Add retry logic with exponential backoff
6. Test offline → online sync flow

**Story 4: Offline UI + Conflict Resolution**
1. Create `src/hooks/useOnlineStatus.ts`
2. Create `src/components/SyncStatusBadge.tsx`
3. Update `Header.tsx` with offline indicator
4. Implement conflict detection and resolution
5. Add toast notifications for sync status
6. End-to-end testing of offline scenarios

### Testing Strategy

**Unit Tests:**
- `syncQueue.ts` - Queue operations, retry logic
- `db.ts` - IndexedDB CRUD operations
- `useOnlineStatus.ts` - Online/offline state changes

**Integration Tests:**
- Full offline → add task → go online → verify sync
- Conflict scenario: edit same task on two devices
- Queue processing with network failures

**Manual Testing Checklist:**
- [ ] Install PWA on Chrome desktop
- [ ] Install PWA on iOS Safari
- [ ] Install PWA on Android Chrome
- [ ] Add task while offline
- [ ] Edit task while offline
- [ ] Complete task while offline
- [ ] Go online and verify sync
- [ ] Verify offline indicator shows correctly
- [ ] Test with airplane mode on mobile

### Acceptance Criteria

**AC-7.1: PWA Installation**
- [ ] App installable via Chrome "Install" prompt
- [ ] App installable on iOS via "Add to Home Screen"
- [ ] Installed app opens in standalone mode (no browser UI)
- [ ] App icon displays correctly on home screen

**AC-7.2: Offline Access**
- [ ] App loads when device is offline (after first visit)
- [ ] All UI elements render correctly offline
- [ ] Static assets (fonts, icons) available offline

**AC-7.3: Offline Data Operations**
- [ ] User can add tasks while offline
- [ ] User can complete tasks while offline
- [ ] User can edit tasks while offline
- [ ] User can delete tasks while offline
- [ ] Changes persist in IndexedDB

**AC-7.4: Sync When Online**
- [ ] Pending changes sync automatically when online
- [ ] Sync indicator shows pending count
- [ ] Toast notification on successful sync
- [ ] Failed syncs retry with backoff

**AC-7.5: Offline Indicator**
- [ ] Header shows offline icon when disconnected
- [ ] Badge shows count of pending sync operations
- [ ] Status updates in real-time on connectivity change

---

## Developer Resources

### File Paths Reference

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/db.ts` | CREATE | IndexedDB schema with Dexie |
| `src/lib/syncQueue.ts` | CREATE | Offline sync queue logic |
| `src/hooks/useOnlineStatus.ts` | CREATE | Online/offline detection |
| `src/hooks/useSyncQueue.ts` | CREATE | Sync queue React hook |
| `src/components/SyncStatusBadge.tsx` | CREATE | Pending sync count badge |
| `src/hooks/useTasks.ts` | MODIFY | Use IndexedDB + queue |
| `src/components/Header.tsx` | MODIFY | Add offline indicator |
| `vite.config.ts` | MODIFY | Add VitePWA plugin |
| `index.html` | MODIFY | Add manifest, theme-color |
| `public/manifest.json` | CREATE | PWA manifest |
| `public/pwa-192x192.png` | CREATE | PWA icon |
| `public/pwa-512x512.png` | CREATE | PWA icon |

### Key Code Locations

| Function/Class | File | Line (approx) |
|----------------|------|---------------|
| `useTasks` hook | `src/hooks/useTasks.ts` | 96 |
| `fetchFromSupabase` | `src/hooks/useTasks.ts` | 106 |
| `addTask` | `src/hooks/useTasks.ts` | 246 |
| `supabase` client | `src/lib/supabase.ts` | 11 |
| `Header` component | `src/components/Header.tsx` | 1 |
| `saveState` | `src/utils/storage.ts` | 14 |

### Testing Locations

| Test Type | Location |
|-----------|----------|
| Unit tests | `tests/lib/` or `src/lib/*.test.ts` |
| Hook tests | `tests/hooks/` or `src/hooks/*.test.ts` |
| Integration | `tests/integration/` |

### Documentation to Update

- `README.md` - Add PWA installation instructions
- `notes/architecture.md` - Add offline architecture section

---

## UX/UI Considerations

### UI Components Affected

**Header.tsx - MODIFY:**
- Add offline indicator icon (cloud-off from Lucide)
- Add sync status badge with pending count
- Indicator should be subtle but visible

**New: SyncStatusBadge.tsx:**
- Small badge showing pending sync count
- Only visible when count > 0
- Click to show sync status modal (optional)

### Visual Design

**Offline Indicator States:**
| State | Icon | Color | Text |
|-------|------|-------|------|
| Online (synced) | Cloud | muted | Hidden |
| Online (syncing) | CloudUpload | primary | "Syncing..." |
| Online (pending) | CloudUpload | warning | Badge with count |
| Offline | CloudOff | destructive | "Offline" |

**Toast Messages:**
- "You're offline. Changes will sync when connected."
- "Back online! Syncing X changes..."
- "All changes synced."
- "Sync failed. Will retry automatically."

### Accessibility

- Offline indicator has `aria-label` describing status
- Badge count announced to screen readers
- Color not the only indicator (icon + text)

---

## Testing Approach

**Framework:** Vitest (as specified in architecture.md)

**Test Strategy:**

| Layer | What to Test | Approach |
|-------|--------------|----------|
| Unit | `syncQueue.ts` functions | Mock IndexedDB, test queue logic |
| Unit | `useOnlineStatus` hook | Mock navigator.onLine, test state |
| Integration | Full sync flow | Fake timers, mock Supabase |
| E2E | PWA installation | Manual or Playwright |

**Coverage Focus:**
- Sync queue: 90%+ (critical path)
- Online detection: 80%+
- IndexedDB operations: 80%+

---

## Deployment Strategy

### Deployment Steps

1. Merge feature branch to main
2. CI/CD builds with `npm run build`
3. Verify service worker generated in `dist/`
4. Deploy to Cloudflare Pages (existing)
5. Verify PWA installable on production
6. Monitor Supabase logs for sync traffic

### Rollback Plan

1. Revert to previous deployment in Cloudflare Pages
2. Service worker will auto-update on next visit
3. IndexedDB data preserved (migration handles both directions)
4. localStorage backup ensures no data loss

### Monitoring

- Supabase dashboard: Monitor API request patterns
- Browser DevTools: Service Worker status
- Console logs: Sync queue processing in dev mode
- User feedback: Installation success, sync issues

---

_Generated by BMAD Tech-Spec Workflow v6.0_
_Date: 2026-01-07_
_For: Vishal_
