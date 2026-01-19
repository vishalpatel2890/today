# Story 3.3: Activity Storage in IndexedDB

Status: done

## Story

As the **system**,
I want **to persist activity logs to IndexedDB when tracking stops**,
so that **activity data survives app restarts**.

## Acceptance Criteria

1. **AC3.3.1**: When `activity:stop` IPC is called, all captured activity entries are saved to IndexedDB
2. **AC3.3.2**: Entries are stored in a separate `activityLogs` table (not mixed with other synced tables)
3. **AC3.3.3**: Entries are indexed by `timeEntryId` for fast retrieval
4. **AC3.3.4**: The data persists after closing and reopening Electron
5. **AC3.3.5**: The activityLogs table is NOT included in Supabase sync
6. **AC3.3.6**: Existing activity retrieval via `activity:get-log` IPC returns entries from IndexedDB
7. **AC3.3.7**: If no activity exists for a timeEntryId, an empty array is returned

## Frontend Test Gate

**Gate ID**: 3-3-TG1

### Prerequisites
- [ ] Story 3.2 complete (activity polling captures entries to memory)
- [ ] `npm run dev:electron` launches Electron app successfully
- [ ] Electron DevTools accessible via Cmd+Option+I

### Test Steps (Manual Testing in Electron DevTools)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Run `npm run dev:electron` | Terminal | Electron window opens with React app |
| 2 | Open DevTools (Cmd+Option+I) | Electron window | DevTools panel opens |
| 3 | Start tracking: `window.electronAPI.activity.start('test-persist-1')` | DevTools Console | Returns `{ success: true }` |
| 4 | Switch between 2-3 apps, waiting 5+ seconds between each | macOS | Activity captured in background |
| 5 | Stop tracking: `window.electronAPI.activity.stop()` | DevTools Console | Returns `{ success: true, data: { entriesRecorded: N } }` where N > 0 |
| 6 | Close Electron app completely | macOS | App closes |
| 7 | Restart app: `npm run dev:electron` | Terminal | Fresh Electron window opens |
| 8 | Query activity: `window.electronAPI.activity.getLog('test-persist-1')` | DevTools Console | Returns `{ success: true, data: [...] }` with previously captured entries |
| 9 | Verify entry count matches what was recorded | DevTools Console | Array length matches entriesRecorded from step 5 |
| 10 | Query non-existent entry: `window.electronAPI.activity.getLog('does-not-exist')` | DevTools Console | Returns `{ success: true, data: [] }` (empty array) |

### Success Criteria (What User Sees)
- [ ] Activity entries persist across app restarts
- [ ] `activity:get-log` returns correct entries for given timeEntryId
- [ ] No duplicate entries created on repeated saves
- [ ] Empty array returned for non-existent timeEntryId
- [ ] No console errors during storage operations
- [ ] Data NOT appearing in Supabase sync (verify in network tab or Supabase dashboard)

### Feedback Questions
1. Did data persist correctly after closing and reopening the app?
2. Was the retrieval fast and responsive?
3. Any errors or unexpected behavior with IndexedDB operations?
4. Does the sync exclusion work correctly (no activity data in Supabase)?

## Tasks / Subtasks

- [x] **Task 1: Extend Dexie database schema with activityLogs table** (AC: 3.3.2, 3.3.3)
  - [x] 1.1: Add new table definition to `src/lib/db.ts`: `activityLogs: '++id, timeEntryId, timestamp'`
  - [x] 1.2: Create `ActivityLogEntry` interface matching existing `ActivityEntry` type
  - [x] 1.3: Increment Dexie version number for schema migration
  - [x] 1.4: Ensure table has compound index on `[timeEntryId+timestamp]` for ordered retrieval

- [x] **Task 2: Create activity store module for IndexedDB operations** (AC: 3.3.1, 3.3.6, 3.3.7)
  - [x] 2.1: Create `src/lib/activityStore.ts` with CRUD operations
  - [x] 2.2: Implement `saveActivityEntries(entries: ActivityEntry[]): Promise<void>`
  - [x] 2.3: Implement `getActivityEntriesByTimeEntryId(timeEntryId: string): Promise<ActivityEntry[]>`
  - [x] 2.4: Entries returned should be sorted by timestamp ascending

- [x] **Task 3: Wire up IPC handlers to use activity store** (AC: 3.3.1, 3.3.6)
  - [x] 3.1: Import activity store functions in electronBridge (renderer-side)
  - [x] 3.2: Update `activity.stop()` in electronBridge to save entries to IndexedDB
  - [x] 3.3: Update `activity.getLog()` to query IndexedDB directly (not IPC)
  - [x] 3.4: Handle errors gracefully with proper IPCResponse format

- [x] **Task 4: Ensure Supabase sync exclusion** (AC: 3.3.5)
  - [x] 4.1: Reviewed existing sync implementation in `src/lib/syncQueue.ts`
  - [x] 4.2: Verified activityLogs table is NOT in SyncTable type
  - [x] 4.3: Added explicit exclusion comments in db.ts
  - [x] 4.4: Sync exclusion is enforced by TypeScript (activityLogs not in SyncTable)

- [x] **Task 5: Implement IPC communication bridge for renderer-to-DB access** (AC: 3.3.1)
  - [x] 5.1: Implemented renderer-side DB access in electronBridge
  - [x] 5.2: No new IPC channel needed - using Option A (renderer-side persistence)
  - [x] 5.3: Entries passed via existing stop response and saved in renderer
  - [x] 5.4: Chose simplest approach per architecture (renderer-side DB access)

- [x] **Task 6: Write unit tests and verify** (AC: 3.3.4, 3.3.7)
  - [x] 6.1: Created comprehensive test suite `src/lib/activityStore.test.ts` (15 tests)
  - [x] 6.2: Updated `src/lib/electronBridge.test.ts` for new behavior (11 tests)
  - [x] 6.3: All 598 tests pass (no regressions)
  - [x] 6.4: Tests cover: save, retrieve, delete, count, sorted retrieval, empty array returns
  - [x] 6.5: Manual testing pending in Test Gate

## Dev Notes

### Architecture Alignment

This story implements FR16-19 (Activity Storage) from the PRD. Per the architecture document:

**From `notes/architecture-electron-migration.md`:**

```typescript
// Activity Data Storage Pattern (ADR-008)
// Activity logs stored in separate Dexie table (Electron-only)

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

**Storage Location per Architecture:**

| Data Type | Storage | Sync |
|-----------|---------|------|
| Tasks | IndexedDB (Dexie) | Supabase |
| Time Entries | IndexedDB (Dexie) | Supabase |
| Activity Logs | IndexedDB (Dexie) | **Never** (local only) |

### IPC and DB Access Pattern

Per ADR-008, Dexie runs in the renderer process, not main process. Two approaches:

**Option A (Preferred): Renderer-side persistence**
- `activity:stop` returns entries to renderer via IPC
- Renderer saves to IndexedDB directly via Dexie
- Simpler, leverages existing Dexie setup

**Option B: Main-to-renderer IPC for DB**
- Main process sends entries to renderer via IPC
- Renderer saves to DB and confirms
- More complex, but keeps main process in control

Recommend **Option A** for simplicity.

### Project Structure Notes

**Files to Create:**
- `src/lib/activityStore.ts` - Activity-specific IndexedDB operations

**Files to Modify:**
- `src/lib/db.ts` - Add activityLogs table schema
- `electron/ipc/handlers.ts` - Update get-log handler to use DB
- Renderer-side code to save entries when stopping tracking

**Existing Files to Review:**
- `src/lib/sync.ts` - Ensure activityLogs excluded from sync
- `src/hooks/useTimeTracking.ts` - May need to handle activity save on stop

### Learnings from Previous Story

**From Story 3.2 (Status: done)**

- **stopTracking() returns entries** - `{ success: true, data: { entriesRecorded, entries } }`
  - Entries array is available for persistence
  - This story needs to intercept this response and save to IndexedDB

- **State management pattern** - TrackerState holds entries in memory during session
  - Entries are cleared after stopTracking() returns
  - Must save before response returns or pass entries through IPC

- **Key methods to use:**
  - `stopTracking()` already returns captured entries
  - Need to add DB save step before clearing entries

- **Files modified in 3.2:**
  - `electron/activity/tracker.ts` - State management, polling
  - `electron/ipc/handlers.ts` - Wired up start/stop

[Source: notes/sprint-artifacts/3-2-activity-polling-during-time-tracking.md#Dev-Agent-Record]

### References

- [Source: notes/architecture-electron-migration.md#Data-Architecture]
- [Source: notes/architecture-electron-migration.md#ADR-008]
- [Source: notes/epics-electron-migration.md#Story-3.3]
- [Source: notes/prd-electron-migration.md#FR16-FR19]
- [Source: notes/sprint-artifacts/3-2-activity-polling-during-time-tracking.md#Dev-Notes]

## Dev Agent Record

### Context Reference

- `notes/sprint-artifacts/3-3-activity-storage-in-indexeddb.context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Implementation followed Option A (renderer-side persistence) per architecture
- Dexie runs in renderer process, so getLog queries IndexedDB directly
- stop() saves entries after receiving from main process via IPC

### Completion Notes List

- **Task 1**: Added `ActivityLogEntry` interface and `activityLogs` table to Dexie schema (version 2). Compound index `[timeEntryId+timestamp]` enables sorted retrieval.
- **Task 2**: Created `activityStore.ts` with `saveActivityEntries()`, `getActivityEntriesByTimeEntryId()`, `deleteActivityEntriesByTimeEntryId()`, and `getActivityCountByTimeEntryId()`.
- **Task 3**: Updated `electronBridge.ts` to save entries on stop and query IndexedDB directly for getLog.
- **Task 4**: Verified sync exclusion - `activityLogs` not in `SyncTable` type. Added explicit comments.
- **Task 5**: Implemented renderer-side persistence (Option A) - simpler than IPC round-trip.
- **Task 6**: Created 15 new tests for activityStore, updated 4 tests in electronBridge. All 598 tests pass.
- ✅ Test Gate PASSED by Vishal (2026-01-18)

### Completion Notes
**Completed:** 2026-01-18
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing

### File List

**Created:**
- `src/lib/activityStore.ts` - Activity log CRUD operations
- `src/lib/activityStore.test.ts` - 15 unit tests

**Modified:**
- `src/lib/db.ts` - Added ActivityLogEntry interface, activityLogs table (version 2)
- `src/lib/electronBridge.ts` - Updated stop() to save entries, getLog() to query IndexedDB
- `src/lib/electronBridge.test.ts` - Updated tests for new behavior
- `src/types/electron.d.ts` - Added ActivityStopResponse type

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-18 | Story drafted from epics and architecture | SM Agent |
| 2026-01-18 | Implementation complete - all tasks done, 598 tests pass | Dev Agent |
