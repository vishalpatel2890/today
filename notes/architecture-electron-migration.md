# Architecture - Today Electron Migration

## Executive Summary

This architecture defines a **dual-target build system** that produces both a PWA and an Electron desktop app from a single React/TypeScript codebase. The primary architectural goal is maintainability through clean separation: shared application code remains platform-agnostic, while Electron-specific capabilities (app tracking) are isolated in a dedicated `electron/` directory with IPC-based communication. The web build excludes all Electron code, and feature detection at runtime conditionally enables desktop-only UI.

## Project Initialization

First implementation story should execute:

```bash
# Install electron-vite (recommended for Vite-based React apps)
npm install -D electron electron-vite @electron-toolkit/preload @electron-toolkit/utils

# Add Electron entry points
mkdir -p electron
touch electron/main.ts electron/preload.ts

# Update package.json scripts (handled in implementation)
```

This establishes the Electron layer on top of the existing Vite + React stack:
- **electron-vite**: Unified build tool for main, preload, and renderer processes
- **@electron-toolkit/preload**: Secure IPC helpers with contextIsolation
- **@electron-toolkit/utils**: Platform detection and common utilities
- Existing React app becomes the renderer process with zero changes

---

## Decision Summary

| Category | Decision | Version | Affects FRs | Rationale |
|----------|----------|---------|-------------|-----------|
| Electron Framework | Electron | 33.x (latest stable) | All Electron FRs | Industry standard, excellent macOS support |
| Build Tooling | electron-vite | 2.x | FR1-5 | Native Vite integration, single config extends existing |
| IPC Bridge | @electron-toolkit/preload | Latest | FR6-9, FR10-15 | Type-safe IPC with contextIsolation |
| App Tracking | NSWorkspace + Accessibility APIs | macOS native | FR10-15 | Only reliable way to get window titles on macOS |
| Activity Storage | Dexie (existing) | 4.x | FR16-19 | Reuse existing IndexedDB abstraction, Electron-only store |
| Feature Detection | Runtime check | N/A | FR6-9 | `window.electronAPI` presence check |
| Web Build | Vite (existing) | 7.x | FR4, FR8-9 | Unchanged, Electron code excluded via config |
| Platform Target | macOS arm64 + x64 | N/A | All | Personal use, universal binary |

---

## Project Structure

```
today-app/
├── index.html                      # Web entry point (unchanged)
├── package.json                    # Updated with Electron scripts
├── tsconfig.json                   # Unchanged
├── tsconfig.node.json              # Unchanged
├── vite.config.ts                  # Web-only build (unchanged)
├── electron.vite.config.ts         # NEW: Electron build config
├── electron/                       # NEW: Electron-specific code
│   ├── main.ts                     # Main process entry
│   ├── preload.ts                  # Preload script (IPC bridge)
│   ├── activity/                   # App tracking module
│   │   ├── tracker.ts              # NSWorkspace/Accessibility polling
│   │   ├── types.ts                # Activity log types
│   │   └── store.ts                # Activity persistence helpers
│   └── ipc/                        # IPC handlers
│       ├── handlers.ts             # Main process IPC handlers
│       └── channels.ts             # Type-safe channel definitions
├── src/                            # Shared React application (95%+ unchanged)
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Root component
│   ├── lib/
│   │   ├── platform.ts             # NEW: Runtime platform detection
│   │   └── electronBridge.ts       # NEW: Type-safe wrapper for electronAPI
│   ├── components/
│   │   └── time-tracking/
│   │       ├── ActivityLogModal.tsx    # NEW: Electron-only activity viewer
│   │       ├── ViewActivityButton.tsx  # NEW: Conditional button
│   │       └── ...existing...
│   ├── hooks/
│   │   ├── useActivityLog.ts       # NEW: Electron-only hook
│   │   └── ...existing...
│   └── types/
│       ├── electron.d.ts           # NEW: Window.electronAPI types
│       └── ...existing...
├── resources/                      # NEW: Electron app resources
│   └── icon.icns                   # macOS app icon
├── dist/                           # Web build output (unchanged)
├── dist-electron/                  # NEW: Electron build output
│   ├── main/
│   ├── preload/
│   └── renderer/
└── release/                        # NEW: Packaged app output
    └── Today.app
```

---

## FR Category to Architecture Mapping

| FR Category | Architecture Component(s) | Files |
|-------------|--------------------------|-------|
| Build & Development (FR1-5) | electron-vite config, npm scripts | `electron.vite.config.ts`, `package.json` |
| Feature Detection (FR6-9) | Platform module, conditional rendering | `src/lib/platform.ts`, component guards |
| Activity Capture (FR10-15) | Main process tracker, IPC handlers | `electron/activity/tracker.ts`, `electron/ipc/` |
| Activity Storage (FR16-19) | Dexie store (Electron-only table) | `electron/activity/store.ts`, `src/lib/db.ts` |
| Activity Viewing (FR20-23) | React components, useActivityLog hook | `src/components/time-tracking/ActivityLogModal.tsx` |
| Activity Export (FR24-26) | Main process file dialog, IPC | `electron/ipc/handlers.ts` |
| Existing Functionality (FR27-30) | Unchanged shared code | All existing `src/` files |

---

## Technology Stack Details

### Core Technologies

**Electron 33 (Latest Stable)**
- Chromium 130 / Node.js 20
- contextIsolation: true (security requirement)
- nodeIntegration: false (security requirement)
- macOS universal binary support

**electron-vite 2.x**
- Extends existing Vite config
- Separate configs for main/preload/renderer
- HMR in renderer during development
- Tree-shaking for production builds

**macOS App Tracking APIs**
- `NSWorkspace.shared.frontmostApplication` for app name
- Accessibility API for window titles (requires permission)
- 5-second polling interval during active tracking

### Integration Points

| Component A | Component B | Integration Method |
|-------------|-------------|-------------------|
| React App | Electron Main | IPC via preload bridge |
| Time Tracking Hook | Activity Tracker | IPC: `activity:start`, `activity:stop` |
| Activity Log Modal | Activity Store | IPC: `activity:getLog` |
| Export Button | File System | IPC: `activity:export` with dialog |
| Platform Detection | UI Rendering | `isElectron()` guard in JSX |

---

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

### IPC Channel Naming

**Convention:** `domain:action` in kebab-case
```typescript
// CORRECT
'activity:start'
'activity:stop'
'activity:get-log'
'activity:export'

// INCORRECT
'startActivity'
'ACTIVITY_START'
```

### Preload Script Pattern

**All IPC exposed via contextBridge MUST:**
- Use typed channel names from `channels.ts`
- Return Promises for async operations
- Never expose Node.js APIs directly

```typescript
// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from './ipc/channels';

contextBridge.exposeInMainWorld('electronAPI', {
  activity: {
    start: (timeEntryId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.ACTIVITY_START, timeEntryId),
    stop: () =>
      ipcRenderer.invoke(IPC_CHANNELS.ACTIVITY_STOP),
    getLog: (timeEntryId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.ACTIVITY_GET_LOG, timeEntryId),
    export: (timeEntryId: string, format: 'json' | 'csv') =>
      ipcRenderer.invoke(IPC_CHANNELS.ACTIVITY_EXPORT, timeEntryId, format),
  },
});
```

### Feature Detection Pattern

**All Electron-only UI MUST use this pattern:**

```typescript
// src/lib/platform.ts
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' &&
         'electronAPI' in window &&
         window.electronAPI !== undefined;
};

// Usage in components
import { isElectron } from '@/lib/platform';

export const TimeEntryActions = ({ entry }: Props) => {
  return (
    <div>
      <EditButton entry={entry} />
      {isElectron() && <ViewActivityButton entryId={entry.id} />}
    </div>
  );
};
```

### Activity Data Storage Pattern

**Activity logs stored in separate Dexie table (Electron-only):**

```typescript
// Extend existing db.ts
interface ActivityEntry {
  id: string;
  timeEntryId: string;
  timestamp: string;      // ISO 8601
  appName: string;
  windowTitle: string;
}

// Only accessed in Electron context
db.version(X).stores({
  ...existingStores,
  activityLogs: '++id, timeEntryId, timestamp',
});
```

### Build Configuration Pattern

**electron.vite.config.ts structure:**

```typescript
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist-electron/main',
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist-electron/preload',
    },
  },
  renderer: {
    // Reuse existing vite.config.ts settings
    plugins: [react()],
    build: {
      outDir: 'dist-electron/renderer',
    },
  },
});
```

---

## Consistency Rules

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| IPC Channels | kebab-case with colon | `activity:get-log` |
| Electron files | kebab-case | `electron/activity/tracker.ts` |
| Type definitions | PascalCase | `ActivityEntry`, `ElectronAPI` |
| Feature flags | camelCase function | `isElectron()` |

### Code Organization

- **electron/**: All Electron-specific code (main process, preload)
- **src/lib/platform.ts**: Single source of truth for platform detection
- **src/lib/electronBridge.ts**: Type-safe wrapper for window.electronAPI
- **src/types/electron.d.ts**: Global type augmentation for Window

### Error Handling

**Main Process Errors:**
```typescript
ipcMain.handle(channel, async (event, ...args) => {
  try {
    return { success: true, data: await doWork(...args) };
  } catch (error) {
    console.error(`[Electron] ${channel} error:`, error);
    return { success: false, error: error.message };
  }
});
```

**Renderer Error Handling:**
```typescript
const result = await window.electronAPI.activity.getLog(id);
if (!result.success) {
  showToast(`Failed to load activity: ${result.error}`);
  return;
}
```

### Logging Strategy

**Main Process:** Node.js console with prefix
```typescript
console.log('[Electron/Main]', message);
console.log('[Electron/Activity]', message);
```

**Renderer:** Existing pattern (dev mode only)
```typescript
if (import.meta.env.DEV) {
  console.log('[Today]', message);
}
```

---

## Data Architecture

### Activity Log Schema

```typescript
interface ActivityEntry {
  id: string;                    // Auto-generated
  timeEntryId: string;           // Links to time_entries table
  timestamp: string;             // ISO 8601 when activity changed
  appName: string;               // e.g., "Visual Studio Code"
  windowTitle: string;           // e.g., "App.tsx - today-app"
  durationMs?: number;           // Calculated when next entry recorded
}

interface ActivitySession {
  timeEntryId: string;
  startedAt: string;
  endedAt: string | null;
  entries: ActivityEntry[];
}
```

### Storage Locations

| Data Type | Storage | Sync |
|-----------|---------|------|
| Tasks | IndexedDB (Dexie) | Supabase |
| Time Entries | IndexedDB (Dexie) | Supabase |
| Activity Logs | IndexedDB (Dexie) | **Never** (local only) |
| User Preferences | localStorage | No |

---

## API Contracts

### IPC Contracts (Main ↔ Renderer)

**activity:start**
```typescript
// Request
invoke('activity:start', timeEntryId: string)

// Response
{ success: true } | { success: false, error: string }
```

**activity:stop**
```typescript
// Request
invoke('activity:stop')

// Response
{ success: true, entriesRecorded: number } | { success: false, error: string }
```

**activity:get-log**
```typescript
// Request
invoke('activity:get-log', timeEntryId: string)

// Response
{ success: true, data: ActivityEntry[] } | { success: false, error: string }
```

**activity:export**
```typescript
// Request
invoke('activity:export', timeEntryId: string, format: 'json' | 'csv')

// Response
{ success: true, filePath: string } | { success: false, error: string }
// Note: Uses native file dialog, user picks location
```

---

## Security Architecture

### Electron Security Hardening

**BrowserWindow Configuration:**
```typescript
new BrowserWindow({
  webPreferences: {
    contextIsolation: true,      // REQUIRED
    nodeIntegration: false,      // REQUIRED
    sandbox: true,               // Additional protection
    preload: path.join(__dirname, 'preload.js'),
  },
});
```

### Permission Model

| Permission | Required | Purpose |
|------------|----------|---------|
| Accessibility | Yes | Read window titles from other apps |
| Screen Recording | No | Not needed for this feature |
| Full Disk Access | No | Only IndexedDB storage used |

**First-run permission prompt:**
- Electron app detects missing Accessibility permission
- Shows in-app guidance to enable in System Preferences
- Gracefully degrades: captures app names only if permission denied

### Data Privacy

- Activity data **never** leaves the device
- No network requests from Electron-specific code
- Supabase sync explicitly excludes activity tables
- Export creates local files only

---

## Performance Considerations

| NFR | Implementation |
|-----|----------------|
| Activity polling < 1% CPU | 5-second interval, lightweight NSWorkspace calls |
| Electron startup < 3s | Lazy-load activity module, minimal main process |
| Activity query < 100ms | Dexie indexed queries on timeEntryId |
| Web bundle unchanged | Vite tree-shaking, Electron code in separate entry |

### Bundle Size Impact

- **Web build:** 0 KB increase (Electron code excluded)
- **Electron main:** ~50 KB (activity tracker + IPC)
- **Electron preload:** ~5 KB (bridge only)
- **Electron renderer:** Same as web build + electron types

---

## Deployment Architecture

### Build Outputs

```bash
# Web deployment (unchanged)
npm run build:web        # → dist/

# Electron development
npm run dev:electron     # Launches Electron with HMR

# Electron production
npm run build:electron   # → dist-electron/
npm run package          # → release/Today.app (macOS universal)
```

### Package Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "dev:electron": "electron-vite dev",
    "build": "vite build",
    "build:electron": "electron-vite build",
    "package": "electron-vite build && electron-builder --mac --universal",
    "preview": "vite preview"
  }
}
```

### Distribution

**MVP: Personal use only**
- No code signing (runs with security warning)
- No auto-update infrastructure
- Manual copy to /Applications
- DMG creation optional (drag-to-install convenience)

---

## Development Environment

### Prerequisites

- Node.js 20+ (matches Electron's Node version)
- npm 10+
- Xcode Command Line Tools (for native modules)
- macOS 12+ (for Accessibility API)

### Setup Commands

```bash
# Install dependencies (including new Electron deps)
npm install

# Run web app (unchanged)
npm run dev

# Run Electron app
npm run dev:electron

# Build both targets
npm run build && npm run build:electron

# Package macOS app
npm run package
```

### First-Time Electron Setup

1. Grant Accessibility permission when prompted
2. App will show guidance if permission missing
3. Activity tracking works after permission granted

---

## Architecture Decision Records (ADRs)

### ADR-006: electron-vite over Electron Forge

**Context:** Need to integrate Electron with existing Vite-based React app.

**Decision:** Use electron-vite instead of Electron Forge.

**Rationale:**
- Native Vite integration (Forge uses Webpack by default)
- Simpler config: extends existing vite.config.ts
- Same HMR experience developers already know
- Better tree-shaking for production builds

**Consequences:**
- May need to add electron-builder separately for advanced packaging
- Less "batteries included" than Forge

---

### ADR-007: IPC-Only Communication

**Context:** React app needs to trigger native macOS APIs.

**Decision:** All communication via IPC with typed channels.

**Rationale:**
- Security: contextIsolation prevents direct Node access
- Type safety: Shared channel/payload types
- Testability: Can mock electronAPI in web tests
- Clean separation: React doesn't know about Electron internals

**Consequences:**
- Slightly more boilerplate for new IPC calls
- Need to maintain type definitions for bridge

---

### ADR-008: Activity Data in IndexedDB (not SQLite)

**Context:** Need to store activity logs in Electron app.

**Decision:** Use existing Dexie/IndexedDB setup, not native SQLite.

**Rationale:**
- Consistent with existing storage pattern
- No additional native module complexity
- Dexie already handles migrations, queries
- Activity data is simple (no complex joins needed)

**Consequences:**
- Can't share DB directly with main process (must go through renderer)
- Slightly less performant than SQLite for huge datasets (acceptable for personal use)

---

### ADR-009: macOS-Only MVP

**Context:** PRD specifies macOS as primary target.

**Decision:** Build macOS-only for MVP, no Windows/Linux abstraction.

**Rationale:**
- Simpler implementation (no cross-platform app tracking)
- User's primary machine is macOS
- Can add platform abstraction later if needed
- Avoid premature complexity

**Consequences:**
- Activity tracking code is macOS-specific
- Would need refactoring to add Windows/Linux support

---

### ADR-010: No Signing/Notarization for MVP

**Context:** App is for personal use only.

**Decision:** Skip code signing and Apple notarization.

**Rationale:**
- Personal use only, not distributed
- Eliminates Apple Developer Program cost
- Faster iteration without signing delays
- User can right-click → Open to bypass Gatekeeper

**Consequences:**
- macOS will show "unidentified developer" warning
- Would need to implement signing for any distribution

---

## Validation Checklist

- [x] Decision table has Version column with specific versions
- [x] Every FR category is mapped to architecture components
- [x] Source tree is complete, not generic
- [x] No placeholder text remains
- [x] All 30 FRs from PRD have architectural support
- [x] All 11 NFRs from PRD are addressed
- [x] Implementation patterns cover all potential conflicts
- [x] IPC contracts fully specified
- [x] Security requirements met (contextIsolation, no nodeIntegration)
- [x] Build commands documented for both targets

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2026-01-11_
_For: Vishal_
