# Story 3.4: Auto-Start/Stop Activity with Time Tracking

Status: drafted

## Story

As a **user**,
I want **activity tracking to automatically start and stop with time tracking**,
so that **I don't need to manually manage activity capture**.

## Acceptance Criteria

1. **AC3.4.1**: When I click "Start" on a task to begin time tracking in Electron, activity capture begins automatically (no extra button click)
2. **AC3.4.2**: When I click "Stop" on an active time tracking session in Electron, activity capture stops and data is saved automatically
3. **AC3.4.3**: This automatic behavior only happens in Electron (web is unaffected - no errors, no activity calls)
4. **AC3.4.4**: If I start tracking in web browser and later open Electron, activity capture starts from that point forward
5. **AC3.4.5**: The existing time tracking UI is unchanged (no new buttons, same visual behavior)
6. **AC3.4.6**: If Electron is opened with an existing active time entry, activity tracking starts automatically for that entry

## Frontend Test Gate

**Gate ID**: 3-4-TG1

### Prerequisites
- [ ] Story 3.3 complete (activity storage in IndexedDB working)
- [ ] `npm run dev:electron` launches Electron app successfully
- [ ] `npm run dev` launches web app in browser
- [ ] Electron DevTools accessible via Cmd+Option+I

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Run `npm run dev:electron` | Terminal | Electron window opens with Today app |
| 2 | Open DevTools (Cmd+Option+I) | Electron window | DevTools panel opens |
| 3 | Click "Start" on any task to begin tracking | Task card timer button | Timer starts, task shows elapsed time |
| 4 | Check console for activity start | DevTools Console | Log shows `[Electron/Activity] Started tracking for: <timeEntryId>` |
| 5 | Switch between 2-3 apps for 15+ seconds | macOS | Activity being captured in background |
| 6 | Click "Stop" to end tracking | Task card timer button | Timer stops, time entry saved |
| 7 | Check console for activity stop | DevTools Console | Log shows `[Electron/Activity] Stopped tracking, X entries recorded` |
| 8 | Verify activity saved: `window.electronAPI.activity.getLog('<timeEntryId>')` | DevTools Console | Returns `{ success: true, data: [...] }` with captured entries |
| 9 | Open web app in browser: `npm run dev` | Browser | Web app loads at localhost:5173 |
| 10 | Start tracking on a task in web | Task card timer button | Timer starts - no errors in console |
| 11 | Open Electron app while web timer running | Electron window | Electron opens, sees active time entry |
| 12 | Check if activity tracking started | DevTools Console | Log shows activity started for the active entry |
| 13 | Stop tracking from either web or Electron | Timer button | Activity captured and saved in Electron |

### Success Criteria (What User Sees)
- [ ] Activity automatically starts when time tracking starts in Electron
- [ ] Activity automatically stops and saves when time tracking stops
- [ ] No extra button clicks needed - completely seamless
- [ ] Web app works identically to before (no errors, no activity features)
- [ ] Electron resuming active session picks up activity tracking
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Could you start/stop time tracking without any extra steps for activity?
2. Did the automatic activity tracking feel seamless and invisible?
3. Any errors when using the web app (where activity shouldn't trigger)?
4. Did activity resume correctly when opening Electron with an active session?

## Tasks / Subtasks

- [ ] **Task 1: Add activity lifecycle hooks to useTimeTracking** (AC: 3.4.1, 3.4.2, 3.4.3)
  - [ ] 1.1: Identify where time entry start/stop occurs in `useTimeTracking.ts`
  - [ ] 1.2: Add `useEffect` that calls `electronAPI.activity.start(timeEntryId)` when tracking starts
  - [ ] 1.3: Add `useEffect` cleanup that calls `electronAPI.activity.stop()` when tracking stops
  - [ ] 1.4: Wrap all activity calls with `isElectron()` guard to prevent errors in web
  - [ ] 1.5: Handle the case where `activeTimeEntry` changes (stop old, start new if applicable)

- [ ] **Task 2: Handle app startup with existing active session** (AC: 3.4.4, 3.4.6)
  - [ ] 2.1: In useTimeTracking initialization, check if there's an active time entry on mount
  - [ ] 2.2: If active entry exists and `isElectron()`, call `electronAPI.activity.start(activeTimeEntry.id)`
  - [ ] 2.3: Ensure this only runs once on mount (use `useEffect` dependency array correctly)
  - [ ] 2.4: Add logging for startup activity initialization: `[Today] Resuming activity tracking for existing session`

- [ ] **Task 3: Ensure web app remains unaffected** (AC: 3.4.3, 3.4.5)
  - [ ] 3.1: Run web app (`npm run dev`) and verify no console errors related to activity
  - [ ] 3.2: Verify `window.electronAPI` is undefined in web context
  - [ ] 3.3: Ensure `isElectron()` returns false in web browser
  - [ ] 3.4: Test time tracking start/stop in web - should work identically to before

- [ ] **Task 4: Add proper error handling for activity IPC calls** (AC: 3.4.1, 3.4.2)
  - [ ] 4.1: Wrap activity.start() call in try-catch, log errors but don't fail time tracking
  - [ ] 4.2: Wrap activity.stop() call in try-catch, log errors but don't fail time entry save
  - [ ] 4.3: Activity failures should be silent to user (time tracking is primary feature)
  - [ ] 4.4: Add dev-mode console warnings if activity operations fail

- [ ] **Task 5: Write tests for activity lifecycle integration** (AC: all)
  - [ ] 5.1: Update `useTimeTracking.test.ts` with tests for activity integration
  - [ ] 5.2: Test: starting tracking in Electron calls activity.start with correct timeEntryId
  - [ ] 5.3: Test: stopping tracking in Electron calls activity.stop
  - [ ] 5.4: Test: activity calls not made in web context (mock isElectron to return false)
  - [ ] 5.5: Test: mount with active session triggers activity.start
  - [ ] 5.6: Ensure all existing useTimeTracking tests still pass

## Dev Notes

### Architecture Alignment

This story implements FR13 (Auto-starts capture) and FR14 (Auto-stops capture) from the PRD.

**From `notes/architecture-electron-migration.md`:**

```typescript
// Integration Points (from Architecture)
| Time Tracking Hook | Activity Tracker | IPC: `activity:start`, `activity:stop` |

// Feature Detection Pattern
import { isElectron } from '@/lib/platform';

// Usage in hooks
if (isElectron()) {
  await window.electronAPI.activity.start(timeEntryId);
}
```

**IPC Contracts:**
```typescript
// activity:start
invoke('activity:start', timeEntryId: string)
// Response: { success: true } | { success: false, error: string }

// activity:stop
invoke('activity:stop')
// Response: { success: true, data: { entriesRecorded: number } } | { success: false, error: string }
```

### Project Structure Notes

**Files to Modify:**
- `src/hooks/useTimeTracking.ts` - Add activity lifecycle effects
- `src/hooks/useTimeTracking.test.ts` - Add tests for activity integration

**Existing Files to Use (from 3.3):**
- `src/lib/platform.ts` - `isElectron()` guard function
- `src/lib/electronBridge.ts` - Activity IPC methods
- `src/lib/activityStore.ts` - Activity persistence (called by electronBridge)

### Learnings from Previous Story

**From Story 3.3 (Status: done)**

- **Renderer-side persistence pattern** - Activity entries are saved to IndexedDB via `activityStore.ts` when `electronBridge.stop()` is called. The bridge handles the IPC response and saves entries automatically.

- **Files available for use:**
  - `src/lib/activityStore.ts` - CRUD operations for activity logs
  - `src/lib/electronBridge.ts` - Type-safe wrapper for `window.electronAPI`
  - `src/types/electron.d.ts` - TypeScript types including `ActivityStopResponse`

- **Key methods to call:**
  - `electronBridge.activity.start(timeEntryId)` - Starts polling in main process
  - `electronBridge.activity.stop()` - Stops polling, returns entries, saves to IndexedDB
  - No need to call `activityStore` directly - `electronBridge` handles persistence

- **Error handling pattern from 3.3:**
  ```typescript
  const result = await window.electronAPI.activity.start(id);
  if (!result.success) {
    console.error('[Today] Activity start failed:', result.error);
    // Don't throw - activity is secondary to time tracking
  }
  ```

- **Test count reference:** All 598 tests pass after 3.3 - maintain this baseline

[Source: notes/sprint-artifacts/3-3-activity-storage-in-indexeddb.md#Dev-Agent-Record]

### Implementation Approach

1. **Minimal intrusion to useTimeTracking** - Add a single `useEffect` that watches the active time entry state
2. **Effect should handle:**
   - Entry becomes active (start activity)
   - Entry becomes inactive (stop activity)
   - Component unmounts with active entry (stop activity)
3. **Use `isElectron()` at the top of effect** to early-return in web context
4. **Error handling should be silent** - Activity is enhancement, not core feature

### References

- [Source: notes/architecture-electron-migration.md#Integration-Points]
- [Source: notes/architecture-electron-migration.md#Implementation-Patterns]
- [Source: notes/epics-electron-migration.md#Story-3.4]
- [Source: notes/sprint-artifacts/3-3-activity-storage-in-indexeddb.md#Completion-Notes]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-18 | Story drafted from epics and architecture | SM Agent |
