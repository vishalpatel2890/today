# Epic Technical Specification: Feature Detection & IPC Bridge

Date: 2026-01-11
Author: Vishal
Epic ID: 2 (Electron Migration)
Status: Draft

---

## Overview

Epic 2 establishes the communication bridge between the React renderer process and Electron's main process, enabling conditional rendering of desktop-only features while keeping the web app unchanged. This epic builds on the Electron foundation from Epic 1 to create the IPC infrastructure required for activity tracking in Epics 3-4.

The primary deliverable is a type-safe IPC bridge (`window.electronAPI`) with platform detection utilities that allow React components to conditionally render desktop-only UI. When running in a browser, the web app looks and behaves exactly as before. When running in Electron, additional UI elements (like "View Activity" buttons) appear on time entries.

**User Value:** The app intelligently shows desktop features only when running in Electron, while the web version remains identical to before. This validates the feature flag architecture before building the actual activity tracking functionality.

## Objectives and Scope

### In Scope (Epic 2)

- **FR6**: Runtime detection of Electron vs browser environment (`isElectron()`)
- **FR7**: Conditional rendering of desktop-only UI elements
- **FR8**: Web app functions identically when not in Electron

### Out of Scope (Epic 2)

- Electron project setup and build pipeline (Epic 1 - DONE)
- Activity tracking capture implementation (Epic 3)
- Activity viewing modal and export (Epic 4)
- Actual IPC handler implementations (stubs only in Epic 2)
- Windows/Linux platform support (Future)

## System Architecture Alignment

### Architecture Reference

This epic implements the feature detection and IPC layers from `notes/architecture-electron-migration.md`:

| Decision | Epic 2 Implementation |
|----------|----------------------|
| ADR-007: IPC-Only Communication | Type-safe channels via contextBridge |
| Feature Detection Pattern | `src/lib/platform.ts` with `isElectron()` |
| IPC Channel Naming | `domain:action` kebab-case convention |
| Security | contextIsolation: true, nodeIntegration: false |

### Components Introduced

| Component | Purpose | Location |
|-----------|---------|----------|
| `src/lib/platform.ts` | Runtime platform detection | `src/lib/` |
| `src/lib/electronBridge.ts` | Type-safe wrapper for window.electronAPI | `src/lib/` |
| `src/types/electron.d.ts` | TypeScript augmentation for Window | `src/types/` |
| `electron/ipc/channels.ts` | IPC channel name constants | `electron/ipc/` |
| `electron/ipc/handlers.ts` | Main process IPC handlers (stubs) | `electron/ipc/` |
| `src/components/time-tracking/ViewActivityButton.tsx` | Electron-only button component | `src/components/` |

### Project Structure After Epic 2

```
today-app/
├── electron/
│   ├── main.ts                     # Updated: register IPC handlers
│   ├── preload.ts                  # Updated: expose electronAPI via contextBridge
│   └── ipc/                        # NEW: IPC infrastructure
│       ├── channels.ts             # Channel name constants
│       └── handlers.ts             # IPC handlers (stubs)
├── src/
│   ├── lib/
│   │   ├── platform.ts             # NEW: isElectron() detection
│   │   └── electronBridge.ts       # NEW: Type-safe electronAPI wrapper
│   ├── types/
│   │   └── electron.d.ts           # NEW: Window.electronAPI types
│   └── components/
│       └── time-tracking/
│           ├── ViewActivityButton.tsx  # NEW: Conditional desktop button
│           └── ...existing...
├── dist/                           # Web build (no Electron code)
└── dist-electron/                  # Electron build
```

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs |
|--------|---------------|--------|---------|
| **src/lib/platform.ts** | Runtime detection of Electron environment | None | `isElectron(): boolean` |
| **src/lib/electronBridge.ts** | Type-safe wrapper for window.electronAPI calls | Method params | Typed Promise responses |
| **electron/ipc/channels.ts** | Central registry of IPC channel names | None | Channel name constants |
| **electron/ipc/handlers.ts** | Main process IPC handler registration | IPC events | Stub responses `{ success: true }` |
| **electron/preload.ts** | contextBridge exposure of electronAPI | IPC renderer | window.electronAPI object |
| **ViewActivityButton.tsx** | Electron-only UI button (placeholder) | timeEntryId | Button element (no action yet) |

**Module Interaction Flow:**

```
React Component (renderer)
    │
    ├── Calls isElectron() from platform.ts
    │   └── Returns true/false based on window.electronAPI presence
    │
    ├── If Electron, renders ViewActivityButton
    │   └── Button calls electronBridge.activity.start()
    │       └── electronBridge wraps window.electronAPI.activity.start()
    │           └── Invokes IPC channel 'activity:start'
    │               └── Main process handler returns { success: true }
    │
    └── If Browser, renders nothing (web unchanged)
```

### Data Models and Contracts

**Epic 2 introduces no persistent data models.** This epic focuses on IPC infrastructure with stub responses.

**Type Definitions:**

```typescript
// src/types/electron.d.ts - Window augmentation
interface ElectronAPI {
  activity: {
    start: (timeEntryId: string) => Promise<IPCResponse>;
    stop: () => Promise<IPCResponse<{ entriesRecorded: number }>>;
    getLog: (timeEntryId: string) => Promise<IPCResponse<ActivityEntry[]>>;
    export: (timeEntryId: string, format: 'json' | 'csv') => Promise<IPCResponse<{ filePath: string }>>;
  };
}

interface IPCResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Placeholder - full definition in Epic 3
interface ActivityEntry {
  id: string;
  timeEntryId: string;
  timestamp: string;
  appName: string;
  windowTitle: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
```

```typescript
// electron/ipc/channels.ts - Channel constants
export const IPC_CHANNELS = {
  ACTIVITY_START: 'activity:start',
  ACTIVITY_STOP: 'activity:stop',
  ACTIVITY_GET_LOG: 'activity:get-log',
  ACTIVITY_EXPORT: 'activity:export',
} as const;
```

### APIs and Interfaces

**IPC Bridge API (window.electronAPI):**

All methods return Promises and follow the `IPCResponse` pattern for consistent error handling.

| Method | Channel | Request | Response | Epic 2 Behavior |
|--------|---------|---------|----------|-----------------|
| `activity.start(timeEntryId)` | `activity:start` | `string` | `{ success: true }` | Stub - returns success |
| `activity.stop()` | `activity:stop` | None | `{ success: true, data: { entriesRecorded: 0 } }` | Stub - returns success |
| `activity.getLog(timeEntryId)` | `activity:get-log` | `string` | `{ success: true, data: [] }` | Stub - returns empty array |
| `activity.export(timeEntryId, format)` | `activity:export` | `string, 'json'|'csv'` | `{ success: true, data: { filePath: '' } }` | Stub - returns success |

**Platform Detection API (src/lib/platform.ts):**

```typescript
/**
 * Detects if the app is running in Electron environment
 * @returns true if window.electronAPI is present
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' &&
         'electronAPI' in window &&
         window.electronAPI !== undefined;
}
```

**Electron Bridge API (src/lib/electronBridge.ts):**

```typescript
/**
 * Type-safe wrapper for Electron IPC calls
 * Provides fallback behavior for web context
 */
export const electronBridge = {
  activity: {
    start: async (timeEntryId: string): Promise<IPCResponse> => {
      if (!isElectron()) return { success: false, error: 'Not in Electron' };
      return window.electronAPI!.activity.start(timeEntryId);
    },
    stop: async (): Promise<IPCResponse<{ entriesRecorded: number }>> => {
      if (!isElectron()) return { success: false, error: 'Not in Electron' };
      return window.electronAPI!.activity.stop();
    },
    getLog: async (timeEntryId: string): Promise<IPCResponse<ActivityEntry[]>> => {
      if (!isElectron()) return { success: false, error: 'Not in Electron' };
      return window.electronAPI!.activity.getLog(timeEntryId);
    },
    export: async (timeEntryId: string, format: 'json' | 'csv'): Promise<IPCResponse<{ filePath: string }>> => {
      if (!isElectron()) return { success: false, error: 'Not in Electron' };
      return window.electronAPI!.activity.export(timeEntryId, format);
    },
  },
};
```

### Workflows and Sequencing

**Flow 1: Platform Detection at Component Render**

```
React component renders
    │
    ▼
Component calls isElectron()
    │
    ├── Check: typeof window !== 'undefined'
    │   └── Handles SSR/build case → false
    │
    ├── Check: 'electronAPI' in window
    │   └── Handles browser case → false
    │
    └── Check: window.electronAPI !== undefined
        └── Electron case → true
    │
    ▼
Conditional rendering based on result
    ├── true: Render desktop-only UI (ViewActivityButton)
    └── false: Render nothing (web unchanged)
```

**Flow 2: IPC Call from Renderer to Main**

```
React calls electronBridge.activity.start('abc123')
    │
    ▼
electronBridge checks isElectron()
    ├── false: Returns { success: false, error: 'Not in Electron' }
    └── true: Continues...
    │
    ▼
Calls window.electronAPI.activity.start('abc123')
    │
    ▼
Preload script (contextBridge) routes to ipcRenderer.invoke
    │
    ▼
ipcRenderer.invoke('activity:start', 'abc123')
    │
    ▼
Main process ipcMain.handle receives request
    │
    ▼
Handler in handlers.ts processes request (stub: return success)
    │
    ▼
Response flows back: Main → Preload → Renderer → electronBridge
    │
    ▼
React receives { success: true }
```

**Flow 3: ViewActivityButton Rendering**

```
TimeEntryItem component renders for completed entry
    │
    ▼
Checks isElectron() in JSX
    │
    ├── false (browser): Renders only existing buttons
    │
    └── true (Electron): Renders ViewActivityButton
        │
        ▼
        User sees "View Activity" button on time entry
        │
        ▼
        Click handler (placeholder in Epic 2):
            └── console.log('[Epic 2] View Activity clicked - modal in Epic 4')
```

## Non-Functional Requirements

### Performance

| NFR | Target | Implementation | Source |
|-----|--------|----------------|--------|
| **isElectron() cost** | < 1ms | Simple property check, no async | Architecture |
| **IPC round-trip** | < 10ms | electron-vite optimized IPC | Architecture |
| **NFR4: Web bundle unchanged** | 0 KB increase | Electron code in separate entry, tree-shaking | PRD NFR4 |
| **Conditional render cost** | Negligible | Single boolean check in JSX | Best practice |

**Implementation Notes:**
- `isElectron()` is synchronous and performs only property checks
- IPC stubs return immediately (no async work in Epic 2)
- Web build excludes all `electron/` code via electron-vite configuration
- ViewActivityButton component tree-shaken from web build (never imported in web path)

### Security

| NFR | Implementation | Source |
|-----|----------------|--------|
| **NFR7: contextIsolation** | `contextIsolation: true` in BrowserWindow (Epic 1) | PRD NFR7 |
| **NFR7: No nodeIntegration** | `nodeIntegration: false` in BrowserWindow (Epic 1) | PRD NFR7 |
| **Typed IPC channels** | Channel names as const enum, no arbitrary string invocation | Architecture ADR-007 |
| **No sensitive data in IPC** | Stubs only; real data handled in Epic 3 | Best practice |

**Preload Script Security Pattern:**

```typescript
// electron/preload.ts - ONLY expose defined methods
contextBridge.exposeInMainWorld('electronAPI', {
  activity: {
    start: (timeEntryId: string) => ipcRenderer.invoke(IPC_CHANNELS.ACTIVITY_START, timeEntryId),
    stop: () => ipcRenderer.invoke(IPC_CHANNELS.ACTIVITY_STOP),
    getLog: (timeEntryId: string) => ipcRenderer.invoke(IPC_CHANNELS.ACTIVITY_GET_LOG, timeEntryId),
    export: (timeEntryId: string, format: 'json' | 'csv') =>
      ipcRenderer.invoke(IPC_CHANNELS.ACTIVITY_EXPORT, timeEntryId, format),
  },
});
// NO direct ipcRenderer exposure
// NO arbitrary channel invocation
```

### Reliability/Availability

| NFR | Target | Implementation | Source |
|-----|--------|----------------|--------|
| **Web continuity** | Zero regression | isElectron() returns false in browser, no desktop code runs | PRD FR8 |
| **Graceful degradation** | electronBridge returns error if not in Electron | Architecture |
| **Type safety** | TypeScript catches misuse at compile time | Best practice |
| **Build isolation** | Electron build failure doesn't affect web build | Architecture |

**Error Handling Pattern:**

```typescript
// Safe call pattern - always works in both contexts
const result = await electronBridge.activity.getLog(entryId);
if (!result.success) {
  // In web: error = 'Not in Electron' (expected)
  // In Electron: error = actual error message
  console.warn('Activity log unavailable:', result.error);
  return;
}
// Use result.data
```

### Observability

| Signal | Implementation | Purpose |
|--------|----------------|---------|
| **IPC logging (main)** | `console.log('[Electron/IPC]', channel, args)` | Debug IPC calls |
| **Platform detection logging** | `console.log('[Platform]', isElectron())` on first call | Verify detection |
| **Stub responses** | Log in development mode only | Verify bridge working |

**Development Mode Logging:**

```typescript
// electron/ipc/handlers.ts
ipcMain.handle(IPC_CHANNELS.ACTIVITY_START, async (event, timeEntryId: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Electron/IPC] activity:start', { timeEntryId });
  }
  // Stub implementation
  return { success: true };
});
```

## Dependencies and Integrations

### Dependencies From Epic 1 (Required)

Epic 2 builds on the Electron foundation established in Epic 1. These are prerequisites:

| Dependency | Version | Installed In | Used By Epic 2 |
|------------|---------|--------------|----------------|
| `electron` | ^39.x | Epic 1 | IPC main handlers |
| `electron-vite` | ^5.x | Epic 1 | Build tooling |
| `@electron-toolkit/preload` | ^3.x | Epic 1 | contextBridge helpers |

### No New Dependencies Required

**Epic 2 introduces no new npm dependencies.** All required packages were installed in Epic 1. This epic focuses on code organization and type definitions.

### Existing Dependencies Used

| Dependency | Version | Usage in Epic 2 |
|------------|---------|-----------------|
| `react` | ^19.2.0 | ViewActivityButton component |
| `lucide-react` | ^0.562.0 | Activity icon for button |
| `typescript` | ~5.9.3 | Type definitions for IPC |

### Internal Module Dependencies

| Module | Depends On | Integration Point |
|--------|------------|-------------------|
| `src/lib/electronBridge.ts` | `src/lib/platform.ts` | Calls `isElectron()` |
| `src/lib/electronBridge.ts` | `src/types/electron.d.ts` | Type definitions |
| `electron/preload.ts` | `electron/ipc/channels.ts` | Channel constants |
| `electron/main.ts` | `electron/ipc/handlers.ts` | Handler registration |
| `ViewActivityButton.tsx` | `src/lib/platform.ts` | Conditional import |

### Integration Points with Existing Code

**Files Modified:**

| File | Change | Reason |
|------|--------|--------|
| `electron/main.ts` | Import and call `registerIpcHandlers()` | Enable IPC |
| `electron/preload.ts` | Add electronAPI via contextBridge | Expose IPC to renderer |
| Time entry component | Add conditional ViewActivityButton | Desktop-only UI |

**Files Added:**

| File | Purpose |
|------|---------|
| `electron/ipc/channels.ts` | IPC channel constants |
| `electron/ipc/handlers.ts` | Main process IPC handlers (stubs) |
| `src/lib/platform.ts` | `isElectron()` detection |
| `src/lib/electronBridge.ts` | Type-safe IPC wrapper |
| `src/types/electron.d.ts` | Window.electronAPI types |
| `src/components/time-tracking/ViewActivityButton.tsx` | Desktop-only button |

**Files Unchanged:**

- `vite.config.ts` - Web build configuration
- `electron.vite.config.ts` - Already configured in Epic 1
- `package.json` - No new dependencies or scripts
- All other `src/**/*` files - Only time entry component modified

## Acceptance Criteria (Authoritative)

### AC1: Platform Detection Utility (Story 2.1)

- **AC1.1**: `src/lib/platform.ts` exports an `isElectron()` function
- **AC1.2**: In Electron: `isElectron()` returns `true`
- **AC1.3**: In web browser: `isElectron()` returns `false`
- **AC1.4**: TypeScript types are correct (function returns `boolean`)
- **AC1.5**: Function handles SSR/build case (`typeof window === 'undefined'`) gracefully
- **AC1.6**: Function works during Vite build without errors

### AC2: IPC Bridge Setup (Story 2.2)

- **AC2.1**: `window.electronAPI` is available in Electron renderer context
- **AC2.2**: `window.electronAPI.activity.start(timeEntryId)` returns `Promise<{ success: true }>`
- **AC2.3**: `window.electronAPI.activity.stop()` returns `Promise<{ success: true, data: { entriesRecorded: 0 } }>`
- **AC2.4**: `window.electronAPI.activity.getLog(timeEntryId)` returns `Promise<{ success: true, data: [] }>`
- **AC2.5**: `window.electronAPI.activity.export(timeEntryId, format)` returns `Promise<{ success: true, data: { filePath: '' } }>`
- **AC2.6**: TypeScript recognizes `window.electronAPI` with correct method types
- **AC2.7**: `contextIsolation: true` is enabled (security requirement)
- **AC2.8**: `nodeIntegration: false` is enabled (security requirement)
- **AC2.9**: IPC channel names follow `domain:action` kebab-case convention

### AC3: Conditional UI Rendering (Story 2.3)

- **AC3.1**: In Electron, completed time entries show a "View Activity" button
- **AC3.2**: In web browser, the same time entries do NOT show a "View Activity" button
- **AC3.3**: The button uses existing Tailwind design patterns (consistent styling)
- **AC3.4**: Clicking the button logs a placeholder message (no modal yet - Epic 4)
- **AC3.5**: Web build bundle size is unchanged (no Electron code included)
- **AC3.6**: Running `grep -r "electronAPI" dist/` returns no matches

### AC4: Web Continuity (Cross-cutting)

- **AC4.1**: All existing task management features work unchanged in web browser
- **AC4.2**: All existing time tracking features work unchanged in web browser
- **AC4.3**: `npm run dev` serves web app at localhost:5173 with no errors
- **AC4.4**: `npm run build` produces web-only output in `dist/`
- **AC4.5**: Supabase sync continues to work (no regression)

## Traceability Mapping

| AC | FR(s) | Spec Section | Component(s) | Test Approach |
|----|-------|--------------|--------------|---------------|
| AC1.1-1.6 | FR6 | Platform Detection API | `src/lib/platform.ts` | Manual: test in Electron + browser DevTools |
| AC2.1-2.9 | FR6, FR7 | APIs and Interfaces | `electron/preload.ts`, `electron/ipc/` | Manual: invoke methods in DevTools console |
| AC3.1-3.6 | FR7, FR8 | Workflows: Flow 3 | `ViewActivityButton.tsx`, time entry component | Manual: visual check in both environments |
| AC4.1-4.5 | FR8, FR27-30 | Reliability | All existing `src/` | Manual: regression test web app |

### FR to Story Mapping

| FR | Description | Story | Acceptance Criteria |
|----|-------------|-------|---------------------|
| FR6 | Runtime Electron detection | Story 2.1, 2.2 | AC1.1-1.6, AC2.1-2.9 |
| FR7 | Conditional desktop UI | Story 2.3 | AC3.1-3.6 |
| FR8 | Web unchanged | Story 2.1, 2.3 | AC1.3, AC3.2, AC4.1-4.5 |

## Risks, Assumptions, Open Questions

### Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R1 | ViewActivityButton not tree-shaken from web build | Medium | High | Verify with `grep -r "ViewActivity" dist/`; ensure no direct import in web code path |
| R2 | TypeScript global augmentation conflicts | Low | Medium | Use module augmentation pattern; test with `tsc -b` |
| R3 | IPC channel names mismatch between main/preload | Medium | High | Use shared constants file `channels.ts`; TypeScript catches mismatches |
| R4 | isElectron() false positive in other Electron apps | Low | Low | Check specifically for `window.electronAPI` presence, not generic Electron detection |

### Assumptions

| ID | Assumption | Validation |
|----|------------|------------|
| A1 | Epic 1 completed successfully (Electron foundation exists) | Verify `npm run dev:electron` works before starting Epic 2 |
| A2 | Time entry component has identifiable location for button | Review existing component structure in Story 2.3 |
| A3 | Existing Tailwind patterns include ghost/icon button style | Check existing UI components for consistent styling |
| A4 | contextIsolation is already true from Epic 1 | Verify in `electron/main.ts` before Epic 2 implementation |

### Open Questions

| ID | Question | Owner | Resolution Target |
|----|----------|-------|-------------------|
| Q1 | Should ViewActivityButton appear on active entries or only completed? | Dev | Resolve during Story 2.3 - recommend completed only |
| Q2 | Where exactly should the button be placed in time entry UI? | Dev | Review existing UI, decide during Story 2.3 |
| Q3 | Should we log IPC calls in production or only development? | Dev | Recommend dev only; resolve in Story 2.2 |
| Q4 | Should electronBridge throw or return error for non-Electron context? | Dev | Return error object (graceful); resolve in Story 2.1 |

## Test Strategy Summary

### Test Levels

| Level | Scope | Framework | Coverage Target |
|-------|-------|-----------|-----------------|
| **Unit Tests** | `isElectron()`, `electronBridge` | Vitest | Core functions |
| **Manual Tests** | All acceptance criteria | Checklist | 100% of ACs |
| **Build Verification** | Web build isolation | Shell scripts | No Electron in dist/ |

### Test Scenarios by Story

**Story 2.1: Platform Detection Utility**
- Unit test: `isElectron()` returns false when `window` is undefined (SSR)
- Unit test: `isElectron()` returns false when `window.electronAPI` is undefined (browser)
- Manual: Run `npm run dev:electron`, open DevTools, run `import { isElectron } from './lib/platform'; isElectron()` → `true`
- Manual: Run `npm run dev`, open browser DevTools, same check → `false`
- Manual: Run `tsc -b` - no TypeScript errors

**Story 2.2: IPC Bridge Setup**
- Manual: In Electron DevTools, run `window.electronAPI.activity.start('test-123')` → `{ success: true }`
- Manual: In Electron DevTools, run `window.electronAPI.activity.stop()` → `{ success: true, data: { entriesRecorded: 0 } }`
- Manual: In Electron DevTools, run `window.electronAPI.activity.getLog('test-123')` → `{ success: true, data: [] }`
- Manual: In Electron DevTools, run `window.electronAPI.activity.export('test-123', 'json')` → `{ success: true, data: { filePath: '' } }`
- Manual: Verify TypeScript autocomplete works for `window.electronAPI.activity.` methods
- Manual: In browser DevTools, confirm `window.electronAPI` is `undefined`

**Story 2.3: Conditional UI Rendering**
- Manual: In Electron, create a completed time entry, verify "View Activity" button appears
- Manual: In web browser, same entry does NOT show "View Activity" button
- Manual: Click button in Electron - console shows placeholder log
- Verification: Run `npm run build && grep -r "ViewActivity" dist/` → no matches
- Verification: Run `npm run build && grep -r "electronAPI" dist/` → no matches

### Web Regression Tests (Cross-cutting)

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Task creation | Add task in web browser | Task appears, persists on refresh |
| Time tracking | Start/stop timer in web | Entry saved correctly |
| Time entry view | View completed time entry | Normal UI, no Electron button |
| `npm run dev` | Start dev server | Serves at localhost:5173, no errors |
| `npm run build` | Build web app | Outputs to dist/, no warnings |

### Unit Test Specifications

```typescript
// src/lib/platform.test.ts
describe('isElectron', () => {
  it('returns false when window is undefined', () => {
    const originalWindow = global.window;
    // @ts-ignore - testing SSR case
    delete global.window;
    expect(isElectron()).toBe(false);
    global.window = originalWindow;
  });

  it('returns false when electronAPI is not present', () => {
    // Browser context - electronAPI not set
    expect(isElectron()).toBe(false);
  });

  it('returns true when electronAPI is present', () => {
    // Mock Electron context
    (window as any).electronAPI = { activity: {} };
    expect(isElectron()).toBe(true);
    delete (window as any).electronAPI;
  });
});
```

```typescript
// src/lib/electronBridge.test.ts
describe('electronBridge.activity', () => {
  it('returns error when not in Electron', async () => {
    const result = await electronBridge.activity.start('test-id');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not in Electron');
  });
});
```

### Build Verification Script

```bash
#!/bin/bash
# verify-epic2.sh - Run after npm run build

echo "Verifying Epic 2: No Electron code in web build..."

if grep -rq "electronAPI" dist/; then
  echo "✗ FAIL: electronAPI found in web build!"
  exit 1
else
  echo "✓ No electronAPI references in dist/"
fi

if grep -rq "ViewActivityButton" dist/; then
  echo "✗ FAIL: ViewActivityButton found in web build!"
  exit 1
else
  echo "✓ ViewActivityButton properly tree-shaken"
fi

if grep -rq "activity:start" dist/; then
  echo "✗ FAIL: IPC channels found in web build!"
  exit 1
else
  echo "✓ No IPC channel strings in dist/"
fi

echo "All Epic 2 verifications passed!"
```

### Acceptance Criteria Coverage

All 24 acceptance criteria (AC1.1 through AC4.5) are covered by the test scenarios above:
- AC1.1-1.6: Unit tests + manual verification
- AC2.1-2.9: Manual DevTools verification
- AC3.1-3.6: Visual inspection + build verification
- AC4.1-4.5: Web regression tests

---

_Generated by BMAD Epic Tech Context Workflow_
_Date: 2026-01-11_
_For: Vishal_
