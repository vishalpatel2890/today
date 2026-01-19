# Story 2.2: IPC Bridge Setup

Status: done

## Story

As a **developer**,
I want **a type-safe IPC bridge between React and Electron main process**,
so that **React components can trigger native functionality securely**.

## Acceptance Criteria

1. **AC2.1**: `window.electronAPI` is available in Electron renderer context
2. **AC2.2**: `window.electronAPI.activity.start(timeEntryId)` returns `Promise<{ success: true }>`
3. **AC2.3**: `window.electronAPI.activity.stop()` returns `Promise<{ success: true, data: { entriesRecorded: 0 } }>`
4. **AC2.4**: `window.electronAPI.activity.getLog(timeEntryId)` returns `Promise<{ success: true, data: [] }>`
5. **AC2.5**: `window.electronAPI.activity.export(timeEntryId, format)` returns `Promise<{ success: true, data: { filePath: '' } }>`
6. **AC2.6**: TypeScript recognizes `window.electronAPI` with correct method types
7. **AC2.7**: `contextIsolation: true` is enabled (security requirement)
8. **AC2.8**: `nodeIntegration: false` is enabled (security requirement)
9. **AC2.9**: IPC channel names follow `domain:action` kebab-case convention

## Frontend Test Gate

**Gate ID**: 2-2-TG1

### Prerequisites
- [x] Story 2.1 complete (platform detection utility exists)
- [ ] `npm run dev:electron` launches Electron app successfully
- [ ] Starting state: Clean working directory

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Run `npm run dev:electron` | Terminal | Electron window opens with React app |
| 2 | Open DevTools (Cmd+Option+I) | Electron window | DevTools panel opens |
| 3 | In Console: `window.electronAPI` | DevTools Console | Returns object with `activity` property |
| 4 | In Console: `window.electronAPI.activity.start('test-123')` | DevTools Console | Promise resolves to `{ success: true }` |
| 5 | In Console: `window.electronAPI.activity.stop()` | DevTools Console | Promise resolves to `{ success: true, data: { entriesRecorded: 0 } }` |
| 6 | In Console: `window.electronAPI.activity.getLog('test-123')` | DevTools Console | Promise resolves to `{ success: true, data: [] }` |
| 7 | In Console: `window.electronAPI.activity.export('test-123', 'json')` | DevTools Console | Promise resolves to `{ success: true, data: { filePath: '' } }` |
| 8 | Run `npm run dev` in browser | Browser at localhost:5173 | `window.electronAPI` is `undefined` |
| 9 | Run `npm run build` | Terminal | Build completes without TypeScript errors |

### Success Criteria (What User Sees)
- [ ] `window.electronAPI` exists in Electron with correct structure
- [ ] All four activity methods return Promises that resolve successfully
- [ ] TypeScript autocomplete works for `window.electronAPI.activity.` methods
- [ ] `window.electronAPI` is undefined in web browser
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Could you invoke all IPC methods from DevTools successfully?
2. Did TypeScript provide correct autocomplete for the API methods?
3. Were the response shapes consistent with expectations?
4. Any unexpected behavior when testing in both Electron and web?

## Tasks / Subtasks

- [x] **Task 1: Create IPC channel constants** (AC: 2.9)
  - [x] 1.1: Create `electron/ipc/channels.ts` with channel name constants
  - [x] 1.2: Define channels: `activity:start`, `activity:stop`, `activity:get-log`, `activity:export`
  - [x] 1.3: Export as `IPC_CHANNELS` const object for type safety

- [x] **Task 2: Implement IPC handlers (stubs)** (AC: 2.2, 2.3, 2.4, 2.5)
  - [x] 2.1: Create `electron/ipc/handlers.ts` with `registerIpcHandlers()` function
  - [x] 2.2: Implement `activity:start` handler returning `{ success: true }`
  - [x] 2.3: Implement `activity:stop` handler returning `{ success: true, data: { entriesRecorded: 0 } }`
  - [x] 2.4: Implement `activity:get-log` handler returning `{ success: true, data: [] }`
  - [x] 2.5: Implement `activity:export` handler returning `{ success: true, data: { filePath: '' } }`
  - [x] 2.6: Add development-mode logging for each IPC call

- [x] **Task 3: Update preload script** (AC: 2.1, 2.7, 2.8)
  - [x] 3.1: Import IPC_CHANNELS from `./ipc/channels`
  - [x] 3.2: Expose `electronAPI.activity` object via contextBridge
  - [x] 3.3: Map each activity method to `ipcRenderer.invoke()` with correct channel
  - [x] 3.4: Verify `contextIsolation: true` in main.ts BrowserWindow config
  - [x] 3.5: Verify `nodeIntegration: false` in main.ts BrowserWindow config

- [x] **Task 4: Register handlers in main process** (AC: 2.1)
  - [x] 4.1: Import `registerIpcHandlers` in `electron/main.ts`
  - [x] 4.2: Call `registerIpcHandlers()` before creating BrowserWindow
  - [x] 4.3: Verify handlers are active by checking console logs

- [x] **Task 5: Update TypeScript declarations** (AC: 2.6)
  - [x] 5.1: Update `src/types/electron.d.ts` with complete `ElectronAPI` interface
  - [x] 5.2: Add `IPCResponse<T>` generic type for consistent response shapes
  - [x] 5.3: Add `ActivityEntry` placeholder interface (full definition in Epic 3)
  - [x] 5.4: Verify TypeScript autocomplete works in VS Code

- [x] **Task 6: Create type-safe electronBridge wrapper** (AC: 2.6)
  - [x] 6.1: Create `src/lib/electronBridge.ts`
  - [x] 6.2: Import `isElectron` from `./platform`
  - [x] 6.3: Implement wrapper methods that check `isElectron()` first
  - [x] 6.4: Return `{ success: false, error: 'Not in Electron' }` for web context
  - [x] 6.5: Add JSDoc comments for API documentation

- [x] **Task 7: Verify in both environments** (AC: 2.1-2.9)
  - [x] 7.1: Run `npm run dev:electron` - test all IPC methods in DevTools
  - [x] 7.2: Run `npm run dev` - verify `window.electronAPI` is undefined in browser
  - [x] 7.3: Run `npm run build` - verify no TypeScript errors
  - [x] 7.4: Verify no Electron code in web build with grep check

## Dev Notes

### Architecture Alignment

This story implements FR6-FR7 (Feature Detection, Conditional Desktop UI) from the PRD and establishes the IPC infrastructure for all Electron-specific features in Epics 3-4.

**Key Pattern from Architecture (ADR-007: IPC-Only Communication):**

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

Per `notes/architecture-electron-migration.md`:
- All IPC exposed via contextBridge MUST use typed channel names
- Methods return Promises for async operations
- NEVER expose Node.js APIs directly (contextIsolation enforces this)

**Security Requirements:**
- `contextIsolation: true` - Prevents renderer from accessing Node.js
- `nodeIntegration: false` - Additional security layer
- Typed channels prevent arbitrary string invocation

### IPC Channel Naming Convention

Per Architecture, channels follow `domain:action` kebab-case:
```typescript
export const IPC_CHANNELS = {
  ACTIVITY_START: 'activity:start',
  ACTIVITY_STOP: 'activity:stop',
  ACTIVITY_GET_LOG: 'activity:get-log',
  ACTIVITY_EXPORT: 'activity:export',
} as const;
```

### Response Shape Pattern

All IPC methods return consistent `IPCResponse<T>` shape:
```typescript
interface IPCResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
```

This enables predictable error handling in React components.

### Project Structure Notes

**New Files:**
- `electron/ipc/channels.ts` - IPC channel name constants
- `electron/ipc/handlers.ts` - Main process IPC handlers (stubs)
- `src/lib/electronBridge.ts` - Type-safe IPC wrapper for React

**Modified Files:**
- `electron/main.ts` - Import and call `registerIpcHandlers()`
- `electron/preload.ts` - Expose `electronAPI` via contextBridge
- `src/types/electron.d.ts` - Complete type definitions (extend from Story 2.1)

### Learnings from Previous Story

**From Story 2-1-platform-detection-utility (Status: done)**

- **New Files Created**:
  - `src/lib/platform.ts` - `isElectron()` function for platform detection
  - `src/lib/platform.test.ts` - 7 unit tests for platform detection
  - `src/types/electron.d.ts` - TypeScript declarations for ElectronAPI

- **Pattern Established**: `isElectron()` checks for `window.electronAPI` presence:
  ```typescript
  export const isElectron = (): boolean => {
    return typeof window !== 'undefined' &&
           'electronAPI' in window &&
           window.electronAPI !== undefined;
  };
  ```

- **TypeScript Foundation**: `src/types/electron.d.ts` already declares `Window.electronAPI` - this story EXTENDS those types, doesn't recreate them

- **Test Baseline**: 502 tests pass - maintain this in Story 2.2

- **Build Verified**: `npm run build` and `tsc -b` complete successfully

**Implication for This Story:**
- Use existing `isElectron()` function in `electronBridge.ts`
- Extend existing TypeScript declarations in `src/types/electron.d.ts`
- `window.electronAPI` stub may already exist from Epic 1 preload - verify and update

[Source: notes/sprint-artifacts/2-1-platform-detection-utility.md#Dev-Agent-Record]

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-2-electron.md#AC2-IPC-Bridge-Setup]
- [Source: notes/architecture-electron-migration.md#IPC-Channel-Naming]
- [Source: notes/architecture-electron-migration.md#Preload-Script-Pattern]
- [Source: notes/architecture-electron-migration.md#ADR-007]
- [Source: notes/epics-electron-migration.md#Story-2.2]
- [Source: notes/prd-electron-migration.md#FR6-FR7]

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/2-2-ipc-bridge-setup.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 2026-01-12: Created IPC channel constants in `electron/ipc/channels.ts` following domain:action kebab-case convention
- 2026-01-12: Created stub IPC handlers in `electron/ipc/handlers.ts` with dev-mode logging
- 2026-01-12: Updated `electron/preload.ts` to expose activity methods via contextBridge
- 2026-01-12: Registered IPC handlers in `electron/main.ts` before window creation
- 2026-01-12: Verified TypeScript declarations from Story 2.1 are complete
- 2026-01-12: Created `src/lib/electronBridge.ts` as type-safe wrapper with isElectron() guard
- 2026-01-12: Added 10 unit tests for electronBridge (4 browser tests, 5 Electron tests)
- 2026-01-12: Fixed TypeScript issues (import paths, type casting)
- 2026-01-12: Build verification: `npm run build` passes, 512 tests pass
- 2026-01-12: Verified no electronAPI or IPC channel strings in web build

### Completion Notes List

- Implemented complete IPC bridge per ADR-007 architecture
- All 4 activity IPC methods exposed: start, stop, getLog, export
- Security verified: contextIsolation=true, nodeIntegration=false already configured
- TypeScript types already complete from Story 2.1
- electronBridge provides safe wrapper that returns error in browser context
- Test suite increased from 502 to 512 tests (10 new electronBridge tests)
- Web build confirmed clean - no Electron code leaked
- ✅ Test Gate PASSED by Vishal (2026-01-12)

### File List

**New Files:**
- `today-app/electron/ipc/channels.ts` - IPC channel constants
- `today-app/electron/ipc/handlers.ts` - Main process IPC handlers (stubs)
- `today-app/src/lib/electronBridge.ts` - Type-safe IPC wrapper for React
- `today-app/src/lib/electronBridge.test.ts` - Unit tests for electronBridge

**Modified Files:**
- `today-app/electron/main.ts` - Added registerIpcHandlers() import and call
- `today-app/electron/preload.ts` - Exposed electronAPI.activity via contextBridge

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-12 | Story drafted from epics, tech spec, and architecture | SM Agent |
| 2026-01-12 | Implemented IPC bridge, handlers, preload, and electronBridge wrapper | Dev Agent |
| 2026-01-12 | Story completed - Test Gate PASSED, marked done | Dev Agent |
