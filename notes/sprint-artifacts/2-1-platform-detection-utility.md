# Story 2.1: Platform Detection Utility

Status: done

## Story

As a **developer**,
I want **a utility function to detect if the app is running in Electron**,
so that **I can conditionally enable desktop features**.

## Acceptance Criteria

1. **AC1.1**: `src/lib/platform.ts` exports an `isElectron()` function
2. **AC1.2**: In Electron: `isElectron()` returns `true`
3. **AC1.3**: In web browser: `isElectron()` returns `false`
4. **AC1.4**: TypeScript types are correct (function returns `boolean`)
5. **AC1.5**: Function handles SSR/build case (`typeof window === 'undefined'`) gracefully
6. **AC1.6**: Function works during Vite build without errors

## Frontend Test Gate

**Gate ID**: 2-1-TG1

### Prerequisites
- [x] Epic 1 complete (Electron foundation established)
- [ ] `npm run dev:electron` launches Electron app successfully
- [ ] `npm run dev` launches web app at localhost:5173
- [ ] Starting state: Clean working directory

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Run `npm run dev:electron` | Terminal | Electron window opens with React app |
| 2 | Open DevTools (Cmd+Option+I) | Electron window | DevTools panel opens |
| 3 | In Console: `import('@/lib/platform').then(m => console.log(m.isElectron()))` | DevTools Console | Logs `true` |
| 4 | Run `npm run dev` | Terminal (new tab) | Web dev server starts at localhost:5173 |
| 5 | Open browser to localhost:5173 | Browser | React app loads |
| 6 | Open DevTools (F12) | Browser | DevTools panel opens |
| 7 | In Console: check `window.electronAPI` | DevTools Console | Returns `undefined` |
| 8 | Run `npm run build` | Terminal | Build completes without errors |

### Success Criteria (What User Sees)
- [ ] `isElectron()` returns `true` in Electron DevTools
- [ ] `isElectron()` returns `false` in browser DevTools
- [ ] `window.electronAPI` is undefined in browser
- [ ] `npm run build` completes without TypeScript errors
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Could you verify platform detection in both environments easily?
2. Did the TypeScript compilation complete without errors?
3. Was the function accessible via the module path?
4. Any unexpected behavior when switching between Electron and web?

## Tasks / Subtasks

- [x] **Task 1: Create platform detection module** (AC: 1.1, 1.4)
  - [x] 1.1: Create `src/lib/platform.ts` file
  - [x] 1.2: Implement `isElectron()` function with proper TypeScript typing
  - [x] 1.3: Export function as named export for tree-shaking compatibility

- [x] **Task 2: Implement detection logic** (AC: 1.2, 1.3, 1.5)
  - [x] 2.1: Check `typeof window !== 'undefined'` for SSR safety
  - [x] 2.2: Check `'electronAPI' in window` for Electron detection
  - [x] 2.3: Check `window.electronAPI !== undefined` as final verification
  - [x] 2.4: Return boolean result combining all checks

- [x] **Task 3: Verify build compatibility** (AC: 1.6)
  - [x] 3.1: Run `npm run build` - verify no errors
  - [x] 3.2: Run `tsc -b` - verify TypeScript compiles cleanly
  - [x] 3.3: Verify function doesn't cause issues during SSR/build phase

- [x] **Task 4: Test in both environments** (AC: 1.2, 1.3)
  - [x] 4.1: Run `npm run dev:electron` - test `isElectron()` returns `true`
  - [x] 4.2: Run `npm run dev` - test `isElectron()` returns `false` in browser
  - [x] 4.3: Document test results in Dev Agent Record

- [x] **Task 5: Write unit tests** (AC: 1.1-1.6)
  - [x] 5.1: Create `src/lib/platform.test.ts`
  - [x] 5.2: Test: returns false when `window` is undefined (SSR case)
  - [x] 5.3: Test: returns false when `window.electronAPI` is not present
  - [x] 5.4: Test: returns true when `window.electronAPI` is present
  - [x] 5.5: Run `npm test` - verify all tests pass

## Dev Notes

### Architecture Alignment

This story implements FR6 (Runtime Electron detection) from the PRD and establishes the foundation for all conditional desktop features in Epic 2.

**Key Pattern from Architecture:**

```typescript
// src/lib/platform.ts
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' &&
         'electronAPI' in window &&
         window.electronAPI !== undefined;
};
```

Per `notes/architecture-electron-migration.md`, this pattern:
- Handles SSR/build case safely
- Checks specifically for `window.electronAPI` (not generic Electron detection)
- Enables clean tree-shaking when feature is unused

**Security Note:** Per ADR-007, all Electron features are exposed via `window.electronAPI` using contextBridge with `contextIsolation: true`. This function detects that API's presence.

### Testing Standards

Per existing project patterns (Vitest):
- Unit tests for pure functions
- Mock `window` object for different environments
- Test edge cases: SSR (no window), browser (no electronAPI), Electron (has electronAPI)

### Project Structure Notes

**New File Location:**
- `src/lib/platform.ts` - Matches existing lib pattern (`src/lib/db.ts`, `src/lib/utils.ts`)

**No Conflicts Detected:**
- No existing `platform.ts` file
- Consistent with existing `src/lib/` organization

### Learnings from Previous Story

**From Story 1-4-macos-app-packaging (Status: done)**

- **electron-builder**: Installed v26.4.0, configured for universal binary
- **App Package Location**: `release/mac-universal/Today.app` (not `release/Today.app`)
- **Icon**: Generated programmatically via sharp, stored at `resources/icon.icns`
- **Test Suite**: 494 tests pass - establish baseline for this story
- **Package Script**: `"package": "electron-vite build && electron-builder --mac --universal"`
- **Key Verification**: `npm run dev:electron` works, `npm run dev` works independently

**Implication for This Story:**
- Electron foundation is complete - `window.electronAPI` will be available once preload script exposes it (Story 2.2)
- For now, Story 2.1 creates the detection function; actual `electronAPI` is stubbed in preload.ts from Epic 1

[Source: notes/sprint-artifacts/1-4-macos-app-packaging.md#Dev-Agent-Record]

### References

- [Source: notes/sprint-artifacts/tech-spec-epic-2-electron.md#AC1-Platform-Detection-Utility]
- [Source: notes/architecture-electron-migration.md#Feature-Detection-Pattern]
- [Source: notes/architecture-electron-migration.md#Implementation-Patterns]
- [Source: notes/epics-electron-migration.md#Story-2.1]
- [Source: notes/prd-electron-migration.md#FR6]

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/2-1-platform-detection-utility.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 2026-01-11: Implemented `isElectron()` function per architecture pattern
- 2026-01-11: Created TypeScript type declarations for `window.electronAPI`
- 2026-01-11: Created 7 unit tests covering SSR, browser, and Electron environments
- 2026-01-11: Fixed TypeScript errors in test file (unused imports, type casting)
- 2026-01-11: Build verification: `npm run build` passes, `tsc -b` compiles cleanly
- 2026-01-11: Test suite: 502 tests pass (7 new platform tests + 495 existing)

### Completion Notes List

- Created `src/lib/platform.ts` with `isElectron()` function following architecture pattern
- Added `src/types/electron.d.ts` with TypeScript declarations for `ElectronAPI` and `Window.electronAPI`
- Created comprehensive test suite `src/lib/platform.test.ts` with 7 tests:
  - SSR environment (window undefined)
  - Browser environment (no electronAPI)
  - Browser with explicitly undefined electronAPI
  - Electron environment with full API
  - Electron environment with empty stub object
  - Edge case: null electronAPI
  - Consistency test: multiple calls
- All 502 tests pass with no regressions
- Build completes successfully with expected chunk size warning (existing issue)
- ✅ Test Gate PASSED by Vishal (2026-01-11)

### File List

**New Files:**
- `today-app/src/lib/platform.ts` - Platform detection utility
- `today-app/src/lib/platform.test.ts` - Unit tests for platform detection
- `today-app/src/types/electron.d.ts` - TypeScript declarations for Electron API

**Modified Files:**
- None

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-11 | Story drafted from epics and tech spec | SM Agent |
| 2026-01-11 | Implemented platform detection, tests, and type declarations | Dev Agent |
